import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SitePage, { getPageTitle, getSourcePage, getSourceRoutes } from "@/lib/site-page";
import { siteConfig } from "@/lib/site-config";

type RouteProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return getSourceRoutes().filter((route) => route !== "/vote").map((route) => ({ slug: route.replace(/^\//, "").split("/") }));
}

export async function generateMetadata({ params, searchParams }: RouteProps): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const route = `/${slug.join("/")}`;
  if (route === "/checkout") return { title: `Checkout | ${siteConfig.name}` };
  const category = query.category;
  const key = route === "/store" && typeof category === "string" ? `${route}?category=${category}` : route;
  return { title: getPageTitle(key) };
}

export default async function ContentPage({ params, searchParams }: RouteProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const route = `/${slug.join("/")}`;
  if (route === "/checkout") return <SitePage route="/checkout" />;
  if (route.startsWith("/blog/")) return <SitePage route={route} />;
  const category = query.category;
  const key = route === "/store" && typeof category === "string" ? `${route}?category=${category}` : route;
  const page = getSourcePage(key);
  if (!page) notFound();
  if (page.status === 404 && route.startsWith("/store/")) return <SitePage route="/store" missingProduct={slug.at(-1)} />;
  const blogCategory = route === "/blog" && typeof query.cat === "string" ? query.cat : undefined;
  return <SitePage route={key} category={blogCategory} />;
}
