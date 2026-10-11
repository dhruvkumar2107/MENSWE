import crypto from "node:crypto";

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function webhookConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
}

let RazorpayCtor: typeof import("razorpay") | null = null;

async function getSdk() {
  if (!RazorpayCtor) {
    const mod = await import("razorpay");
    RazorpayCtor = (mod as unknown as { default: typeof import("razorpay") }).default ?? (mod as unknown as typeof import("razorpay"));
  }
  return RazorpayCtor;
}

export async function getRazorpay() {
  if (!razorpayConfigured()) return null;
  const Ctor = await getSdk();
  return new Ctor({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
}

export async function createRazorpayOrder(params: {
  amount: number; // paise
  receipt: string;
  notes?: Record<string, string>;
}) {
  const client = await getRazorpay();
  if (!client) throw new Error("Razorpay is not configured");
  return client.orders.create({
    amount: params.amount,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

// Payment signature verification: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, params.signature);
}

// Webhook signature verification: HMAC_SHA256(rawBody, webhook_secret)
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
