import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VotePage, { getVotePage, getVotePageTitle, getVoteRoutes } from "@/lib/vote-page";

type RouteProps = { params: Promise<{ slug: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateStaticParams() {
  return getVoteRoutes().map((route) => ({ slug: route.replace(/^\//, "").split("/") }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: getVotePageTitle(`/${slug.join("/")}`) };
}

export default async function VotingSubpage({ params, searchParams }: RouteProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const route = `/${slug.join("/")}`;
  if (!getVotePage(route)) notFound();
  return <VotePage route={route} searchPlayer={typeof query.player === "string" ? query.player : ""} />;
}
