import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/db";
import { getStoreSettings } from "../../../../../lib/settings";
import { formatMoney } from "../../../../../lib/format";
import InvoiceAutoPrint from "../../../../../components/admin/InvoiceAutoPrint";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }) {
  const { id } = await params;
  const numId = Number(id);
  const where = Number.isFinite(numId) ? { id: numId } : { code: String(id).toUpperCase() };
  const order = await prisma.order.findFirst({ where, include: { items: true } });
  if (!order) notFound();
  const settings = await getStoreSettings();
  const short = order.code || String(order.id);

  return (
    <div className="min-h-screen bg-white p-10 text-[#1a1a1a] print:p-0">
      <InvoiceAutoPrint />
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 16mm; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto bg-white">
        <header className="flex items-start justify-between border-b-2 border-[#1a2b4a] pb-5 mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1a2b4a]">{settings.storeName}</h1>
            {settings.supportEmail && <p className="text-xs text-gray-600 mt-1">{settings.supportEmail}</p>}
            {settings.supportPhone && <p className="text-xs text-gray-600">{settings.supportPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Invoice</p>
            <p className="font-mono text-xl font-bold">#{short}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString("en-BD")}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Billed to</p>
            <p className="font-semibold">{order.shipName || order.userEmail}</p>
            <p>{order.userEmail}</p>
            {order.shipPhone && <p>{order.shipPhone}</p>}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Ship to</p>
            <p>{order.shipName}</p>
            <p>{order.shipLine1}</p>
            <p>{order.shipCity}, {order.shipState}</p>
            <p>{order.shipCountry}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead className="border-b border-gray-300">
            <tr className="text-left text-[10px] uppercase tracking-wide text-gray-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(order.items || []).map((it) => (
              <tr key={it.id}>
                <td className="py-2 pr-2">{it.title}</td>
                <td className="py-2 text-center">{it.qty}</td>
                <td className="py-2 text-right">{formatMoney(it.price)}</td>
                <td className="py-2 text-right">{formatMoney((it.price || 0) * (it.qty || 1))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700"><span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span><span>−{formatMoney(order.discountAmount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping === 0 ? "Free" : formatMoney(order.shipping)}</span></div>
          <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 font-bold text-base">
            <span>Total</span><span>{formatMoney(order.total)}</span>
          </div>
          {order.refundAmount > 0 && (
            <div className="flex justify-between text-rose-700 text-xs"><span>Refunded</span><span>−{formatMoney(order.refundAmount)}</span></div>
          )}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-600 grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold mb-1">Payment</p>
            <p>Method: {(order.paymentMethod || "—").toUpperCase()}</p>
            {order.paymentTxnId && <p>TrxID: <span className="font-mono">{order.paymentTxnId}</span></p>}
            <p>Status: <span className="capitalize">{order.status}</span></p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-1">Thank you</p>
            <p>{settings.footerTagline || "Honesty in every step."}</p>
          </div>
        </div>

        <div className="mt-10 text-center no-print text-xs text-gray-500">
          Print dialog should open automatically. Use Ctrl+P / Cmd+P if it didn&apos;t.
        </div>
      </div>
    </div>
  );
}
