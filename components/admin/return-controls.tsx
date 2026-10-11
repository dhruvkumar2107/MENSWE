"use client";

import { useActionState } from "react";
import { updateReturnAction, replyReviewAction, type AdminState } from "@/lib/actions/admin";
import { inputClass } from "@/components/ui";
import { toRupees } from "@/lib/money";

const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "PICKED_UP", "INSPECTED", "COMPLETED"];

export function ReturnControls({
  id, status, resolution, refundAmount, restockable, adminNote,
}: {
  id: string; status: string; resolution: string; refundAmount: number; restockable: boolean; adminNote: string | null;
}) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(updateReturnAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 border border-[#e4ded4] bg-white p-5">
      <input type="hidden" name="id" value={id} />
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Process return</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="status" defaultValue={status} className={inputClass}>
          {RETURN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="resolution" defaultValue={resolution} className={inputClass}>
          <option value="REFUND">Refund</option>
          <option value="EXCHANGE">Exchange</option>
        </select>
        <input name="refundAmount" type="number" placeholder="Refund ₹" defaultValue={refundAmount ? toRupees(refundAmount) : ""} className={inputClass} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="restockable" defaultChecked={restockable} className="h-4 w-4 accent-gold" />
          Restock item (adds back to inventory)
        </label>
      </div>
      <textarea name="adminNote" rows={2} defaultValue={adminNote ?? ""} placeholder="Internal note" className={inputClass} />
      <div>
        <button type="submit" disabled={pending} className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : "Save return"}
        </button>
        {state?.message && <span className="ml-3 text-sm text-emerald-700">{state.message}</span>}
        {state?.error && <span className="ml-3 text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

export function ReviewReplyForm({ id, adminReply }: { id: string; adminReply: string | null }) {
  const [state, action, pending] = useActionState<AdminState | undefined, FormData>(replyReviewAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="adminReply" defaultValue={adminReply ?? ""} placeholder="Reply to this review" className="h-9 flex-1 border border-[#d9d2c6] bg-white px-3 text-sm" />
      <button type="submit" disabled={pending} className="h-9 border border-obsidian px-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-obsidian hover:text-ivory disabled:opacity-60">
        {pending ? "…" : "Reply"}
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}