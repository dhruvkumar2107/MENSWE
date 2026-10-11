import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

const nav = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns & Exchanges" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="container-wide py-16">{children}</div>;
  }

  return (
    <div className="container-wide grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-graphite">Signed in as</p>
          <p className="font-display text-xl">{user.name}</p>
          <p className="text-xs text-graphite">{user.email}</p>
        </div>
        <nav className="flex flex-col border-t border-line">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="border-b border-line py-3 text-sm text-graphite hover:text-obsidian">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-6">
          <button type="submit" className="text-[11px] uppercase tracking-[0.2em] text-obsidian underline">
            Sign out
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}