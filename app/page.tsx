"use client";

import Link from "next/link";
import { useState } from "react";

const serverName = "Your Server";
const serverAddress = "play.example.com";
const bedrockPort = "19132";

const features = [
  ["01", "Survival", "Build, explore, and create your own world with friends."],
  ["02", "Friendly community", "Set the tone for a welcoming place to play."],
  ["03", "Regular events", "Add events, updates, or seasonal activities here."],
  ["04", "Cross-play", "Share connection details for the editions you support."],
];

const questions = [
  ["How do I join?", "Add the server address to the multiplayer list in your Minecraft edition."],
  ["Is the server free to play?", "Replace this answer with your server's access and store information."],
  ["Which versions are supported?", "List the Java and Bedrock versions supported by your server."],
  ["How do I contact staff?", "Add a support link or contact method for your community."],
  ["Can I play with friends?", "Describe your server's party, team, or multiplayer features."],
  ["Where can I find the rules?", "Link to your rules page and explain how players should read them."],
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(serverAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label={`${serverName} home`}>
          <img src="/server-placeholder.svg" alt="" />
          <span>{serverName}</span>
        </Link>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          <Link href="/">Home</Link><Link href="/vote">Vote</Link><Link href="/about">About</Link><Link href="/store">Store</Link><Link href="/rules">Rules</Link><Link href="/blog">Blog</Link>
        </nav>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="eyebrow"><i /> Minecraft Server Template</span>
            <h1>Build your next <span>Minecraft community.</span></h1>
            <p>Make this website your own. Add your server details, community links, game modes, and news in one responsive place.</p>
            <div className="hero-actions"><button className="button button-primary" onClick={copyAddress}>{copied ? "Copied!" : `Copy ${serverAddress}`}</button><Link className="button button-quiet" href="/vote">Voting page <span aria-hidden="true">↗</span></Link></div>
          </div>
          <div className="hero-mark"><img src="/server-placeholder.svg" alt="Placeholder server mark" /><span>Replace this logo</span></div>
          <div className="quick-stats" aria-label="Server information">
            <div><span className="stat-icon">◈</span><span><small>Java address</small><strong>{serverAddress}</strong></span></div>
            <div><span className="stat-icon">◇</span><span><small>Bedrock port</small><strong>{bedrockPort}</strong></span></div>
            <div><span className="stat-icon">✦</span><span><small>Game mode</small><strong>Survival</strong></span></div>
            <div><span className="stat-icon">◎</span><span><small>Server status</small><strong>Configure status</strong></span></div>
          </div>
        </section>

        <section className="section wrap" id="features">
          <div className="section-heading"><span className="eyebrow">Start here</span><h2>Make it <em>your world.</em></h2><p>Replace the sample copy and connect the services your community uses.</p></div>
          <div className="feature-grid">{features.map(([n, title, text]) => <article className="feature-card" key={title}><span className="feature-number">{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="join-section">
          <div className="wrap join-inner"><div><span className="eyebrow">Connection details</span><h2>Ready to join?</h2><p>Replace the sample address and port with your server connection details.</p></div><div className="address-card"><span>JAVA EDITION</span><strong>{serverAddress}</strong><button type="button" onClick={copyAddress}>{copied ? "Copied" : "Copy address"}</button><small>Bedrock port: {bedrockPort}</small></div></div>
        </section>

        <section className="section wrap" id="faq">
          <div className="section-heading"><span className="eyebrow">Need a hand?</span><h2>Frequently asked <em>questions</em></h2><p>Edit these answers to match your server.</p></div>
          <div className="faq-grid">{questions.map(([question, answer], index) => {
            const open = openFaq === index;
            return <article className={open ? "faq-card is-open" : "faq-card"} key={question}>
              <button className="faq-question" type="button" aria-expanded={open} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(open ? null : index)}>
                <span className="faq-number">{String(index + 1).padStart(2, "0")}</span><span className="faq-title">{question}</span><span className="faq-toggle" aria-hidden="true">+</span>
              </button>
              <div className="faq-answer" id={`faq-answer-${index}`} aria-hidden={!open}><p>{answer}</p></div>
            </article>;
          })}</div>
        </section>
      </main>

      <footer className="site-footer"><div className="wrap footer-inner"><Link className="brand" href="/"><img src="/server-placeholder.svg" alt="" /><span>{serverName}</span></Link><p>Replace the placeholder content and make this server site your own.</p><div><Link href="/vote">Vote</Link><Link href="/rules">Rules</Link><Link href="/contact">Contact</Link></div><small>© {new Date().getFullYear()} {serverName}. Minecraft is a trademark of Microsoft.</small></div></footer>
    </>
  );
}
