"use client";

import { useActionState } from "react";
import { updateContentBlockAction, upsertFaqAction, updateSettingsAction, type AdminState } from "@/lib/actions/admin";
import { inputClass } from "@/components/ui";

export function ContentBlockForm({
  block,
}: {
  block?: { id: string; key: string; type: string; title: string | null; subtitle: string | null; imageUrl: string | null; ctaLabel: string | null; ctaHref: string | null; position: number; isActive: boolean };
}) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(updateContentBlockAction, undefined);
  return (
    <details className="border border-[#e4ded4] bg-white" open={!block}>
      <summary className="cursor-pointer px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
        {block ? `Edit ${block.key}` : "New content block"}
      </summary>
      <form action={action} className="grid gap-3 border-t border-[#e4ded4] p-5 sm:grid-cols-2">
        {block?.id && <input type="hidden" name="id" value={block.id} />}
        <input name="key" required placeholder="key (e.g. home.campaign)" defaultValue={block?.key} className={inputClass} />
        <select name="type" defaultValue={block?.type ?? "CUSTOM"} className={inputClass}>
          {["CUSTOM", "HERO", "CATEGORY_TILE", "CAMPAIGN", "BANNER"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input name="title" placeholder="Title" defaultValue={block?.title ?? ""} className={inputClass} />
        <input name="subtitle" placeholder="Subtitle" defaultValue={block?.subtitle ?? ""} className={inputClass} />
        <input name="imageUrl" placeholder="Image URL" defaultValue={block?.imageUrl ?? ""} className={inputClass} />
        <input name="ctaLabel" placeholder="CTA label" defaultValue={block?.ctaLabel ?? ""} className={inputClass} />
        <input name="ctaHref" placeholder="CTA href" defaultValue={block?.ctaHref ?? ""} className={inputClass} />
        <input name="position" type="number" placeholder="Position" defaultValue={block?.position ?? 0} className={inputClass} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={block ? block.isActive : true} className="h-4 w-4 accent-gold" />Active</label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
            {pending ? "Saving…" : "Save block"}
          </button>
          {state?.message && <span className="ml-3 text-sm text-emerald-700">{state.message}</span>}
          {state?.error && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}

export function FaqForm({ faq }: { faq?: { id: string; question: string; answer: string; position: number; isActive: boolean } }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(upsertFaqAction, undefined);
  return (
    <form action={action} className="grid gap-3 border border-[#e4ded4] bg-white p-5">
      {faq?.id && <input type="hidden" name="id" value={faq.id} />}
      <input name="question" required placeholder="Question" defaultValue={faq?.question} className={inputClass} />
      <textarea name="answer" required rows={2} placeholder="Answer" defaultValue={faq?.answer} className={inputClass} />
      <div className="flex items-center gap-4">
        <input name="position" type="number" placeholder="Position" defaultValue={faq?.position ?? 0} className="h-10 w-24 border border-[#d9d2c6] bg-white px-2 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={faq ? faq.isActive : true} className="h-4 w-4 accent-gold" />Active</label>
        <button type="submit" disabled={pending} className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : faq ? "Update FAQ" : "Add FAQ"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

export function SettingsForm({ settings, fields }: { settings: Record<string, string>; fields: { key: string; label: string; type?: string; textarea?: boolean }[] }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(updateSettingsAction, undefined);
  return (
    <form action={action} className="grid gap-4 border border-[#e4ded4] bg-white p-5 sm:grid-cols-2">
      {fields.map((f) =>
        f.textarea ? (
          <label key={f.key} className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">{f.label}</span>
            <textarea name={`setting.${f.key}`} rows={3} defaultValue={settings[f.key] ?? ""} className={inputClass} />
          </label>
        ) : (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b655c]">{f.label}</span>
            <input name={`setting.${f.key}`} type={f.type ?? "text"} defaultValue={settings[f.key] ?? ""} className={inputClass} />
          </label>
        ),
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state?.message && <span className="ml-3 text-sm text-emerald-700">{state.message}</span>}
        {state?.error && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}