import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReturnRequestForm } from "@/components/store/return-request-form";
import { Badge } from "@/components/ui";

export default async function ReturnsPage() {
  const user = await requireUser();
  const [orders, returns] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id, status: "DELIVERED" },
      orderBy: { placedAt: "desc" },
      include: { items: true },
    }),
    prisma.returnRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { order: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Returns &amp; Exchanges</h1>
      <ReturnRequestForm
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          items: o.items.map((i) => ({ id: i.id, name: i.name, size: i.size, color: i.color })),
        }))}
      />

      {returns.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Your requests</h2>
          {returns.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 border border-line bg-white p-4 text-sm">
              <div>
                <span className="font-medium">Order #{r.order.orderNumber}</span>
                <span className="block text-xs text-graphite">{r.reason}{r.comment ? ` — ${r.comment}` : ""}</span>
                <span className="block text-[11px] text-graphite">
                  {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <Badge tone={r.status === "COMPLETED" ? "success" : r.status === "REJECTED" ? "danger" : "gold"}>{r.status}</Badge>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}