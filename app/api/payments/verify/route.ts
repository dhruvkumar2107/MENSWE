import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { commitStock } from "@/lib/inventory";
import { trackEvent } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, paymentId, signature } = body as {
      orderNumber?: string;
      paymentId?: string;
      signature?: string;
    };
    if (!orderNumber || !paymentId || !signature) {
      return NextResponse.json({ ok: false, error: "Missing parameters" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { order: { orderNumber }, providerOrderId: { not: null } },
      include: { order: true },
    });
    if (!payment || !payment.providerOrderId) {
      return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    }

    const valid = verifyPaymentSignature({
      orderId: payment.providerOrderId,
      paymentId,
      signature,
    });
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }
    if (payment.order.paymentStatus === "PAID") {
      return NextResponse.json({ ok: true, message: "Already confirmed" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { providerPaymentId: paymentId, providerSignature: signature, status: "CAPTURED" },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "PAID" },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: payment.orderId, status: "PAID", note: "Payment confirmed via Razorpay" },
      });
    });
    await commitStock(payment.order.orderNumber);
    await trackEvent({ type: "PURCHASE", sessionId: null, metadata: { orderNumber: payment.order.orderNumber, source: "verify" } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Verification failed" }, { status: 500 });
  }
}