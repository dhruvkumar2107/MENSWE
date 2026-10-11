"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { addressSchema, returnRequestSchema } from "@/lib/validation";
import { releaseStock } from "@/lib/inventory";
import { logAudit } from "@/lib/audit";

export type FormState = { ok?: boolean; error?: string; message?: string };

export async function updateProfileAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const marketingConsent = formData.get("marketingConsent") === "on";
  if (name.length < 2) return { error: "Please enter your name" };
  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null, marketingConsent },
  });
  revalidatePath("/account/profile");
  return { ok: true, message: "Profile updated" };
}

export async function changePasswordAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const sessionUser = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  const record = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    return { error: "Current password is incorrect" };
  }
  await prisma.user.update({ where: { id: sessionUser.id }, data: { passwordHash: await hashPassword(next) } });
  await logAudit({ userId: sessionUser.id, action: "PASSWORD_CHANGE", entity: "User", entityId: sessionUser.id });
  return { ok: true, message: "Password changed" };
}

export async function saveAddressAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const sessionUser = await requireUser();
  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    type: formData.get("type") ?? "HOME",
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the address" };
  const id = formData.get("id");
  const data = {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    city: parsed.data.city,
    state: parsed.data.state,
    pincode: parsed.data.pincode,
    type: parsed.data.type,
    isDefault: parsed.data.isDefault ?? false,
  };
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: sessionUser.id }, data: { isDefault: false } });
  }
  if (typeof id === "string" && id) {
    await prisma.address.updateMany({ where: { id, userId: sessionUser.id }, data });
  } else {
    await prisma.address.create({ data: { ...data, userId: sessionUser.id } });
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved" };
}

export async function deleteAddressAction(id: string): Promise<void> {
  const sessionUser = await requireUser();
  await prisma.address.deleteMany({ where: { id, userId: sessionUser.id } });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(id: string): Promise<void> {
  const sessionUser = await requireUser();
  await prisma.address.updateMany({ where: { userId: sessionUser.id }, data: { isDefault: false } });
  await prisma.address.updateMany({ where: { id, userId: sessionUser.id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
}

export async function submitReturnAction(_prev: FormState | undefined, formData: FormData): Promise<FormState> {
  const sessionUser = await requireUser();
  const parsed = returnRequestSchema.safeParse({
    orderId: formData.get("orderId"),
    orderItemId: formData.get("orderItemId") ?? undefined,
    reason: formData.get("reason"),
    comment: formData.get("comment") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please complete the form" };

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, userId: sessionUser.id, status: "DELIVERED" },
  });
  if (!order) return { error: "Only delivered orders can be returned" };

  await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      orderItemId: parsed.data.orderItemId || null,
      userId: sessionUser.id,
      reason: parsed.data.reason,
      comment: parsed.data.comment || null,
      status: "REQUESTED",
    },
  });
  revalidatePath("/account/returns");
  return { ok: true, message: "Return request submitted. Our team will review it shortly." };
}

export async function cancelOrderAction(orderNumber: string): Promise<void> {
  const sessionUser = await requireUser();
  const order = await prisma.order.findFirst({ where: { orderNumber, userId: sessionUser.id } });
  if (!order) return;
  if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) {
    return;
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", fulfillmentStatus: "CANCELLED", cancelledAt: new Date() },
  });
  await prisma.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED", note: "Cancelled by customer" } });
  await releaseStock(order.orderNumber, sessionUser.id);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${order.orderNumber}`);
}