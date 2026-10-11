import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAFF_ROLES } from "@/lib/constants";
import { StaffRoleSelect } from "@/components/admin/staff-controls";

export default async function AdminStaffPage() {
  const admin = await requireAdmin("staff:read");

  const [staff, recentCustomers] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: STAFF_ROLES } }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">Staff &amp; Access</h1>
        <p className="mt-1 text-sm text-[#6b655c]">Assign roles to control what each team member can see and do.</p>
      </div>

      <section className="overflow-x-auto border border-[#e4ded4] bg-white">
        <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Team</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-[#efe9df] last:border-0">
                <td className="px-4 py-3 font-medium">{s.name}{s.id === admin.id && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-gold-deep">You</span>}</td>
                <td className="px-4 py-3 text-[#6b655c]">{s.email}</td>
                <td className="px-4 py-3"><StaffRoleSelect userId={s.id} role={s.role} self={s.id === admin.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto border border-[#e4ded4] bg-white">
        <h2 className="border-b border-[#e4ded4] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">Promote a customer</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#e4ded4] text-left text-[10px] uppercase tracking-[0.14em] text-[#6b655c]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {recentCustomers.map((c) => (
              <tr key={c.id} className="border-b border-[#efe9df] last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-[#6b655c]">{c.email}</td>
                <td className="px-4 py-3"><StaffRoleSelect userId={c.id} role={c.role} self={false} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}