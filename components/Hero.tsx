"use client";
import { CopyIP } from "@/components/CopyIP";
import { siteConfig } from "@/lib/site-config";

export default function Hero({ stats }: { stats: any }) {
  return (
    <section className="hero relative isolate">
      <div className="hero__glow" aria-hidden="true"></div>
      <div className="hero__grid" aria-hidden="true"></div>
      <div className="container hero__inner">
        <span className="eyebrow" >
          Java & Bedrock online
        </span>
        <h1 className="hero__title" >
          Built for players<br />who never <em>log off</em>.
        </h1>
        <p className="hero__lede" >
          Build, explore, and compete with a welcoming community. Java and Bedrock players are all welcome.
        </p>
        <div className="hero__cta" >
          <a href="/store" className="btn btn--primary btn--lg">
            Open the store
          </a>
          <a href="/ranks" className="btn btn--outline btn--lg">
            See ranks
          </a>
        </div>
        <div className="ipgrid">
          <CopyIP label="Java Edition" address={siteConfig.javaAddress} />
          <CopyIP label="Bedrock Edition" address={siteConfig.bedrockAddress} port={siteConfig.bedrockPort} />
        </div>
        <div className="stats" >
          <div className="stat">
            <span className="stat__num">{stats.players}<span>+</span></span>
            <span className="stat__label">Players this week</span>
          </div>
          <div className="stat">
            <span className="stat__num">{stats.uptime}</span>
            <span className="stat__label">Uptime</span>
          </div>
          <div className="stat">
            <span className="stat__num">{stats.modes}</span>
            <span className="stat__label">Game modes</span>
          </div>
          <div className="stat">
            <span className="stat__num">{stats.version}</span>
            <span className="stat__label">Version</span>
          </div>
        </div>
      </div>
    </section>
  );
}
