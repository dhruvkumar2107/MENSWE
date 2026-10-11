"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveAddressAction, type FormState } from "@/lib/actions/account";
import { inputClass } from "@/components/ui";

type AddressData = {
  id?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  type?: string;
  isDefault?: boolean;
};

export function AddressForm({ address }: { address?: AddressData }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState | undefined, FormData>(saveAddressAction, undefined);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-3 border border-line bg-white p-5">
      {address?.id && <input type="hidden" name="id" value={address.id} />}
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em]">{address?.id ? "Edit address" : "Add new address"}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="fullName" required defaultValue={address?.fullName} placeholder="Full name" className={inputClass} />
        <input name="phone" required defaultValue={address?.phone} placeholder="Phone" className={inputClass} />
        <input name="line1" required defaultValue={address?.line1} placeholder="Address line 1" className={inputClass} />
        <input name="line2" defaultValue={address?.line2 ?? ""} placeholder="Address line 2 (optional)" className={inputClass} />
        <input name="city" required defaultValue={address?.city} placeholder="City" className={inputClass} />
        <input name="state" required defaultValue={address?.state} placeholder="State" className={inputClass} />
        <input name="pincode" required inputMode="numeric" maxLength={6} defaultValue={address?.pincode} placeholder="PIN code" className={inputClass} />
        <select name="type" defaultValue={address?.type ?? "HOME"} className={inputClass}>
          <option value="HOME">Home</option>
          <option value="WORK">Work</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-graphite">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="h-4 w-4 accent-gold" />
        Set as default address
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : address?.id ? "Update" : "Save address"}
        </button>
        {state?.message && <span className="text-sm text-success">{state.message}</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}