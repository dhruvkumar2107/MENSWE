import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

type ReserveLine = {
  variantId: string;
  quantity: number;
};

/**
 * Atomically validate and reserve stock for the given lines.
 * Throws with a user-safe message if any line cannot be fulfilled.
 * The whole operation runs in a transaction so partial state is impossible.
 */
export async function reserveStock(lines: ReserveLine[], referenceId: string, userId?: string | null) {
  const reserved: { variantId: string; quantity: number }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const variant = await tx.productVariant.findUnique({
        where: { id: line.variantId },
        include: { product: { select: { name: true } } },
      });
      if (!variant) throw new Error("A product in your order is no longer available");
      const available = variant.stock - variant.reserved;
      if (available < line.quantity) {
        throw new Error(
          `Only ${Math.max(0, available)} left of ${variant.product.name} (${variant.color}, ${variant.size})`,
        );
      }
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { reserved: variant.reserved + line.quantity },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "RESERVATION",
          quantity: -line.quantity,
          balanceAfter: variant.stock - (variant.reserved + line.quantity),
          reason: `Order ${referenceId}`,
          referenceId,
          userId: userId ?? null,
        },
      });
      reserved.push({ variantId: line.variantId, quantity: line.quantity });
    }
  });

  return reserved;
}

/**
 * Release reserved stock back into sellable inventory (e.g. abandoned order).
 */
export async function releaseStock(referenceId: string, userId?: string | null) {
  const movements = await prisma.inventoryMovement.findMany({
    where: { type: "RESERVATION", referenceId },
  });
  await prisma.$transaction(async (tx) => {
    for (const m of movements) {
      const variant = await tx.productVariant.findUnique({ where: { id: m.variantId } });
      if (!variant) continue;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { reserved: Math.max(0, variant.reserved + Math.min(0, m.quantity)) }, // m.quantity is negative
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "RELEASE",
          quantity: -m.quantity, // positive: back into stock
          balanceAfter: variant.stock - variant.reserved,
          reason: `Release for ${referenceId}`,
          referenceId,
          userId: userId ?? null,
        },
      });
    }
  });
}

/**
 * Decrement stock on a confirmed payment/fulfilment and log the movement.
 */
export async function commitStock(referenceId: string, userId?: string | null) {
  const movements = await prisma.inventoryMovement.findMany({
    where: { type: "RESERVATION", referenceId },
  });
  await prisma.$transaction(async (tx) => {
    for (const m of movements) {
      const variant = await tx.productVariant.findUnique({ where: { id: m.variantId } });
      if (!variant) continue;
      const qty = Math.min(0, m.quantity); // negative
      const newReserved = Math.max(0, variant.reserved - Math.abs(qty));
      const newStock = Math.max(0, variant.stock + qty);
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: newStock, reserved: newReserved },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "STOCK_OUT",
          quantity: qty,
          balanceAfter: newStock,
          reason: `Confirmed order ${referenceId}`,
          referenceId,
          userId: userId ?? null,
        },
      });
    }
  });
}

/**
 * Restock sold inventory for cancelled / returned lines.
 */
export async function deregisterStock(variantIds: { variantId: string; quantity: number }[], referenceId: string, reason: string, userId?: string | null) {
  await prisma.$transaction(async (tx) => {
    for (const line of variantIds) {
      const variant = await tx.productVariant.findUnique({ where: { id: line.variantId } });
      if (!variant) continue;
      const newStock = variant.stock + line.quantity;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: newStock, reserved: Math.max(0, variant.reserved - line.quantity) },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "RETURN",
          quantity: line.quantity,
          balanceAfter: newStock,
          reason: `${reason} ${referenceId}`,
          referenceId,
          userId: userId ?? null,
        },
      });
    }
  });
}

export async function adjustStock(variantId: string, delta: number, reason: string, userId?: string | null, supplierId?: string | null, unitCost?: number | null) {
  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new Error("Variant not found");
    const newStock = Math.max(0, variant.stock + delta);
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: newStock } });
    await tx.inventoryMovement.create({
      data: {
        variantId,
        type: delta >= 0 ? "STOCK_IN" : "ADJUSTMENT",
        quantity: delta,
        balanceAfter: newStock,
        reason,
        supplierId: supplierId ?? null,
        unitCost: unitCost ?? null,
        userId: userId ?? null,
      },
    });
  });
  await logAudit({
    action: delta >= 0 ? "INVENTORY_STOCK_IN" : "INVENTORY_ADJUSTMENT",
    entity: "ProductVariant",
    entityId: variantId,
    details: reason,
  });
}