import { prisma } from "@/lib/db";

export type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activeStatuses = { notIn: ["CANCELLED", "RETURNED"] };

  const [
    revenueAll,
    revenueMonth,
    revenueToday,
    orderCount,
    monthOrderCount,
    pendingOrders,
    customerCount,
    newCustomers,
    pendingReviews,
    pendingReturns,
    recentOrders,
    topProductGroups,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: activeStatuses } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: activeStatuses, placedAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: activeStatuses, placedAt: { gte: startOfToday } } }),
    prisma.order.count(),
    prisma.order.count({ where: { placedAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.returnRequest.count({ where: { status: "REQUESTED" } }),
    prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, customerName: true, total: true, status: true, paymentStatus: true, placedAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
  ]);

  const lowStockVariants = await prisma.productVariant.findMany({
    where: { isActive: true },
    select: { id: true, sku: true, color: true, size: true, stock: true, reserved: true, lowStockThreshold: true, product: { select: { name: true, slug: true } } },
  });
  const lowStock = lowStockVariants
    .map((v) => ({ ...v, available: v.stock - v.reserved }))
    .filter((v) => v.available <= v.lowStockThreshold)
    .sort((a, b) => a.available - b.available)
    .slice(0, 8);

  const revenueMonthValue = revenueMonth._sum.total ?? 0;

  return {
    revenueAll: revenueAll._sum.total ?? 0,
    revenueMonth: revenueMonthValue,
    revenueToday: revenueToday._sum.total ?? 0,
    orderCount,
    monthOrderCount,
    pendingOrders,
    customerCount,
    newCustomers,
    pendingReviews,
    pendingReturns,
    aov: monthOrderCount > 0 ? Math.round(revenueMonthValue / monthOrderCount) : 0,
    recentOrders,
    topProducts: topProductGroups.map((g) => ({
      productId: g.productId,
      name: g.name,
      quantity: g._sum.quantity ?? 0,
      revenue: g._sum.lineTotal ?? 0,
    })),
    lowStock,
  };
}

export async function getSalesByDay(days = 14) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const orders = await prisma.order.findMany({
    where: { placedAt: { gte: since }, status: { notIn: ["CANCELLED"] } },
    select: { placedAt: true, total: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = o.placedAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }
  return Array.from(buckets.entries()).map(([date, total]) => ({ date, total }));
}

export async function getReportRows() {
  const orders = await prisma.order.findMany({
    orderBy: { placedAt: "desc" },
    take: 500,
    select: {
      orderNumber: true, customerName: true, email: true, status: true, paymentStatus: true,
      paymentMethod: true, itemsCount: true, subtotal: true, discount: true, shipping: true, total: true, placedAt: true,
    },
  });
  return orders;
}
