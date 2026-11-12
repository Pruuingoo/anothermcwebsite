"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { siteConfig } from "@/lib/site-config";

type CartData = { username: string | null; itemCount: number; pointsAmount: number; subtotal: number; currency: string };

export default function DatabaseCheckout() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" }).then((response) => response.json()).then(setCart).catch(() => setError("Could not load your cart."));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create order.");
      if (typeof result.paymentUrl !== "string") throw new Error("The payment service did not return a checkout link.");
      window.location.assign(result.paymentUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create order.");
    } finally {
      setBusy(false);
    }
  };

  if (cart && cart.itemCount === 0) return <main className="db-checkout"><section className="db-checkout__panel"><h1>Your cart is empty</h1><Link href="/store" className="db-cart__primary">Browse Store</Link></section></main>;

  return (
    <main className="db-checkout">
      <section className="db-checkout__panel">
        <span className="db-store__eyebrow">Secure Checkout</span>
        <h1>Buy Points</h1>
        <p>Buying for <strong>{cart?.username || "your Minecraft account"}</strong></p>
        <form onSubmit={submit} className="db-checkout__form">
          <label htmlFor="checkout-email">Email for payment receipt</label>
          <input id="checkout-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={siteConfig.supportEmail} required />
          <div className="db-checkout__receipt"><span>Points</span><strong>{cart?.pointsAmount.toLocaleString() ?? "—"}</strong></div>
          <div className="db-checkout__receipt"><span>Subtotal</span><strong>{cart ? `${Number(cart.subtotal).toLocaleString()} ${cart.currency}` : "Loading…"}</strong></div>
          {error && <p className="db-cart__error" role="alert">{error}</p>}
          <button className="db-cart__primary" type="submit" disabled={busy || !cart?.itemCount}>{busy ? "Opening payment…" : "Continue to Payment"}</button>
        </form>
        <small>Your points will be delivered in game after the payment provider confirms your payment.</small>
      </section>
    </main>
  );
}
