import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { ReturnControls } from "@/components/admin/return-controls";
import { StatusPill } from "@/components/admin/status-pill";

export default async function AdminReturnsPage() {
  await requireAdmin("return:read");
  const returns = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { order: { select: { orderNumber: true, id: true } }, orderItem: { select: { name: true, color: true, size: true } }, user: { select: { name: true, email: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Returns &amp; Exchanges</h1>
      {returns.length === 0 && <p className="border border-[#e4ded4] bg-white p-6 text-sm text-[#6b655c]">No return requests.</p>}
      <div className="flex flex-col gap-4">
        {returns.map((r) => (
          <div key={r.id} className="grid gap-4 border border-[#e4ded4] bg-white p-5 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-3">
                <Link href={`/admin/orders/${r.order.id}`} className="font-medium hover:text-gold-deep">#{r.order.orderNumber}</Link>
                <StatusPill value={r.status} />
                <span className="text-xs text-[#6b655c]">{r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</span>
              </div>
              <p><span className="text-[#6b655c]">Reason:</span> {r.reason}</p>
              {r.comment && <p className="text-[#6b655c]">{r.comment}</p>}
              {r.orderItem && <p className="text-xs text-[#6b655c]">Item: {r.orderItem.name} ({r.orderItem.color} / {r.orderItem.size})</p>}
              <p className="text-xs text-[#6b655c]">Customer: {r.user?.name ?? "—"} · {r.user?.email ?? "guest"}</p>
              {r.refundAmount > 0 && <p className="text-xs">Refund set: {formatINR(r.refundAmount)} ({r.resolution})</p>}
            </div>
            <ReturnControls
              id={r.id}
              status={r.status}
              resolution={r.resolution}
              refundAmount={r.refundAmount}
              restockable={r.restockable}
              adminNote={r.adminNote}
            />
          </div>
        ))}
      </div>
    </div>
  );
}