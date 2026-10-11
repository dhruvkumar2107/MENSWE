import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { Badge } from "@/components/ui";

export default async function AccountPage() {
  const user = await requireUser();
  const [orderCount, recentOrders, wishlistCount, address] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { placedAt: "desc" }, take: 3, include: { items: true } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.address.findFirst({ where: { userId: user.id, isDefault: true } }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-graphite">Manage your orders, addresses and preferences.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders placed", value: String(orderCount), href: "/account/orders" },
          { label: "Wishlist items", value: String(wishlistCount), href: "/wishlist" },
          { label: "Rewards", value: "—", href: "/account" },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="border border-line bg-white p-5 hover:border-gold">
            <span className="text-[11px] uppercase tracking-[0.18em] text-graphite">{card.label}</span>
            <span className="mt-2 block font-display text-3xl">{card.value}</span>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-graphite underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="border border-line bg-white p-6 text-sm text-graphite">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentOrders.map((o) => (
              <Link key={o.id} href={`/account/orders/${o.orderNumber}`} className="flex items-center justify-between border border-line bg-white p-4 hover:border-gold">
                <div>
                  <span className="text-sm font-medium">#{o.orderNumber}</span>
                  <span className="block text-xs text-graphite">
                    {o.items.length} item{o.items.length > 1 ? "s" : ""} · {o.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "danger" : "gold"}>{o.status}</Badge>
                  <span className="text-sm font-medium">{formatINR(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Default Address</h2>
          <Link href="/account/addresses" className="text-xs text-graphite underline">Manage</Link>
        </div>
        {address ? (
          <p className="border border-line bg-white p-6 text-sm text-graphite">
            <span className="block font-medium text-obsidian">{address.fullName}</span>
            {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}
          </p>
        ) : (
          <p className="border border-line bg-white p-6 text-sm text-graphite">No address saved yet.</p>
        )}
      </section>
    </div>
  );
}