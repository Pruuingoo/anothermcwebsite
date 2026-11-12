"use client";

import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    const current = window.localStorage.getItem("server-cookie-choice");
    setVisible(current === null);
  }, []);

  const dismiss = (choice: "accepted" | "rejected") => {
    window.localStorage.setItem("server-cookie-choice", choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-consent" aria-label="Cookie preferences">
      <div className="cookie-consent__inner">
        <span className="cookie-consent__icon" aria-hidden="true">◉</span>
        <div className="cookie-consent__content">
          <div className="cookie-consent__heading">
            <div>
              <p className="cookie-consent__title">We use cookies 🍪</p>
              <p className="cookie-consent__copy">We use cookies to personalise content, run ads, and analyse traffic. <a href="/privacy">Privacy Policy</a></p>
            </div>
            <button className="cookie-consent__close" onClick={() => dismiss("rejected")} aria-label="Close cookie notice" type="button">×</button>
          </div>
          {customizing && <p className="cookie-consent__custom-copy">Essential cookies are always active. Optional cookies help us improve the community site.</p>}
          <div className="cookie-consent__actions">
            <button className="cookie-consent__accept" onClick={() => dismiss("accepted")} type="button">✓ Accept All</button>
            <button className="cookie-consent__reject" onClick={() => dismiss("rejected")} type="button">Reject All</button>
            <button className="cookie-consent__customize" onClick={() => setCustomizing(!customizing)} type="button" aria-expanded={customizing}>{customizing ? "Done" : "Customise⌄"}</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
