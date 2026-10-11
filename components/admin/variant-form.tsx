"use client";

import { useActionState } from "react";
import { upsertVariantAction, adjustStockAction, type AdminState } from "@/lib/actions/admin";
import { inputClass } from "@/components/ui";
import { toRupees } from "@/lib/money";

type Variant = {
  id: string; sku: string; color: string; colorHex: string | null; size: string;
  priceOverride: number | null; stock: number; lowStockThreshold: number; isActive: boolean;
};

export function VariantForm({ productId, variant }: { productId: string; variant?: Variant }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(upsertVariantAction, undefined);
  return (
    <form action={action} className="grid gap-3 border border-[#e4ded4] bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
      <input type="hidden" name="productId" value={productId} />
      {variant?.id && <input type="hidden" name="id" value={variant.id} />}
      <input name="color" required placeholder="Colour" defaultValue={variant?.color} className={inputClass} />
      <input name="colorHex" placeholder="Hex #000000" defaultValue={variant?.colorHex ?? ""} className={inputClass} />
      <input name="size" required placeholder="Size" defaultValue={variant?.size} className={inputClass} />
      <input name="sku" placeholder="SKU (auto)" defaultValue={variant?.sku} className={inputClass} />
      <input name="stock" type="number" placeholder="Stock" defaultValue={variant?.stock ?? 0} className={inputClass} />
      <input name="priceOverride" type="number" placeholder="Price ₹ (opt)" defaultValue={variant?.priceOverride ? toRupees(variant.priceOverride) : ""} className={inputClass} />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="isActive" defaultChecked={variant ? variant.isActive : true} className="h-4 w-4 accent-gold" />
        Active
      </label>
      <div className="sm:col-span-2 lg:col-span-5">
        <button type="submit" disabled={pending} className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : variant ? "Update variant" : "Add variant"}
        </button>
        {state?.message && <span className="ml-3 text-sm text-emerald-700">{state.message}</span>}
        {state?.error && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

export function InventoryAdjust({ variantId, label }: { variantId: string; label: string }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(adjustStockAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <input name="delta" type="number" placeholder="± qty" required className="h-9 w-20 border border-[#d9d2c6] bg-white px-2 text-sm" aria-label={`Adjust stock for ${label}`} />
      <input name="reason" placeholder="Reason" className="h-9 w-32 border border-[#d9d2c6] bg-white px-2 text-sm" />
      <button type="submit" disabled={pending} className="h-9 border border-obsidian px-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-obsidian hover:text-ivory disabled:opacity-60">
        Adjust
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}