"use client";

import { useActionState } from "react";
import { updateProductAction, type AdminState } from "@/lib/actions/admin";
import { inputClass } from "@/components/ui";
import { toRupees } from "@/lib/money";

type Option = { id: string; name: string };

export type AdminProduct = {
  id: string; name: string; slug: string; description: string; shortDescription: string | null;
  categoryId: string; brandId: string | null; fabric: string | null; fit: string | null; occasion: string | null;
  pattern: string | null; careInstructions: string | null; price: number; salePrice: number | null; costPrice: number | null;
  lowStockThreshold: number; tags: string; isPublished: boolean; isNewArrival: boolean; isBestSeller: boolean;
  isFeatured: boolean; isLimitedEdition: boolean; seoTitle: string | null; seoDescription: string | null;
};

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-gold" />
      {label}
    </label>
  );
}

export function ProductForm({ product, categories, brands }: { product: AdminProduct; categories: Option[]; brands: Option[] }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(updateProductAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={product.id} />

      <div className="grid gap-4 border border-[#e4ded4] bg-white p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Name</span>
          <input name="name" required defaultValue={product.name} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Slug</span>
          <input name="slug" defaultValue={product.slug} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Category</span>
          <select name="categoryId" required defaultValue={product.categoryId} className={inputClass}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Brand</span>
          <select name="brandId" defaultValue={product.brandId ?? ""} className={inputClass}>
            <option value="">None</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Tags (comma separated)</span>
          <input name="tags" defaultValue={product.tags} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 border border-[#e4ded4] bg-white p-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Price (₹)</span>
          <input name="price" type="number" step="1" required defaultValue={toRupees(product.price)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Sale price (₹)</span>
          <input name="salePrice" type="number" step="1" defaultValue={product.salePrice ? toRupees(product.salePrice) : ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Cost price (₹)</span>
          <input name="costPrice" type="number" step="1" defaultValue={product.costPrice ? toRupees(product.costPrice) : ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Low stock threshold</span>
          <input name="lowStockThreshold" type="number" defaultValue={product.lowStockThreshold} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Fabric</span>
          <input name="fabric" defaultValue={product.fabric ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Fit</span>
          <input name="fit" defaultValue={product.fit ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Occasion</span>
          <input name="occasion" defaultValue={product.occasion ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Pattern</span>
          <input name="pattern" defaultValue={product.pattern ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Care instructions</span>
          <input name="careInstructions" defaultValue={product.careInstructions ?? ""} className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col gap-4 border border-[#e4ded4] bg-white p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Short description</span>
          <input name="shortDescription" defaultValue={product.shortDescription ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">Description</span>
          <textarea name="description" rows={5} defaultValue={product.description} className={inputClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">SEO title</span>
            <input name="seoTitle" defaultValue={product.seoTitle ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">SEO description</span>
            <input name="seoDescription" defaultValue={product.seoDescription ?? ""} className={inputClass} />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Check name="isPublished" label="Published" defaultChecked={product.isPublished} />
          <Check name="isNewArrival" label="New arrival" defaultChecked={product.isNewArrival} />
          <Check name="isBestSeller" label="Best seller" defaultChecked={product.isBestSeller} />
          <Check name="isFeatured" label="Featured" defaultChecked={product.isFeatured} />
          <Check name="isLimitedEdition" label="Limited edition" defaultChecked={product.isLimitedEdition} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : "Save product"}
        </button>
        {state?.message && <span className="text-sm text-emerald-700">{state.message}</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}