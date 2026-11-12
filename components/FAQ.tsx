"use client";

import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = [
    { q: "Do I need a paid account?", a: "No, the server is free to play. Premium ranks offer extra perks." },
    { q: "Is it free to play?", a: "Yes, there are no paywalls for core gameplay." },
    { q: "What versions are supported?", a: "Minecraft 1.20 through 1.21.1 for Java, and 1.20+ for Bedrock." },
    { q: "How do I report a player?", a: "Use the suggestions button in the bottom right, or contact staff on Discord." },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section__head" style={{ justifyContent: "center", textAlign: "center" }}>
          <div className="section__copy" style={{ alignItems: "center", marginInline: "auto" }}>
            <span className="eyebrow">Support</span>
            <h2 className="section__title">Frequently asked</h2>
          </div>
        </div>
        <div className="faq">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="faq__item"
              data-faq-item
              data-reveal
              data-open={openIndex === idx}
            >
              <button
                className="faq__q"
                type="button"
                data-faq-toggle
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                {item.q}
                <svg className="faq__chev" width="18" height="18" aria-hidden="true"><use href="#i-chev" /></svg>
              </button>
              <div className="faq__a" id={`faq-answer-${idx}`}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
