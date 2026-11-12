import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

const staff = [
  { id: "staff-1", fallback: siteConfig.ownerName, displayName: siteConfig.ownerName, role: "Owner", url: null, avatarUrl: "/server-placeholder.svg" },
  { id: "staff-2", fallback: siteConfig.adminName, displayName: siteConfig.adminName, role: "Admin", url: null, avatarUrl: "/server-placeholder.svg" },
  { id: "staff-3", fallback: siteConfig.developerName, displayName: siteConfig.developerName, role: "Developer", url: null, avatarUrl: "/server-placeholder.svg" },
  { id: "staff-4", fallback: siteConfig.moderatorName, displayName: siteConfig.moderatorName, role: "Moderator", url: null, avatarUrl: "/server-placeholder.svg" },
];

export async function GET() {
  return NextResponse.json({ staff }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } });
}
