import { requireAdmin } from "@/lib/auth";
import { getReportRows, getSalesByDay, getDashboardMetrics } from "@/lib/reports";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/admin/status-pill";

export default async function AdminReportsPage() {
  await requireAdmin("report:read");
  const [metrics, sales, orders, statusBreakdown] = await Promise.all([
    getDashboardMetrics(),
    getSalesByDay(30),
    getReportRows(),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { total: true } }),
  ]);

  const max = Math.max(1, ...sales.map((s) => s.total));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Reports</h1>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=orders" className="h-10 bg-obsidian px-4 text-xs font-medium uppercase leading-10 tracking-[0.16em] text-ivory">Export orders CSV</a>
          <a href="/api/admin/export?type=products" className="h-10 border border-obsidian px-4 text-xs font-medium uppercase leading-10 tracking-[0.16em] hover:bg-obsidian hover:text-ivory">Export products CSV</a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-[#e4ded4] bg-white p-5"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b655c]">Revenue (all time)</span><span className="mt-2 block font-display text-2xl">{formatINR(metrics.revenueAll)}</span></div>
        <div className="border border-[#e4ded4] bg-white p-5"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b655c]">Revenue (month)</span><span className="mt-2 block font-display text-2xl">{formatINR(metrics.revenueMonth)}</span></div>
        <div className="border border-[#e4ded4] bg-white p-5"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b655c]">Avg order value</span><span className="mt-2 block font-display text-2xl">{formatINR(metrics.aov)}</span></div>
      </div>

      <section className="border border-[#e4ded4] bg-white p-5">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Daily revenue (30 days)</h2>
        <div className="flex h-40 items-end gap-1">
          {sales.map((s) => (
            <div key={s.date} className="group flex flex-1 flex-col items-center justify-end" title={`${s.date}: ${formatINR(s.total)}`}>
              <div className="w-full bg-gold/70 group-hover:bg-gold" style={{ height: `${Math.max(3, (s.total / max) * 100)}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-[#e4ded4] bg-white">
          <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Orders by status</h2>
          <div className="divide-y divide-[#efe9df]">
            {statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between px-5 py-3 text-sm">
                <StatusPill value={s.status} />
                <span>{s._count._all} orders · {formatINR(s._sum.total ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#e4ded4] bg-white">
          <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Top products</h2>
          <div className="divide-y divide-[#efe9df]">
            {metrics.topProducts.map((p, i) => (
              <div key={p.productId ?? i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{i + 1}. {p.name}</span>
                <span className="text-xs text-[#6b655c]">{p.quantity} sold · {formatINR(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-x-auto border border-[#e4ded4] bg-white">
        <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Recent orders (latest 500)</h2>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Subtotal</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Shipping</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderNumber} className="border-b border-[#efe9df] last:border-0">
                <td className="px-4 py-2.5">{o.orderNumber}</td>
                <td className="px-4 py-2.5">{o.customerName}</td>
                <td className="px-4 py-2.5">{o.itemsCount}</td>
                <td className="px-4 py-2.5">{formatINR(o.subtotal)}</td>
                <td className="px-4 py-2.5">{formatINR(o.discount)}</td>
                <td className="px-4 py-2.5">{formatINR(o.shipping)}</td>
                <td className="px-4 py-2.5 font-medium">{formatINR(o.total)}</td>
                <td className="px-4 py-2.5"><StatusPill value={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}