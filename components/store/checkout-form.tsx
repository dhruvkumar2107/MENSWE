"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { placeOrderAction, type PlaceOrderResult, type TotalsView } from "@/lib/actions/checkout";
import type { CartLine } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

const initialResult: PlaceOrderResult = { ok: false, message: "" };

function loadRazorpay(cb: (rzp: any) => void, onError: () => void) {
  const existing = (window as any).Razorpay;
  if (existing) return cb(existing);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => ((window as any).Razorpay ? cb((window as any).Razorpay) : onError());
  script.onerror = onError;
  script.async = true;
  document.body.appendChild(script);
}

export function CheckoutForm({
  lines,
  totals,
  couponNote,
  userEmail,
  userPhone,
  defaultAddress,
  addresses,
  loggedIn,
}: {
  lines: CartLine[];
  totals: TotalsView;
  couponNote: string | null;
  userEmail?: string;
  userPhone?: string;
  defaultAddress?: Address | null;
  addresses?: Address[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PlaceOrderResult, FormData>(placeOrderAction, initialResult);
  const [method, setMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);

  useEffect(() => {
    if (!state.ok || payingRef.current) return;
    if (!state.orderNumber) return;

    if (state.paymentMethod === "RAZORPAY" && state.razorpayOrderId && state.razorpayKeyId) {
      payingRef.current = true;
      setPaying(true);
      loadRazorpay(
        (Razorpay) => {
          const rzp = new Razorpay({
            key: state.razorpayKeyId,
            amount: state.amount,
            currency: "INR",
            name: "MAISON HOMME",
            order_id: state.razorpayOrderId,
            prefill: { email: userEmail, contact: userPhone },
            handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
              await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderNumber: state.orderNumber,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });
              router.replace(`/order/${state.orderNumber}`);
            },
            modal: {
              ondismiss: () => {
                payingRef.current = false;
                setPaying(false);
                router.push(`/order/${state.orderNumber}`);
              },
            },
          });
          rzp.open();
        },
        () => {
          payingRef.current = false;
          setPaying(false);
          router.push(`/order/${state.orderNumber}`);
        },
      );
    } else {
      router.replace(`/order/${state.orderNumber}`);
    }
  }, [state, router, userEmail, userPhone]);

  const shippingLabel = totals.shipping === 0 ? "Free" : formatINR(totals.shipping);
  const displayTotal = method === "COD" ? totals.total + totals.codFee : totals.total;

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-10">
        {/* Contact */}
        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">1 · Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Email</span>
              <input name="email" required type="email" defaultValue={userEmail} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Phone</span>
              <input name="phone" required type="tel" defaultValue={userPhone} placeholder="10-digit mobile" className={inputClass} />
            </label>
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">2 · Delivery Address</h2>

          {addresses && addresses.length > 0 && loggedIn && (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={(e) => {
                    const form = e.currentTarget.closest("form") as HTMLFormElement;
                    const set = (name: string, value: string) => {
                      const el = form.elements.namedItem(name) as HTMLInputElement;
                      if (el) el.value = value;
                    };
                    set("fullName", a.fullName);
                    set("phone", a.phone);
                    set("line1", a.line1);
                    set("line2", a.line2 ?? "");
                    set("city", a.city);
                    set("state", a.state);
                    set("pincode", a.pincode);
                  }}
                  className="border border-line bg-white p-3 text-left text-xs hover:border-gold"
                >
                  <span className="font-medium text-obsidian">{a.fullName}</span>
                  <span className="block text-graphite">
                    {a.line1} {a.line2}, {a.city}, {a.state} {a.pincode}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Full name</span>
              <input name="fullName" required defaultValue={defaultAddress?.fullName ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Address line 1</span>
              <input name="line1" required defaultValue={defaultAddress?.line1 ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Address line 2 (optional)</span>
              <input name="line2" defaultValue={defaultAddress?.line2 ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">City</span>
              <input name="city" required defaultValue={defaultAddress?.city ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">State</span>
              <input name="state" required defaultValue={defaultAddress?.state ?? ""} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">PIN code</span>
              <input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{6}" maxLength={6} defaultValue={defaultAddress?.pincode ?? ""} className={inputClass} />
            </label>
            <input type="hidden" name="type" value="HOME" />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input name="note" defaultValue="" className={cn(inputClass, "h-11 w-full")} placeholder="Order note (optional)" aria-label="Order note" />
          </label>

          {loggedIn && (
            <label className="mt-3 flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 border-line accent-gold" />
              Save this address for next time
            </label>
          )}
        </section>

        {/* Payment */}
        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]">3 · Payment Method</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 border p-4",
                method === "RAZORPAY" ? "border-obsidian bg-sand" : "border-line bg-white",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="RAZORPAY"
                checked={method === "RAZORPAY"}
                onChange={() => setMethod("RAZORPAY")}
                className="accent-gold"
              />
              <span>
                <span className="block text-sm font-medium">Card / UPI / Netbanking</span>
                <span className="block text-xs text-graphite">Secure payments via Razorpay</span>
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 border p-4",
                method === "COD" ? "border-obsidian bg-sand" : "border-line bg-white",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={method === "COD"}
                onChange={() => setMethod("COD")}
                className="accent-gold"
              />
              <span>
                <span className="block text-sm font-medium">Cash on Delivery</span>
                <span className="block text-xs text-graphite">{formatINR(totals.codFee)} fee</span>
              </span>
            </label>
          </div>
          {method === "RAZORPAY" && (
            <p className="mt-3 text-xs text-graphite">
              You&apos;ll be redirected to a secure Razorpay checkout to complete your payment.
            </p>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-5 bg-obsidian p-6 text-ivory">
          <h2 className="font-display text-xl">Order Summary</h2>
          <ul className="flex flex-col gap-4 border-b border-ivory/15 pb-5">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ivory/80">
                  {l.name}
                  <span className="block text-[11px] text-ivory/50">
                    {l.color} · {l.size} × {l.quantity}
                  </span>
                </span>
                <span>{formatINR(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ivory/70">Subtotal</dt>
              <dd>{formatINR(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-gold">
                <dt>Coupon discount</dt>
                <dd>−{formatINR(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ivory/70">Shipping{couponNote ? ` · ${couponNote}` : ""}</dt>
              <dd>{shippingLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ivory/70">Taxes (incl.)</dt>
              <dd>{formatINR(totals.tax)}</dd>
            </div>
            {method === "COD" && totals.codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-ivory/70">COD fee</dt>
                <dd>{formatINR(totals.codFee)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-ivory/20 pt-3 font-display text-2xl">
              <dt>Total</dt>
              <dd>{formatINR(displayTotal)}</dd>
            </div>
          </dl>
          {method === "COD" && totals.codFee > 0 && (
            <p className="text-[11px] text-ivory/60">Includes {formatINR(totals.codFee)} cash-on-delivery fee.</p>
          )}
          <input type="hidden" name="couponCode" value="" />
          <button
            type="submit"
            disabled={pending || paying}
            className="h-14 bg-gold text-xs font-semibold uppercase tracking-[0.2em] text-obsidian hover:bg-gold-deep hover:text-ivory disabled:opacity-60"
          >
            {pending ? "Placing order…" : paying ? "Opening payment…" : method === "COD" ? "Place Order (COD)" : "Pay & Place Order"}
          </button>
          <p className="text-center text-[11px] text-ivory/60">By placing this order you agree to our terms & policies.</p>
        </div>

        {state.message && !state.ok && (
          <p role="alert" className="mt-4 border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
            {state.message}
          </p>
        )}
      </aside>
    </form>
  );
}