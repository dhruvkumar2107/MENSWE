import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InventoryAdjust } from "@/components/admin/variant-form";
import { setVariantActiveAction } from "@/lib/actions/admin";

export default async function AdminInventoryPage() {
  await requireAdmin("inventory:read");
  const variants = await prisma.productVariant.findMany({
    orderBy: [{ product: { name: "asc" } }, { color: "asc" }, { size: "asc" }],
    take: 400,
    include: { product: { select: { name: true, slug: true } } },
  });

  const low = variants.filter((v) => v.stock - v.reserved <= v.lowStockThreshold);
  const out = variants.filter((v) => v.stock - v.reserved <= 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">Inventory</h1>
        <p className="mt-1 text-sm text-[#6b655c]">{variants.length} variants · {low.length} low stock · {out.length} out of stock</p>
      </div>

      <div className="overflow-x-auto border border-[#e4ded4] bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">On hand</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Adjust</th>
              <th className="px-4 py-3 text-right">Active</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const available = v.stock - v.reserved;
              return (
                <tr key={v.id} className="border-b border-[#efe9df] last:border-0">
                  <td className="px-4 py-2.5">{v.product.name}</td>
                  <td className="px-4 py-2.5 text-[#6b655c]">{v.color} / {v.size} <span className="text-xs">({v.sku})</span></td>
                  <td className="px-4 py-2.5">{v.stock}</td>
                  <td className="px-4 py-2.5">{v.reserved}</td>
                  <td className={`px-4 py-2.5 font-medium ${available <= 0 ? "text-red-600" : available <= v.lowStockThreshold ? "text-amber-600" : "text-emerald-700"}`}>{available}</td>
                  <td className="px-4 py-2.5"><InventoryAdjust variantId={v.id} label={`${v.product.name} ${v.color}/${v.size}`} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={setVariantActiveAction.bind(null, v.id)}>
                      <button type="submit" className={`text-[10px] font-semibold uppercase tracking-[0.12em] underline ${v.isActive ? "text-emerald-700" : "text-red-600"}`}>
                        {v.isActive ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}