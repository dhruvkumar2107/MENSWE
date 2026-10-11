"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction, updateOrderTrackingAction, type AdminState } from "@/lib/actions/admin";
import { inputClass } from "@/components/ui";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

export function OrderStatusControls({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function apply() {
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, status, note);
      if (res.error) alert(res.error);
      else if (res.message) alert(res.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 border border-[#e4ded4] bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Update status</h2>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={inputClass} />
      <button onClick={apply} disabled={pending} className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
        {pending ? "Updating…" : "Apply status"}
      </button>
    </div>
  );
}

export function OrderTrackingForm({
  orderId, courier, trackingNumber, internalNote, expectedDelivery,
}: {
  orderId: string; courier: string | null; trackingNumber: string | null; internalNote: string | null; expectedDelivery: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<AdminState | undefined>();
  const [pending, startTransition] = useTransition();

  async function onSubmit(fd: FormData) {
    startTransition(async () => {
      const res = await updateOrderTrackingAction(undefined, fd);
      setState(res);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3 border border-[#e4ded4] bg-white p-5">
      <input type="hidden" name="orderId" value={orderId} />
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Fulfilment & tracking</h2>
      <input name="courier" defaultValue={courier ?? ""} placeholder="Courier" className={inputClass} />
      <input name="trackingNumber" defaultValue={trackingNumber ?? ""} placeholder="Tracking number" className={inputClass} />
      <input name="expectedDelivery" type="date" defaultValue={expectedDelivery ?? ""} className={inputClass} />
      <textarea name="internalNote" rows={2} defaultValue={internalNote ?? ""} placeholder="Internal note" className={inputClass} />
      <button type="submit" disabled={pending} className="h-10 border border-obsidian px-5 text-xs font-medium uppercase tracking-[0.2em] hover:bg-obsidian hover:text-ivory disabled:opacity-60">
        {pending ? "Saving…" : "Save tracking"}
      </button>
      {state?.message && <span className="text-sm text-emerald-700">{state.message}</span>}
    </form>
  );
}