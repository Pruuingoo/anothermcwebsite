"use client";

import { useEffect } from "react";

export default function StoreInteractions({ productSlug }: { productSlug: string }) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!target || !/username to buy|add to cart/i.test(target.textContent ?? "")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const username = window.localStorage.getItem("server-minecraft-username");
      if (!username) {
        window.sessionStorage.setItem("server-pending-product", productSlug);
        window.dispatchEvent(new CustomEvent("store:request-username"));
        return;
      }
      target.disabled = true;
      void fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", slug: productSlug, quantity: 1, username: window.localStorage.getItem("server-minecraft-username") }),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not add the item.");
        target.textContent = "Added to Cart";
      }).catch((error: unknown) => {
        target.textContent = error instanceof Error ? error.message : "Could not add the item";
      }).finally(() => {
        window.setTimeout(() => { target.disabled = false; }, 900);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [productSlug]);

  return null;
}
