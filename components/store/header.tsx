"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, User, Heart, ShoppingBag, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavCategory = {
  name: string;
  slug: string;
  imageUrl?: string | null;
  children: { name: string; slug: string }[];
};

export function Header({
  brandName,
  categories,
  cartCount,
  wishlistCount,
  userName,
}: {
  brandName: string;
  categories: NavCategory[];
  cartCount: number;
  wishlistCount: number;
  userName: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  };

  const primaryLinks = [
    { label: "New Arrivals", href: "/collections/new-arrivals" },
    { label: "Best Sellers", href: "/collections/best-sellers" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between gap-4">
            <button
              type="button"
              className="lg:hidden -ml-2 p-2"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex flex-col leading-none">
              <span className="font-display text-xl tracking-[0.24em] sm:text-2xl">{brandName}</span>
            </Link>

            <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 text-[11px] font-medium uppercase tracking-[0.18em]">
              {primaryLinks.map((link) => (
                <Link key={link.href} href={link.href} className="link-underline py-2">
                  {link.label}
                </Link>
              ))}
              {categories.slice(0, 5).map((cat) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(cat.slug)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <Link
                    href={`/collections/${cat.slug}`}
                    className="link-underline inline-flex items-center gap-1 py-2"
                    onFocus={() => setOpenMenu(cat.slug)}
                  >
                    {cat.name}
                    {cat.children.length > 0 && <ChevronDown className="h-3 w-3" />}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Search"
                className="p-2 hover:text-gold"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <Search className="h-5 w-5" />
              </button>
              <Link href={userName ? "/account" : "/account/login"} aria-label="Account" className="hidden sm:block p-2 hover:text-gold">
                <User className="h-5 w-5" />
              </Link>
              <Link href="/wishlist" aria-label="Wishlist" className="relative p-2 hover:text-gold">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[9px] font-bold text-obsidian">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/cart" aria-label="Shopping bag" className="relative p-2 hover:text-gold">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[9px] font-bold text-obsidian">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line bg-ivory animate-fade-in">
            <form onSubmit={submitSearch} className="container-wide flex items-center gap-3 py-3">
              <Search className="h-5 w-5 text-graphite" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shirts, trousers, blazers…"
                className="h-10 flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button type="submit" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mega menu */}
      {openMenu && (
        <div
          className="hidden lg:block fixed left-0 right-0 top-24 z-40 border-b border-line bg-ivory/98 backdrop-blur animate-fade-in"
          onMouseEnter={() => setOpenMenu(openMenu)}
          onMouseLeave={() => setOpenMenu(null)}
        >
          <div className="container-wide grid grid-cols-[2fr_1fr] gap-10 py-10">
            <div className="grid grid-cols-3 gap-x-8 gap-y-3">
              {categories
                .find((c) => c.slug === openMenu)
                ?.children.map((child) => (
                  <Link
                    key={child.slug}
                    href={`/collections/${child.slug}`}
                    className="text-sm text-graphite hover:text-obsidian"
                  >
                    {child.name}
                  </Link>
                ))}
              {categories.find((c) => c.slug === openMenu)?.children.length === 0 && (
                <Link
                  href={`/collections/${openMenu}`}
                  className="text-sm text-graphite hover:text-obsidian"
                >
                  Shop all {categories.find((c) => c.slug === openMenu)?.name}
                </Link>
              )}
            </div>
            <Link href={`/collections/${openMenu}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                {categories.find((c) => c.slug === openMenu)?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={categories.find((c) => c.slug === openMenu)?.imageUrl as string}
                    alt={openMenu}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <span className="mt-3 inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian">
                Explore collection →
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-obsidian/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-[85%] max-w-sm bg-ivory transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-display tracking-[0.2em]">{brandName}</span>
            <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col px-5 py-4">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-line py-3.5 text-sm uppercase tracking-[0.16em]"
              >
                {link.label}
              </Link>
            ))}
            {categories.map((cat) => (
              <div key={cat.slug} className="border-b border-line">
                <Link href={`/collections/${cat.slug}`} className="block py-3.5 text-sm uppercase tracking-[0.16em]">
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <div className="flex flex-col gap-2 pb-3 pl-3">
                    {cat.children.map((c) => (
                      <Link key={c.slug} href={`/collections/${c.slug}`} className="text-xs text-graphite">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <Link href={userName ? "/account" : "/account/login"} className="text-sm">
                {userName ? `Hi, ${userName}` : "Sign in / Register"}
              </Link>
              <Link href="/wishlist" className="text-sm">
                Wishlist
              </Link>
              <Link href="/collections/all" className="text-sm">
                Shop all
              </Link>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
