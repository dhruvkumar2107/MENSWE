import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../lib/db";
import { reserveStock, releaseStock, commitStock, adjustStock } from "../lib/inventory";

const stamp = Date.now();

test("inventory: reserve, release, commit and adjust lifecycle", async (t) => {
  const category = await prisma.category.create({
    data: { name: "Test Category", slug: `test-category-${stamp}`, sortOrder: 999 },
  });
  const product = await prisma.product.create({
    data: {
      name: "Test Garment",
      slug: `test-garment-${stamp}`,
      parentSku: `TEST-${stamp}`,
      price: 100000,
      categoryId: category.id,
    },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `TESTV-${stamp}`, color: "Navy", size: "M", stock: 10 },
  });

  t.after(async () => {
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  });

  const ref = `TESTREF-${stamp}`;

  await reserveStock([{ variantId: variant.id, quantity: 3 }], ref, null);
  let v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(v.reserved, 3, "reserve increments reserved");
  assert.equal(v.stock, 10, "reserve does not change stock");

  await releaseStock(ref, null);
  v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(v.reserved, 0, "release clears reserved");

  await reserveStock([{ variantId: variant.id, quantity: 4 }], ref, null);
  await commitStock(ref, null);
  v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(v.stock, 6, "commit decrements stock");
  assert.equal(v.reserved, 0, "commit clears reserved");

  await adjustStock(variant.id, 5, "Restock test", null);
  v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(v.stock, 11, "adjust adds stock");

  const movements = await prisma.inventoryMovement.count({ where: { variantId: variant.id } });
  assert.ok(movements >= 4, "movements are logged");
});

test("inventory: reserve beyond availability throws", async (t) => {
  const category = await prisma.category.create({
    data: { name: "Test Category 2", slug: `test-category-2-${stamp}`, sortOrder: 999 },
  });
  const product = await prisma.product.create({
    data: {
      name: "Test Garment 2",
      slug: `test-garment-2-${stamp}`,
      parentSku: `TEST2-${stamp}`,
      price: 50000,
      categoryId: category.id,
    },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `TESTV2-${stamp}`, color: "Black", size: "L", stock: 1 },
  });

  t.after(async () => {
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  });

  await assert.rejects(
    () => reserveStock([{ variantId: variant.id, quantity: 5 }], `OVER-${stamp}`, null),
    /Only \d+ left/,
  );

  const v = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
  assert.equal(v.reserved, 0, "failed reservation leaves no partial state");
});