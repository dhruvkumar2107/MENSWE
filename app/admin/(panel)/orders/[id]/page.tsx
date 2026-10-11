import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { OrderStatusControls, OrderTrackingForm } from "@/components/admin/order-controls";
import { StatusPill } from "@/components/admin/status-pill";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("order:read");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } }, payments: true, returns: true, refunds: true },
  });
  if (!order) notFound();

  const address = JSON.parse(order.shippingAddress) as {
    fullName: string; phone?: string; line1: string; line2?: string; city: string; state: string; pincode: string;
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/orders" className="text-xs text-[#6b655c] underline">← Orders</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">#{order.orderNumber}</h1>
          <StatusPill value={order.status} />
          <StatusPill value={order.paymentStatus} />
        </div>
        <p className="mt-1 text-xs text-[#6b655c]">
          Placed {order.placedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {order.paymentMethod}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="border border-[#e4ded4] bg-white">
            <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Items</h2>
            <div className="divide-y divide-[#efe9df]">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    {i.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.imageUrl} alt={i.name} className="h-14 w-11 object-cover" />
                    )}
                    <div>
                      <span className="block font-medium">{i.name}</span>
                      <span className="text-xs text-[#6b655c]">{i.color} / {i.size} · {i.sku} × {i.quantity}</span>
                    </div>
                  </div>
                  <span>{formatINR(i.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e4ded4] px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-[#6b655c]">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span><span>−{formatINR(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-[#6b655c]">Shipping</span><span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span></div>
              <div className="flex justify-between border-t border-[#e4ded4] pt-2 font-medium"><span>Total</span><span>{formatINR(order.total)}</span></div>
              <a href="/api/admin/export?type=orders" className="mt-3 inline-block text-xs text-[#6b655c] underline">Export all orders (CSV)</a>
            </div>
          </section>

          <section className="border border-[#e4ded4] bg-white">
            <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Timeline</h2>
            <ol className="flex flex-col gap-3 px-5 py-4">
              {order.history.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span><span className="font-medium">{h.status}</span>{h.note && <span className="block text-xs text-[#6b655c]">{h.note}</span>}<span className="block text-[10px] text-[#6b655c]">{h.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span></span>
                </li>
              ))}
            </ol>
          </section>

          {order.returns.length > 0 && (
            <section className="border border-[#e4ded4] bg-white">
              <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Returns</h2>
              <div className="divide-y divide-[#efe9df]">
                {order.returns.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span>{r.reason}</span>
                    <span className="flex items-center gap-3"><StatusPill value={r.status} /><Link href="/admin/returns" className="text-xs underline">Process</Link></span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <div className="border border-[#e4ded4] bg-white p-5 text-sm">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Shipping to</h2>
            <p className="text-[#6b655c]">
              <span className="block font-medium text-obsidian">{address.fullName}</span>
              {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
              {address.city}, {address.state} {address.pincode}<br />
              {address.phone ?? order.phone}
            </p>
            <p className="mt-3 text-xs text-[#6b655c]">Contact: {order.email}</p>
          </div>

          <OrderStatusControls orderId={order.id} current={order.status} />
          <OrderTrackingForm
            orderId={order.id}
            courier={order.courier}
            trackingNumber={order.trackingNumber}
            internalNote={order.internalNote}
            expectedDelivery={order.expectedDelivery ? order.expectedDelivery.toISOString().slice(0, 10) : null}
          />

          <p className="text-xs text-[#6b655c]">Order value {formatINR(order.total)} · Refund to date {formatINR(order.refunds.reduce((s, r) => s + r.amount, 0))}</p>
        </aside>
      </div>
    </div>
  );
}