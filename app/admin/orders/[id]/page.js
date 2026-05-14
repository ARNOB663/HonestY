import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import OrderStatusForm from "../../../../components/admin/OrderStatusForm";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }) {
  const { id } = await params;
  await dbConnect();
  const doc = await Order.findById(id).lean();
  if (!doc) notFound();
  const o = { ...doc, _id: String(doc._id) };
  const { formatMoney: money } = await import("../../../../lib/format");

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-gray-500 hover:underline">← Orders</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order #{o._id.slice(-6)}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed {new Date(o.createdAt).toLocaleString()}</p>
        </div>
        <OrderStatusForm id={o._id} status={o.status} />
      </div>

      <section className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-3 border-b border-gray-200 font-semibold text-sm">Items</div>
        <ul className="divide-y divide-gray-100">
          {(o.items || []).map((it, i) => (
            <li key={i} className="px-5 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{it.title}</p>
                <p className="text-xs text-gray-500">{it.slug} · qty {it.qty}</p>
              </div>
              <p>{money((it.price || 0) * (it.qty || 1))}</p>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-gray-200 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{money(o.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{money(o.shipping)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{money(o.total)}</span></div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-2">Customer</h2>
          <p className="text-sm">{o.userEmail}</p>
          <Link href={`/admin/customers?q=${encodeURIComponent(o.userEmail)}`} className="text-xs text-blue-600 hover:underline">View customer →</Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-2">Ship to</h2>
          {o.shippingAddress ? (
            <div className="text-sm text-gray-700 leading-relaxed">
              <p>{o.shippingAddress.name}</p>
              <p>{o.shippingAddress.line1}</p>
              <p>{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.zip}</p>
              <p>{o.shippingAddress.country}</p>
            </div>
          ) : <p className="text-sm text-gray-500">No address on file.</p>}
        </div>
      </section>
    </div>
  );
}
