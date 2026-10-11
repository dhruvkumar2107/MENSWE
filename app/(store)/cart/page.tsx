import type { Metadata } from "next";
import Link from "next/link";
import { getCartSummaryWithCoupon } from "@/lib/cart";
import { CartSummary } from "@/components/store/cart-summary";
import { EmptyState, SectionHeading } from "@/components/ui";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = {
  title: "Shopping Bag | MAISON HOMME",
};

export default async function CartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const couponCode = Array.isArray(sp.coupon) ? (sp.coupon[0] ?? "") : (sp.coupon ?? "");
  const { lines, totals, coupon, error } = await getCartSummaryWithCoupon(couponCode || undefined);

  if (lines.length === 0) {
    return (
      <div className="container-wide py-16">
        <SectionHeading eyebrow="Your Bag" title="Shopping Bag" align="center" />
        <EmptyState
          title="Your bag is empty"
          description="Fill it with pieces you'll reach for again and again."
          action={
            <Link href="/collections/all" className="border border-obsidian px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-wide py-12">
      <SectionHeading eyebrow="Your Bag" title="Shopping Bag" align="left" action={<Link href="/collections/all" className="text-xs text-graphite underline">Continue shopping</Link>} />

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <CartSummary lines={lines} totals={totals} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">Coupon</h2>
          <form action="/cart" method="GET" className="flex gap-2">
            <input
              name="coupon"
              defaultValue={couponCode}
              placeholder="Enter coupon code"
              aria-label="Coupon code"
              className="h-11 flex-1 border border-line bg-white px-3 text-sm uppercase focus:border-obsidian focus:outline-none"
            />
            <button type="submit" className="h-11 border border-obsidian px-4 text-[10px] font-semibold uppercase tracking-[0.16em]">
              Apply
            </button>
          </form>
          {coupon && coupon.valid && (
            <p className="mt-2 text-xs text-success">{coupon.message}</p>
          )}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          {coupon && coupon.valid && coupon.code && (
            <Link href="/cart" className="mt-1 inline-block text-xs text-graphite underline">Remove coupon</Link>
          )}

          <ul className="mt-6 flex flex-col gap-2 text-xs text-graphite">
            <li>✓ Free shipping on orders above {formatINR(149900)}</li>
            <li>✓ Cash on delivery available</li>
            <li>✓ 7-day easy returns</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}