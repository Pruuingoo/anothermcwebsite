import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyAndFulfillInvoice } from "@/lib/payments/fulfillment";
import { getUddoktaConfig } from "@/lib/payments/uddokta";

export const runtime = "nodejs";
export const maxDuration = 30;

function validKey(provided: string | null, expected: string) {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const config = getUddoktaConfig();
  const token = request.nextUrl.searchParams.get("token");
  const configuredWebhookToken = process.env.UDDOKTAPAY_WEBHOOK_TOKEN;
  const headerAuthorized = Boolean(config && validKey(request.headers.get("rt-uddoktapay-api-key"), config.apiKey));
  const tokenAuthorized = Boolean(configuredWebhookToken && token && validKey(token, configuredWebhookToken));
  if (!config || (!headerAuthorized && !tokenAuthorized)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const eventData = body && typeof body.data === "object" && body.data ? body.data : body;
    const invoiceId = typeof eventData.invoice_id === "string" ? eventData.invoice_id : "";
    const result = await verifyAndFulfillInvoice(invoiceId);
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Payment webhook processing error:", error instanceof Error ? error.message : "Verification failed");
    return NextResponse.json({ error: "Payment verification is temporarily unavailable." }, { status: 503 });
  }
}
