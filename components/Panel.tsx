"use client";
import { siteConfig } from "@/lib/site-config";

export default function Panel() {
  return (
    <section className="section">
      <div className="container">
        <div className="panel">
          <div style={{ display: "grid", gap: "2rem", alignItems: "center" }} className="grid--2">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "32rem" }}>
              <h2 className="panel__title">Stay updated</h2>
              <p className="section__sub">
                Get occasional server news, community updates, and event announcements in your inbox.
              </p>
              <form className="field" onSubmit={(e) => e.preventDefault()}>
                <label className="visually-hidden" htmlFor="email">
                  Email address
                </label>
                <input
                  className="input"
                  id="email"
                  type="email"
                  placeholder="{{SUPPORT_EMAIL}}"
                  autoComplete="email"
                />
                <button className="btn btn--primary" type="submit">
                  Subscribe
                </button>
              </form>
            </div>
            <div className="tile" style={{ background: "transparent" }}>
              <h3 className="tile__title">Join the Discord</h3>
              <ul className="plan__list" style={{ marginTop: "0.75rem" }}>
                <li>
                  <svg width="16" height="16" aria-hidden="true"><use href="#i-check" /></svg> Active chat
                </li>
                <li>
                  <svg width="16" height="16" aria-hidden="true"><use href="#i-check" /></svg> Support tickets
                </li>
                <li>
                  <svg width="16" height="16" aria-hidden="true"><use href="#i-check" /></svg> Giveaways
                </li>
                <li>
                  <svg width="16" height="16" aria-hidden="true"><use href="#i-check" /></svg> Patch notes
                </li>
              </ul>
              <a href={siteConfig.discordInvite} target="_blank" rel="noreferrer" className="btn btn--outline" style={{ marginTop: "1.25rem" }}>
                Join Discord<svg className="btn__arrow" width="16" height="16" aria-hidden="true"><use href="#i-arrow" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
