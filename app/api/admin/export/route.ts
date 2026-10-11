import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await authorize("report:read");
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const type = request.nextUrl.searchParams.get("type") ?? "orders";
  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      select: {
        orderNumber: true, customerName: true, email: true, phone: true, status: true,
        paymentStatus: true, paymentMethod: true, itemsCount: true, subtotal: true,
        discount: true, shipping: true, total: true, couponCode: true, placedAt: true,
      },
    });
    rows = orders.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.customerName,
      email: o.email,
      phone: o.phone,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      items: o.itemsCount,
      subtotal: (o.subtotal / 100).toFixed(2),
      discount: (o.discount / 100).toFixed(2),
      shipping: (o.shipping / 100).toFixed(2),
      total: (o.total / 100).toFixed(2),
      coupon: o.couponCode ?? "",
      placedAt: o.placedAt.toISOString(),
    }));
    filename = "orders.csv";
  } else if (type === "products") {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } }, variants: { select: { stock: true, reserved: true } } },
    });
    rows = products.map((p) => ({
      name: p.name,
      sku: p.parentSku,
      category: p.category.name,
      price: (p.price / 100).toFixed(2),
      salePrice: p.salePrice ? (p.salePrice / 100).toFixed(2) : "",
      stock: p.variants.reduce((sum, v) => sum + v.stock - v.reserved, 0),
      published: p.isPublished ? "yes" : "no",
      newArrival: p.isNewArrival ? "yes" : "no",
      bestSeller: p.isBestSeller ? "yes" : "no",
    }));
    filename = "products.csv";
  } else {
    return new NextResponse("Unknown export type", { status: 400 });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}