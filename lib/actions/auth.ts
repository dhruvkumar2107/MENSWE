"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { CART_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";
import { sendMail, welcomeEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type AuthState = { error?: string; ok?: boolean };

async function linkGuestCart(userId: string) {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return;
  await prisma.cart.updateMany({
    where: { sessionToken: token },
    data: { userId },
  });
}

async function startSession(user: { id: string; email: string; role: string; name: string }) {
  const token = await signSession({ userId: user.id, email: user.email, role: user.role, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function registerAction(_prev: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") ?? "",
    marketingConsent: formData.get("marketingConsent") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details" };
  }
  const email = parsed.data.email.toLowerCase();
  const limit = rateLimit(`register:${email}`, 5, 60_000);
  if (!limit.allowed) return { error: "Too many attempts. Please try again shortly." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash,
      role: "CUSTOMER",
      marketingConsent: parsed.data.marketingConsent ?? false,
    },
  });
  if (parsed.data.marketingConsent) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, source: "signup", isActive: true },
    });
  }
  await linkGuestCart(user.id);
  await startSession(user);
  const mail = welcomeEmail(user.name);
  await sendMail({ to: user.email, ...mail });
  await logAudit({ userId: user.id, action: "USER_REGISTER", entity: "User", entityId: user.id });
  redirect("/account");
}

export async function loginAction(_prev: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password" };
  const email = parsed.data.email.toLowerCase();
  const limit = rateLimit(`login:${email}`, 8, 60_000);
  if (!limit.allowed) return { error: "Too many attempts. Please try again shortly." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return { error: "Invalid email or password" };
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await linkGuestCart(user.id);
  await startSession(user);

  const next = (formData.get("next") as string) || "/account";
  redirect(next.startsWith("/") ? next : "/account");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
