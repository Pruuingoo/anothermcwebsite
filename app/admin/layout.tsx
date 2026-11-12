import type { ReactNode } from "react";
import Link from "next/link";
import "./admin.css";
import { getAdminContext } from "@/lib/admin/auth";
import { siteConfig } from "@/lib/site-config";

export const metadata = { title: `${siteConfig.name} Admin`, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminContext();
  return <div className="wc-admin">{admin&&<header><Link href="/admin">{siteConfig.name} Admin</Link><div><span>{admin.username} · {admin.role}</span><form action="/api/admin/logout" method="post"><button type="submit">Sign out</button></form></div></header>}{children}</div>;
}
