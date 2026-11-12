"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { siteConfig } from "@/lib/site-config";

type Product = { id: string; slug: string; name: string; price: number; category: string; description: string | null; image_url: string | null };
const pointsImage = "/reference/assets/09bd77d8b0897b220b6dd5e9217abd5a8f15251a.webp";

export default function DatabaseStorefront({ initialCategory = "ranks" }: { initialCategory?: string }) {
  const [category, setCategory] = useState("points");
  const [username, setUsername] = useState("");
  const [customPoints, setCustomPoints] = useState("700");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState("");

  const load = useCallback(async (selected: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/catalog?category=${encodeURIComponent(selected)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The store catalog is unavailable.");
      setProducts((result.data ?? []).sort((a: Product, b: Product) => Number(a.slug.split("-")[1]) - Number(b.slug.split("-")[1])));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The store catalog is unavailable.");
    } finally { setLoading(false); }
  }, []);

  const savedUsername = () => window.localStorage.getItem("server-minecraft-username") || "";
  useEffect(() => { void load(category); setUsername(savedUsername()); }, [category, load]);

  useEffect(() => {
    const updateUsername = (event: Event) => setUsername((event as CustomEvent<{ username?: string }>).detail?.username || savedUsername());
    window.addEventListener("store:username-saved", updateUsername);
    return () => window.removeEventListener("store:username-saved", updateUsername);
  }, []);

  const add = useCallback(async (slug: string) => {
    const points = Number(slug.split("-")[1]);
    if (!Number.isSafeInteger(points) || points < 100 || points > 1000) return;
    if (!savedUsername()) {
      window.sessionStorage.setItem("server-pending-points", String(points));
      window.dispatchEvent(new CustomEvent("store:request-username"));
      return;
    }
    setAdding(slug);
    try {
      const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_points", points, username: savedUsername() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add item.");
      setNotice(`${points.toLocaleString()} points added to your cart.`);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not add item."); }
    finally { setAdding(""); }
  }, []);

  const addCustomPoints = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const points = Number(customPoints);
    if (!Number.isSafeInteger(points) || points < 100 || points > 50000 || points % 100 !== 0) {
      setNotice("Choose a points amount from 100 to 50,000 in steps of 100.");
      return;
    }
    const username = savedUsername();
    if (!username) {
      window.sessionStorage.setItem("server-pending-points", String(points));
      window.dispatchEvent(new CustomEvent("store:request-username"));
      return;
    }
    setAdding("custom-points");
    try {
      const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_points", points, username }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add points.");
      setNotice(`${points.toLocaleString()} points added to your cart.`);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not add points."); }
    finally { setAdding(""); }
  }, [customPoints]);

  useEffect(() => {
    const onUsernameSaved = () => {
      const points = window.sessionStorage.getItem("server-pending-points");
      if (points) {
        window.sessionStorage.removeItem("server-pending-points");
        const parsedPoints = Number(points);
        const username = savedUsername();
        if (username) void fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_points", points: parsedPoints, username }) }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Could not add points.");
          setNotice(`${parsedPoints.toLocaleString()} points added to your cart.`);
        }).catch((cause: unknown) => setNotice(cause instanceof Error ? cause.message : "Could not add points."));
        return;
      }
      const slug = window.sessionStorage.getItem("server-pending-product");
      if (!slug) return;
      window.sessionStorage.removeItem("server-pending-product");
      void add(slug);
    };
    window.addEventListener("store:username-saved", onUsernameSaved);
    return () => window.removeEventListener("store:username-saved", onUsernameSaved);
  }, [add]);

  return (
    <section className="db-store">
      <header className="db-store__hero">
        <span className="db-store__eyebrow">{siteConfig.name} Points</span>
        <h1>Top up your <strong>Points</strong></h1>
        <p>Choose a points pack or enter any amount in multiples of 100. Matching packs combine automatically for the best tier price.</p>
      </header>
      <div className="db-store__body">
        <nav className="db-store__categories" aria-label="Store category"><button type="button" className="is-active" aria-current="page">Points</button></nav>
        <div className="db-points-account"><span>Buying for <strong>{username || "no username set"}</strong></span><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("store:request-username"))}>{username ? "Change username" : "Enter username"}</button></div>
        {notice && <p className="db-store__notice" role="status">{notice} <a href="/cart">View cart</a></p>}
        {error && <p className="db-store__error" role="alert">{error}</p>}
        {loading ? <div className="db-store__grid">{Array.from({ length: 4 }, (_, i) => <div className="db-store__skeleton" key={i} />)}</div> : products.length ? (
          <div className="db-store__grid">
            {products.map((product) => <article className="db-product" key={product.id}>
              <div className="db-product__image" aria-label={`${product.name} pack`}>
                <img src={product.image_url || pointsImage} alt="" />
                <span className="db-product__badge">Points</span>
              </div>
              <div className="db-product__info">
                <h2>{product.name}</h2>
                <p>{product.description || `Use your points in the ${siteConfig.name} server store.`}</p>
                <div className="db-product__buy"><span><small>PRICE</small><strong>{Number(product.price).toLocaleString()} <i>BDT</i></strong></span><button type="button" onClick={() => void add(product.slug)} disabled={adding === product.slug}>{adding === product.slug ? "Adding…" : "Add Pack"}</button></div>
              </div>
            </article>)}
          </div>
        ) : <div className="db-store__empty">Point packs are temporarily unavailable.</div>}
        <form className="db-points-custom" onSubmit={addCustomPoints}>
          <div><span className="db-store__eyebrow">Custom amount</span><h2>Need a different amount?</h2><p>Any multiple of 100 from 100 to 50,000. We combine packs into the lowest available tiers.</p></div>
          <label>Points amount<input type="number" min="100" max="50000" step="100" value={customPoints} onChange={(event) => setCustomPoints(event.target.value)} required /></label>
          <div className="db-points-custom__price"><span>Price</span><strong>{(() => { const n = Math.max(0, Number(customPoints) || 0); const thousands = Math.floor(n / 1000); const rest = n % 1000; const fiveHundreds = Math.floor(rest / 500); const hundreds = Math.floor((rest % 500) / 100); return (thousands * 400 + fiveHundreds * 230 + hundreds * 50).toLocaleString(); })()} BDT</strong></div>
          <button className="db-cart__primary" type="submit" disabled={adding === "custom-points"}>{adding === "custom-points" ? "Adding…" : "Add Points to Cart"}</button>
        </form>
      </div>
    </section>
  );
}
