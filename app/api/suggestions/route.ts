import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedCategories = new Set(["Website", "In Game", "Survival GameMode", "Other"]);
const recentSubmissions = new Map<string, number[]>();
const turnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export async function HEAD() {
  return new NextResponse(null, { status: 204, headers: { "x-turnstile-enabled": turnstileEnabled ? "true" : "false" } });
}

async function verifyTurnstile(token: string, ip: string) {
  if (!turnstileEnabled) return process.env.NODE_ENV !== "production";
  if (!token || token.length > 2048) return false;
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(5000), cache: "no-store" });
    const result = await response.json() as { success?: boolean; hostname?: string };
    const configuredHost = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname : "";
    return response.ok && result.success === true && (!configuredHost || !result.hostname || result.hostname === configuredHost);
  } catch { return false; }
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const recent = (recentSubmissions.get(ip) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 3) return false;
  recent.push(now);
  recentSubmissions.set(ip, recent);
  return true;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("suggestions")
      .select("id,name,message,created_at,category,status,upvotes,downvotes,admin_note,avatar_url")
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
  } catch (error) {
    console.error("Suggestions read error:", error);
    return NextResponse.json({ error: "Suggestions are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Quietly accept the hidden honeypot so basic bots don't retry against the endpoint.
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ success: true });

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const category = typeof body.category === "string" && allowedCategories.has(body.category) ? body.category : "Other";
    if (name.length < 3 || name.length > 16 || !/^[a-zA-Z0-9_]+$/.test(name)) {
      return NextResponse.json({ error: "Use a Minecraft username with 3–16 letters, numbers, or underscores." }, { status: 400 });
    }
    if (message.length < 8 || message.length > 2000) {
      return NextResponse.json({ error: "Suggestion must be between 8 and 2000 characters." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!(await verifyTurnstile(typeof body.turnstileToken === "string" ? body.turnstileToken : "", ip))) {
      return NextResponse.json({ error: "Complete the anti-spam check, then submit again." }, { status: 403 });
    }
    if (!checkRateLimit(ip)) return NextResponse.json({ error: "Please wait a minute before submitting another idea." }, { status: 429 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("suggestions")
      .insert({ name, message, category, status: "pending" })
      .select("id,name,message,created_at,category,status,upvotes,downvotes")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Suggestions write error:", error);
    return NextResponse.json({ error: "Could not save your suggestion right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const voterId = typeof body.voterId === "string" ? body.voterId : "";
    const vote = body.vote === 1 ? 1 : body.vote === -1 ? -1 : 0;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(voterId) || !vote) return NextResponse.json({ error: "A valid vote is required." }, { status: 400 });
    const admin = createAdminClient();
    const result = await admin.rpc("cast_suggestion_vote", { p_suggestion_id: id, p_voter_id: voterId, p_vote: vote });
    if (result.error) throw result.error;
    return NextResponse.json({ success: true, vote: result.data });
  } catch (error) {
    console.error("Suggestion vote error:", error instanceof Error ? error.message : "vote failed");
    return NextResponse.json({ error: "Could not save your vote." }, { status: 500 });
  }
}
