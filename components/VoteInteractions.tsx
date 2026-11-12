"use client";

import { useEffect } from "react";

export default function VoteInteractions() {
  useEffect(() => {
    const tabRoot = document.querySelector<HTMLElement>('[data-slot="tabs"]');
    const tabs = tabRoot ? Array.from(tabRoot.querySelectorAll<HTMLButtonElement>('[role="tab"]')) : [];
    const panels = tabRoot ? Array.from(tabRoot.querySelectorAll<HTMLElement>('[role="tabpanel"]')) : [];

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const voteLink = target.closest<HTMLAnchorElement>("a[data-vote-site]");
      if (voteLink) {
        const username = window.localStorage.getItem("server-voter-name");
        if (username) {
          const href = new URL(voteLink.href, window.location.href);
          href.searchParams.set("username", username);
          voteLink.href = href.toString();
        }
      }
      const tab = target.closest<HTMLButtonElement>('[role="tab"]');
      if (tab && tabRoot?.contains(tab)) {
        event.preventDefault();
        const panelId = tab.getAttribute("aria-controls");
        for (const item of tabs) {
          const selected = item === tab;
          item.setAttribute("data-state", selected ? "active" : "inactive");
          item.setAttribute("aria-selected", String(selected));
          item.tabIndex = selected ? 0 : -1;
        }
        for (const panel of panels) {
          const selected = panel.id === panelId;
          panel.hidden = !selected;
          panel.setAttribute("data-state", selected ? "active" : "inactive");
        }
        return;
      }

      const trigger = target.closest<HTMLButtonElement>('[data-slot="accordion-trigger"]');
      if (!trigger) return;
      const item = trigger.closest<HTMLElement>('[data-slot="accordion-item"]') ?? trigger.parentElement;
      const content = item?.querySelector<HTMLElement>('[data-slot="accordion-content"]');
      if (!content) return;
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      item?.setAttribute("data-state", expanded ? "closed" : "open");
      content.hidden = expanded;
    };

    const onSearchSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const input = form.querySelector<HTMLInputElement>('input[name="player"]');
      const username = input?.value.trim();
      if (username && /^[A-Za-z0-9_]{3,16}$/.test(username)) window.localStorage.setItem("server-voter-name", username);
    };

    const countdown = document.querySelector<HTMLElement>("[data-vote-countdown]");
    const updateCountdown = () => {
      if (!countdown) return;
      const dhakaNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const nextMidnight = Date.UTC(dhakaNow.getUTCFullYear(), dhakaNow.getUTCMonth(), dhakaNow.getUTCDate() + 1) - 6 * 60 * 60 * 1000;
      const total = Math.max(0, Math.floor((nextMidnight - Date.now()) / 1000));
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;
      countdown.textContent = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    };

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSearchSubmit, true);
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSearchSubmit, true);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
