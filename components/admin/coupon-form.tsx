"use client";

import { useActionState } from "react";
import { upsertCouponAction, type AdminState } from "@/lib/actions/admin";
import { inputClass } from "@/components/ui";
import { toRupees } from "@/lib/money";

type Coupon = {
  id: string; code: string; description: string | null; type: string; value: number; minCartValue: number;
  maxDiscount: number | null; firstOrderOnly: boolean; perCustomerLimit: number; usageLimit: number | null;
  stackable: boolean; isActive: boolean; startsAt: Date | null; endsAt: Date | null;
};

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(upsertCouponAction, undefined);
  const isFixed = coupon?.type === "FIXED";
  const dateVal = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

  return (
    <details className="border border-[#e4ded4] bg-white" open={!coupon}>
      <summary className="cursor-pointer px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
        {coupon ? `Edit ${coupon.code}` : "Create coupon"}
      </summary>
      <form action={action} className="grid gap-3 border-t border-[#e4ded4] p-5 sm:grid-cols-3">
        {coupon?.id && <input type="hidden" name="id" value={coupon.id} />}
        <input name="code" required placeholder="CODE" defaultValue={coupon?.code} className={inputClass} />
        <select name="type" defaultValue={coupon?.type ?? "PERCENT"} className={inputClass}>
          <option value="PERCENT">Percent off</option>
          <option value="FIXED">Fixed amount off</option>
          <option value="FREE_SHIPPING">Free shipping</option>
        </select>
        <input name="value" type="number" placeholder={isFixed ? "Value ₹" : "Value %"} defaultValue={coupon?.value ?? ""} className={inputClass} />
        <input name="minCartValue" type="number" placeholder="Min cart ₹" defaultValue={coupon ? toRupees(coupon.minCartValue) : ""} className={inputClass} />
        <input name="maxDiscount" type="number" placeholder="Max discount ₹" defaultValue={coupon?.maxDiscount ? toRupees(coupon.maxDiscount) : ""} className={inputClass} />
        <input name="perCustomerLimit" type="number" placeholder="Per-customer limit" defaultValue={coupon?.perCustomerLimit ?? 1} className={inputClass} />
        <input name="usageLimit" type="number" placeholder="Total usage limit" defaultValue={coupon?.usageLimit ?? ""} className={inputClass} />
        <input name="startsAt" type="date" defaultValue={dateVal(coupon?.startsAt)} className={inputClass} />
        <input name="endsAt" type="date" defaultValue={dateVal(coupon?.endsAt)} className={inputClass} />
        <input name="description" placeholder="Description" defaultValue={coupon?.description ?? ""} className={`${inputClass} sm:col-span-3`} />
        <div className="flex flex-wrap gap-4 sm:col-span-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="firstOrderOnly" defaultChecked={coupon?.firstOrderOnly} className="h-4 w-4 accent-gold" />First order only</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="stackable" defaultChecked={coupon?.stackable} className="h-4 w-4 accent-gold" />Stackable</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={coupon ? coupon.isActive : true} className="h-4 w-4 accent-gold" />Active</label>
        </div>
        <div className="sm:col-span-3">
          <button type="submit" disabled={pending} className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
            {pending ? "Saving…" : "Save coupon"}
          </button>
          {state?.message && <span className="ml-3 text-sm text-emerald-700">{state.message}</span>}
          {state?.error && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}