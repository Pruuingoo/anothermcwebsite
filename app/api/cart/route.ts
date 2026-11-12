import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const cookieName = "server_cart";
const usernamePattern = /^[A-Za-z0-9_]{3,16}$/;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function getCart(request: NextRequest, createIfMissing: boolean) {
  const admin = createAdminClient();
  const existingToken = request.cookies.get(cookieName)?.value;
  if (!existingToken && !createIfMissing) return { admin, cart: null, token: "", fresh: false };
  const token = existingToken && /^[A-Za-z0-9_-]{40,60}$/.test(existingToken) ? existingToken : randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);

  let { data: cart, error } = await admin.from("store_carts").select("id,minecraft_username").eq("token_hash", tokenHash).maybeSingle();
  if (error) throw error;
  if (!cart && !createIfMissing) return { admin, cart: null, token, fresh: false };
  if (!cart) {
    const created = await admin.from("store_carts").insert({ token_hash: tokenHash }).select("id,minecraft_username").single();
    if (created.error) throw created.error;
    cart = created.data;
  }

  return { admin, cart, token, fresh: token !== existingToken };
}

function jsonWithCartCookie(request: NextRequest, token: string, fresh: boolean, data: unknown, status = 200) {
  const response = NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
  if (fresh) {
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
  }
  return response;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

async function serializeCart(admin: ReturnType<typeof createAdminClient>, cart: { id: string; minecraft_username: string | null }) {
  const { data: items, error } = await admin
    .from("store_cart_items")
    .select("id,product_id,quantity")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const productIds = (items ?? []).map((item) => item.product_id);
  let products: Array<{ id: string; slug: string; name: string; price: number; image_url: string | null; category: string }> = [];
  if (productIds.length) {
    const result = await admin.from("products").select("id,slug,name,price,image_url,category").eq("is_active", true).in("id", productIds);
    if (result.error) throw result.error;
    products = result.data ?? [];
  }
  const productMap = new Map(products.map((product) => [product.id, product]));
  const serialized = (items ?? []).flatMap((item) => {
    const product = productMap.get(item.product_id);
    return product ? [{ id: item.id, quantity: item.quantity, product, lineTotal: Number(product.price) * item.quantity }] : [];
  });
  return {
    username: cart.minecraft_username,
    items: serialized,
    itemCount: serialized.reduce((sum, item) => sum + item.quantity, 0),
    pointsAmount: serialized.reduce((sum, item) => sum + (item.product.category === "points" ? Number(item.product.slug.split("-")[1]) * item.quantity : 0), 0),
    subtotal: serialized.reduce((sum, item) => sum + item.lineTotal, 0),
    currency: "BDT",
  };
}

export async function GET(request: NextRequest) {
  try {
    const state = await getCart(request, false);
    if (!state.cart) return NextResponse.json({ username: null, items: [], itemCount: 0, subtotal: 0, currency: "BDT" }, { headers: { "Cache-Control": "no-store" } });
    const data = await serializeCart(state.admin, state.cart);
    return jsonWithCartCookie(request, state.token, state.fresh, data);
  } catch (error) {
    console.error("Cart read error:", error);
    return NextResponse.json({ error: "Cart is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    const state = await getCart(request, true);
    if (!state.cart) throw new Error("Could not create a cart session.");
    const { admin, cart } = state;

    if (body.action === "set_username") {
      const username = typeof body.username === "string" ? body.username.trim() : "";
      if (!usernamePattern.test(username)) return jsonWithCartCookie(request, state.token, state.fresh, { error: "Use 3–16 letters, numbers, or underscores." }, 400);
      const { error } = await admin.from("store_carts").update({ minecraft_username: username }).eq("id", cart.id);
      if (error) throw error;
      cart.minecraft_username = username;
    } else if (body.action === "add_points") {
      if (typeof body.username === "string" && usernamePattern.test(body.username.trim())) {
        const username = body.username.trim();
        const updated = await admin.from("store_carts").update({ minecraft_username: username }).eq("id", cart.id);
        if (updated.error) throw updated.error;
        cart.minecraft_username = username;
      }
      if (!cart.minecraft_username) return jsonWithCartCookie(request, state.token, state.fresh, { error: "Enter your Minecraft username first." }, 409);
      const points = body.points;
      if (!Number.isInteger(points) || points < 100 || points > 50000 || points % 100 !== 0) {
        return jsonWithCartCookie(request, state.token, state.fresh, { error: "Choose an amount from 100 to 50,000 in steps of 100." }, 400);
      }
      const { error } = await admin.rpc("adjust_points_cart", { p_cart_id: cart.id, p_delta: points });
      if (error) {
        if (error.message.includes("at most 50000")) return jsonWithCartCookie(request, state.token, state.fresh, { error: error.message }, 400);
        throw error;
      }
    } else if (body.action === "add") {
      if (!cart.minecraft_username && typeof body.username === "string" && usernamePattern.test(body.username.trim())) {
        const username = body.username.trim();
        const updated = await admin.from("store_carts").update({ minecraft_username: username }).eq("id", cart.id);
        if (updated.error) throw updated.error;
        cart.minecraft_username = username;
      }
      if (!cart.minecraft_username) return jsonWithCartCookie(request, state.token, state.fresh, { error: "Enter your Minecraft username first." }, 409);
      const slug = typeof body.slug === "string" ? body.slug : "";
      const quantity = Number.isInteger(body.quantity) ? Math.max(1, Math.min(50, body.quantity)) : 1;
      const product = await admin.from("products").select("id,category").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (product.error) throw product.error;
      if (!product.data) return jsonWithCartCookie(request, state.token, state.fresh, { error: "That item is currently unavailable." }, 404);
      if (product.data.category === "points") return jsonWithCartCookie(request, state.token, state.fresh, { error: "Use the points amount action to combine packs." }, 400);
      const existing = await admin.from("store_cart_items").select("id,quantity").eq("cart_id", cart.id).eq("product_id", product.data.id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) {
        const { error } = await admin.from("store_cart_items").update({ quantity: Math.min(50, existing.data.quantity + quantity), updated_at: new Date().toISOString() }).eq("id", existing.data.id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("store_cart_items").insert({ cart_id: cart.id, product_id: product.data.id, quantity });
        if (error) throw error;
      }
    } else if (body.action === "remove") {
      if (typeof body.itemId !== "string") return jsonWithCartCookie(request, state.token, state.fresh, { error: "Cart item is required." }, 400);
      const item = await admin.from("store_cart_items").select("product_id,quantity").eq("id", body.itemId).eq("cart_id", cart.id).maybeSingle();
      if (item.error) throw item.error;
      if (item.data) {
        const product = await admin.from("products").select("slug,category").eq("id", item.data.product_id).maybeSingle();
        if (product.error) throw product.error;
        const points = product.data?.category === "points" ? Number(product.data.slug.split("-")[1]) * item.data.quantity : 0;
        if (points) {
          const adjusted = await admin.rpc("adjust_points_cart", { p_cart_id: cart.id, p_delta: -points });
          if (adjusted.error) throw adjusted.error;
        } else {
          const deleted = await admin.from("store_cart_items").delete().eq("id", body.itemId).eq("cart_id", cart.id);
          if (deleted.error) throw deleted.error;
        }
      }
    } else if (body.action === "quantity") {
      if (typeof body.itemId !== "string" || !Number.isInteger(body.quantity)) return jsonWithCartCookie(request, state.token, state.fresh, { error: "Cart item and quantity are required." }, 400);
      const quantity = Math.max(0, Math.min(50, body.quantity));
      const item = await admin.from("store_cart_items").select("product_id,quantity").eq("id", body.itemId).eq("cart_id", cart.id).maybeSingle();
      if (item.error) throw item.error;
      if (item.data) {
        const product = await admin.from("products").select("slug,category").eq("id", item.data.product_id).maybeSingle();
        if (product.error) throw product.error;
        if (product.data?.category === "points") {
          const pointsPerPack = Number(product.data.slug.split("-")[1]);
          const delta = (quantity - item.data.quantity) * pointsPerPack;
          const adjusted = await admin.rpc("adjust_points_cart", { p_cart_id: cart.id, p_delta: delta });
          if (adjusted.error) throw adjusted.error;
        } else {
          const query = quantity === 0
            ? admin.from("store_cart_items").delete().eq("id", body.itemId).eq("cart_id", cart.id)
            : admin.from("store_cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("id", body.itemId).eq("cart_id", cart.id);
          const { error } = await query;
          if (error) throw error;
        }
      }
    } else if (body.action === "clear") {
      const { error } = await admin.from("store_cart_items").delete().eq("cart_id", cart.id);
      if (error) throw error;
    } else {
      return jsonWithCartCookie(request, state.token, state.fresh, { error: "Unknown cart action." }, 400);
    }

    const refreshed = await serializeCart(admin, cart);
    return jsonWithCartCookie(request, state.token, state.fresh, refreshed);
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json({ error: "Could not update the cart." }, { status: 500 });
  }
}
