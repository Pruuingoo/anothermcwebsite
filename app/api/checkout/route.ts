import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUddoktaCheckout, getUddoktaConfig, hasPluginConfig } from "@/lib/payments/uddokta";

const cookieName = "server_cart";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.nextUrl.host; } catch { return false; }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const token = request.cookies.get(cookieName)?.value;
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return NextResponse.json({ error: "Your cart has expired. Please add the items again." }, { status: 400 });

  try {
    if (!getUddoktaConfig() || !hasPluginConfig()) {
      return NextResponse.json({ error: "Online checkout is not configured yet. Please try again later." }, { status: 503 });
    }
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address for payment." }, { status: 400 });
    }

    const admin = createAdminClient();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const cartResult = await admin.from("store_carts").select("id,minecraft_username").eq("token_hash", tokenHash).maybeSingle();
    if (cartResult.error) throw cartResult.error;
    const cart = cartResult.data;
    if (!cart?.minecraft_username) return NextResponse.json({ error: "Add your Minecraft username before checkout." }, { status: 400 });

    const itemResult = await admin.from("store_cart_items").select("product_id,quantity").eq("cart_id", cart.id);
    if (itemResult.error) throw itemResult.error;
    if (!itemResult.data?.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

    const productResult = await admin.from("products").select("id,slug,name,price,is_active,category").in("id", itemResult.data.map((item) => item.product_id));
    if (productResult.error) throw productResult.error;
    const productMap = new Map((productResult.data ?? []).map((product) => [product.id, product]));
    const orderItems = itemResult.data.flatMap((item) => {
      const product = productMap.get(item.product_id);
      if (!product || !product.is_active || product.category !== "points") return [];
      return [{ product_id: product.id, product_slug: product.slug, product_name: product.name, unit_price: product.price, quantity: item.quantity }];
    });
    if (!orderItems.length) return NextResponse.json({ error: "The items in your cart are no longer available." }, { status: 409 });

    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
    const pointsAmount = orderItems.reduce((sum, item) => sum + Number(item.product_slug.split("-")[1]) * item.quantity, 0);
    if (!pointsAmount || subtotal <= 0) return NextResponse.json({ error: "Your cart does not contain valid points packs." }, { status: 400 });
    const orderResult = await admin.from("store_orders").insert({
      cart_id: cart.id,
      minecraft_username: cart.minecraft_username,
      email,
      status: "awaiting_payment",
      currency: "BDT",
      subtotal,
      points_amount: pointsAmount,
    }).select("id,status,subtotal,currency,created_at").single();
    if (orderResult.error) throw orderResult.error;

    const itemInsert = await admin.from("store_order_items").insert(orderItems.map((item) => ({ ...item, order_id: orderResult.data.id })));
    if (itemInsert.error) {
      await admin.from("store_orders").delete().eq("id", orderResult.data.id);
      throw itemInsert.error;
    }

    try {
      const payment = await createUddoktaCheckout({
        orderId: orderResult.data.id,
        username: cart.minecraft_username,
        email,
        amount: subtotal,
        requestOrigin: request.nextUrl.origin,
      });
      const update = await admin.from("store_orders").update({ payment_invoice_id: payment.invoiceId }).eq("id", orderResult.data.id);
      if (update.error) throw update.error;
      await admin.from("store_cart_items").delete().eq("cart_id", cart.id);
      return NextResponse.json({ success: true, paymentUrl: payment.paymentUrl }, { status: 201 });
    } catch (error) {
      await admin.from("store_orders").update({ status: "payment_failed" }).eq("id", orderResult.data.id).eq("status", "awaiting_payment");
      throw error;
    }
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json({ error: "Could not create the order. Please try again." }, { status: 500 });
  }
}
