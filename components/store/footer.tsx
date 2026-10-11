import Link from "next/link";
import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";
import { NewsletterForm } from "@/components/store/newsletter-form";
import type { Settings } from "@/lib/settings";

const shopLinks = [
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Shirts", href: "/collections/shirts" },
  { label: "Trousers", href: "/collections/trousers" },
  { label: "Blazers & Suits", href: "/collections/blazers-suits" },
  { label: "Accessories", href: "/collections/accessories" },
];

const helpLinks = [
  { label: "Size Guide", href: "/pages/size-guide" },
  { label: "Shipping Policy", href: "/pages/shipping-policy" },
  { label: "Returns & Refunds", href: "/pages/return-policy" },
  { label: "Track Order", href: "/account/orders" },
  { label: "FAQs", href: "/pages/faqs" },
  { label: "Contact", href: "/pages/contact" },
];

const companyLinks = [
  { label: "About Us", href: "/pages/about" },
  { label: "Privacy Policy", href: "/pages/privacy" },
  { label: "Terms & Conditions", href: "/pages/terms" },
];

export function Footer({ settings }: { settings: Settings }) {
  const socials = [
    { href: settings["social.instagram"], icon: Instagram, label: "Instagram" },
    { href: settings["social.facebook"], icon: Facebook, label: "Facebook" },
    { href: settings["social.youtube"], icon: Youtube, label: "YouTube" },
    { href: settings["social.twitter"], icon: Twitter, label: "X" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 bg-obsidian text-ivory">
      <div className="container-wide grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-5">
          <span className="font-display text-2xl tracking-[0.24em]">{settings["brand.name"]}</span>
          <p className="text-sm leading-relaxed text-ivory/70">
            {settings["brand.tagline"]}. Premium menswear crafted in India for the modern gentleman.
          </p>
          <div className="flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center border border-ivory/20 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Shop</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-ivory/70">
            {shopLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Customer Care
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm text-ivory/70">
            {helpLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-1 text-sm text-ivory/70">
            <p>{settings["contact.phone"]}</p>
            <p>{settings["contact.email"]}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            The House Journal
          </h3>
          <p className="text-sm text-ivory/70">
            Early access to new collections, private sales and styling notes.
          </p>
          <NewsletterForm compact />
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ivory/50">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-wide flex flex-col items-center justify-between gap-4 py-6 text-xs text-ivory/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings["brand.name"]}. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Secure payments</span>
            {["UPI", "VISA", "MASTERCARD", "RUPAY", "NETBANKING", "COD"].map((m) => (
              <span key={m} className="border border-ivory/15 px-2 py-1 text-[9px] tracking-wider">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
