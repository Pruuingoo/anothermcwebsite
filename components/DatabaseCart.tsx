"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CartData = {
  username: string | null;
  itemCount: number;
  subtotal: number;
  currency: string;
  pointsAmount: number;
  items: Array<{ id: string; quantity: number; lineTotal: number; product: { id: string; slug: string; name: string; price: number; image_url: string | null } }>;
};

export default function DatabaseCart() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Cart unavailable");
      setCart(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cart unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = async (action: string, itemId?: string, quantity?: number) => {
    setBusy(itemId ?? action);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemId, quantity }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update cart");
      setCart(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update cart");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <main className="db-cart"><p>Loading your cart…</p></main>;
  if (!cart?.items.length) return (
    <main className="db-cart db-cart--empty">
      <div className="db-cart__empty-icon" aria-hidden="true">▱</div>
      <h1>Your Cart is Empty</h1>
      <p>Looks like you haven’t found the perfect item yet. Explore our store to upgrade your gear.</p>
      <Link href="/store" className="db-cart__primary">Browse Store</Link>
      {error && <p role="alert" className="db-cart__error">{error}</p>}
    </main>
  );

  return (
    <main className="db-cart">
      <header className="db-cart__heading"><div><span className="db-store__eyebrow">Your Items</span><h1>Your Cart</h1><p><strong>{cart.pointsAmount.toLocaleString()} Points</strong> for <strong>{cart.username || "your Minecraft account"}</strong></p></div><Link href="/store" className="db-cart__continue">Continue Shopping</Link></header>
      {error && <p role="alert" className="db-cart__error">{error}</p>}
      <div className="db-cart__layout">
        <section className="db-cart__items" aria-label="Cart items">
          {cart.items.map(({ id, quantity, product, lineTotal }) => (
            <article className="db-cart__item" key={id}>
              <a href={`/store/${product.slug}`} className="db-cart__image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>✦</span>}</a>
              <div className="db-cart__info"><a href={`/store/${product.slug}`}><h2>{product.name}</h2></a><span>{Number(product.price).toLocaleString()} BDT each</span><button className="db-cart__remove" type="button" onClick={() => void update("remove", id)} disabled={busy === id}>Remove</button></div>
              <div className="db-cart__quantity"><button type="button" aria-label="Decrease quantity" disabled={busy === id} onClick={() => void update("quantity", id, quantity - 1)}>−</button><span>{quantity}</span><button type="button" aria-label="Increase quantity" disabled={busy === id} onClick={() => void update("quantity", id, quantity + 1)}>+</button></div>
              <strong className="db-cart__line-total">{Number(lineTotal).toLocaleString()} BDT</strong>
            </article>
          ))}
          <button className="db-cart__clear" type="button" disabled={busy === "clear"} onClick={() => void update("clear")}>Clear cart</button>
        </section>
        <aside className="db-cart__summary"><h2>Order Summary</h2><div><span>Points</span><strong>{cart.pointsAmount.toLocaleString()}</strong></div><div className="db-cart__total"><span>Total</span><strong>{Number(cart.subtotal).toLocaleString()} {cart.currency}</strong></div><p>Points are added to the Minecraft username shown above after payment is verified.</p><Link href="/checkout" className="db-cart__primary">Continue to Checkout</Link></aside>
      </div>
    </main>
  );
}
