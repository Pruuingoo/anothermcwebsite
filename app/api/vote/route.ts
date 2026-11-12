import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_VOTE_SITES } from "@/lib/vote-data";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("site");
  const site = ALLOWED_VOTE_SITES.find((candidate) => candidate.slug === slug);
  if (!site?.vote_url) return NextResponse.json({ error: "Configure this voting URL in your environment settings." }, { status: 404 });
  let destination: URL;
  try {
    destination = new URL(site.vote_url);
    if (destination.protocol !== "https:") throw new Error("HTTPS is required");
  } catch {
    return NextResponse.json({ error: "This voting URL is invalid." }, { status: 400 });
  }

  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (username && /^[A-Za-z0-9_]{3,16}$/.test(username)) destination.searchParams.set("username", username);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await createAdminClient().from("vote_events").insert({ player_uuid: "unregistered", player_name: username || "Visitor", site_slug: site.slug, site_name: site.name, verified: false, event_source: "outbound_click" });
    } catch {
      // An outbound link remains usable even if optional analytics are not configured.
    }
  }
  return NextResponse.redirect(destination, 302);
}
