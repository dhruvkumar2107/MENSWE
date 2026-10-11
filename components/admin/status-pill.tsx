import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-800 border-sky-200",
  PROCESSING: "bg-sky-100 text-sky-800 border-sky-200",
  PACKED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-violet-100 text-violet-800 border-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
  COD_PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PICKED_UP: "bg-sky-100 text-sky-800 border-sky-200",
  INSPECTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function StatusPill({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        TONES[value] ?? "bg-slate-100 text-slate-700 border-slate-200",
        className,
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}