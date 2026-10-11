import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Back Office | MAISON HOMME", robots: { index: false } };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="font-display text-2xl tracking-[0.28em] text-ivory">
            MAISON HOMME
          </Link>
          <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-gold">Back Office</p>
        </div>
        <div className="border border-ivory/15 bg-charcoal/40 p-7">
          <AdminLoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-ivory/40">
          Authorised staff only. All access is logged.
        </p>
      </div>
    </div>
  );
}