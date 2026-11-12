export default function Steps() {
  return (
    <section className="section">
      <div className="container">
        <div className="section__head">
          <div className="section__copy">
            <span className="eyebrow">Getting in</span>
            <h2 className="section__title">How to join</h2>
            <p className="section__sub">
              Join from Java or Bedrock in just a few quick steps.
            </p>
          </div>
        </div>
        <div className="steps">
          <div className="step" data-reveal>
            <span className="step__num">1</span>
            <h3>Copy server IP</h3>
            <p>Use either address card above; each writes to the clipboard.</p>
          </div>
          <div className="step" data-reveal>
            <span className="step__num">2</span>
            <h3>Launch Minecraft</h3>
            <p>Match the version shown in the stats row.</p>
          </div>
          <div className="step" data-reveal>
            <span className="step__num">3</span>
            <h3>Add server</h3>
            <p>Paste into Multiplayer, or into Servers on Bedrock.</p>
          </div>
          <div className="step" data-reveal>
            <span className="step__num">4</span>
            <h3>Join and play</h3>
            <p>Pick a mode from the grid and go.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
