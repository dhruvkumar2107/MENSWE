import { cache } from "react";
import { prisma } from "@/lib/db";
import { SHIPPING } from "@/lib/constants";

// Editable, database-backed site configuration. Everything the storefront
// treats as "content" (brand name, contact details, hero, announcements,
// theme colours, policies, shipping rules) is a row in SiteSetting so admins
// can change it without touching code.

export const DEFAULT_SETTINGS: Record<string, string> = {
  "brand.name": "MAISON HOMME",
  "brand.tagline": "The Art of Dressing Well",
  "brand.logoText": "MAISON HOMME",
  "brand.logoUrl": "",
  "brand.currency": "INR",
  "brand.primaryColor": "#101010",
  "brand.goldColor": "#B89B62",
  "brand.ivoryColor": "#F7F4EF",
  "brand.charcoalColor": "#303030",

  "contact.email": "care@maisonhomme.in",
  "contact.phone": "+91 98100 00000",
  "contact.whatsapp": "+91 98100 00000",
  "contact.address": "Level 4, Oberoi Commerz, Goregaon East, Mumbai 400063, India",

  "announcement.enabled": "true",
  "announcement.messages":
    "Free shipping on orders above ₹1,499|New Autumn/Winter Collection is live|Flat 10% off on your first order — code WELCOME10",

  "hero.heading": "THE ART OF DRESSING WELL.",
  "hero.subheading": "Refined essentials. Modern silhouettes. Confidence in every detail.",
  "hero.image": "",
  "hero.ctaPrimaryLabel": "Explore the Collection",
  "hero.ctaPrimaryHref": "/collections/new-arrivals",
  "hero.ctaSecondaryLabel": "Shop Best Sellers",
  "hero.ctaSecondaryHref": "/collections/best-sellers",

  "shipping.freeThreshold": String(SHIPPING.freeThreshold),
  "shipping.standard": String(SHIPPING.standard),
  "shipping.codFee": String(SHIPPING.codFee),
  "shipping.codEnabled": "true",
  "shipping.returnWindowDays": "7",

  "social.instagram": "https://instagram.com",
  "social.facebook": "https://facebook.com",
  "social.youtube": "https://youtube.com",
  "social.twitter": "https://x.com",

  "seo.defaultTitle": "MAISON HOMME — Premium Menswear",
  "seo.defaultDescription":
    "Refined essentials and modern silhouettes for the discerning man. Shirts, trousers, denim, blazers and occasion wear.",

  "policy.shipping":
    "We ship across India within 2–6 business days. Free shipping on orders above ₹1,499. Cash on Delivery available on serviceable PIN codes.",
  "policy.returns":
    "Eligible items can be returned within 7 days of delivery in unused condition with original tags. Refunds are processed after quality inspection.",
  "policy.privacy":
    "We collect only the data needed to fulfil your order and improve your experience. We never sell your personal information.",
  "policy.terms":
    "By using this website you agree to our terms of sale, pricing, and return policies. Prices are inclusive of applicable GST unless stated otherwise.",
};

export type Settings = Record<string, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.siteSetting.findMany().catch(() => []);
  const merged: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.value !== "" && row.value != null) merged[row.key] = row.value;
  }
  return merged;
});

export async function getSetting(key: string): Promise<string> {
  const settings = await getSettings();
  return settings[key] ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
}

export function numSetting(settings: Settings, key: string, fallback: number): number {
  const raw = settings[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function boolSetting(settings: Settings, key: string, fallback = false): boolean {
  const raw = settings[key];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}
