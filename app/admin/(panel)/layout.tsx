import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { hasPermission, type Permission } from "@/lib/constants";
import { AdminSidebar, type AdminNavItem } from "@/components/admin/admin-sidebar";

const ALL_NAV: { href: string; label: string; icon: AdminNavItem["icon"]; permission?: Permission }[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "orders", permission: "order:read" },
  { href: "/admin/products", label: "Products", icon: "products", permission: "product:read" },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory", permission: "inventory:read" },
  { href: "/admin/customers", label: "Customers", icon: "customers", permission: "customer:read" },
  { href: "/admin/returns", label: "Returns", icon: "returns", permission: "return:read" },
  { href: "/admin/reviews", label: "Reviews", icon: "reviews", permission: "review:read" },
  { href: "/admin/coupons", label: "Coupons", icon: "coupons", permission: "coupon:read" },
  { href: "/admin/content", label: "Content", icon: "content", permission: "content:read" },
  { href: "/admin/reports", label: "Reports", icon: "reports", permission: "report:read" },
  { href: "/admin/staff", label: "Staff", icon: "staff", permission: "staff:read" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const nav: AdminNavItem[] = ALL_NAV.filter(
    (item) => !item.permission || hasPermission(user.role, item.permission),
  ).map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="min-h-screen bg-[#F4F1EC] lg:flex">
      <AdminSidebar nav={nav} staffName={user.name} role={user.role} signOut={logoutAction} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}