"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PaymentReturn({ invoiceId }: { invoiceId: string }) {
  const [message, setMessage] = useState("Verifying your payment and delivering points…");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setMessage("No payment reference was included. If you completed payment, contact support with your receipt.");
      return;
    }
    let cancelled = false;
    void fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.status === "needs_review" ? "Payment is confirmed, but points delivery needs staff review. Please keep your receipt." : result.error || "Payment is still being verified. Please wait and refresh this page.");
      if (!cancelled) { setComplete(true); setMessage("Payment confirmed. Your points have been added to your Minecraft account."); }
    }).catch((error: unknown) => {
      if (!cancelled) setMessage(error instanceof Error ? error.message : "Payment is still being verified. Please refresh in a moment.");
    });
    return () => { cancelled = true; };
  }, [invoiceId]);

  return <main className="db-checkout"><section className="db-checkout__panel"><span className="db-store__eyebrow">{complete ? "Order Complete" : "Payment Status"}</span><h1>{complete ? "Points delivered" : "Checking payment"}</h1><p role="status">{message}</p><div className="db-checkout__receipt"><span>Payment reference</span><strong>{invoiceId || "Not provided"}</strong></div><Link href="/store" className="db-cart__primary">Return to Store</Link></section></main>;
}
