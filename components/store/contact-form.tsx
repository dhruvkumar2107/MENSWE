"use client";

import { useActionState, useEffect, useRef } from "react";
import { contactAction, type ContactState } from "@/lib/actions/contact";
import { inputClass } from "@/components/ui";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ContactState | undefined, FormData>(contactAction, undefined);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 border border-line bg-white p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Name</span>
          <input name="name" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Email</span>
          <input name="email" type="email" required className={inputClass} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Phone (optional)</span>
        <input name="phone" type="tel" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Message</span>
        <textarea name="message" rows={5} required className={inputClass} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Sending…" : "Send message"}
        </button>
        {state?.ok && <span className="text-sm text-success">Thank you — we&apos;ll be in touch shortly.</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}