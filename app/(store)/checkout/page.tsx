import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCartSummaryWithCoupon } from "@/lib/cart";
import { getCheckoutTotals } from "@/lib/actions/checkout";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout | MAISON HOMME",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const { lines, totals, coupon } = await getCartSummaryWithCoupon();

  if (lines.length === 0) {
    redirect("/cart");
  }

  const [addresses, defaultAddress] = user
    ? await Promise.all([
        prisma.address.findMany({ where: { userId: user.id } }),
        prisma.address.findFirst({ where: { userId: user.id, isDefault: true } }),
      ])
    : [null, null];

  return (
    <div className="container-wide py-12">
      <SectionHeading
        eyebrow="Secure Checkout"
        title="Checkout"
        align="left"
        action={
          <Link href="/cart" className="text-xs text-graphite underline">
            Back to bag
          </Link>
        }
      />
      <CheckoutForm
        lines={lines}
        totals={totals}
        couponNote={coupon && coupon.valid ? (coupon.code ?? "") : null}
        userEmail={user?.email}
        userPhone={user?.phone ?? undefined}
        defaultAddress={defaultAddress ? { id: defaultAddress.id, fullName: defaultAddress.fullName, phone: defaultAddress.phone, line1: defaultAddress.line1, line2: defaultAddress.line2, city: defaultAddress.city, state: defaultAddress.state, pincode: defaultAddress.pincode } : null}
        addresses={addresses?.map((a) => ({ id: a.id, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode })) ?? undefined}
        loggedIn={!!user}
      />
    </div>
  );
}