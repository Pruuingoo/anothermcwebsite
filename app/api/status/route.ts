import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

export async function GET() {
  try {
    const supabase = await createClient();
    const [statusResult, modesResult] = await Promise.all([
      supabase
        .from("server_status")
        .select("players_online,uptime,version,is_online,updated_at")
        .eq("status_key", "primary")
        .maybeSingle(),
      supabase.from("game_modes").select("name").eq("active", true),
    ]);

    if (statusResult.error) throw statusResult.error;
    if (modesResult.error) throw modesResult.error;

    const status = statusResult.data;
    if (!status) return NextResponse.json({ error: "Server status has not been configured." }, { status: 503 });
    let players = status.players_online;
    let online = status.is_online;
    try {
      if (!siteConfig.javaAddress.endsWith(".example")) {
      const live = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(siteConfig.javaAddress)}`, { headers: { "User-Agent": `${siteConfig.name} website status` }, signal: AbortSignal.timeout(5000), next: { revalidate: 60 } });
      if (live.ok) { const result = await live.json() as { online?: boolean; players?: { online?: number } }; online = Boolean(result.online); players = result.players?.online ?? players; }
      }
    } catch { /* retain the configured status if the public status API is unavailable */ }
    return NextResponse.json({ players, uptime: status.uptime, modes: modesResult.data?.length ?? 0, version: status.version, online, updatedAt: status.updated_at }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json({ error: "Server status is temporarily unavailable." }, { status: 503 });
  }
}
