import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { ToggleActiveButton } from "@/components/admin/staff-controls";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin("customer:read");
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { orders: true } } },
  });

  const spend = await prisma.order.groupBy({
    by: ["userId"],
    _sum: { total: true },
    where: { userId: { in: customers.map((c) => c.id) }, status: { notIn: ["CANCELLED"] } },
  });
  const spendMap = new Map(spend.map((s) => [s.userId, s._sum.total ?? 0]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Customers</h1>
      <form method="get" className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name, email or phone…" className="h-10 flex-1 border border-[#d9d2c6] bg-white px-3 text-sm" />
        <button className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.16em] text-ivory">Search</button>
      </form>

      <div className="overflow-x-auto border border-[#e4ded4] bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Lifetime value</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[#efe9df] last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}<span className="block text-xs text-[#6b655c]">{c.email}</span></td>
                <td className="px-4 py-3 text-[#6b655c]">{c.phone ?? "—"}</td>
                <td className="px-4 py-3">{c._count.orders}</td>
                <td className="px-4 py-3">{formatINR(spendMap.get(c.id) ?? 0)}</td>
                <td className="px-4 py-3 text-xs text-[#6b655c]">{c.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                <td className="px-4 py-3 text-right">
                  <ToggleActiveButton userId={c.id} isActive={c.isActive} self={c.id === admin.id} />
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b655c]">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}