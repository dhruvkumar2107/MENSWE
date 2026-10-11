import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { VariantForm } from "@/components/admin/variant-form";
import { setVariantActiveAction } from "@/lib/actions/admin";
import { formatINR } from "@/lib/money";

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("product:read");
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] } } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/products" className="text-xs text-[#6b655c] underline">← Products</Link>
        <h1 className="mt-2 font-display text-3xl">{product.name}</h1>
        <p className="mt-1 text-xs text-[#6b655c]">{product.parentSku} · {product.isPublished ? "Published" : "Draft"}</p>
      </div>

      <ProductForm
        product={{
          id: product.id, name: product.name, slug: product.slug, description: product.description,
          shortDescription: product.shortDescription, categoryId: product.categoryId, brandId: product.brandId,
          fabric: product.fabric, fit: product.fit, occasion: product.occasion, pattern: product.pattern,
          careInstructions: product.careInstructions, price: product.price, salePrice: product.salePrice,
          costPrice: product.costPrice, lowStockThreshold: product.lowStockThreshold, tags: product.tags,
          isPublished: product.isPublished, isNewArrival: product.isNewArrival, isBestSeller: product.isBestSeller,
          isFeatured: product.isFeatured, isLimitedEdition: product.isLimitedEdition, seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
        }}
        categories={categories}
        brands={brands}
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl">Variants</h2>
        <div className="overflow-x-auto border border-[#e4ded4] bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Colour</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">Active</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id} className="border-b border-[#efe9df] last:border-0">
                  <td className="px-4 py-2.5 text-xs">{v.sku}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border border-[#d9d2c6]" style={{ background: v.colorHex ?? "#ccc" }} />
                      {v.color}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{v.size}</td>
                  <td className="px-4 py-2.5">{v.priceOverride ? formatINR(v.priceOverride) : "—"}</td>
                  <td className="px-4 py-2.5">{v.stock - v.reserved} <span className="text-xs text-[#6b655c]">/ {v.stock}</span></td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={setVariantActiveAction.bind(null, v.id)}>
                      <button type="submit" className={`text-[10px] font-semibold uppercase tracking-[0.12em] underline ${v.isActive ? "text-emerald-700" : "text-red-600"}`}>
                        {v.isActive ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {product.variants.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-[#6b655c]">No variants yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <VariantForm productId={product.id} />
      </section>
    </div>
  );
}