import Link from "next/link";
import { notFound } from "next/navigation";

const pages: Record<string, { title: string; description: string; sections: string[] }> = {
  about: { title: "About the server", description: "Introduce your Minecraft community and what makes it a place players will enjoy.", sections: ["Community", "Gameplay", "Getting started"] },
  rules: { title: "Server rules", description: "Add clear rules that help players understand how to participate.", sections: ["Be respectful", "Play fairly", "Ask staff for help"] },
  store: { title: "Server store", description: "Connect your own store before accepting payments. This template does not process purchases.", sections: ["Add products", "Explain delivery", "Publish your store policy"] },
  ranks: { title: "Ranks", description: "Describe optional ranks or perks available on your server.", sections: ["Rank one", "Rank two", "Rank three"] },
  blog: { title: "News and updates", description: "Share server announcements, guides, and community stories.", sections: ["Add your first post", "Share an update", "Publish a guide"] },
  contact: { title: "Contact", description: "Add your support email, community link, or ticket system here.", sections: ["Community support", "Technical help", "Business inquiries"] },
  suggestions: { title: "Suggestions", description: "Choose a feedback service or add your own suggestion form.", sections: ["Share an idea", "Report an issue", "See community updates"] },
  gallery: { title: "Gallery", description: "Add screenshots from your server after replacing these placeholders.", sections: ["Build showcase", "Community moments", "Events"] },
  leaderboard: { title: "Leaderboard", description: "Connect a data source to show live server leaderboards.", sections: ["Top players", "Recent activity", "Season standings"] },
};

export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: pages[slug]?.title ?? "Page" };
}

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <main className="page-shell"><header className="page-header"><Link href="/" className="back-link">← Home</Link><span className="eyebrow">Template page</span><h1>{page.title}</h1><p>{page.description}</p></header><section className="feature-grid page-feature-grid">{page.sections.map((item, index) => <article className="feature-card" key={item}><span className="feature-number">{String(index + 1).padStart(2, "0")}</span><h2>{item}</h2><p>Replace this sample section with your own content.</p></article>)}</section></main>;
}
