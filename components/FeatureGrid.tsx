import Link from "next/link";

export default function FeatureGrid() {
  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <div className="section__copy">
            <span className="eyebrow">Game modes</span>
            <h2 className="section__title">Choose your adventure</h2>
            <p className="section__sub">
              Find your next world, whether you want a long-term build or a quick match.
            </p>
          </div>
          <Link href="/store" className="btn btn--outline">
            Browse all<svg className="btn__arrow" width="16" height="16" aria-hidden="true"><use href="#i-arrow" /></svg>
          </Link>
        </div>
        <div className="grid grid--2">
          <article className="tile" data-reveal>
            <span className="tile__icon">
              <span aria-hidden="true">🌿</span>
            </span>
            <h3 className="tile__title">Survival</h3>
            <p className="tile__text">
              Long-form season with land claims, player shops, quests and a custom mob grid.
            </p>
          </article>
          <article className="tile" data-reveal>
            <span className="tile__icon">
              <span aria-hidden="true">⚔️</span>
            </span>
            <h3 className="tile__title">PvP Arena</h3>
            <p className="tile__text">
              Ranked duos and kits with seasonal leaderboards.
            </p>
          </article>
          <article className="tile" data-reveal>
            <span className="tile__icon">
              <span aria-hidden="true">🎮</span>
            </span>
            <h3 className="tile__title">Minigames</h3>
            <p className="tile__text">
              Rotating lobby games that queue fast.
            </p>
          </article>
          <article className="tile" data-reveal>
            <span className="tile__icon">
              <span aria-hidden="true">💎</span>
            </span>
            <h3 className="tile__title">Skyblock</h3>
            <p className="tile__text">
              Island progression, coop slots and island wars.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
