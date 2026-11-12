import pages from "@/data/site-pages.json";
import StoreGate from "@/components/StoreGate";
import HomeEffects from "@/components/HomeEffects";
import MobileMenuInteractions from "@/components/MobileMenuInteractions";
import DatabaseStorefront from "@/components/DatabaseStorefront";
import DatabaseCart from "@/components/DatabaseCart";
import DatabaseCheckout from "@/components/DatabaseCheckout";
import DatabaseProductDetail from "@/components/DatabaseProductDetail";
import DatabaseInteractions from "@/components/DatabaseInteractions";
import StoreInteractions from "@/components/StoreInteractions";
import LivePlayerList from "@/components/LivePlayerList";
import StaffList from "@/components/StaffList";
import AboutPage from "@/components/AboutPage";
import { getGameModes, getPost, getPosts, getProduct, getRanks, getSuggestions, type DbGameMode, type DbPost, type DbProduct, type DbRank, type DbSuggestion } from "@/lib/site-data";
import { expandTemplateTokens } from "@/lib/site-config";

type SourcePage = { main: string; nav: string; footer: string; title: string; sourceUrl: string; status: number };
const pageMap = pages as Record<string, SourcePage>;
type Suggestion = {
  id?: string;
  username: string; avatar: string; status: string; tag: string; tagColor: string; tagTextColor: string;
  content: string; age: string; upvotes: number; downvotes: number; comments: number; adminNote: string;
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function suggestionCards(items: Suggestion[]) {
  return items.map((item) => {
    const username = escapeHtml(item.username);
    const text = escapeHtml(item.content).replaceAll("\n", "<br>");
    const note = item.adminNote ? `<div class="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs"><strong class="text-primary">Admin note</strong><p class="mb-0 mt-1 text-muted-foreground">${escapeHtml(item.adminNote)}</p></div>` : "";
    const status = item.status === "FIXED" ? "Fixed" : "Pending";
    const statusClass = item.status === "FIXED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-muted/50 text-muted-foreground border-border/50";
    const comments = item.comments ? `${item.comments} ${item.comments === 1 ? "comment" : "comments"}` : "Add comment";
    const color = /^#[0-9a-f]{6}$/i.test(item.tagColor) ? item.tagColor : "#c91d0b";
    const textColor = /^#[0-9a-f]{6}$/i.test(item.tagTextColor) ? item.tagTextColor : "#ffffff";
    return `<article data-suggestion-id="${escapeHtml((item as Suggestion & { id?: string }).id || "")}" class="group relative flex min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-card/70 transition-all hover:border-primary/30 hover:shadow-xl"><div class="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-border/40 bg-background/20 py-4"><button type="button" data-suggestion-vote="1" aria-label="Upvote">↑</button><span data-vote-count="1" class="text-xs font-bold text-emerald-500">${item.upvotes}</span><button type="button" data-suggestion-vote="-1" aria-label="Downvote">↓</button><span data-vote-count="-1" class="text-xs text-blue-500">${item.downvotes}</span></div><div class="flex min-w-0 flex-1 flex-col p-4"><div class="flex items-start gap-3"><img class="h-9 w-9 shrink-0 rounded-lg border border-border/50 bg-muted object-cover" src="${escapeHtml(item.avatar)}" alt="${username}"/><div class="min-w-0 flex-1"><div class="truncate text-sm font-bold">${username}</div><div class="text-[11px] text-muted-foreground">${escapeHtml(item.age)}</div></div><span class="shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClass}">${status}</span></div><p class="mt-3 line-clamp-4 whitespace-normal text-sm leading-relaxed text-foreground/85">${text}</p>${note}<div class="mt-auto flex items-center justify-between gap-3 pt-4"><span class="rounded-full px-2.5 py-1 text-[10px] font-bold" style="background-color:${color};color:${textColor}">${escapeHtml(item.tag)}</span><span class="text-[11px] text-muted-foreground">▢ &nbsp;${escapeHtml(comments)}</span></div></div></article>`;
  }).join("");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function relativeAge(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days < 1) return "Today";
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function databasePostCards(items: DbPost[]) {
  return items.map((item) => {
    const title = escapeHtml(item.title);
    const href = escapeAttribute(item.source_path);
    const image = escapeAttribute(item.cover_url);
    const excerpt = escapeHtml(item.excerpt);
    const category = escapeHtml(item.category);
    const date = new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    return `<a class="group h-full flex" href="${href}"><article class="flex flex-col h-full w-full bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300"><div class="aspect-video w-full bg-muted overflow-hidden relative border-b"><img src="${image}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div><div class="p-5 flex flex-col gap-3 flex-1"><span data-slot="badge" class="badge w-fit">${category}</span><span class="text-xs text-muted-foreground">${date}</span><h3 class="text-xl font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">${title}</h3><p class="text-sm text-muted-foreground line-clamp-3 leading-relaxed">${excerpt}</p><span class="mt-auto pt-3 text-sm font-bold text-primary">Read Article →</span></div></article></a>`;
  }).join("");
}

function replaceDivGridAfter(html: string, marker: string, className: string, children: string, outputClass = className) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return html;
  const start = html.indexOf(`<div class="${className}">`, markerIndex);
  if (start < 0) return html;
  const tags = /<div\b[^>]*>|<\/div\s*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(html))) {
    depth += match[0].toLowerCase().startsWith("</div") ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + `<div class="${outputClass}">${children}</div>` + html.slice(tags.lastIndex);
  }
  return html;
}

function gameModeCards(modes: DbGameMode[] | null) {
  if (modes === null) return '<div class="col-span-full rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-200">Game modes could not be loaded right now.</div>';
  if (modes.length === 0) return '<div class="col-span-full rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">There are no active game modes right now.</div>';
  const icons: Record<string, string> = { survival: "f5e97d41d9d7a899b8370f7bca14086a19b3b7e1.webp", skyblock: "e138d1a72179bbfefd0ff850aeb0173e5b4e814c.webp", bedwars: "d6dab23065fbd11b890445b9cf125d405a6fa010.webp", "practice pvp": "fbd478608088a8dc0c7a3cbb03dd55c5191d7eef.webp" };
  return modes.map((mode, index) => {
    const icon = icons[mode.name.toLowerCase()];
    const image = icon ? `<img src="/reference/assets/${icon}" alt="" class="h-16 w-16 object-cover"/>` : '<span class="db-mode-icon" aria-hidden="true">✦</span>';
    const colors = ["green", "red", "blue", "yellow"];
    const color = colors[index % colors.length];
    return `<article class="wc-home-mode-card group relative w-full max-w-sm overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-2xl"><div class="relative p-6"><div class="mb-4 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-muted/60 ring-1 ring-white/10">${image}</div><h3 class="mb-3 text-2xl font-bold">${escapeHtml(mode.name)}</h3><p class="text-muted-foreground mb-4 text-sm leading-relaxed">${escapeHtml(mode.description)}</p></div><div class="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-${color}-500/20 blur-2xl"></div></article>`;
  }).join("");
}

function databaseFaq() {
  const items = [
    ["How do I join the server?", "Java: {{JAVA_ADDRESS}}. Bedrock: {{JAVA_ADDRESS}}, port {{BEDROCK_PORT}}. Choose the address for your edition and add it from the Multiplayer or Servers menu."],
    ["Is the server free to play?", "Yes. Core gameplay is free. Optional store items add cosmetics and convenience features."],
    ["Do I need a premium Minecraft account to play?", "No. The server accepts supported Java and Bedrock accounts. Use the same in-game name when voting or opening a support request."],
    ["How can I secure my account?", "Use a unique password in-game, never share it, and avoid logging in on devices you do not trust. Staff will never ask for your password."],
    ["Can I change my in-game name later?", "If you change your Minecraft name, contact staff through Discord so they can check your account and any store purchases."],
    ["I bought something but haven’t received it.", "Allow a few minutes for delivery, then check that you entered the correct Minecraft username. If it is still missing, open a Discord support ticket with your order details."],
    ["What versions does the server support?", "The Java network supports versions 1.8 through 1.21.5. Bedrock players can join using {{JAVA_ADDRESS}} on port {{BEDROCK_PORT}}."],
    ["Can I play on console?", "Bedrock-compatible consoles can join using the Bedrock address and port. Console network settings can vary by platform."],
    ["Are hacks or mods allowed?", "Cheats, hacked clients, exploits, and unfair automation are not allowed. Use only approved client-side enhancements."],
    ["How do I report a player?", "Send the staff team a Discord support ticket. Include the player name, game mode, and any useful screenshots or clips."],
    ["I forgot my password. What should I do?", "Open a Discord support ticket and provide your in-game username. Do not send your current or old password."],
    ["Are ranks permanent?", "Store rank purchases remain on the account they were bought for, subject to the server rules and terms."],
    ["Is PvP enabled on the server?", "PvP depends on the game mode and area. Check the mode rules before fighting or building near other players."],
  ];
  return items.map(([question, answer], index) => `<article class="wc-faq-card" data-home-faq-card><button class="wc-faq-card__question" type="button" data-home-faq-toggle aria-expanded="false" aria-controls="home-faq-answer-${index}"><span class="wc-faq-card__number">${String(index + 1).padStart(2, "0")}</span><span class="wc-faq-card__title">${escapeHtml(question)}</span><span class="wc-faq-card__toggle" aria-hidden="true">+</span></button><div class="wc-faq-card__answer" id="home-faq-answer-${index}" data-home-faq-answer aria-hidden="true">${escapeHtml(answer)}</div></article>`).join("");
}

function pageHtml(route: string, html: string, options: { posts?: DbPost[] | null; suggestions?: Suggestion[] | null; ranks?: DbRank[] | null; gameModes?: DbGameMode[] | null; status?: { players: number; uptime: string; online: boolean } | null; supporters?: Array<{ username: string; amount: number }> | null } = {}) {
  html = expandTemplateTokens(html);
  if (route === "/about") {
    html = html.replace('<section><div class="flex items-center gap-3 mb-6"><span class="wc-eyebrow">{{SERVER_NAME}} Team</span>', '<section class="wc-about-team"><div class="flex items-center gap-3 mb-6"><span class="wc-eyebrow">{{SERVER_NAME}} Team</span>');
    html = html.replace(/<section><div class="flex items-center gap-3 mb-6"><img[^>]*alt="Tech"[^>]*\/><h2 class="text-2xl font-black tracking-tight">Infrastructure &amp; Features<\/h2>/, (match) => match.replace('<section>', '<section class="wc-about-infrastructure">'));
  }
  if (route === "/") {
    html = html.replace(/<img src="\/[^\"]*logo\.svg" alt="[^\"]*logo"/i, '<img data-home-logo="" src="/server-placeholder.svg" alt="{{SERVER_NAME}} logo"');
    html = html.replace(/<h1 class="absolute top-0 left-0 ([^"]*text-blue-500[^"]*)">Infinite Adventures\.<\/h1>/, '<h1 data-home-hero-shuffle="" class="absolute top-0 left-0 $1">Infinite Adventures.</h1>');
    html = html.replace("<span>Experience epic adventures with custom game modes, an active community, and lag-free gameplay. Replace your boring afternoons with an incredible Minecraft experience.</span>", '<span data-home-intro-shuffle="">Experience epic adventures with custom game modes, an active community, and lag-free gameplay. Replace your boring afternoons with an incredible Minecraft experience.</span>');
    html = html.replace(/(<span class="text-\[11px\] font-medium text-slate-500 tracking-wide">Players Online<\/span>)<span class="text-lg font-bold text-white leading-tight mt-0\.5">[^<]*(<\/span>)/, '$1<span class="text-lg font-bold text-white leading-tight mt-0.5" data-db-players>—$2');
    html = html.replace(/(object-contain"\/>)([^<]*)<!-- --> Online<\/div>/, '$1<span data-db-network-players>0</span><!-- --> Online</div>');
    html = html.replace('</span><!-- --> Online</div><a href="{{DISCORD_INVITE_URL}}"', '</span><!-- --> Online</div><button type="button" data-open-player-list class="wc-network-players-button">View Players</button><a href="{{DISCORD_INVITE_URL}}"');
    html = html.replace(/(<span class="text-\[11px\] font-medium text-slate-500 tracking-wide">Uptime<\/span>)<span class="text-lg font-bold text-white leading-tight mt-0\.5">[^<]*(<\/span>)/, '$1<span class="text-lg font-bold text-white leading-tight mt-0.5" data-db-uptime>—$2');
    if (options.status === null) html = html.replace("LOADING...", "STATUS UNAVAILABLE");
    if (options.status === undefined) html = html.replace("LOADING...", "STATUS UNAVAILABLE");
    if (options.status) {
      html = html.replace('data-db-players>—', `data-db-players>${options.status.players}`);
      html = html.replace('data-db-uptime>—', `data-db-uptime>${escapeHtml(options.status.uptime)}`);
      html = html.replace("LOADING...", options.status.online ? "ONLINE" : "OFFLINE");
    }
    if (options.gameModes !== undefined) html = replaceDivGridAfter(html, "Choose Your Adventure", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", gameModeCards(options.gameModes), "wc-home-modes-grid");
    html = replaceDivGridAfter(html, "Find answers to common questions about our server", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", databaseFaq(), "wc-faq-grid");
    html = html.replaceAll("{{JAVA_ADDRESS}}", "{{JAVA_ADDRESS}}").replaceAll("{{JAVA_ADDRESS}}", "{{JAVA_ADDRESS}}");
    if (options.posts !== undefined) {
      const cards = options.posts === null
        ? '<div class="col-span-full rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-200">Latest news could not be loaded right now.</div>'
        : options.posts.length ? databasePostCards(options.posts.slice(0, 3)) : '<div class="col-span-full rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">No published articles are available yet.</div>';
      html = replaceDivGridAfter(html, "Latest News &amp; Insights", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", cards);
    }
  }
  if (route === "/blog" && options.posts !== undefined) {
    const cards = options.posts === null
      ? '<div class="col-span-full rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-200">Articles could not be loaded right now.</div>'
      : options.posts.length ? databasePostCards(options.posts) : '<div class="col-span-full rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">No published posts in this category yet.</div>';
    html = replaceDivGridAfter(html, "Official Blog", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto", cards);
  }
  if (route === "/ranks" && Array.isArray(options.ranks)) {
    const cards = options.ranks.map((rank) => {
      const lines = rank.perks.split("\n").map((line) => line.trim()).filter(Boolean);
      const perks = lines.map((line) => `<li>${escapeHtml(line.replace(/^-\s*/, ""))}</li>`).join("");
      const image = rank.image_url ? `<img src="${escapeAttribute(rank.image_url)}" alt=""/>` : "";
      return `<article class="wc-rank-card"><div class="wc-rank-card__top">${image}<div><span>{{SERVER_NAME}} RANK</span><h2>${escapeHtml(rank.name)}</h2></div></div><p class="wc-rank-card__price">${Number(rank.price).toLocaleString("en-US")} <small>Points</small></p><ul>${perks}</ul><a href="/store" class="wc-rank-card__buy">Get Points</a></article>`;
    }).join("");
    html = html.replace(/<table\b[\s\S]*?<\/table>/, `<section class="wc-ranks-grid">${cards}</section>`);
  }
  if (route === "/ranks" && options.ranks !== undefined && (!options.ranks || options.ranks.length === 0)) {
    const message = options.ranks === null ? "Rank data could not be loaded right now." : "No active ranks are available right now.";
    html = html.replace(/<table\b[\s\S]*?<\/table>/, `<div class="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-300">${message}</div>`);
  }
  if (route === "/suggestions") {
    const skeleton = '<div class="animate-pulse bg-card border rounded-xl h-[200px]"></div>'.repeat(6);
    const emptyGrid = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${skeleton}</div>`;
    const cardHtml = options.suggestions === null || options.suggestions === undefined
      ? '<div class="col-span-full rounded-xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-200">Suggestions are unavailable right now.</div>'
      : options.suggestions.length ? suggestionCards(options.suggestions) : '<div class="col-span-full rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">No community ideas have been submitted yet.</div>';
    const filledGrid = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${cardHtml}</div>`;
    html = html.replace(emptyGrid, filledGrid);
  }
  if (route === "/leaderboard" && options.supporters !== undefined) {
    const rows = options.supporters?.length ? options.supporters.map((row, index) => `<article class="wc-supporter-row"><strong>#${index + 1}</strong><span>${escapeHtml(row.username)}</span><b>${Number(row.amount).toLocaleString("en-US")} BDT</b></article>`).join("") : '<p class="wc-leaderboard-empty">{{LEADERBOARD_EMPTY_MESSAGE}}</p>';
    html = `<main class="wc-static-page"><span class="wc-eyebrow">Community</span><h1>Supporter Leaderboard</h1><p>Players ranked by confirmed {{SERVER_NAME}} purchases.</p><section class="wc-supporter-list">${rows}</section></main>`;
  }
  return expandTemplateTokens(html);
}

function navigationHtml(html: string) {
  html = expandTemplateTokens(html);
  return html.replace(/<button\b[^>]*>[\s\S]*?<\/button>/g, (button) => {
    if (!button.includes("lucide-shopping-cart")) return button;
    return button.replace(/^<button\b/, '<a href="/cart" aria-label="Shopping cart"').replace(/<\/button>$/, "</a>");
  });
}

export function getSourcePage(route: string) {
  return pageMap[route];
}

export function getSourceRoutes() {
  return Object.keys(pageMap).filter((route) => route !== "/");
}

function StoreFallback({ product }: { product: string }) {
  const title = product.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return (
    <div className="store-product-fallback">
      <a href="/store">‹ &nbsp;Back to Store</a>
      <div className="store-product-fallback__grid">
        <div className="store-product-fallback__art"><img src="/reference/assets/2a4ee024213ac869ea0d702852afaec5c56619b1.webp" alt="" /></div>
        <section className="store-product-fallback__details">
          <span>STORE ITEM</span>
          <h1>{title}</h1>
          <p>This item is listed in the {expandTemplateTokens("{{SERVER_NAME}} listing")} but is no longer available on the source store.</p>
          <button type="button" disabled>Currently unavailable</button>
        </section>
      </div>
    </div>
  );
}

export default async function SitePage({ route, missingProduct, category }: { route: string; missingProduct?: string; category?: string }) {
  const page = pageMap[route] ?? pageMap["/cart"] ?? pageMap["/store"];
  const fallback = Boolean(missingProduct);
  const storeIndex = route === "/store" || route.startsWith("/store?category=");
  const storeDetail = route.startsWith("/store/") && !fallback;
  const articleRoute = route.startsWith("/blog/") || route.startsWith("/minecraft-guides/") || route.startsWith("/survival/") || route.startsWith("/builds/") || route.startsWith("/update/") || route.startsWith("/event/") || route.startsWith("/community/") || route.startsWith("/status/");
  const contentPosts = route === "/" || route === "/blog";
  const [posts, dbSuggestions, status, ranks, gameModes, article, product, supporters] = await Promise.all([
    contentPosts ? getPosts({ category: route === "/blog" ? category : undefined, limit: route === "/" ? 3 : 100 }).catch(() => []) : Promise.resolve(null),
    route === "/suggestions" ? getSuggestions().catch(() => []) : Promise.resolve(null),
    route === "/" ? (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const summary = await supabase.from("server_status").select("players_online,uptime,is_online").eq("status_key", "primary").maybeSingle();
        if (summary.error) return null;
        if (!summary.data) return null;
        return { players: summary.data.players_online, uptime: summary.data.uptime, online: summary.data.is_online };
      } catch { return null; }
    })() : Promise.resolve(null),
    route === "/ranks" ? getRanks().catch(() => []) : Promise.resolve(undefined),
    route === "/" ? getGameModes().catch(() => [{ id: "survival-template", name: "Survival", description: "Add a short description of your survival world and community.", sort_order: 1 }]) : Promise.resolve(undefined),
    articleRoute ? getPost(route).catch(() => null) : Promise.resolve(null),
    storeDetail ? getProduct(route.slice("/store/".length)).catch(() => null) : Promise.resolve(null),
    route === "/leaderboard" ? (async () => {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        const { data, error } = await admin.from("store_orders").select("minecraft_username,subtotal").in("status", ["paid", "fulfilled"]);
        if (error) throw error;
        const totals = new Map<string, number>();
        for (const order of data ?? []) totals.set(order.minecraft_username, (totals.get(order.minecraft_username) ?? 0) + Number(order.subtotal));
        return [...totals].map(([username, amount]) => ({ username, amount })).sort((a, b) => b.amount - a.amount).slice(0, 20);
      } catch { return null; }
    })() : Promise.resolve(undefined),
  ]);
  const databaseSuggestions: Suggestion[] | null = dbSuggestions === null ? null : (dbSuggestions as DbSuggestion[]).map((item) => ({
    id: item.id,
    username: item.name,
    avatar: item.avatar_url || "/reference/assets/18045171bd71b6dbdb4625210eb988cb83a28711.webp",
    status: item.status.toUpperCase(),
    tag: item.category,
    tagColor: item.category === "Survival GameMode" ? "#8a00bd" : "#fa8500",
    tagTextColor: "#ffffff",
    content: item.message,
    age: relativeAge(item.created_at),
    upvotes: item.upvotes,
    downvotes: item.downvotes,
    comments: 0,
    adminNote: item.admin_note || "",
  }));
  let main = pageHtml(route, page.main, {
    posts: contentPosts ? (posts as DbPost[] | null) : undefined,
    suggestions: route === "/suggestions" ? databaseSuggestions : undefined,
    status: route === "/" ? status : undefined,
    ranks: route === "/ranks" ? ranks as DbRank[] | null : undefined,
    gameModes: route === "/" ? gameModes as DbGameMode[] | null : undefined,
    supporters: route === "/leaderboard" ? supporters as Array<{ username: string; amount: number }> | null : undefined,
  });
  if (storeIndex) return (
    <div className="bdz-page relative flex min-h-screen flex-col bg-background text-foreground">
      <HomeEffects />
      <div dangerouslySetInnerHTML={{ __html: navigationHtml(page.nav) }} />
      <MobileMenuInteractions />
      <main className="flex-1"><DatabaseStorefront initialCategory={category || "ranks"} /></main>
      <StoreGate initialOpen />
      <DatabaseInteractions />
      <div dangerouslySetInnerHTML={{ __html: expandTemplateTokens(page.footer) }} />
    </div>
  );
  if (route === "/about") return (
    <div className="bdz-page relative flex min-h-screen flex-col bg-background text-foreground">
      <div dangerouslySetInnerHTML={{ __html: navigationHtml(page.nav) }} />
      <MobileMenuInteractions />
      <AboutPage />
      <div dangerouslySetInnerHTML={{ __html: expandTemplateTokens(page.footer) }} />
    </div>
  );
  if (article?.content_html) main = article.content_html;
  if (articleRoute && !article) main = '<section class="mx-auto max-w-3xl px-6 py-20 text-center"><h1 class="text-3xl font-black">Article unavailable</h1><p class="mt-3 text-muted-foreground">This article could not be loaded right now. Please try again.</p><a class="mt-6 inline-flex text-primary" href="/blog">Back to Blog</a></section>';
  if (storeDetail && !product) main = '<section class="mx-auto max-w-3xl px-6 py-20 text-center"><h1 class="text-3xl font-black">Product unavailable</h1><p class="mt-3 text-muted-foreground">This product could not be loaded right now. Please try again.</p><a class="mt-6 inline-flex text-primary" href="/store">Back to Store</a></section>';
  const staffParts = route === "/about" ? main.split('<div data-server-staff-list></div>') : [];
  return (
    <div className={`${route === "/" ? "bdz-home " : ""}bdz-page relative flex min-h-screen flex-col bg-background text-foreground`}>
      <HomeEffects />
      <div dangerouslySetInnerHTML={{ __html: navigationHtml(page.nav) }} />
      <MobileMenuInteractions />
      {route === "/" && <LivePlayerList />}
      <main className="flex-1">
        {fallback ? <StoreFallback product={missingProduct!} /> : route === "/cart" ? <DatabaseCart /> : route === "/checkout" ? <DatabaseCheckout /> : storeDetail && product ? <DatabaseProductDetail product={product} /> : route === "/about" && staffParts.length === 2 ? <><div dangerouslySetInnerHTML={{ __html: staffParts[0] }} /><StaffList /><div dangerouslySetInnerHTML={{ __html: staffParts[1] }} /></> : <div dangerouslySetInnerHTML={{ __html: main }} />}
      </main>
      {storeDetail && <><StoreGate /><StoreInteractions productSlug={route.slice("/store/".length)} /></>}
      {storeIndex && <StoreGate initialOpen />}
      <DatabaseInteractions suggestionsPage={route === "/suggestions"} newsletter={route === "/"} />
      <div dangerouslySetInnerHTML={{ __html: expandTemplateTokens(page.footer) }} />
      <a
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f18] p-0 shadow-[0_0_30px_-5px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-2 hover:scale-105 hover:bg-[#121a2f]"
        href="/suggestions"
        title="Suggestions & Feedback"
        aria-label="Suggestions and feedback"
      >
        <img src="/reference/assets/edb9f6d0b93860e5f1fe32b6222d01aed011836e.webp" alt="" className="h-14 w-14 scale-[1.15] object-cover object-center" />
      </a>
    </div>
  );
}

export function getPageTitle(route: string) {
  return expandTemplateTokens(pageMap[route]?.title ?? "{{SERVER_NAME}} Store | {{SERVER_NAME}}");
}
