import StaffList from "@/components/StaffList";
import { siteConfig } from "@/lib/site-config";

const features = [
  { title: "Classic Survival", text: "Enjoy balanced, immersive survival gameplay with custom enhancements." },
  { title: "Crossplay Support", text: "Java and Bedrock players can play together in one community." },
  { title: "Active Community", text: "Meet friendly players, helpful staff, and take part in regular events." },
  { title: "Optimized Performance", text: "Smooth, lag-free gameplay keeps builds and adventures moving." },
];

export default function AboutPage() {
  return <main className="wc-about-page">
    <header className="wc-about-page__header">
      <span className="wc-eyebrow">{siteConfig.name}</span>
      <h1>About the server</h1>
      <p>Learn about our Survival community, how to join, and the team that supports the server.</p>
    </header>

    <section className="wc-about-page__section wc-about-server">
      <h2>About the Server</h2>
      <p>Welcome to {siteConfig.name} — your Minecraft community website. Introduce your server, explain what makes it unique, and tell players how to get started.</p>
      <ul>{features.map(item=><li key={item.title}><strong>{item.title}:</strong> {item.text}</li>)}</ul>
      <p>Link your voting sites to let players support the community.</p>
    </section>

    <section className="wc-about-page__section wc-about-connection">
      <div><span className="wc-eyebrow">Join the server</span><h2>Java and Bedrock</h2><p>Use the same address for either edition. The default port applies.</p></div>
      <div className="wc-about-connection__details"><span>SERVER ADDRESS</span><strong>{siteConfig.javaAddress}</strong><span>VERSION</span><strong>{siteConfig.minecraftVersion}</strong></div>
    </section>

    <section className="wc-about-page__section">
      <h2>What you’ll find here</h2>
      <div className="wc-about-highlights">{features.map((item,index)=><article className="wc-about-highlight" key={item.title}><span className="wc-about-highlight__number">0{index+1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      <div className="wc-about-vote"><div><span className="wc-eyebrow">Support the community</span><h3>Help {siteConfig.name} grow</h3><p>Vote daily to support the server and claim available in-game rewards.</p></div><a href="/vote">Vote for {siteConfig.name} ↗</a></div>
    </section>

    <section className="wc-about-page__section wc-about-team-section">
      <h2>Meet the Team</h2>
      <p className="wc-about-page__muted">The people who help keep {siteConfig.name} welcoming and running smoothly.</p>
      <StaffList/>
    </section>
  </main>;
}
