"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type WishlistResult = { ok: boolean; added?: boolean; message: string; requiresAuth?: boolean };

export async function toggleWishlistAction(productId: string): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, message: "Please sign in to save items", requiresAuth: true };
  }
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.userId, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { ok: true, added: false, message: "Removed from wishlist" };
  }
  await prisma.wishlistItem.create({ data: { userId: session.userId, productId } });
  revalidatePath("/wishlist");
  return { ok: true, added: true, message: "Saved to wishlist" };
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const items = await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } });
  return items.map((i) => i.productId);
}
