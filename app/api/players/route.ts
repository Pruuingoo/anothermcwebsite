import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Player = { name: string; uuid?: string; sessionTime?: string | number; skinUrl?: string };

function findPlayerList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["players", "onlinePlayers", "online_players", "data", "results"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = findPlayerList(candidate);
      if (nested.length) return nested;
      const entries = Object.entries(candidate as Record<string, unknown>);
      if (entries.length && entries.every(([, item]) => item && typeof item === "object")) return entries.map(([name, item]) => ({ name, ...(item as object) }));
    }
  }
  return [];
}

function normalizePlayer(item: unknown): Player | null {
  if (typeof item === "string") return /^[A-Za-z0-9_]{1,16}$/.test(item) ? { name: item } : null;
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const name = [row.name, row.username, row.playerName, row.player_name, row.user].find((value): value is string => typeof value === "string");
  if (!name || !/^[A-Za-z0-9_]{1,16}$/.test(name)) return null;
  const uuid = [row.uuid, row.uniqueId, row.unique_id].find((value): value is string => typeof value === "string");
  const skinUrl = [row.skinUrl, row.skin_url, row.skinURL, row.skin].find((value): value is string => typeof value === "string" && value.startsWith("https://"));
  const sessionTime = [row.sessionTime, row.session_time, row.playtime, row.duration].find((value): value is string | number => typeof value === "string" || typeof value === "number");
  return { name, ...(uuid ? { uuid } : {}), ...(skinUrl ? { skinUrl } : {}), ...(sessionTime !== undefined ? { sessionTime } : {}) };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: snapshot, error } = await admin.from("mc_player_status").select("payload,updated_at").eq("id", 1).maybeSingle();
    if (error) throw error;
    const payload: unknown = snapshot?.payload;
    if (!payload) throw new Error("Player status snapshot has not been written yet.");
    const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const rows = findPlayerList(payload).map(normalizePlayer).filter((player): player is Player => player !== null);
    const countValue = [root.count, root.total, root.online, root.onlinePlayersCount].find((x) => typeof x === "number");
    const maxValue = [root.max, root.maxPlayers, root.capacity].find((x) => typeof x === "number");
    return NextResponse.json({ online: root.online !== false, count: typeof countValue === "number" ? countValue : rows.length, max: typeof maxValue === "number" ? maxValue : 0, players: rows, updatedAt: snapshot?.updated_at ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ online: false, count: 0, max: 0, players: [], error: "Player list unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
