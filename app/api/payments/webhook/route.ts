import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { webhookConfigured, verifyWebhookSignature } from "@/lib/razorpay";
import { commitStock, releaseStock } from "@/lib/inventory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!webhookConfigured() || !verifyWebhookSignature(raw, signature)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    const payload = JSON.parse(raw);
    const event = payload?.event;
    const entity = payload?.payload?.payment?.entity;

    if (event === "payment.captured" && entity?.id) {
      await prisma.$transaction(async (tx) => {
        const payment = entity.order_id
          ? await tx.payment.findFirst({ where: { providerOrderId: entity.order_id } })
          : null;
        if (!payment) return;
        await tx.payment.update({
          where: { id: payment.id },
          data: { providerPaymentId: entity.id, status: "CAPTURED", method: entity.method ?? undefined },
        });
        const order = await tx.payment.findUnique({ where: { id: payment.id } }).order();
        if (order && order.paymentStatus !== "PAID") {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
          await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "PAID", note: "Webhook: payment captured" } });
          await commitStock(order.orderNumber);
        }
      });
    } else if (event === "payment.failed" && entity?.id) {
      await prisma.$transaction(async (tx) => {
        const payment = entity.order_id ? await tx.payment.findFirst({ where: { providerOrderId: entity.order_id } }) : null;
        if (!payment) return;
        await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
        const order = await tx.payment.findUnique({ where: { id: payment.id } }).order();
        if (order && order.paymentStatus === "PENDING") {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
          await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "FAILED", note: "Webhook: payment failed" } });
          await releaseStock(order.orderNumber);
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Webhook processing failed" }, { status: 500 });
  }
}