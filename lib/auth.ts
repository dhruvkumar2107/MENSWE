import * as bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { STAFF_ROLES, hasPermission, type Permission, type Role } from "@/lib/constants";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
});

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  marketingConsent: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      marketingConsent: true,
    },
  });
  if (!user || !user.isActive) return null;
  return user;
});

export function isStaff(role: string | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role as Role);
}

export async function requireUser(redirectTo = "/account/login"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin(permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    redirect(`/admin/login?next=/admin`);
  }
  if (permission && !hasPermission(user.role, permission)) {
    redirect(`/admin?denied=${encodeURIComponent(permission)}`);
  }
  return user;
}

// For route handlers / server actions where we want a boolean instead of a redirect.
export async function authorize(permission: Permission): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return null;
  if (!hasPermission(user.role, permission)) return null;
  return user;
}
