import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { Badge } from "@/components/ui";

const statusTone: Record<string, "gold" | "success" | "danger" | "muted"> = {
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
  SHIPPED: "gold",
  PENDING: "muted",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { placedAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="border border-line bg-white p-6 text-sm text-graphite">
          You haven&apos;t placed any orders yet.{" "}
          <Link href="/collections/all" className="underline">Start shopping</Link>.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.orderNumber}`} className="block border border-line bg-white p-5 hover:border-gold">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <span className="text-sm font-medium">Order #{o.orderNumber}</span>
                  <span className="ml-3 text-xs text-graphite">
                    {o.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <Badge tone={statusTone[o.status] ?? "gold"}>{o.status}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-xs text-graphite">
                  {o.items.length} item{o.items.length > 1 ? "s" : ""} · {o.items.map((i) => i.name).slice(0, 2).join(", ")}
                  {o.items.length > 2 ? "…" : ""}
                </span>
                <span className="text-sm font-semibold">{formatINR(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}