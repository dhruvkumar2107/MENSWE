"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { inputClass } from "@/components/ui";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AuthState | undefined, FormData>(loginAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value="/admin" />
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-ivory/60">Staff email</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-ivory/60">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-12 bg-gold text-xs font-semibold uppercase tracking-[0.2em] text-obsidian hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Enter back office"}
      </button>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}