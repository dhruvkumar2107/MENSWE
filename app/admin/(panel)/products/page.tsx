import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { toggleProductPublishedAction, deleteProductAction } from "@/lib/actions/admin";
import { StatusPill } from "@/components/admin/status-pill";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("product:read");
  const { q } = await searchParams;

  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { parentSku: { contains: q } }] } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { category: { select: { name: true } }, variants: { select: { stock: true, reserved: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Products</h1>
        <div className="flex items-center gap-2">
          <a href="/api/admin/export?type=products" className="h-10 border border-obsidian px-4 text-xs font-medium uppercase leading-10 tracking-[0.16em] hover:bg-obsidian hover:text-ivory">Export CSV</a>
        </div>
      </div>

      <form method="get" className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search products or SKU…" className="h-10 flex-1 border border-[#d9d2c6] bg-white px-3 text-sm" />
        <button className="h-10 bg-obsidian px-5 text-xs font-medium uppercase tracking-[0.16em] text-ivory">Search</button>
      </form>

      <div className="overflow-x-auto border border-[#e4ded4] bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock - v.reserved, 0);
              return (
                <tr key={p.id} className="border-b border-[#efe9df] last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-gold-deep">{p.name}</Link>
                    <span className="block text-xs text-[#6b655c]">{p.parentSku}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6b655c]">{p.category.name}</td>
                  <td className="px-4 py-3">{formatINR(p.salePrice ?? p.price)}</td>
                  <td className={`px-4 py-3 ${stock <= 0 ? "text-red-600" : stock <= 5 ? "text-amber-600" : ""}`}>{stock}</td>
                  <td className="px-4 py-3"><StatusPill value={p.isPublished ? "DELIVERED" : "PENDING"} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <form action={toggleProductPublishedAction.bind(null, p.id)}>
                        <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] underline">{p.isPublished ? "Unpublish" : "Publish"}</button>
                      </form>
                      <Link href={`/product/${p.slug}`} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b655c] underline">View</Link>
                      <form action={deleteProductAction.bind(null, p.id)}>
                        <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600 underline">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b655c]">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}