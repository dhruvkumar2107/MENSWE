import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Create Account | MAISON HOMME" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  return (
    <div className="mx-auto max-w-md">
      <SectionHeading eyebrow="Join the House" title="Create Account" align="center" />
      <Suspense fallback={null}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}