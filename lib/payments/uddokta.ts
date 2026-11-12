import "server-only";

export type UddoktaConfig = { baseUrl: string; apiKey: string };
type CheckoutResponse = { status?: boolean; message?: string; payment_url?: string; invoice_id?: string };

export function getUddoktaConfig(): UddoktaConfig | null {
  const apiKey = process.env.UDDOKTAPAY_API_KEY;
  const baseUrl = process.env.UDDOKTAPAY_BASE_URL || "";
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" || !apiKey) return null;
    return { baseUrl: parsed.toString().replace(/\/$/, ""), apiKey };
  } catch {
    return null;
  }
}

export function hasPluginConfig() {
  return Boolean(process.env.MINECRAFT_SERVER_PLUGIN_API_KEY);
}

export async function createUddoktaCheckout(input: {
  orderId: string;
  username: string;
  email: string;
  amount: number;
  requestOrigin: string;
}) {
  const config = getUddoktaConfig();
  if (!config) throw new Error("Payment provider is not configured.");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || input.requestOrigin;
  const root = new URL(origin);
  if (root.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("Payment return URL must use HTTPS.");
  const endpoint = new URL(`${config.baseUrl}/checkout-v2`);
  const webhookUrl = new URL("/api/payments/webhook", root);
  if (process.env.UDDOKTAPAY_WEBHOOK_TOKEN) webhookUrl.searchParams.set("token", process.env.UDDOKTAPAY_WEBHOOK_TOKEN);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "RT-UDDOKTAPAY-API-KEY": config.apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: input.username,
      email: input.email,
      amount: input.amount.toFixed(2),
      currency: "BDT",
      metadata: { order_id: input.orderId },
      redirect_url: new URL("/payment/return", root).toString(),
      return_type: "GET",
      cancel_url: new URL("/checkout?payment=cancelled", root).toString(),
      webhook_url: webhookUrl.toString(),
    }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as CheckoutResponse;
  if (!response.ok || result.status === false || typeof result.payment_url !== "string") {
    throw new Error("Payment provider could not start checkout.");
  }
  const paymentUrl = new URL(result.payment_url);
  if (paymentUrl.protocol !== "https:") throw new Error("Payment provider returned an invalid checkout URL.");
  return { paymentUrl: paymentUrl.toString(), invoiceId: result.invoice_id || null };
}

export type VerifiedUddoktaPayment = {
  status?: string;
  invoice_id?: string;
  amount?: string | number;
  transaction_id?: string;
  metadata?: { order_id?: string };
};

export async function verifyUddoktaInvoice(invoiceId: string): Promise<VerifiedUddoktaPayment> {
  const config = getUddoktaConfig();
  if (!config) throw new Error("Payment provider is not configured.");
  const response = await fetch(`${config.baseUrl}/verify-payment`, {
    method: "POST",
    headers: {
      "RT-UDDOKTAPAY-API-KEY": config.apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Payment verification is temporarily unavailable.");
  return await response.json() as VerifiedUddoktaPayment;
}
