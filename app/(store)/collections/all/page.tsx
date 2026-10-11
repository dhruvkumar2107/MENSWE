import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";

export const metadata: Metadata = {
  title: "Shop All | MAISON HOMME",
  description: "The complete MAISON HOMME collection — formal shirts, casual shirts, trousers, denim, blazers, wedding wear and accessories for the modern Indian man.",
};

export default async function ShopAllPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (v !== undefined) sp[k] = Array.isArray(v) ? v[0] ?? "" : v;

  return (
    <CatalogView
      basePath="/collections/all"
      params={sp}
      title="Shop All"
      eyebrow="The Complete Collection"
      description="Every piece in the MAISON HOMME wardrobe. Filter by category, size, colour, fabric and fit — or start with the latest arrivals."
    />
  );
}