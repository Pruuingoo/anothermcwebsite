import Link from "next/link";

export default function NotFound() {
  return <main className="page-shell not-found"><span className="eyebrow">404</span><h1>Page not found</h1><p>This template page has not been added yet.</p><Link className="button button-primary" href="/">Back home</Link></main>;
}
