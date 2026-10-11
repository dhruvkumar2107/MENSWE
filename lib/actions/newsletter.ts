"use server";

import { prisma } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation";

export type NewsletterState = { ok: boolean; message: string };

export async function subscribeAction(
  _prev: NewsletterState | undefined,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? "footer",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  }
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: { isActive: true, consent: true },
    create: {
      email: parsed.data.email.toLowerCase(),
      source: parsed.data.source ?? "footer",
      isActive: true,
      consent: true,
    },
  });
  return { ok: true, message: "You're on the list. Welcome to the house." };
}
