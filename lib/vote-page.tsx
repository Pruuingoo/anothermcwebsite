import pages from "@/data/vote-pages.json";
import VoteInteractions from "@/components/VoteInteractions";
import { getVerifiedVoteCounts, getVoteEvents, getVotePlayer, getVotePlayers, getVoteSites, type VoteEvent, type VotePlayer, type VoteSite } from "@/lib/vote-data";
import { expandTemplateTokens } from "@/lib/site-config";

type VotePageData = { main: string; nav: string; footer: string; title: string };
const pageMap = pages as Record<string, VotePageData>;

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function safeHref(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function formatDate(value: string | null) {
  if (!value) return "No votes yet";
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}

function mediaCount(value: number) {
  return value.toLocaleString("en-US");
}

function replaceDivGridAfter(source: string, marker: string, gridClass: string, content: string) {
  const markerIndex = source.indexOf(marker);
  const start = source.indexOf(`<div class="${gridClass}">`, markerIndex);
  if (markerIndex < 0 || start < 0) return source;
  const tags = /<div\b[^>]*>|<\/div\s*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(source))) {
    depth += match[0].toLowerCase().startsWith("</div") ? -1 : 1;
    if (depth === 0) return source.slice(0, start) + `<div class="${gridClass}">${content}</div>` + source.slice(tags.lastIndex);
  }
  return source;
}

function providerCards(sites: VoteSite[]) {
  if (!sites.length) return '<div class="col-span-full rounded-xl border border-gray-800 bg-gray-900 p-7 text-center"><h4 class="font-bold">Voting links are being configured</h4><p class="mt-2 text-sm text-gray-400">Voting providers will appear here when their {{SERVER_NAME}} listing links are added.</p></div>';
  return sites.map((site) => {
    const action = site.enabled && site.vote_url
      ? `<a href="/api/vote?site=${encodeURIComponent(site.slug)}" data-vote-site="${escapeHtml(site.slug)}" class="mt-3 flex min-h-9 w-full items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">Vote Now</a>`
      : `<span class="mt-3 flex min-h-9 w-full items-center justify-center rounded-md bg-gray-800 px-3 py-2 text-xs text-gray-400">Link not configured</span>`;
    return `<div class="flex min-w-0 flex-col items-center rounded-xl border border-gray-800 bg-gray-900 p-5 text-center"><span class="grid h-10 w-10 place-items-center rounded-lg bg-gray-800 text-lg text-gray-300" aria-hidden="true">☆</span><span class="mt-3 font-semibold">${escapeHtml(site.name)}</span>${action}</div>`;
  }).join("");
}

function playerCards(players: VotePlayer[], heading: string) {
  if (!players.length) return `<div class="mx-auto max-w-xl rounded-xl border border-gray-800 bg-gray-900 p-7 text-center"><h3 class="font-bold">No voter profiles yet</h3><p class="mt-2 text-sm text-gray-400">${escapeHtml(heading)} will appear after voting activity has been recorded.</p></div>`;
  const cards = players.map((player, index) => `<a href="/vote/player/${encodeURIComponent(player.player_uuid)}" class="flex min-w-0 items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-primary"><span class="w-8 shrink-0 text-center font-black ${index < 3 ? "text-yellow-400" : "text-gray-500"}">#${index + 1}</span>${player.avatar_url ? `<img src="${safeHref(player.avatar_url)}" alt="" class="h-10 w-10 shrink-0 rounded-lg object-cover"/>` : ""}<span class="min-w-0 flex-1"><span class="block truncate font-bold">${escapeHtml(player.username)}</span><span class="text-xs text-gray-400">${mediaCount(player.total_votes)} votes</span></span><span class="text-sm font-bold text-primary">${mediaCount(player.total_votes)}</span></a>`).join("");
  return `<div class="container mx-auto space-y-5 px-4 pb-8"><h3 class="text-center text-2xl font-bold">${escapeHtml(heading)}</h3><div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">${cards}</div></div>`;
}

function activitySummary(events: VoteEvent[]) {
  const uniqueVoters = new Set(events.map((event) => event.player_uuid).filter((uuid) => uuid !== "unregistered")).size;
  return { uniqueVoters };
}

function replaceStat(source: string, label: string, value: number) {
  const safeLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<div class="text-2xl font-bold text-white mb-1">)[^<]*(<\\/div><div class="text-xs text-gray-400 uppercase tracking-wider">${safeLabel}<\\/div>)`);
  return source.replace(pattern, (_match, prefix: string, suffix: string) => `${prefix}${mediaCount(value)}${suffix}`);
}

function verifiedActivityCard(counts: { today: number; week: number; month: number; total: number }) {
  return `<section class="mx-auto max-w-3xl rounded-xl border border-gray-800 bg-gray-900 p-6"><h2 class="text-center text-2xl font-bold">Verified voting activity</h2><div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3"><div class="rounded-lg border border-gray-800 bg-gray-950/50 p-5 text-center"><strong class="block text-3xl text-primary">${mediaCount(counts.today)}</strong><span class="mt-1 block text-sm text-gray-400">Confirmed votes today (UTC)</span></div><div class="rounded-lg border border-gray-800 bg-gray-950/50 p-5 text-center"><strong class="block text-3xl text-primary">${mediaCount(counts.week)}</strong><span class="mt-1 block text-sm text-gray-400">Confirmed votes this week (UTC)</span></div><div class="rounded-lg border border-gray-800 bg-gray-950/50 p-5 text-center"><strong class="block text-3xl text-primary">${mediaCount(counts.total)}</strong><span class="mt-1 block text-sm text-gray-400">Confirmed votes recorded</span></div></div><p class="mt-4 text-center text-xs leading-relaxed text-gray-500">Counts include only confirmed vote notifications from the four enabled voting sites. UTC calendar day and Monday-to-Sunday week.</p></section>`;
}

function recentVotesHtml(events: VoteEvent[]) {
  const rows = events.map((event) => `<article class="flex flex-col gap-3 border-b border-gray-800 p-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex min-w-0 items-center gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-800 text-primary" aria-hidden="true">✓</span><div class="min-w-0"><a class="block truncate text-lg font-bold hover:text-primary" href="/vote/player/${encodeURIComponent(event.player_uuid)}">${escapeHtml(event.player_name)}</a><span class="text-sm text-gray-400">voted on <strong class="text-gray-200">${escapeHtml(event.site_name)}</strong></span></div></div><time class="shrink-0 rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-gray-400">${formatDate(event.voted_at)}</time></article>`).join("");
  return `<section class="container mx-auto max-w-4xl px-4 py-10"><h1 class="mb-6 text-center text-3xl font-black text-primary">Recent Votes</h1><div class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">${rows || '<div class="p-8 text-center text-gray-400">No verified votes have been recorded yet.</div>'}</div></section>`;
}

function searchHtml(query: string, players: VotePlayer[], error?: string) {
  const results = players.map((player) => `<tr class="border-b border-gray-800"><td class="flex items-center gap-3 px-4 py-4 font-bold text-white">${player.avatar_url ? `<img src="${safeHref(player.avatar_url)}" alt="" class="h-7 w-7 rounded object-cover"/>` : ""}<a href="/vote/player/${encodeURIComponent(player.player_uuid)}">${escapeHtml(player.username)}</a></td><td class="px-4 py-4">${player.daily_votes}</td><td class="px-4 py-4">${player.weekly_votes}</td><td class="px-4 py-4">${player.monthly_votes}</td><td class="px-4 py-4 font-bold text-primary">${player.total_votes}</td></tr>`).join("");
  const resultsBlock = error ? `<p role="alert" class="mt-8 rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-red-200">${escapeHtml(error)}</p>` : query ? `<div class="mt-8"><h2 class="mb-4 text-lg font-bold text-gray-300">Results for “${escapeHtml(query)}”</h2><div class="overflow-x-auto rounded-xl border border-gray-800"><table class="w-full min-w-[520px] text-left text-sm text-gray-300"><thead class="bg-gray-800 text-gray-400"><tr><th class="px-4 py-3">Player</th><th class="px-4 py-3">Daily</th><th class="px-4 py-3">Weekly</th><th class="px-4 py-3">Monthly</th><th class="px-4 py-3">All-time</th></tr></thead><tbody>${results || '<tr><td colspan="5" class="p-6 text-center text-gray-400">No matching voter has been recorded yet.</td></tr>'}</tbody></table></div></div>` : '<div class="mt-8 rounded-xl border border-blue-900/40 bg-blue-950/20 p-6 text-center text-blue-300">Enter a player name to search recorded voting history.</div>';
  return `<section class="container mx-auto min-h-[50vh] px-4 py-12"><div class="mx-auto max-w-3xl"><h1 class="mb-8 text-center text-3xl font-black">Search Players</h1><form class="flex gap-2" action="/vote/search" method="get"><input class="h-12 min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-900 px-3 text-white" placeholder="Enter player name..." name="player" value="${escapeHtml(query)}"/><button class="rounded-md bg-primary px-5 font-medium text-primary-foreground" type="submit">Search</button></form>${resultsBlock}</div></section>`;
}

function playerProfile(player: VotePlayer | null, events: VoteEvent[]) {
  if (!player) return '<section class="container mx-auto min-h-[50vh] px-4 py-16 text-center"><h1 class="text-3xl font-black">Player not found</h1><p class="mt-3 text-gray-400">No voter profile is currently available for this player.</p><a href="/vote/search" class="mt-6 inline-flex text-primary">Search players</a></section>';
  const recent = events.filter((event) => event.player_uuid === player.player_uuid).slice(0, 20);
  const eventRows = recent.map((event) => `<div class="flex justify-between gap-4 border-b border-gray-800 p-3 text-sm"><span>${escapeHtml(event.site_name)}</span><time class="text-gray-400">${formatDate(event.voted_at)}</time></div>`).join("");
  const stats = [["Daily", player.daily_votes], ["Weekly", player.weekly_votes], ["Monthly", player.monthly_votes], ["All-Time", player.total_votes]];
  return `<section class="container mx-auto max-w-5xl px-4 py-8"><div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div class="rounded-xl border border-gray-800 bg-gray-900 p-6"><div class="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left"><img src="${safeHref(player.avatar_url || "/vote-reference/assets/31510ecfd213682093ec74f18a0cec473c992865.webp")}" alt="" class="h-24 w-24 rounded-2xl object-cover"/><div><h1 class="text-3xl font-black">${escapeHtml(player.username)}</h1><p class="mt-2 text-gray-400">Voter rank #${player.rank}</p><p class="mt-1 text-sm text-gray-500">Last vote: ${formatDate(player.last_vote_at)}</p></div></div><div class="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">${stats.map(([label,value])=>`<div class="rounded-xl border border-gray-800 bg-gray-800/40 p-4 text-center"><strong class="block text-2xl">${value}</strong><span class="text-xs uppercase text-gray-400">${label}</span></div>`).join("")}</div><div class="mt-5 grid grid-cols-2 gap-3"><div class="rounded-xl bg-gray-800/40 p-4 text-center">Current streak <strong class="block text-xl">${player.current_streak}</strong></div><div class="rounded-xl bg-gray-800/40 p-4 text-center">Best streak <strong class="block text-xl">${player.best_streak}</strong></div></div></div><aside class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-lg font-bold">Recent verified votes</h2>${eventRows || '<p class="text-sm text-gray-400">No verified votes yet.</p>'}</aside></div></section>`;
}

function unavailable(message: string) {
  return `<section class="container mx-auto min-h-[45vh] px-4 py-16 text-center"><p class="rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-200">${escapeHtml(message)}</p></section>`;
}

export function getVotePage(route: string) { return pageMap[route]; }
export function getVoteRoutes() { return Object.keys(pageMap).filter((route) => route !== "/" && !route.includes("?") && !route.startsWith("/player/")); }
export function getVotePageTitle(route: string) { return pageMap[route]?.title ?? "{{SERVER_NAME}} Voting"; }

export default async function VotePage({ route, searchPlayer = "" }: { route: string; searchPlayer?: string }) {
  const page = pageMap[route] ?? pageMap["/"];
  let content = expandTemplateTokens(page.main);
  try {
    if (route === "/") {
      const [sites, players, events, counts] = await Promise.all([getVoteSites(), getVotePlayers(), getVoteEvents(10000), getVerifiedVoteCounts()]);
      const activity = activitySummary(events);
      content = replaceStat(content, "Total Votes", counts.total);
      content = replaceStat(content, "Total Voters", activity.uniqueVoters);
      content = replaceStat(content, "Today&#x27;s Votes", counts.today);
      content = replaceStat(content, "This Week&#x27;s Votes", counts.week);
      content = replaceStat(content, "This Month&#x27;s Votes", counts.month);
      content = replaceDivGridAfter(content, "All<!-- --> Sites</h3>", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", providerCards(sites));
      content = content.replace(/<section class="max-w-3xl mx-auto"><div data-slot="card"[\s\S]*?Weekly Server Goal[\s\S]*?<\/section>/, verifiedActivityCard(counts));
      content = content.replace("<!-- VOTE_PANEL:leaderboards -->", playerCards(players.slice(0, 10), "Top Voters"));
      content = content.replace("<!-- VOTE_PANEL:walloffame -->", playerCards(players, "Wall of Fame"));
      content = content.replace("<!-- VOTE_PANEL:rewards -->", '<div class="mx-auto max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center"><h3 class="text-2xl font-bold">Voting Rewards</h3><p class="mt-3 text-gray-300">Vote through an enabled listing to support the server. Reward information is maintained by the server team.</p><a class="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground" href="/rewards">How rewards work</a></div>');
    } else if (route === "/recent") {
      content = recentVotesHtml(await getVoteEvents(10000));
    } else if (route === "/search") {
      const query = searchPlayer.trim();
      content = searchHtml(query, query ? await getVotePlayers(query) : [], undefined);
    } else if (route.startsWith("/player/")) {
      const uuid = route.slice("/player/".length);
      const [player, events] = await Promise.all([getVotePlayer(uuid), getVoteEvents(10000)]);
      content = playerProfile(player, events);
    }
  } catch (error) {
    console.error("Voting database read error:", error);
    if (route === "/search") content = searchHtml(searchPlayer, [], "Voter records are unavailable right now.");
    else content = unavailable("Voting data is unavailable right now. Please try again.");
  }
  const nav = expandTemplateTokens(page.nav).replace(/href="\/(search|recent|rewards|rules)(?=["?])/g, 'href="/vote/$1');
  const footer = expandTemplateTokens(page.footer).replace(/href="\/(search|recent|rewards|rules)(?=["?])/g, 'href="/vote/$1');
  return <><link rel="stylesheet" href="/vote-reference/_next/static/chunks/245c09e4dc1642e3.css" /><link rel="stylesheet" href="/vote-reference/mobile.css" /><div dangerouslySetInnerHTML={{ __html: nav }} /><main className="flex-1"><div dangerouslySetInnerHTML={{ __html: content }} /><VoteInteractions /></main><div dangerouslySetInnerHTML={{ __html: footer }} /></>;
}
