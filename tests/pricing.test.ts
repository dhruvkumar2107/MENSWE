import assert from "node:assert/strict";
import test from "node:test";
import { validateCoupon, computeTotals, type CouponLike } from "../lib/pricing";

const baseItems = [
  { variantId: "v1", productId: "p1", categoryId: "c1", unitPrice: 100000, quantity: 1, taxRate: 500 },
  { variantId: "v2", productId: "p1", categoryId: "c1", unitPrice: 50000, quantity: 1, taxRate: 500 },
];

const couponPct: CouponLike = {
  id: "c1",
  code: "SAVE10",
  type: "PERCENT",
  value: 1000, // 10%
  minCartValue: 0,
  maxDiscount: null,
  scope: "ALL",
  categoryId: null,
  productId: null,
  firstOrderOnly: false,
  perCustomerLimit: 1,
  usageLimit: null,
  usedCount: 0,
  isActive: true,
  startsAt: null,
  endsAt: null,
};

test("PERCENT coupon applies 10% to eligible subtotal", () => {
  const subtotal = 150000;
  const res = validateCoupon(couponPct, {
    subtotal,
    items: baseItems,
    isFirstOrder: true,
    userRedemptions: 0,
  });
  assert.equal(res.valid, true);
  assert.equal(res.discount, 15000);
});

const couponFixed: CouponLike = {
  ...couponPct,
  type: "FIXED",
  value: 50000,
};

test("FIXED coupon caps at base subtotal", () => {
  const res = validateCoupon(couponFixed, {
    subtotal: 150000,
    items: baseItems,
    isFirstOrder: true,
    userRedemptions: 0,
  });
  assert.equal(res.valid, true);
  assert.equal(res.discount, 50000);
});

const couponFreeship: CouponLike = {
  ...couponPct,
  type: "FREE_SHIPPING",
  value: 0,
};

test("FREE_SHIPPING sets free shipping flag", () => {
  const res = validateCoupon(couponFreeship, {
    subtotal: 150000,
    items: baseItems,
    isFirstOrder: true,
    userRedemptions: 0,
  });
  assert.equal(res.valid, true);
  assert.equal(res.freeShipping, true);
  assert.equal(res.discount, 0);
});

test("computeTotals applies shipping threshold", () => {
  const under = computeTotals({
    items: [{ variantId: "v1", productId: "p1", categoryId: "c1", unitPrice: 100000, quantity: 1, taxRate: 500 }],
    shipping: { freeThreshold: 149900, standard: 9900, codFee: 4900 },
  });
  assert.equal(under.shipping, 9900);
  const over = computeTotals({
    items: [{ variantId: "v1", productId: "p1", categoryId: "c1", unitPrice: 150000, quantity: 1, taxRate: 500 }],
    shipping: { freeThreshold: 149900, standard: 9900, codFee: 4900 },
  });
  assert.equal(over.shipping, 0);
});