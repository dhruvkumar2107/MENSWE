import { taxComponent } from "@/lib/money";

export type PricingLine = {
  variantId: string;
  productId: string;
  categoryId: string;
  unitPrice: number; // paise, effective price
  quantity: number;
  taxRate: number; // basis points
};

export type CouponLike = {
  id: string;
  code: string;
  type: string; // PERCENT | FIXED | FREE_SHIPPING
  value: number;
  minCartValue: number;
  maxDiscount: number | null;
  scope: string; // ALL | CATEGORY | PRODUCT
  categoryId: string | null;
  productId: string | null;
  firstOrderOnly: boolean;
  perCustomerLimit: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type CouponContext = {
  subtotal: number;
  items: PricingLine[];
  isFirstOrder: boolean;
  userRedemptions: number;
  now?: Date;
};

export type CouponResult =
  | { valid: true; discount: number; freeShipping: boolean; message: string }
  | { valid: false; discount: 0; freeShipping: false; message: string };

export function eligibleSubtotal(coupon: CouponLike, items: PricingLine[]): number {
  if (coupon.scope === "CATEGORY" && coupon.categoryId) {
    return items
      .filter((i) => i.categoryId === coupon.categoryId)
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }
  if (coupon.scope === "PRODUCT" && coupon.productId) {
    return items
      .filter((i) => i.productId === coupon.productId)
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function validateCoupon(coupon: CouponLike | null, ctx: CouponContext): CouponResult {
  const now = ctx.now ?? new Date();
  if (!coupon || !coupon.isActive) {
    return { valid: false, discount: 0, freeShipping: false, message: "Invalid coupon code" };
  }
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, discount: 0, freeShipping: false, message: "This coupon is not active yet" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { valid: false, discount: 0, freeShipping: false, message: "This coupon has expired" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, freeShipping: false, message: "This coupon has reached its usage limit" };
  }
  if (coupon.perCustomerLimit > 0 && ctx.userRedemptions >= coupon.perCustomerLimit) {
    return { valid: false, discount: 0, freeShipping: false, message: "You have already used this coupon" };
  }
  if (coupon.firstOrderOnly && !ctx.isFirstOrder) {
    return { valid: false, discount: 0, freeShipping: false, message: "This coupon is valid on your first order only" };
  }
  if (ctx.subtotal < coupon.minCartValue) {
    return { valid: false, discount: 0, freeShipping: false, message: "Minimum order value not met" };
  }

  const base = eligibleSubtotal(coupon, ctx.items);
  if (base <= 0) {
    return { valid: false, discount: 0, freeShipping: false, message: "This coupon does not apply to your bag" };
  }

  if (coupon.type === "FREE_SHIPPING") {
    return { valid: true, discount: 0, freeShipping: true, message: "Free shipping applied" };
  }

  let discount = 0;
  if (coupon.type === "PERCENT") {
    discount = Math.round((base * coupon.value) / 10000);
  } else if (coupon.type === "FIXED") {
    discount = Math.min(coupon.value, base);
  }
  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, ctx.subtotal);
  if (discount <= 0) {
    return { valid: false, discount: 0, freeShipping: false, message: "This coupon does not apply to your bag" };
  }
  return { valid: true, discount, freeShipping: false, message: `Coupon ${coupon.code} applied` };
}

export type ShippingConfig = {
  freeThreshold: number;
  standard: number;
  codFee: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  codFee: number;
  total: number;
  freeShippingApplied: boolean;
};

export function computeTotals(params: {
  items: PricingLine[];
  coupon?: CouponResult;
  shipping: ShippingConfig;
  paymentMethod?: string;
}): Totals {
  const { items, shipping: cfg } = params;
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const coupon = params.coupon && params.coupon.valid ? params.coupon : undefined;
  const discount = coupon?.discount ?? 0;

  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;

  let tax = 0;
  for (const line of items) {
    const lineTotal = line.unitPrice * line.quantity;
    const lineNet = Math.round(lineTotal * discountRatio);
    tax += taxComponent(lineNet, line.taxRate);
  }

  const netAfterDiscount = subtotal - discount;
  const freeShipping =
    !!coupon?.freeShipping || netAfterDiscount >= cfg.freeThreshold;
  const shipping = freeShipping || items.length === 0 ? 0 : cfg.standard;

  const codFee = params.paymentMethod === "COD" && items.length > 0 ? cfg.codFee : 0;
  const total = Math.max(0, netAfterDiscount + shipping + codFee);

  return {
    subtotal,
    discount,
    tax,
    shipping,
    codFee,
    total,
    freeShippingApplied: freeShipping,
  };
}
