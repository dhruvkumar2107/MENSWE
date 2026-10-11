import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogView, toQuery } from "@/components/store/catalog-view";
import { prisma } from "@/lib/db";

const SPECIAL: Record<string, { title: string; eyebrow: string; description: string; params: Record<string, string> }> = {
  "new-arrivals": {
    title: "New Arrivals",
    eyebrow: "Just Landed",
    description: "The freshest additions to the MAISON HOMME wardrobe. Re-stocked weekly, cut in our signature silhouettes.",
    params: { collection: "new-arrivals" },
  },
  "best-sellers": {
    title: "Best Sellers",
    eyebrow: "Most Loved",
    description: "The pieces our community reaches for again and again — proven fits, premium fabrics, timeless style.",
    params: { collection: "best-sellers" },
  },
  sale: {
    title: "The Edit — Sale",
    eyebrow: "Limited Time",
    description: "Seasonal markdowns on core pieces. Once they're gone, they're gone.",
    params: { on_sale: "1" },
  },
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const special = SPECIAL[slug];
  if (special) {
    return { title: special.title };
  }
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Collection" };
  return { title: `${category.name} | MAISON HOMME`, description: category.description ?? undefined };
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const raw = await searchParams;
  const sp: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (v !== undefined) sp[k] = Array.isArray(v) ? v[0] ?? "" : v;

  const special = SPECIAL[slug];
  if (special) {
    const queryParams = { ...sp, ...special.params };
    return (
      <CatalogView
        basePath={`/collections/${slug}`}
        params={queryParams}
        title={special.title}
        eyebrow={special.eyebrow}
        description={special.description}
      />
    );
  }

  const category = await prisma.category.findUnique({ where: { slug }, include: { children: true } });
  if (!category || !category.isActive) notFound();

  const queryParams = { ...sp, cat: slug };
  return (
    <>
      <CatalogView
        basePath={`/collections/${slug}`}
        params={queryParams}
        title={category.name}
        eyebrow="Collection"
        description={category.description ?? undefined}
      />
    </>
  );
}