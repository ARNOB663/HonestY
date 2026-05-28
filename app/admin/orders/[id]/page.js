import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import OrderStatusForm from "../../../../components/admin/OrderStatusForm";
import PaymentVerifyForm from "../../../../components/admin/PaymentVerifyForm";
import OrderNotesForm from "../../../../components/admin/OrderNotesForm";
import OrderRefundForm from "../../../../components/admin/OrderRefundForm";
import OrderEmailForm from "../../../../components/admin/OrderEmailForm";
import { formatMoney as money } from "../../../../lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }) {
  const { id } = await params;
  await dbConnect();
  const doc = await Order.findById(id).lean();
  if (!doc) notFound();
  const o = { ...doc, _id: String(doc._id) };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/admin/orders" className="text-sm text-gray-500 hover:underline">← Orders</Link>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Order #{o._id.slice(-6)}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed {new Date(o.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/admin/orders/${o._id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="border border-gray-300 hover:border-[#1a2b4a] text-sm px-3 py-1.5 rounded"
          >
            Print invoice
          </a>
          <OrderStatusForm id={o._id} status={o.status} paymentMethod={o.payment?.method} />
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-3 border-b border-gray-200 font-semibold text-sm">Items</div>
        <ul className="divide-y divide-gray-100">
          {(o.items || []).map((it, i) => (
            <li key={i} className="px-5 py-3 flex items-center justify-between text-sm">
              <div>
                <Link href={`/products/${it.slug}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">{it.title}</Link>
                <p className="text-xs text-gray-500">{it.slug} · qty {it.qty}</p>
              </div>
              <p>{money((it.price || 0) * (it.qty || 1))}</p>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-gray-200 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{money(o.subtotal)}</span></div>
          {o.discountAmount > 0 && (
            <div className="flex justify-between text-green-700"><span>Discount{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{money(o.discountAmount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{o.shipping === 0 ? "Free" : money(o.shipping)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{money(o.total)}</span></div>
          {o.refundAmount > 0 && (
            <div className="flex justify-between text-rose-700"><span>Refunded</span><span>−{money(o.refundAmount)}</span></div>
          )}
        </div>
      </section>

      {o.payment && (
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-semibold text-sm">Payment</h2>
            {o.payment.method && (
              <PaymentVerifyForm id={o._id} verified={o.payment.verified} paymentMethod={o.payment.method} />
            )}
          </div>
          <dl className="text-sm grid grid-cols-2 gap-y-1.5">
            <dt className="text-gray-500">Method</dt>
            <dd className="uppercase font-medium">{o.payment.method || "—"}</dd>
            {o.payment.method !== "cod" && (
              <>
                <dt className="text-gray-500">Transaction ID</dt>
                <dd className="font-mono">{o.payment.txnId || "—"}</dd>
                <dt className="text-gray-500">Sent from</dt>
                <dd>{o.payment.payerNumber || "—"}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-2">Customer</h2>
          <p className="text-sm">{o.userEmail}</p>
          <Link href={`/admin/customers/${encodeURIComponent(o.userEmail)}`} className="text-xs text-blue-600 hover:underline">View customer →</Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-2">Ship to</h2>
          {o.shippingAddress ? (
            <div className="text-sm text-gray-700 leading-relaxed">
              <p>{o.shippingAddress.name}</p>
              <p>{o.shippingAddress.line1}</p>
              <p>{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.zip}</p>
              <p>{o.shippingAddress.country}</p>
              {o.shippingAddress.phone && <p className="mt-1 text-gray-500">{o.shippingAddress.phone}</p>}
            </div>
          ) : <p className="text-sm text-gray-500">No address on file.</p>}
        </div>
      </section>

      {Array.isArray(o.statusHistory) && o.statusHistory.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-3">Status timeline</h2>
          <ol className="relative border-l border-gray-200 ml-2 space-y-3">
            {o.statusHistory.map((h, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[#1a2b4a]" />
                <p className="text-sm font-medium capitalize">{h.status}</p>
                <p className="text-xs text-gray-500">
                  {new Date(h.at).toLocaleString()}{h.by ? ` · ${h.by}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <OrderNotesForm id={o._id} initial={o.adminNotes || ""} />
      <OrderRefundForm id={o._id} total={o.total} initialAmount={o.refundAmount || 0} initialReason={o.refundReason || ""} />
      <OrderEmailForm id={o._id} customerEmail={o.userEmail} orderShort={o._id.slice(-6)} />
    </div>
  );
}
