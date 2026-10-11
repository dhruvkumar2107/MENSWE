import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { SectionHeading, ButtonLink } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber} | MAISON HOMME` };
}

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="container-wide py-16">
      <SectionHeading eyebrow="Thank you" title="Order Confirmed" align="center" description={`Order #${order.orderNumber}`} />

      <div className="mx-auto max-w-2xl flex flex-col items-center gap-6 border border-line bg-white p-10 text-center">
        <p className="text-base leading-relaxed text-charcoal">
          Thank you, {order.customerName}. Your order has been received and we&apos;ll send you updates when it ships.
        </p>
        <div className="grid w-full grid-cols-2 gap-3 border-t border-line pt-6 text-left text-sm sm:grid-cols-4">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-graphite">Order total</span>
            <span className="mt-1 block font-medium">{formatINR(order.total)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-graphite">Payment</span>
            <span className="mt-1 block font-medium">{order.paymentMethod === "COD" ? "Cash on delivery" : "Online"}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-graphite">Status</span>
            <span className="mt-1 block font-medium">{order.status}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-graphite">Placed on</span>
            <span className="mt-1 block font-medium">{order.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 border-t border-line pt-6 text-left">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-line/50 pb-4 last:border-0 last:pb-0">
              <div>
                <span className="block text-sm font-medium">{item.name}</span>
                <span className="block text-xs text-graphite">
                  {item.color} · Size {item.size} × {item.quantity}
                </span>
              </div>
              <span className="text-sm">{formatINR(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-graphite">We&apos;ve emailed a confirmation to {order.email}.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/account/orders" variant="primary" size="md">
            View orders
          </ButtonLink>
          <ButtonLink href="/collections/all" variant="outline" size="md">
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}