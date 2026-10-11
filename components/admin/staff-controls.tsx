"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction, toggleUserActiveAction } from "@/lib/actions/admin";
import { STAFF_ROLES, ROLES } from "@/lib/constants";

export function StaffRoleSelect({ userId, role, self }: { userId: string; role: string; self: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const options = [ROLES.CUSTOMER, ...STAFF_ROLES] as string[];

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={role}
        disabled={pending || self}
        onChange={(e) => {
          const next = e.target.value;
          start(async () => {
            await setUserRoleAction(userId, next);
            router.refresh();
          });
        }}
        className="h-9 border border-[#d9d2c6] bg-white px-2 text-xs disabled:opacity-50"
      >
        {options.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
      </select>
      {pending && <span className="text-xs text-[#6b655c]">…</span>}
    </div>
  );
}

export function ToggleActiveButton({ userId, isActive, self }: { userId: string; isActive: boolean; self: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (self) return null;
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await toggleUserActiveAction(userId); router.refresh(); })}
      className={`text-[10px] font-semibold uppercase tracking-[0.12em] underline ${isActive ? "text-red-600" : "text-emerald-700"} disabled:opacity-50`}
    >
      {isActive ? "Disable" : "Enable"}
    </button>
  );
}