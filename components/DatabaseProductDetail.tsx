import Link from "next/link";
import type { DbProduct } from "@/lib/site-data";

export default function DatabaseProductDetail({ product }: { product: DbProduct }) {
  return (
    <section className="db-product-detail">
      <Link className="db-product-detail__back" href={`/store?category=${encodeURIComponent(product.category)}`}>‹ &nbsp;Back to Store</Link>
      <div className="db-product-detail__grid">
        <div className="db-product-detail__art">
          <span className="db-product__badge">{product.category}</span>
          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span aria-hidden="true">✦</span>}
        </div>
        <div className="db-product-detail__info">
          <span className="db-store__eyebrow">{product.category} item</span>
          <h1>{product.name}</h1>
          <strong className="db-product-detail__price">{Number(product.price).toLocaleString()} <small>BDT</small></strong>
          <p>{product.description || product.name}</p>
          <button type="button" className="db-cart__primary" data-store-buy="true">Enter Username to Buy</button>
          <small className="db-product-detail__secure">Protected by secure checkout</small>
        </div>
      </div>
      <section className="db-product-detail__description">
        <h2>Description</h2>
        <h3>{product.name}</h3>
        <p>{product.description || product.name}</p>
        <p>Your item will be associated with your Minecraft username. Check the item and username before placing an order.</p>
      </section>
    </section>
  );
}
