"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, registerAction, type AuthState } from "@/lib/actions/auth";
import { inputClass } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {mode === "register" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Full name</span>
          <input name="name" required autoComplete="name" className={inputClass} />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Email</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      {mode === "register" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Phone (optional)</span>
          <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={inputClass}
        />
      </label>
      {mode === "register" && (
        <label className="flex items-center gap-2 text-sm text-graphite">
          <input type="checkbox" name="marketingConsent" className="h-4 w-4 accent-gold" />
          Email me about new collections and private sales
        </label>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 bg-obsidian text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60"
      >
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <p className="text-center text-xs text-graphite">
        {mode === "login" ? (
          <>
            New to MAISON HOMME?{" "}
            <Link href="/account/register" className="text-obsidian underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/account/login" className="text-obsidian underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}