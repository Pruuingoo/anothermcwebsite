"use client";

import { useEffect } from "react";

const menuLabels = new Set(["Home", "Store", "Ranks", "Vote", "Leaderboard", "Blog", "Gallery", "Suggestions", "About"]);

export default function MobileMenuInteractions() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("nav");
    if (!nav) return;

    const menuButton = Array.from(nav.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.querySelector("svg.lucide-menu"));
    if (!menuButton) return;

    const desktopNav = Array.from(nav.querySelectorAll<HTMLElement>("div")).find((element) => element.classList.contains("hidden") && element.classList.contains("md:block"));
    const menuWrapper = menuButton.parentElement;

    const originalOverflow = document.body.style.overflow;
    let drawer: HTMLDivElement | null = null;

    const close = () => {
      drawer?.remove();
      drawer = null;
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
      menuButton.removeAttribute("aria-controls");
      document.body.style.overflow = originalOverflow;
    };

    const open = () => {
      if (drawer) return;
      drawer = document.createElement("div");
      drawer.className = "bdz-mobile-menu";
      drawer.id = "bdz-mobile-navigation";
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-label", "Main navigation");

      const navigationList = desktopNav ?? nav;
      const links = Array.from(navigationList.querySelectorAll<HTMLAnchorElement>("a[href]")).filter((link) => menuLabels.has(link.textContent?.trim() ?? ""));
      for (const sourceLink of links) {
        const label = sourceLink.textContent?.trim() ?? "";
        const item = document.createElement("a");
        item.className = "bdz-mobile-menu__link";
        item.href = sourceLink.href;
        item.innerHTML = sourceLink.innerHTML;
        item.setAttribute("aria-label", label);
        const target = new URL(sourceLink.href, window.location.href);
        const current = target.hostname === window.location.hostname && target.pathname === window.location.pathname;
        if (current) {
          item.classList.add("is-active");
          item.setAttribute("aria-current", "page");
        }
        item.addEventListener("click", close, { once: true });
        drawer.appendChild(item);
      }

      drawer.addEventListener("click", (event) => {
        if (event.target === drawer) close();
      });
      document.body.appendChild(drawer);
      document.body.style.overflow = "hidden";
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "Close navigation menu");
      menuButton.setAttribute("aria-controls", drawer.id);
    };

    const onMenuClick = (event: MouseEvent) => {
      event.preventDefault();
      drawer ? close() : open();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawer) close();
    };
    const updateNavLayout = () => {
      const useCompactNav = window.innerWidth < 1440;
      if (desktopNav) desktopNav.style.setProperty("display", useCompactNav ? "none" : "block", "important");
      if (menuWrapper) menuWrapper.style.setProperty("display", useCompactNav ? "block" : "none", "important");
      if (!useCompactNav && drawer) close();
    };

    menuButton.setAttribute("aria-label", "Open navigation menu");
    menuButton.setAttribute("aria-expanded", "false");
    updateNavLayout();
    menuButton.addEventListener("click", onMenuClick);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateNavLayout, { passive: true });

    return () => {
      close();
      menuButton.removeEventListener("click", onMenuClick);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateNavLayout);
      desktopNav?.style.removeProperty("display");
      menuWrapper?.style.removeProperty("display");
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return null;
}
