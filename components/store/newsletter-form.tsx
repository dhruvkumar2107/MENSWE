"use client";

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/lib/actions/newsletter";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState<NewsletterState | undefined, FormData>(
    subscribeAction,
    undefined,
  );

  return (
    <form action={action} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Your email address"
          className={
            compact
              ? "h-11 flex-1 border-b border-ivory/40 bg-transparent px-1 text-sm text-ivory placeholder:text-ivory/50 focus:border-gold focus:outline-none"
              : "h-12 flex-1 border border-line bg-white px-4 text-sm text-obsidian placeholder:text-graphite/60 focus:border-obsidian focus:outline-none"
          }
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 whitespace-nowrap bg-gold px-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-obsidian transition-colors hover:bg-gold-deep hover:text-ivory disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state?.message && (
        <p
          role="status"
          className={`mt-3 text-xs ${state.ok ? "text-success" : "text-danger"} ${compact ? "text-ivory/80" : ""}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
