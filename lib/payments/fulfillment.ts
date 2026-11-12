import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUddoktaInvoice } from "@/lib/payments/uddokta";

export async function verifyAndFulfillInvoice(invoiceId: string) {
  if (!/^[A-Za-z0-9_-]{4,128}$/.test(invoiceId)) return { ok: false as const, status: "invalid_invoice" };
  const payment = await verifyUddoktaInvoice(invoiceId);
  const orderId = payment.metadata?.order_id;
  const amount = Number(payment.amount);
  if (!orderId || payment.invoice_id !== invoiceId || payment.status?.toUpperCase() !== "COMPLETED" || !Number.isFinite(amount)) {
    return { ok: false as const, status: payment.status?.toLowerCase() || "unverified" };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin.from("store_orders")
    .select("id,status,subtotal,minecraft_username,points_amount,payment_invoice_id,fulfillment_status")
    .eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order || order.payment_invoice_id && order.payment_invoice_id !== invoiceId) {
    return { ok: false as const, status: "order_mismatch" };
  }
  if (Math.abs(amount - Number(order.subtotal)) >= 0.01 || order.points_amount < 100) {
    return { ok: false as const, status: "amount_mismatch" };
  }
  if (order.status === "fulfilled" || order.fulfillment_status === "complete") return { ok: true as const, status: "fulfilled" };

  if (order.status === "fulfilled" || order.fulfillment_status === "complete") return { ok: true as const, status: "fulfilled" };
  if (order.status === "awaiting_payment") {
    const paid = await admin.from("store_orders").update({
      status: "paid",
      payment_invoice_id: invoiceId,
      payment_transaction_id: payment.transaction_id || null,
    }).eq("id", order.id).eq("status", "awaiting_payment").select("id").maybeSingle();
    if (paid.error) throw paid.error;
  }

  // Payment is verified here; the server plugin polls and performs the in-game grant.
  return { ok: true as const, status: "paid_pending_plugin" };
}
