import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Sign In | MAISON HOMME" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  return (
    <div className="mx-auto max-w-md">
      <SectionHeading eyebrow="Members" title="Sign In" align="center" />
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}