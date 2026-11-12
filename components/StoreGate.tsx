"use client";

import { FormEvent, useEffect, useState } from "react";

export default function StoreGate({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("server-minecraft-username");
    if (saved) setUsername(saved);
    else if (initialOpen) setOpen(true);
    if (saved) {
      void fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_username", username: saved }) });
    }
    const requestUsername = () => setOpen(true);
    window.addEventListener("store:request-username", requestUsername);
    return () => window.removeEventListener("store:request-username", requestUsername);
  }, [initialOpen]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = username.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(value)) {
      setError("Use 3–16 letters, numbers, or underscores.");
      return;
    }
    setError("");
    void fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_username", username: value }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save username.");
      window.localStorage.setItem("server-minecraft-username", value);
      setOpen(false);
      window.dispatchEvent(new CustomEvent("store:username-saved", { detail: { username: value } }));
    }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Could not save username.");
    });
  };

  if (!open) return null;

  return (
    <div className="store-gate" role="presentation">
      <section className="store-gate__dialog" role="dialog" aria-modal="true" aria-labelledby="store-gate-title">
        <div className="store-gate__symbol" aria-hidden="true">⚔</div>
        <h1 id="store-gate-title">Enter Your Username</h1>
        <p>Enter your Minecraft username to access the store.</p>
        <img className="store-gate__avatar" src="/reference/assets/18045171bd71b6dbdb4625210eb988cb83a28711.webp" alt="Minecraft player avatar" />
        <span className="store-gate__rank">♢ &nbsp;Current Rank: <strong>—</strong></span>
        <form onSubmit={submit}>
          <label className="store-gate__label" htmlFor="minecraft-username">Minecraft username</label>
          <input id="minecraft-username" autoComplete="username" autoFocus value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} placeholder="e.g. Notch, Steve123, my_name" />
          <small>3–16 characters. Letters, numbers, underscores only.</small>
          {error && <span className="store-gate__error" role="alert">{error}</span>}
          <button type="submit">Continue to Store&nbsp; ›</button>
        </form>
      </section>
    </div>
  );
}
