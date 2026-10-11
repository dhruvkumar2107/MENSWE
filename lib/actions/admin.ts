"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth";
import { adjustStock, releaseStock, commitStock } from "@/lib/inventory";
import { setSettings } from "@/lib/settings";
import { toPaise } from "@/lib/money";
import { logAudit } from "@/lib/audit";

export type AdminState = { ok?: boolean; error?: string; message?: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v || null;
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}
function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function denied(permission: Parameters<typeof authorize>[0]) {
  const user = await authorize(permission);
  return user;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function updateOrderStatusAction(orderId: string, status: string, note?: string): Promise<AdminState> {
  const user = await denied("order:write");
  if (!user) return { error: "Not authorised" };
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found" };

  const fulfillmentMap: Record<string, string> = {
    PENDING: "UNFULFILLED",
    CONFIRMED: "PROCESSING",
    PROCESSING: "PROCESSING",
    PACKED: "PACKED",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    RETURNED: "RETURNED",
  };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      fulfillmentStatus: fulfillmentMap[status] ?? order.fulfillmentStatus,
      ...(status === "SHIPPED" ? { shippedAt: new Date() } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      ...(status === "CANCELLED" ? { paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : "FAILED" } : {}),
    },
  });
  await prisma.orderStatusHistory.create({ data: { orderId, status, note: note || null, createdById: user.id } });

  // restock on cancellation, commit on delivery
  if (status === "CANCELLED") await releaseStock(order.orderNumber, user.id);
  if (status === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
    await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } });
  }

  await logAudit({ userId: user.id, action: "ORDER_STATUS", entity: "Order", entityId: orderId, details: status });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { ok: true, message: `Order marked ${status}` };
}

export async function updateOrderTrackingAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("order:write");
  if (!user) return { error: "Not authorised" };
  const orderId = str(fd, "orderId");
  if (!orderId) return { error: "Missing order" };
  await prisma.order.update({
    where: { id: orderId },
    data: {
      courier: optStr(fd, "courier"),
      trackingNumber: optStr(fd, "trackingNumber"),
      internalNote: optStr(fd, "internalNote"),
      expectedDelivery: num(fd, "expectedDelivery") ? new Date(str(fd, "expectedDelivery")) : undefined,
    },
  });
  await logAudit({ userId: user.id, action: "ORDER_TRACKING", entity: "Order", entityId: orderId });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Tracking details saved" };
}

export async function commitOrderStockAction(orderId: string): Promise<void> {
  const user = await denied("order:write");
  if (!user) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  await commitStock(order.orderNumber, user.id);
  revalidatePath(`/admin/orders/${orderId}`);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function updateProductAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("product:write");
  if (!user) return { error: "Not authorised" };
  const id = str(fd, "id");
  if (!id) return { error: "Missing product" };
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const price = num(fd, "price");
  if (price == null) return { error: "Price is required" };

  const slug = str(fd, "slug") || slugify(name);
  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description: str(fd, "description"),
        shortDescription: optStr(fd, "shortDescription"),
        categoryId: str(fd, "categoryId"),
        brandId: optStr(fd, "brandId"),
        fabric: optStr(fd, "fabric"),
        fit: optStr(fd, "fit"),
        occasion: optStr(fd, "occasion"),
        pattern: optStr(fd, "pattern"),
        careInstructions: optStr(fd, "careInstructions"),
        price: toPaise(price),
        salePrice: num(fd, "salePrice") != null ? toPaise(num(fd, "salePrice") as number) : null,
        costPrice: num(fd, "costPrice") != null ? toPaise(num(fd, "costPrice") as number) : null,
        lowStockThreshold: num(fd, "lowStockThreshold") ?? 5,
        tags: str(fd, "tags"),
        isPublished: bool(fd, "isPublished"),
        isNewArrival: bool(fd, "isNewArrival"),
        isBestSeller: bool(fd, "isBestSeller"),
        isFeatured: bool(fd, "isFeatured"),
        isLimitedEdition: bool(fd, "isLimitedEdition"),
        seoTitle: optStr(fd, "seoTitle"),
        seoDescription: optStr(fd, "seoDescription"),
        publishedAt: bool(fd, "isPublished") ? new Date() : null,
      },
    });
  } catch {
    return { error: "Could not save — the slug or SKU may already exist." };
  }
  await logAudit({ userId: user.id, action: "PRODUCT_UPDATE", entity: "Product", entityId: id });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/product/${slug}`);
  return { ok: true, message: "Product saved" };
}

export async function toggleProductPublishedAction(id: string): Promise<void> {
  const user = await denied("product:write");
  if (!user) return;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;
  await prisma.product.update({ where: { id }, data: { isPublished: !product.isPublished } });
  revalidatePath("/admin/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  const user = await denied("product:delete");
  if (!user) return;
  await prisma.product.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "PRODUCT_DELETE", entity: "Product", entityId: id });
  revalidatePath("/admin/products");
}

export async function upsertVariantAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("product:write");
  if (!user) return { error: "Not authorised" };
  const productId = str(fd, "productId");
  const id = str(fd, "id");
  const color = str(fd, "color");
  const size = str(fd, "size");
  if (!productId || !color || !size) return { error: "Color and size are required" };
  const priceOverride = num(fd, "priceOverride");
  const data = {
    color,
    colorHex: optStr(fd, "colorHex"),
    size,
    sku: str(fd, "sku") || `${productId.slice(-6)}-${slugify(color)}-${slugify(size)}`,
    priceOverride: priceOverride != null ? toPaise(priceOverride) : null,
    stock: num(fd, "stock") ?? 0,
    lowStockThreshold: num(fd, "lowStockThreshold") ?? 5,
    isActive: bool(fd, "isActive") || fd.get("isActive") === null,
  };
  try {
    if (id) await prisma.productVariant.update({ where: { id }, data });
    else await prisma.productVariant.create({ data: { ...data, productId } });
  } catch {
    return { error: "Could not save variant — SKU or size/colour combination already exists." };
  }
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Variant saved" };
}

export async function adjustStockAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("inventory:write");
  if (!user) return { error: "Not authorised" };
  const variantId = str(fd, "variantId");
  const delta = num(fd, "delta");
  if (!variantId || delta == null || delta === 0) return { error: "Enter a non-zero adjustment" };
  await adjustStock(variantId, delta, str(fd, "reason") || "Manual adjustment", user.id);
  revalidatePath("/admin/inventory");
  return { ok: true, message: `Stock ${delta > 0 ? "increased" : "decreased"} by ${Math.abs(delta)}` };
}

export async function setVariantActiveAction(id: string): Promise<void> {
  const user = await denied("inventory:write");
  if (!user) return;
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) return;
  await prisma.productVariant.update({ where: { id }, data: { isActive: !variant.isActive } });
  revalidatePath("/admin/inventory");
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export async function upsertCouponAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("coupon:write");
  if (!user) return { error: "Not authorised" };
  const id = str(fd, "id");
  const code = str(fd, "code").toUpperCase();
  if (!code) return { error: "Coupon code is required" };
  const type = str(fd, "type") || "PERCENT";
  const value = num(fd, "value") ?? 0;
  const data = {
    code,
    description: optStr(fd, "description"),
    type,
    value: type === "FIXED" ? toPaise(value) : value,
    minCartValue: toPaise(num(fd, "minCartValue") ?? 0),
    maxDiscount: num(fd, "maxDiscount") != null ? toPaise(num(fd, "maxDiscount") as number) : null,
    scope: str(fd, "scope") || "ALL",
    firstOrderOnly: bool(fd, "firstOrderOnly"),
    perCustomerLimit: num(fd, "perCustomerLimit") ?? 1,
    usageLimit: num(fd, "usageLimit"),
    stackable: bool(fd, "stackable"),
    isActive: bool(fd, "isActive") || fd.get("isActive") === null,
    startsAt: num(fd, "startsAt") ? new Date(str(fd, "startsAt")) : null,
    endsAt: num(fd, "endsAt") ? new Date(str(fd, "endsAt")) : null,
  };
  try {
    if (id) await prisma.coupon.update({ where: { id }, data });
    else await prisma.coupon.create({ data });
  } catch {
    return { error: "A coupon with this code already exists." };
  }
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon saved" };
}

export async function toggleCouponAction(id: string): Promise<void> {
  const user = await denied("coupon:write");
  if (!user) return;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return;
  await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(id: string): Promise<void> {
  const user = await denied("coupon:write");
  if (!user) return;
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function moderateReviewAction(id: string, status: string): Promise<void> {
  const user = await denied("review:write");
  if (!user) return;
  await prisma.review.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reviews");
}

export async function replyReviewAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("review:write");
  if (!user) return { error: "Not authorised" };
  const id = str(fd, "id");
  await prisma.review.update({ where: { id }, data: { adminReply: optStr(fd, "adminReply") } });
  revalidatePath("/admin/reviews");
  return { ok: true, message: "Reply saved" };
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

export async function updateReturnAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("return:write");
  if (!user) return { error: "Not authorised" };
  const id = str(fd, "id");
  const status = str(fd, "status");
  const restockable = bool(fd, "restockable");
  const ret = await prisma.returnRequest.findUnique({ where: { id }, include: { orderItem: true } });
  if (!ret) return { error: "Return not found" };

  await prisma.returnRequest.update({
    where: { id },
    data: {
      status,
      resolution: str(fd, "resolution") || ret.resolution,
      refundAmount: toPaise(num(fd, "refundAmount") ?? 0),
      restockable,
      adminNote: optStr(fd, "adminNote"),
    },
  });

  if (status === "COMPLETED" && restockable && ret.orderItem?.variantId) {
    await adjustStock(ret.orderItem.variantId, ret.orderItem.quantity, `Return ${ret.id}`, user.id);
  }
  await logAudit({ userId: user.id, action: "RETURN_UPDATE", entity: "ReturnRequest", entityId: id, details: status });
  revalidatePath("/admin/returns");
  return { ok: true, message: "Return updated" };
}

// ---------------------------------------------------------------------------
// Customers & staff
// ---------------------------------------------------------------------------

export async function setUserRoleAction(userId: string, role: string): Promise<void> {
  const user = await denied("staff:write");
  if (!user) return;
  if (userId === user.id && role === "CUSTOMER") return; // don't demote yourself
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAudit({ userId: user.id, action: "STAFF_ROLE", entity: "User", entityId: userId, details: role });
  revalidatePath("/admin/staff");
}

export async function toggleUserActiveAction(userId: string): Promise<void> {
  const user = await denied("customer:write");
  if (!user || userId === user.id) return;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
  revalidatePath("/admin/customers");
  revalidatePath("/admin/staff");
}

// ---------------------------------------------------------------------------
// Content & settings
// ---------------------------------------------------------------------------

export async function updateContentBlockAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("content:write");
  if (!user) return { error: "Not authorised" };
  const id = str(fd, "id");
  const key = str(fd, "key");
  if (!key && !id) return { error: "Missing content block" };
  const data = {
    key: key || `block-${id?.slice(-6)}`,
    type: str(fd, "type") || "CUSTOM",
    title: optStr(fd, "title"),
    subtitle: optStr(fd, "subtitle"),
    imageUrl: optStr(fd, "imageUrl"),
    ctaLabel: optStr(fd, "ctaLabel"),
    ctaHref: optStr(fd, "ctaHref"),
    position: num(fd, "position") ?? 0,
    isActive: bool(fd, "isActive") || fd.get("isActive") === null,
  };
  try {
    if (id) await prisma.contentBlock.update({ where: { id }, data });
    else await prisma.contentBlock.create({ data });
  } catch {
    return { error: "Could not save — the key may already be used." };
  }
  revalidatePath("/admin/content");
  revalidatePath("/");
  return { ok: true, message: "Content saved" };
}

export async function updateSettingsAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("settings:write");
  if (!user) return { error: "Not authorised" };
  const entries: Record<string, string> = {};
  for (const [key, value] of fd.entries()) {
    if (key.startsWith("setting.")) {
      entries[key.slice("setting.".length)] = typeof value === "string" ? value : "";
    }
  }
  if (Object.keys(entries).length === 0) return { error: "Nothing to save" };
  await setSettings(entries);
  await logAudit({ userId: user.id, action: "SETTINGS_UPDATE", entity: "SiteSetting" });
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved" };
}

export async function upsertFaqAction(_prev: AdminState | undefined, fd: FormData): Promise<AdminState> {
  const user = await denied("content:write");
  if (!user) return { error: "Not authorised" };
  const id = str(fd, "id");
  const question = str(fd, "question");
  const answer = str(fd, "answer");
  if (!question || !answer) return { error: "Question and answer are required" };
  const data = { question, answer, position: num(fd, "position") ?? 0, isActive: bool(fd, "isActive") || fd.get("isActive") === null };
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data });
  revalidatePath("/admin/content");
  return { ok: true, message: "FAQ saved" };
}

export async function deleteFaqAction(id: string): Promise<void> {
  const user = await denied("content:write");
  if (!user) return;
  await prisma.faq.delete({ where: { id } });
  revalidatePath("/admin/content");
}

export async function deleteContentBlockAction(id: string): Promise<void> {
  const user = await denied("content:write");
  if (!user) return;
  await prisma.contentBlock.delete({ where: { id } });
  revalidatePath("/admin/content");
}