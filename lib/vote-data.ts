import { createAdminClient } from "@/lib/supabase/admin";

export type VotePlayer = {
  id: string;
  player_uuid: string;
  username: string;
  avatar_url: string | null;
  daily_votes: number;
  weekly_votes: number;
  monthly_votes: number;
  total_votes: number;
  rank: number;
  current_streak: number;
  best_streak: number;
  last_vote_at: string | null;
};

export type VoteEvent = { id: string; player_uuid: string; player_name: string; site_name: string; site_slug: string | null; voted_at: string; event_source: string };
export type VoteSite = { id: string; slug: string; name: string; vote_url: string | null; enabled: boolean; sort_order: number };

export const ALLOWED_VOTE_SITES = [
  { slug: "voting-site-1", name: "Voting Site 1", vote_url: process.env.NEXT_PUBLIC_VOTE_SITE_1_URL || null, sort_order: 1 },
  { slug: "voting-site-2", name: "Voting Site 2", vote_url: process.env.NEXT_PUBLIC_VOTE_SITE_2_URL || null, sort_order: 2 },
  { slug: "voting-site-3", name: "Voting Site 3", vote_url: process.env.NEXT_PUBLIC_VOTE_SITE_3_URL || null, sort_order: 3 },
  { slug: "voting-site-4", name: "Voting Site 4", vote_url: process.env.NEXT_PUBLIC_VOTE_SITE_4_URL || null, sort_order: 4 },
] as const;

const databaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function getVoteSites(): Promise<VoteSite[]> {
  const defaults = ALLOWED_VOTE_SITES.map((site) => ({ id: site.slug, ...site, enabled: Boolean(site.vote_url) }));
  if (!databaseConfigured) return defaults;
  try {
    const { data, error } = await createAdminClient().from("vote_sites").select("id,slug,name,vote_url,enabled,sort_order").order("sort_order", { ascending: true });
    if (error) throw error;
    const configured = new Map((data ?? []).map((site) => [site.slug, site]));
    return defaults.map((fallback) => {
      const site = configured.get(fallback.slug);
      return site?.enabled && site.vote_url ? { ...fallback, ...site, name: fallback.name } as VoteSite : fallback;
    });
  } catch {
    return defaults;
  }
}

export async function getVoteEvents(limit = 100): Promise<VoteEvent[]> {
  if (!databaseConfigured) return [];
  const { data, error } = await createAdminClient().from("vote_events").select("id,player_uuid,player_name,site_name,site_slug,voted_at,event_source").eq("verified", true).eq("event_source", "provider_callback").in("site_slug", ALLOWED_VOTE_SITES.map((site) => site.slug)).order("voted_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as VoteEvent[];
}

export async function getVotePlayers(query = "") {
  const events = await getVoteEvents(10000);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const monday = new Date(today);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const month = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const players = new Map<string, VotePlayer>();
  for (const event of events) {
    let player = players.get(event.player_uuid);
    if (!player) {
      player = { id: event.id, player_uuid: event.player_uuid, username: event.player_name, avatar_url: null, daily_votes: 0, weekly_votes: 0, monthly_votes: 0, total_votes: 0, rank: 0, current_streak: 0, best_streak: 0, last_vote_at: event.voted_at };
      players.set(event.player_uuid, player);
    }
    const at = new Date(event.voted_at).getTime();
    player.total_votes += 1;
    if (at >= today) player.daily_votes += 1;
    if (at >= monday.getTime()) player.weekly_votes += 1;
    if (at >= month) player.monthly_votes += 1;
  }
  const needle = query.trim().toLowerCase();
  return [...players.values()].filter((player) => !needle || player.username.toLowerCase().includes(needle)).sort((a, b) => b.total_votes - a.total_votes || a.username.localeCompare(b.username)).slice(0, 100).map((player, index) => ({ ...player, rank: index + 1 }));
}

export async function getVotePlayer(uuid: string) {
  return (await getVotePlayers()).find((player) => player.player_uuid === uuid) ?? null;
}

export async function getVerifiedVoteCounts() {
  if (!databaseConfigured) return { total: 0, today: 0, week: 0, month: 0 };
  const admin = createAdminClient();
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const week = new Date(today);
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const countSince = (since?: Date) => {
    let query = admin.from("vote_events").select("id", { count: "exact", head: true }).eq("verified", true).eq("event_source", "provider_callback").in("site_slug", ALLOWED_VOTE_SITES.map((site) => site.slug));
    if (since) query = query.gte("voted_at", since.toISOString());
    return query;
  };
  const [all, daily, weekly, monthly] = await Promise.all([countSince(), countSince(today), countSince(week), countSince(month)]);
  const failed = [all, daily, weekly, monthly].find((result) => result.error);
  if (failed?.error) throw failed.error;
  return { total: all.count ?? 0, today: daily.count ?? 0, week: weekly.count ?? 0, month: monthly.count ?? 0 };
}
