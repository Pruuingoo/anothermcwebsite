"use client";

import { FormEvent, useEffect, useState } from "react";

declare global { interface Window { turnstile?: { render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string; reset: (widgetId: string) => void }; } }

export default function DatabaseInteractions({ suggestionsPage = false, newsletter = false }: { suggestionsPage?: boolean; newsletter?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("In Game");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);

  useEffect(() => {
    const onFaqToggle = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-home-faq-toggle]");
      const card = button?.closest<HTMLElement>("[data-home-faq-card]");
      const answer = card?.querySelector<HTMLElement>("[data-home-faq-answer]");
      if (!button || !card || !answer) return;
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      answer.setAttribute("aria-hidden", String(!open));
      card.classList.toggle("is-open", open);
    };
    document.addEventListener("click", onFaqToggle);
    return () => document.removeEventListener("click", onFaqToggle);
  }, []);

  useEffect(() => {
    if (!suggestionsPage) return;
    const onVote = async (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-suggestion-vote]");
      const card = button?.closest<HTMLElement>("[data-suggestion-id]");
      const id = card?.dataset.suggestionId;
      if (!button || !card || !id) return;
      let voterId = window.localStorage.getItem("server-suggestion-voter");
      if (!voterId) { voterId = crypto.randomUUID(); window.localStorage.setItem("server-suggestion-voter", voterId); }
      button.disabled = true;
      try {
        const response = await fetch("/api/suggestions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, voterId, vote: Number(button.dataset.suggestionVote) }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not save vote.");
        const counts = card.querySelectorAll<HTMLElement>("[data-vote-count]");
        const vote = Number(button.dataset.suggestionVote);
        counts.forEach((count) => { if (Number(count.dataset.voteCount) === vote) count.textContent = String(Number(count.textContent) + 1); });
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save vote."); }
      finally { button.disabled = false; }
    };
    document.addEventListener("click", onVote);
    return () => document.removeEventListener("click", onVote);
  }, [suggestionsPage]);

  useEffect(() => {
    if (!suggestionsPage) return;
    fetch("/api/suggestions", { method: "HEAD", cache: "no-store" }).then((response) => setTurnstileEnabled(response.headers.get("x-turnstile-enabled") === "true")).catch(() => setTurnstileEnabled(true));
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [suggestionsPage]);

  useEffect(() => {
    if (!open || !turnstileEnabled) return;
    const timer = window.setInterval(() => {
      const container = document.getElementById("suggestion-turnstile");
      const siteKey = container?.dataset.sitekey;
      if (!container || !siteKey || !window.turnstile || container.dataset.rendered) return;
      container.dataset.rendered = "true";
      window.turnstile.render(container, { sitekey: siteKey, callback: setTurnstileToken, "expired-callback": () => setTurnstileToken(""), "error-callback": () => setTurnstileToken("") });
      window.clearInterval(timer);
    }, 150);
    return () => window.clearInterval(timer);
  }, [open, turnstileEnabled]);

  useEffect(() => {
    if (!suggestionsPage) return;
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button || !button.textContent?.toLowerCase().includes("submit idea")) return;
      event.preventDefault();
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [suggestionsPage]);

  useEffect(() => {
    if (!newsletter) return;
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.querySelector('input[type="email"]')) return;
      event.preventDefault();
      const input = form.querySelector<HTMLInputElement>('input[type="email"]');
      if (!input) return;
      let status = form.querySelector<HTMLElement>("[data-newsletter-status]");
      if (!status) {
        status = document.createElement("p");
        status.dataset.newsletterStatus = "true";
        status.setAttribute("role", "status");
        status.className = "db-form-status";
        form.insertAdjacentElement("afterend", status);
      }
      status.textContent = "Saving…";
      void fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input.value }),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not subscribe.");
        status!.textContent = "Thanks! You’re on the update list.";
        input.value = "";
      }).catch((cause: unknown) => {
        status!.textContent = cause instanceof Error ? cause.message : "Could not subscribe right now.";
      });
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [newsletter]);

  const submitSuggestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, message, turnstileToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit suggestion.");
      setOpen(false);
      setName("");
      setMessage("");
      setTurnstileToken("");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit suggestion.");
    } finally {
      setSaving(false);
    }
  };

  if (!suggestionsPage) return null;
  return open ? (
    <div className="db-suggestion-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="db-suggestion-dialog" role="dialog" aria-modal="true" aria-labelledby="db-suggestion-title">
        <button className="db-suggestion-close" type="button" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        <span className="db-store__eyebrow">Idea Board</span>
        <h2 id="db-suggestion-title">Submit an Idea</h2>
        <p>Your suggestion will be saved for the community team to review.</p>
        <form onSubmit={submitSuggestion}>
          <label htmlFor="idea-name">Minecraft username</label>
          <input id="idea-name" value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={16} autoComplete="username" required />
          <label htmlFor="idea-category">Category</label>
          <select id="idea-category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>Website</option><option>In Game</option><option>Survival GameMode</option><option>Other</option>
          </select>
          <label htmlFor="idea-message">Suggestion</label>
          <textarea id="idea-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} minLength={8} maxLength={2000} required />
          {turnstileEnabled && <div id="suggestion-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />}
          {error && <p className="db-form-status is-error" role="alert">{error}</p>}
          <button className="db-cart__primary" type="submit" disabled={saving || (turnstileEnabled && !turnstileToken)}>{saving ? "Saving…" : "Submit Suggestion"}</button>
        </form>
      </section>
    </div>
  ) : null;
}
