"use client";
import Image from "next/image";
import Link from "next/link";

export default function NewsGrid({ posts }: { posts: any[] }) {
  return (
    <section className="section section--wide">
      <div className="container">
        <div className="section__head">
          <div className="section__copy">
            <span className="eyebrow">Latest updates</span>
            <h2 className="section__title">News and guides</h2>
            <p className="section__sub">
              Cover image, category chip, date row, two-line clamped title and excerpt.
            </p>
          </div>
          <Link href="/blog" className="btn btn--outline">
            Read all articles
          </Link>
        </div>
        <div className="grid grid--3">
          {posts.map((p) => (
            <a key={p.id} className="card post" href="/blog" data-reveal>
              <span className="media">
                <Image src={p.cover_url} alt={p.title} width={800} height={450} priority />
              </span>
              <span className="flex flex-col gap-1 p-5 flex-1">
                <span className="meta">
                  <span className="badge">{p.category}</span>
                </span>
                <h3 className="post__title">{p.title}</h3>
                <p className="post__excerpt">{p.excerpt}</p>
                <span className="post__more">Read more</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
