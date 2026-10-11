"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction, type FormState } from "@/lib/actions/account";
import { inputClass } from "@/components/ui";

export function ProfileForm({ name, phone, marketingConsent }: { name: string; phone: string; marketingConsent: boolean }) {
  const [state, action, pending] = useActionState<FormState | undefined, FormData>(updateProfileAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 border border-line bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Personal details</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Full name</span>
        <input name="name" required defaultValue={name} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Phone</span>
        <input name="phone" type="tel" defaultValue={phone} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm text-graphite">
        <input type="checkbox" name="marketingConsent" defaultChecked={marketingConsent} className="h-4 w-4 accent-gold" />
        Email me about new collections and private sales
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 bg-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] text-ivory hover:bg-charcoal disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state?.message && <span className="text-sm text-success">{state.message}</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState | undefined, FormData>(changePasswordAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 border border-line bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em]">Change password</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">Current password</span>
        <input name="currentPassword" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.16em] text-graphite">New password</span>
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-11 border border-obsidian px-6 text-xs font-medium uppercase tracking-[0.2em] hover:bg-obsidian hover:text-ivory disabled:opacity-60">
          {pending ? "Updating…" : "Update password"}
        </button>
        {state?.message && <span className="text-sm text-success">{state.message}</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}