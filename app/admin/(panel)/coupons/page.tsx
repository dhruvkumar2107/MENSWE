import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { CouponForm } from "@/components/admin/coupon-form";
import { toggleCouponAction, deleteCouponAction } from "@/lib/actions/admin";
import { StatusPill } from "@/components/admin/status-pill";

export default async function AdminCouponsPage() {
  await requireAdmin("coupon:read");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Coupons</h1>
      <CouponForm />

      <div className="overflow-x-auto border border-[#e4ded4] bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-[#efe9df] last:border-0">
                <td className="px-4 py-3 font-medium">{c.code}<span className="block text-xs text-[#6b655c]">{c.description ?? ""}</span></td>
                <td className="px-4 py-3 text-[#6b655c]">{c.type}</td>
                <td className="px-4 py-3">{c.type === "FIXED" ? formatINR(c.value) : c.type === "PERCENT" ? `${c.value}%` : "Free shipping"}</td>
                <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3"><StatusPill value={c.isActive ? "DELIVERED" : "CANCELLED"} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <form action={toggleCouponAction.bind(null, c.id)}>
                      <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] underline">{c.isActive ? "Disable" : "Enable"}</button>
                    </form>
                    <form action={deleteCouponAction.bind(null, c.id)}>
                      <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600 underline">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[#6b655c]">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}