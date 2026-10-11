import Link from "next/link";
import { getDashboardMetrics, getSalesByDay } from "@/lib/reports";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/admin/status-pill";

export const dynamic = "force-dynamic";

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <div className="border border-[#e4ded4] bg-white p-5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b655c]">{label}</span>
      <span className="mt-2 block font-display text-2xl">{value}</span>
      {sub && <span className="mt-1 block text-xs text-[#6b655c]">{sub}</span>}
    </div>
  );
  return href ? <Link href={href} className="hover:border-gold">{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  const [m, sales] = await Promise.all([getDashboardMetrics(), getSalesByDay(14)]);
  const maxSales = Math.max(1, ...sales.map((s) => s.total));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-[#6b655c]">Live overview of sales, orders and operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue (month)" value={formatINR(m.revenueMonth)} sub={`All time ${formatINR(m.revenueAll)}`} href="/admin/reports" />
        <Stat label="Orders (month)" value={String(m.monthOrderCount)} sub={`${m.orderCount} all time`} href="/admin/orders" />
        <Stat label="Avg order value" value={formatINR(m.aov)} sub={`Today ${formatINR(m.revenueToday)}`} />
        <Stat label="Customers" value={String(m.customerCount)} sub={`+${m.newCustomers} this month`} href="/admin/customers" />
      </div>

      {(m.pendingOrders > 0 || m.pendingReviews > 0 || m.pendingReturns > 0) && (
        <div className="flex flex-wrap gap-3">
          {m.pendingOrders > 0 && <Link href="/admin/orders" className="border border-gold bg-[#fbf7ee] px-4 py-2 text-xs"><strong>{m.pendingOrders}</strong> orders need attention</Link>}
          {m.pendingReturns > 0 && <Link href="/admin/returns" className="border border-gold bg-[#fbf7ee] px-4 py-2 text-xs"><strong>{m.pendingReturns}</strong> return requests</Link>}
          {m.pendingReviews > 0 && <Link href="/admin/reviews" className="border border-gold bg-[#fbf7ee] px-4 py-2 text-xs"><strong>{m.pendingReviews}</strong> reviews to moderate</Link>}
        </div>
      )}

      <section className="border border-[#e4ded4] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Sales — last 14 days</h2>
          <Link href="/api/admin/export?type=orders" className="text-xs text-[#6b655c] underline">Export CSV</Link>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {sales.map((s) => (
            <div key={s.date} className="group flex flex-1 flex-col items-center justify-end" title={`${s.date}: ${formatINR(s.total)}`}>
              <div className="w-full bg-gold/70 transition-colors group-hover:bg-gold" style={{ height: `${Math.max(3, (s.total / maxSales) * 100)}%` }} />
              <span className="mt-1 hidden text-[9px] text-[#6b655c] sm:block">{s.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-[#e4ded4] bg-white">
          <div className="flex items-center justify-between border-b border-[#e4ded4] px-5 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#6b655c] underline">View all</Link>
          </div>
          <div className="divide-y divide-[#efe9df]">
            {m.recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-[#faf8f4]">
                <div>
                  <span className="font-medium">#{o.orderNumber}</span>
                  <span className="block text-xs text-[#6b655c]">{o.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={o.status} />
                  <span className="text-sm">{formatINR(o.total)}</span>
                </div>
              </Link>
            ))}
            {m.recentOrders.length === 0 && <p className="px-5 py-6 text-sm text-[#6b655c]">No orders yet.</p>}
          </div>
        </section>

        <section className="border border-[#e4ded4] bg-white">
          <div className="flex items-center justify-between border-b border-[#e4ded4] px-5 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Best sellers</h2>
            <Link href="/admin/products" className="text-xs text-[#6b655c] underline">Products</Link>
          </div>
          <div className="divide-y divide-[#efe9df]">
            {m.topProducts.map((p, i) => (
              <div key={p.productId ?? i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{i + 1}. {p.name}</span>
                <span className="text-xs text-[#6b655c]">{p.quantity} sold · {formatINR(p.revenue)}</span>
              </div>
            ))}
            {m.topProducts.length === 0 && <p className="px-5 py-6 text-sm text-[#6b655c]">No sales data yet.</p>}
          </div>
        </section>
      </div>

      <section className="border border-[#e4ded4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e4ded4] px-5 py-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Low stock alerts</h2>
          <Link href="/admin/inventory" className="text-xs text-[#6b655c] underline">Manage inventory</Link>
        </div>
        <div className="divide-y divide-[#efe9df]">
          {m.lowStock.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{v.product.name} <span className="text-[#6b655c]">· {v.color} / {v.size}</span></span>
              <span className={v.available <= 0 ? "text-red-600" : "text-amber-600"}>{v.available} left</span>
            </div>
          ))}
          {m.lowStock.length === 0 && <p className="px-5 py-6 text-sm text-[#6b655c]">All variants are well stocked.</p>}
        </div>
      </section>
    </div>
  );
}