import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return {
    title: q ? `Results for “${q}” | MAISON HOMME` : "Search | MAISON HOMME",
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (v !== undefined) sp[k] = Array.isArray(v) ? v[0] ?? "" : v;

  const q = sp.q || "";
  return (
    <CatalogView
      basePath="/search"
      params={sp}
      title={q ? `Results for “${q}”` : "Search"}
      eyebrow="Search"
      description={q ? undefined : "Search by product name, style or SKU."}
    />
  );
}