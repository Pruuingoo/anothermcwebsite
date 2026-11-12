import Link from "next/link";

const sites = ["Voting Site 1", "Voting Site 2", "Voting Site 3", "Voting Site 4"];

export const metadata = { title: "Vote" };

export default function VotePage() {
  return <main className="page-shell"><header className="page-header"><Link href="/" className="back-link">← Home</Link><span className="eyebrow">Support the server</span><h1>Vote for your server</h1><p>Add your server-list URLs to these cards in <code>app/vote/page.tsx</code>.</p></header><section className="vote-grid" aria-label="Voting sites">{sites.map((site) => <article className="vote-card" key={site}><span className="vote-star" aria-hidden="true">☆</span><h2>{site}</h2><p>Replace this card with a link to your listing.</p><span className="button button-disabled">Add vote link</span></article>)}</section></main>;
}
