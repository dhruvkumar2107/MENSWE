import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { CART_COOKIE, cartCookieOptions } from "@/lib/session";
import { getSession } from "@/lib/auth";
import { randomToken } from "@/lib/utils";
import { computeTotals, validateCoupon, type PricingLine, type Totals, type CouponResult } from "@/lib/pricing";
import { getSettings, numSetting } from "@/lib/settings";

export async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

// Only call from a Server Action or Route Handler (sets a cookie).
export async function ensureCartToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const token = randomToken(32);
  store.set(CART_COOKIE, token, cartCookieOptions());
  return token;
}

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  color: string;
  size: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  taxRate: number;
  categoryId: string;
  imageUrl: string | null;
  available: number;
};

export async function getCart(token: string | null) {
  if (!token) return null;
  return prisma.cart.findFirst({
    where: { sessionToken: token, status: "ACTIVE" },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { orderBy: { position: "asc" } } },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getCartLines(token: string | null): Promise<CartLine[]> {
  const cart = await getCart(token);
  if (!cart) return [];
  return cart.items
    .filter((item) => item.variant && item.variant.isActive && item.variant.product.isPublished)
    .map((item) => {
      const p = item.variant.product;
      const unitPrice = item.variant.priceOverride ?? p.salePrice ?? p.price;
      const img =
        p.images.find((i) => i.color && i.color === item.variant.color)?.url ??
        p.images[0]?.url ??
        null;
      return {
        id: item.id,
        variantId: item.variantId,
        productId: p.id,
        slug: p.slug,
        name: p.name,
        color: item.variant.color,
        size: item.variant.size,
        unitPrice,
        originalPrice: p.price,
        quantity: item.quantity,
        taxRate: p.taxRate,
        categoryId: p.categoryId,
        imageUrl: img,
        available: Math.max(0, item.variant.stock - item.variant.reserved),
      };
    });
}

export async function getCartSummary(
  token: string | null,
  coupon?: CouponResult | null,
): Promise<{
  lines: CartLine[];
  totals: Totals;
  count: number;
}> {
  const lines = await getCartLines(token);
  const settings = await getSettings();
  const items: PricingLine[] = lines.map((l) => ({
    variantId: l.variantId,
    productId: l.productId,
    categoryId: l.categoryId,
    unitPrice: l.unitPrice,
    quantity: l.quantity,
    taxRate: l.taxRate,
  }));
  const totals = computeTotals({
    items,
    coupon: coupon ?? undefined,
    shipping: {
      freeThreshold: numSetting(settings, "shipping.freeThreshold", 149900),
      standard: numSetting(settings, "shipping.standard", 9900),
      codFee: numSetting(settings, "shipping.codFee", 4900),
    },
  });
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { lines, totals, count };
}

export async function addToCart(token: string, variantId: string, quantity: number): Promise<void> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.isActive || !variant.product.isPublished) {
    throw new Error("This product is unavailable");
  }
  const session = await getSession();

  const cart = await prisma.cart.upsert({
    where: { sessionToken: token },
    update: { userId: session?.userId ?? undefined },
    create: { sessionToken: token, userId: session?.userId ?? null },
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  const desired = (existing?.quantity ?? 0) + quantity;
  const available = Math.max(0, variant.stock - variant.reserved);
  if (available <= 0) throw new Error("This size is sold out");
  if (desired > available) {
    throw new Error(`Only ${available} left in this size`);
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: desired },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId, quantity: Math.min(quantity, available) },
    });
  }
}

export async function updateCartItem(token: string, itemId: string, quantity: number): Promise<void> {
  const cart = await getCart(token);
  if (!cart) throw new Error("Cart not found");
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found");
  const available = Math.max(0, item.variant.stock - item.variant.reserved);
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return;
  }
  if (quantity > available) throw new Error(`Only ${available} left in this size`);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

export async function removeCartItem(token: string, itemId: string): Promise<void> {
  const cart = await getCart(token);
  if (!cart) return;
  const item = cart.items.find((i) => i.id === itemId);
  if (item) await prisma.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(token: string): Promise<void> {
  const cart = await getCart(token);
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export async function cartCount(token: string | null): Promise<number> {
  const lines = await getCartLines(token);
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

type CouponTotalsResult = {
  lines: CartLine[];
  totals: Totals & { count: number };
  coupon: (CouponResult & { code?: string }) | null;
  error: string | null;
  sessionUserId: string | null;
};

/**
 * Shared by the cart and checkout pages: fetch the bag, resolve any coupon and
 * compute order totals. Re-validated inside placeOrderAction before committing.
 */
export async function getCartSummaryWithCoupon(
  couponCode?: string,
): Promise<CouponTotalsResult> {
  const token = await readCartToken();
  const lines = await getCartLines(token);
  const session = await getSession();
  const settings = await getSettings();

  const items: PricingLine[] = lines.map((l) => ({
    variantId: l.variantId,
    productId: l.productId,
    categoryId: l.categoryId,
    unitPrice: l.unitPrice,
    quantity: l.quantity,
    taxRate: l.taxRate,
  }));

  let coupon: CouponResult | null = null;
  if (couponCode?.trim()) {
    const found = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    const userRedemptions = session
      ? await prisma.couponRedemption.count({ where: { userId: session.userId } })
      : 0;
    const priorOrders = session
      ? await prisma.order.count({ where: { email: session.email } })
      : 0;
    coupon = found
      ? validateCoupon(found, {
          subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
          items,
          isFirstOrder: priorOrders === 0,
          userRedemptions,
        })
      : { valid: false, discount: 0, freeShipping: false, message: "Invalid coupon code" };
  }

  const totals = computeTotals({
    items,
    coupon: coupon ?? undefined,
    shipping: {
      freeThreshold: numSetting(settings, "shipping.freeThreshold", 149900),
      standard: numSetting(settings, "shipping.standard", 9900),
      codFee: numSetting(settings, "shipping.codFee", 4900),
    },
  });
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return {
    lines,
    totals: { ...totals, count },
    coupon: coupon ? { ...coupon, code: couponCode?.trim().toUpperCase() } : null,
    error: coupon && !coupon.valid ? coupon.message : null,
    sessionUserId: session?.userId ?? null,
  };
}
