import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/admin/status-pill";

const FILTERS = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin("order:read");
  const { status = "ALL", q } = await searchParams;

  const where = {
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { OR: [{ orderNumber: { contains: q } }, { customerName: { contains: q } }, { email: { contains: q } }] } : {}),
  };

  const orders = await prisma.order.findMany({ where, orderBy: { placedAt: "desc" }, take: 200, include: { items: true } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Orders</h1>
        <a href="/api/admin/export?type=orders" className="h-10 border border-obsidian px-4 text-xs font-medium uppercase leading-10 tracking-[0.16em] hover:bg-obsidian hover:text-ivory">Export CSV</a>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search order, name or email…" className="h-10 flex-1 border border-[#d9d2c6] bg-white px-3 text-sm" />
        <select name="status" defaultValue={status} className="h-10 border border-[#d9d2c6] bg-white px-3 text-sm">
          {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <button className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.16em] text-ivory">Filter</button>
      </form>

      <div className="overflow-x-auto border border-[#e4ded4] bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[#efe9df] last:border-0 hover:bg-[#faf8f4]">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-gold-deep">#{o.orderNumber}</Link></td>
                <td className="px-4 py-3">{o.customerName}<span className="block text-xs text-[#6b655c]">{o.email}</span></td>
                <td className="px-4 py-3">{o.items.length}</td>
                <td className="px-4 py-3 font-medium">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><StatusPill value={o.paymentStatus} /><span className="mt-1 block text-[10px] text-[#6b655c]">{o.paymentMethod}</span></td>
                <td className="px-4 py-3"><StatusPill value={o.status} /></td>
                <td className="px-4 py-3 text-xs text-[#6b655c]">{o.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6b655c]">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}