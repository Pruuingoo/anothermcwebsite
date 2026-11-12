import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const categories = new Set(["points"]);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const category = request.nextUrl.searchParams.get("category");
    let query = supabase
      .from("products")
      .select("id,slug,name,price,category,description,image_url,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (category && categories.has(category)) query = query.eq("category", category);
    const { data, error } = await query.limit(100);
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Catalog read error:", error);
    return NextResponse.json({ error: "Store catalog is temporarily unavailable." }, { status: 503 });
  }
}
