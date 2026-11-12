import { NextRequest, NextResponse } from "next/server";
import { verifyAndFulfillInvoice } from "@/lib/payments/fulfillment";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { if (new URL(origin).host !== request.nextUrl.host) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
    catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
  }
  try {
    const body = await request.json();
    const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId : "";
    const result = await verifyAndFulfillInvoice(invoiceId);
    return NextResponse.json(result, { status: result.ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Payment confirmation error:", error instanceof Error ? error.message : "Verification failed");
    return NextResponse.json({ error: "Payment could not be verified yet. Please wait a moment and try again." }, { status: 503 });
  }
}
