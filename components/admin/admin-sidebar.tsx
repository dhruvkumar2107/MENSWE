"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Boxes, Users, RotateCcw, Star, Ticket, FileText, BarChart3, ShieldCheck, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminNavItem = { href: string; label: string; icon: keyof typeof ICONS };

const ICONS = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  products: Package,
  inventory: Boxes,
  customers: Users,
  returns: RotateCcw,
  reviews: Star,
  coupons: Ticket,
  content: FileText,
  reports: BarChart3,
  staff: ShieldCheck,
} as const;

export function AdminSidebar({ nav, staffName, role, signOut }: { nav: AdminNavItem[]; staffName: string; role: string; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
              active ? "bg-ivory/10 text-ivory" : "text-ivory/55 hover:bg-ivory/5 hover:text-ivory",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-ivory/10 px-4 py-3 lg:hidden">
        <span className="font-display text-lg tracking-[0.24em] text-ivory">MAISON HOMME</span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" className="text-ivory">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "flex w-full flex-col bg-obsidian lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="hidden px-5 py-6 lg:block">
          <Link href="/admin" className="font-display text-lg tracking-[0.22em] text-ivory">MAISON HOMME</Link>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-gold">Back Office</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{links}</div>
        <div className="border-t border-ivory/10 px-5 py-4">
          <p className="text-sm text-ivory">{staffName}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">{role.replace("_", " ")}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-[11px] uppercase tracking-[0.18em] text-ivory/50 underline hover:text-ivory">
              Sign out
            </button>
          </form>
          <Link href="/" className="mt-3 block text-[11px] uppercase tracking-[0.18em] text-ivory/50 hover:text-ivory">
            View storefront →
          </Link>
        </div>
      </aside>
    </>
  );
}