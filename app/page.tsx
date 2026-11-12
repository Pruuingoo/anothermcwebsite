import type { Metadata } from "next";
import SitePage, { getPageTitle } from "@/lib/site-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getPageTitle("/") };
}

export default function HomePage() {
  return <SitePage route="/" />;
}
