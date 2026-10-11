"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";

export type ReviewResult = { ok: boolean; message: string };

export async function submitReviewAction(
  _prev: ReviewResult | undefined,
  formData: FormData,
): Promise<ReviewResult> {
  const user = await requireUser("/account/login?next=/account");
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? "",
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your review" };
  }

  const existing = await prisma.review.findFirst({
    where: { productId: parsed.data.productId, userId: user.id },
  });
  if (existing) return { ok: false, message: "You have already reviewed this product" };

  const delivered = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: "DELIVERED",
      items: { some: { productId: parsed.data.productId } },
    },
  });

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId: user.id,
      orderId: delivered?.id ?? null,
      authorName: user.name,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      isVerifiedPurchase: !!delivered,
      status: "PENDING",
    },
  });

  revalidatePath(`/product/${formData.get("productSlug")}`);
  return { ok: true, message: "Thank you! Your review is awaiting moderation." };
}