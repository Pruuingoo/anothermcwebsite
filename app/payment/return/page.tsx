import PaymentReturn from "@/app/payment/return/PaymentReturn";

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ invoice_id?: string | string[] }> }) {
  const query = await searchParams;
  const invoiceId = Array.isArray(query.invoice_id) ? query.invoice_id[0] : query.invoice_id || "";
  return <PaymentReturn invoiceId={invoiceId.slice(0, 128)} />;
}
