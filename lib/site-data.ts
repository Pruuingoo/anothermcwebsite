import { createClient } from "@/lib/supabase/server";

export type DbPost = {
  id: string;
  slug: string;
  source_path: string;
  title: string;
  excerpt: string;
  cover_url: string;
  category: string;
  published_at: string;
  content_html?: string;
};

export type DbProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type DbRank = {
  id: string;
  slug: string;
  name: string;
  price: number;
  badge_color: string | null;
  perks: string;
  image_url: string | null;
  featured: boolean;
  sort_order: number;
};

export type DbGameMode = { id: string; name: string; description: string; sort_order: number };

export type DbSuggestion = {
  id: string;
  name: string;
  message: string;
  created_at: string;
  category: string;
  status: string;
  upvotes: number;
  downvotes: number;
  admin_note: string | null;
  avatar_url: string | null;
};

export async function getPosts({ category, limit }: { category?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id,slug,source_path,title,excerpt,cover_url,category,published_at")
    .eq("is_published", true)
    .not("source_path", "is", null)
    .order("published_at", { ascending: false });
  const categoryName = category ? ({
    "minecraft-guides": "Minecraft Guides",
    "server-status": "Server Status",
    "patch-notes": "Patch Notes",
  } as Record<string, string>)[category] ?? category : undefined;
  if (categoryName) query = query.ilike("category", categoryName);
  const { data, error } = await query.limit(limit ?? 100);
  if (error) throw error;
  return (data ?? []) as DbPost[];
}

export async function getRanks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ranks")
    .select("slug,name,price,badge_color,perks,image_url,featured,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbRank[];
}

export async function getGameModes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_modes")
    .select("id,name,description,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbGameMode[];
}

export async function getPost(sourcePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id,slug,source_path,title,excerpt,cover_url,category,published_at,content_html")
    .eq("source_path", sourcePath)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data as DbPost | null;
}

export async function getProducts(category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id,slug,name,price,category,description,image_url,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (category) query = query.eq("category", category);
  const { data, error } = await query.limit(100);
  if (error) throw error;
  return (data ?? []) as DbProduct[];
}

export async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name,price,category,description,image_url,sort_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as DbProduct | null;
}

export async function getSuggestions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suggestions")
    .select("id,name,message,created_at,category,status,upvotes,downvotes,admin_note,avatar_url")
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as DbSuggestion[];
}
