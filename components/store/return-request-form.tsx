"use client";

import { useActionState } from "react";
import { submitReturnAction, type FormState } from "@/lib/actions/account";
import { inputClass } from "@/components/ui";

type OrderOption = { id: string; orderNumber: string; items: { id: string; name: string; size: string; color: string }[] };

const REASONS = [
  "Size doesn't fit",
  "Item damaged or defective",
  "Received wrong item",
  "Not as described",
  "Changed my mind",
  "Other",
];

export function ReturnRequestForm({ orders }: { orders: OrderOption[] }) {
  const [state, action, pending] = useActionState<FormState | undefined, FormData>(submitReturnAction, undefined);

  if (orders.length === 0) {
    return <p className="border border-line bg-white p-6 text-sm text-graphite">You have no delivered orders eligible for a return.</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3 border border-line bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Start a return or exchange</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Order</span>
        <select name="orderId" required className={inputClass} defaultValue="">
          <option value="" disabled>Select an order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>#{o.orderNumber}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Item (optional)</span>
        <select name="orderItemId" className={inputClass} defaultValue="">
          <option value="">Whole order</option>
          {orders.flatMap((o) =>
            o.items.map((i) => (
              <option key={i.id} value={i.id}>#{o.orderNumber} — {i.name} ({i.color}/{i.size})</option>
            )),
          )}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Reason</span>
        <select name="reason" required className={inputClass} defaultValue="">
          <option value="" disabled>Select a reason</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Comments (optional)</span>
        <textarea name="comment" rows={3} className={inputClass} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Submitting…" : "Submit request"}
        </button>
        {state?.message && <span className="text-sm text-success">{state.message}</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}