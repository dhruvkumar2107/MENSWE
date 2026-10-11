import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { cancelOrderAction } from "@/lib/actions/account";
import { Badge, Button } from "@/components/ui";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await requireUser();
  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const address = JSON.parse(order.shippingAddress) as {
    fullName: string; line1: string; line2?: string; city: string; state: string; pincode: string;
  };
  const cancellable = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/account/orders" className="text-xs text-graphite underline">← Back to orders</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl">Order #{order.orderNumber}</h1>
          <Badge tone="gold">{order.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-graphite">
          Placed {order.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Payment: {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"} · {order.paymentStatus}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border border-line bg-white p-4">
              <div className="flex items-center gap-4">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-20 w-16 object-cover" />
                )}
                <div>
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="block text-xs text-graphite">{item.color} · Size {item.size} × {item.quantity}</span>
                </div>
              </div>
              <span className="text-sm">{formatINR(item.lineTotal)}</span>
            </div>
          ))}

          <div className="border border-line bg-white p-5">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Order Timeline</h2>
            <ol className="flex flex-col gap-3">
              {order.history.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span>
                    <span className="font-medium">{h.status}</span>
                    {h.note && <span className="block text-xs text-graphite">{h.note}</span>}
                    <span className="block text-[11px] text-graphite">
                      {h.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="border border-line bg-white p-5 text-sm">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Shipping Address</h2>
            <p className="text-graphite">
              <span className="block font-medium text-obsidian">{address.fullName}</span>
              {address.line1}{address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.state} {address.pincode}
            </p>
          </div>

          <div className="flex flex-col gap-2 border border-line bg-white p-5 text-sm">
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]">Summary</h2>
            <div className="flex justify-between"><span className="text-graphite">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-gold"><span>Discount</span><span>−{formatINR(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-graphite">Shipping</span><span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 font-medium"><span>Total</span><span>{formatINR(order.total)}</span></div>
          </div>

          {cancellable && (
            <form action={cancelOrderAction.bind(null, order.orderNumber)}>
              <Button type="submit" variant="outline" size="md" className="w-full">
                Cancel order
              </Button>
            </form>
          )}

          {order.status === "DELIVERED" && (
            <Link href="/account/returns" className="text-center text-xs text-graphite underline">
              Request a return or exchange
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}