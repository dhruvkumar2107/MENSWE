"use client";

import { useActionState } from "react";
import { Star } from "lucide-react";
import { submitReviewAction, type ReviewResult } from "@/lib/actions/review";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, productSlug, userName }: { productId: string; productSlug: string; userName: string }) {
  const [state, action, pending] = useActionState<ReviewResult | undefined, FormData>(submitReviewAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 border border-line bg-white p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-graphite">
        Reviewing as {userName}
      </p>
      <div>
        <label className="text-xs text-graphite">Rating</label>
        <select name="rating" defaultValue="5" className="mt-1 h-10 w-full border border-line bg-white px-2 text-sm">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <input
        name="title"
        placeholder="Review title (optional)"
        aria-label="Review title"
        className="h-11 w-full border border-line bg-ivory px-3 text-sm focus:border-obsidian focus:outline-none"
      />
      <textarea
        name="body"
        required
        minLength={10}
        placeholder="Share your thoughts on fit, fabric and finish…"
        aria-label="Review body"
        rows={4}
        className="w-full border border-line bg-ivory p-3 text-sm focus:border-obsidian focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
      {state && (
        <p role="status" className={cn("text-sm", state.ok ? "text-success" : "text-danger")}>
          {state.message}
        </p>
      )}
    </form>
  );
}