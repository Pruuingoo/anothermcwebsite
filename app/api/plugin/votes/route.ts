import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_VOTE_SITES } from "@/lib/vote-data";

export const runtime = "nodejs";

function authorized(value: string | null) {
  const expected = process.env.MINECRAFT_SERVER_PLUGIN_API_KEY;
  if (!value || !expected) return false;
  const supplied = Buffer.from(value);
  const secret = Buffer.from(`Bearer ${expected}`);
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const providerAliases = new Map<string, string>();
ALLOWED_VOTE_SITES.forEach((site, index) => {
  const configuredName = process.env[`MINECRAFT_SERVER_VOTE_SERVICE_${index + 1}`] || site.name;
  providerAliases.set(normalize(configuredName), site.slug);
  providerAliases.set(normalize(site.slug), site.slug);
});

export async function POST(request: NextRequest) {
  if (!authorized(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const service = typeof body.service === "string" ? body.service : "";
    const rawTime = typeof body.timestamp === "string" ? body.timestamp : "";
    const slug = providerAliases.get(normalize(service));
    if (!slug || !/^[A-Za-z0-9_]{3,16}$/.test(username)) return NextResponse.json({ error: "Invalid provider or player name" }, { status: 400 });
    const numericTime = /^\d{10,13}$/.test(rawTime) ? Number(rawTime) * (rawTime.length === 10 ? 1000 : 1) : NaN;
    const normalizedTime = rawTime.replace(" ", "T").replace(/(Z|[+-]\d\d:?\d\d)$/i, "$1");
    const parsed = rawTime ? new Date(Number.isFinite(numericTime) ? numericTime : normalizedTime) : new Date();
    const votedAt = Number.isFinite(parsed.getTime()) ? parsed : new Date();
    if (votedAt.getTime() > Date.now() + 5 * 60_000 || votedAt.getTime() < Date.now() - 90 * 86_400_000) {
      return NextResponse.json({ error: "Invalid vote timestamp" }, { status: 400 });
    }
    const site = ALLOWED_VOTE_SITES.find((item) => item.slug === slug);
    if (!site) return NextResponse.json({ error: "Provider is not enabled" }, { status: 400 });

    const playerBytes = createHash("md5").update(`OfflinePlayer:${username}`).digest();
    playerBytes[6] = (playerBytes[6] & 0x0f) | 0x30;
    playerBytes[8] = (playerBytes[8] & 0x3f) | 0x80;
    const playerHex = playerBytes.toString("hex");
    const playerUuid = `${playerHex.slice(0, 8)}-${playerHex.slice(8, 12)}-${playerHex.slice(12, 16)}-${playerHex.slice(16, 20)}-${playerHex.slice(20)}`;
    const eventKey = createHash("sha256").update(`${slug}:${username.toLowerCase()}:${votedAt.toISOString()}`).digest("hex");
    const { error } = await createAdminClient().from("vote_events").upsert({
      event_key: eventKey,
      player_uuid: playerUuid,
      player_name: username,
      site_slug: slug,
      site_name: site.name,
      voted_at: votedAt.toISOString(),
      verified: true,
      event_source: "provider_callback",
    }, { onConflict: "event_key", ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ accepted: true });
  } catch (error) {
    console.error("Vote notification could not be recorded:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Vote notification could not be recorded" }, { status: 500 });
  }
}
