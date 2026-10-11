import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number").optional().or(z.literal("")),
  marketingConsent: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const addressSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  line1: z.string().min(3).max(160),
  line2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutSchema = addressSchema.extend({
  email: z.string().email("Enter a valid email"),
  note: z.string().max(300).optional().or(z.literal("")),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).default("RAZORPAY"),
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email"),
  source: z.string().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(10, "Please write at least 10 characters").max(2000),
});

export const returnRequestSchema = z.object({
  orderId: z.string().min(1),
  orderItemId: z.string().optional(),
  reason: z.string().min(3).max(120),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export const productFormSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180),
  parentSku: z.string().min(2).max(60),
  description: z.string().default(""),
  shortDescription: z.string().max(300).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Select a category"),
  brandId: z.string().optional().or(z.literal("")),
  fabric: z.string().max(120).optional().or(z.literal("")),
  careInstructions: z.string().max(300).optional().or(z.literal("")),
  fit: z.string().max(60).optional().or(z.literal("")),
  occasion: z.string().max(60).optional().or(z.literal("")),
  pattern: z.string().max(60).optional().or(z.literal("")),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).optional(),
  costPrice: z.coerce.number().int().min(0).optional(),
  taxRate: z.coerce.number().int().min(0).max(5000).default(500),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  tags: z.string().optional().or(z.literal("")),
  isPublished: z.coerce.boolean().default(false),
  isNewArrival: z.coerce.boolean().default(false),
  isBestSeller: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false),
  isLimitedEdition: z.coerce.boolean().default(false),
  seoTitle: z.string().max(160).optional().or(z.literal("")),
  seoDescription: z.string().max(300).optional().or(z.literal("")),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(30).transform((s) => s.toUpperCase()),
  description: z.string().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.coerce.number().int().min(0),
  minCartValue: z.coerce.number().int().min(0).default(0),
  maxDiscount: z.coerce.number().int().min(0).optional(),
  scope: z.enum(["ALL", "CATEGORY", "PRODUCT"]).default("ALL"),
  categoryId: z.string().optional().or(z.literal("")),
  productId: z.string().optional().or(z.literal("")),
  firstOrderOnly: z.coerce.boolean().default(false),
  perCustomerLimit: z.coerce.number().int().min(0).default(1),
  usageLimit: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().default(true),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
