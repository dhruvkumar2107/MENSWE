"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { readCartToken, getCartLines, clearCart } from "@/lib/cart";
import { computeTotals, validateCoupon, type CouponLike, type CouponResult } from "@/lib/pricing";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { reserveStock, releaseStock } from "@/lib/inventory";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { trackEvent } from "@/lib/analytics";
import { getSettings, numSetting } from "@/lib/settings";
import { randomToken } from "@/lib/utils";

export type TotalsView = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  codFee: number;
  total: number;
  count: number;
  freeShippingApplied: boolean;
};

export type CouponView = CouponResult & { code?: string };

function orderNumber(): string {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `MH-${y}${m}${day}-${randomToken(4).toUpperCase()}`;
}

export async function getCheckoutTotals(couponCode?: string): Promise<{
  linesCount: number;
  totals: TotalsView;
  coupon: CouponView | null;
  error: string | null;
}> {
  const token = await readCartToken();
  const lines = await getCartLines(token);
  if (lines.length === 0) {
    return { linesCount: 0, totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, codFee: 0, total: 0, count: 0, freeShippingApplied: false }, coupon: null, error: null };
  }
  return applyCouponTotals(lines, couponCode);
}

async function applyCouponTotals(
  lines: Awaited<ReturnType<typeof getCartLines>>,
  couponCode?: string,
): Promise<{ linesCount: number; totals: TotalsView; coupon: CouponView | null; error: string | null }> {
  const settings = await getSettings();
  const session = await getSession();
  const items = lines.map((l) => ({
    variantId: l.variantId,
    productId: l.productId,
    categoryId: l.categoryId,
    unitPrice: l.unitPrice,
    quantity: l.quantity,
    taxRate: l.taxRate,
  }));

  let coupon: CouponLike | null = null;
  let couponResult: CouponResult | null = null;
  if (couponCode?.trim()) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    const userRedemptions = session
      ? await prisma.couponRedemption.count({ where: { userId: session.userId } })
      : 0;
    const priorOrders = await prisma.order.count({ where: { email: session?.email ?? undefined } });
    couponResult = coupon
      ? validateCoupon(coupon, {
          subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
          items,
          isFirstOrder: priorOrders === 0,
          userRedemptions,
        })
      : { valid: false, discount: 0, freeShipping: false, message: "Invalid coupon code" };
  }

  const totals = computeTotals({ items, coupon: couponResult ?? undefined, shipping: { freeThreshold: numSetting(settings, "shipping.freeThreshold", 149900), standard: numSetting(settings, "shipping.standard", 9900), codFee: numSetting(settings, "shipping.codFee", 4900) } });
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  return {
    linesCount: lines.length,
    totals: { ...totals, count },
    coupon: couponResult ? { ...couponResult, code: coupon?.code } : null,
    error: couponResult && !couponResult.valid ? couponResult.message : null,
  };
}

export type PlaceOrderResult = {
  ok: boolean;
  message: string;
  orderId?: string;
  orderNumber?: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  amount?: number;
};

export async function placeOrderAction(_prev: PlaceOrderResult | undefined, formData: FormData): Promise<PlaceOrderResult> {
  const token = await readCartToken();
  const lines = await getCartLines(token);
  if (!token || lines.length === 0) return { ok: false, message: "Your bag is empty" };

  const raw: Record<string, FormDataEntryValue> = {};
  for (const key of ["email", "fullName", "phone", "line1", "line2", "city", "state", "pincode", "type", "note", "paymentMethod", "couponCode", "saveAddress"]) {
    raw[key] = formData.get(key) ?? "";
  }
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details" };
  }
  const input = parsed.data as CheckoutInput & { couponCode?: string; saveAddress?: string };

  const session = await getSession();
  if (input.paymentMethod === "RAZORPAY" && !razorpayConfigured()) {
    return { ok: false, message: "Online payments are not configured yet — please choose Cash on Delivery to place your order." };
  }

  const priorOrders = await prisma.order.count({ where: { email: input.email } });
  const userRedemptions = session ? await prisma.couponRedemption.count({ where: { userId: session.userId } }) : 0;

  let coupon: CouponLike | null = null;
  let couponResult: CouponResult | null = null;
  if (input.couponCode?.trim()) {
    coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.trim().toUpperCase() } });
    couponResult = coupon ? validateCoupon(coupon, {
      subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      items: lines.map((l) => ({ variantId: l.variantId, productId: l.productId, categoryId: l.categoryId, unitPrice: l.unitPrice, quantity: l.quantity, taxRate: l.taxRate })),
      isFirstOrder: priorOrders === 0,
      userRedemptions,
    }) : null;
    if (couponResult && !couponResult.valid) {
      return { ok: false, message: couponResult.message };
    }
  }

  const settings = await getSettings();
  const totals = computeTotals({
    items: lines.map((l) => ({ variantId: l.variantId, productId: l.productId, categoryId: l.categoryId, unitPrice: l.unitPrice, quantity: l.quantity, taxRate: l.taxRate })),
    coupon: couponResult ?? undefined,
    shipping: { freeThreshold: numSetting(settings, "shipping.freeThreshold", 149900), standard: numSetting(settings, "shipping.standard", 9900), codFee: numSetting(settings, "shipping.codFee", 4900) },
    paymentMethod: input.paymentMethod,
  });
  if (totals.total <= 0) return { ok: false, message: "Order total is invalid" };

  const num = orderNumber();

  // 1) Reserve stock atomically
  try {
    await reserveStock(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), num, session?.userId ?? null);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not reserve stock" };
  }

  // 2) Create Razorpay order first (before the DB order) so a crash leaves no orphan
  let rzOrder = null;
  if (input.paymentMethod === "RAZORPAY" && razorpayConfigured()) {
    try {
      rzOrder = await createRazorpayOrder({ amount: totals.total, receipt: num, notes: { orderNumber: num, email: input.email } });
    } catch {
      await releaseStock(num, session?.userId ?? null);
      return { ok: false, message: "Payment gateway is temporarily unavailable. Please try again." };
    }
  }

  // 3) Persist the order
  const addressJson = JSON.stringify({
    fullName: input.fullName,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 || "",
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    country: "IN",
  });

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: num,
          userId: session?.userId ?? null,
          email: input.email,
          phone: input.phone,
          customerName: input.fullName,
          status: "CONFIRMED",
          paymentStatus: input.paymentMethod === "COD" ? "COD_PENDING" : "PENDING",
          fulfillmentStatus: "UNFULFILLED",
          paymentMethod: input.paymentMethod,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          shipping: totals.shipping,
          total: totals.total,
          couponCode: coupon?.code ?? null,
          itemsCount: lines.reduce((s, l) => s + l.quantity, 0),
          shippingAddress: addressJson,
          deliveryPincode: input.pincode,
          customerNote: input.note || null,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              sku: `${l.name} ${l.color} ${l.size}`.slice(0, 60),
              color: l.color,
              size: l.size,
              imageUrl: l.imageUrl,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              taxRate: l.taxRate,
              lineTotal: l.unitPrice * l.quantity,
            })),
          },
          history: {
            create: {
              status: "CONFIRMED",
              note: "Order placed",
              createdById: session?.userId ?? null,
            },
          },
        },
        include: { items: true },
      });

      if (coupon && couponResult && couponResult.valid) {
        await tx.couponRedemption.create({
          data: { couponId: coupon.id, userId: session?.userId ?? null, orderId: created.id, amount: totals.discount },
        });
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }

      if (input.paymentMethod === "COD") {
        await tx.payment.create({
          data: { orderId: created.id, provider: "COD", amount: totals.total, status: "CREATED" },
        });
      } else if (rzOrder && rzOrder.id) {
        await tx.payment.create({
          data: { orderId: created.id, provider: "RAZORPAY", providerOrderId: rzOrder.id, amount: totals.total, status: "CREATED" },
        });
      }

      // Link any logged-in cart, save address for reuse
      if (session) {
        await tx.cart.updateMany({ where: { sessionToken: token }, data: { userId: session.userId, status: "CONVERTED" } });
        if (input.saveAddress === "on") {
          await tx.address.create({
            data: {
              userId: session.userId,
              fullName: input.fullName,
              phone: input.phone,
              line1: input.line1,
              line2: input.line2 || undefined,
              city: input.city,
              state: input.state,
              pincode: input.pincode,
              type: input.type,
            },
          });
        }
      } else {
        await tx.cart.updateMany({ where: { sessionToken: token }, data: { status: "CONVERTED" } });
      }

      return created;
    });
  } catch (error) {
    await releaseStock(num, session?.userId ?? null);
    return { ok: false, message: error instanceof Error ? error.message : "Could not place your order. Please try again." };
  }

  await trackEvent({ type: "PURCHASE", sessionId: token, userId: session?.userId ?? null, metadata: { orderNumber: num, totalPaise: totals.total } });
  await clearCart(token);
  revalidatePath("/cart");
  revalidatePath("/account/orders");

  return {
    ok: true,
    message: "Order placed",
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: input.paymentMethod,
    ...(rzOrder ? { razorpayOrderId: rzOrder.id as string, razorpayKeyId: process.env.RAZORPAY_KEY_ID as string, amount: totals.total } : {}),
  };
}

export async function redirectAfterOrder(result: PlaceOrderResult) {
  if (!result.ok) redirect("/checkout");
  redirect(`/order/${result.orderNumber}`);
}