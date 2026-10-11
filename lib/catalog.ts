import { prisma } from "@/lib/db";
import { percentOff } from "@/lib/money";
import { placeholderUrl } from "@/lib/images";

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  discountPercent: number;
  imageUrl: string;
  imageAlt: string;
  colors: { color: string; hex: string | null }[];
  sizes: string[];
  variants: { id: string; size: string; color: string; available: number }[];
  inStock: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isLimitedEdition: boolean;
  categoryName: string;
  rating: number;
  reviewCount: number;
};

type SortKey = "newest" | "popular" | "price-asc" | "price-desc" | "rating" | "discount";

export type ProductQuery = {
  search?: string;
  categorySlug?: string;
  categoryIds?: string[];
  collection?: string; // new-arrivals | best-sellers
  sizes?: string[];
  colors?: string[];
  fabrics?: string[];
  fits?: string[];
  occasions?: string[];
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSale?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

const cardInclude = {
  images: { orderBy: { position: "asc" as const } },
  variants: { where: { isActive: true }, orderBy: { size: "asc" as const } },
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true, slug: true } },
};

async function attachRatings<T extends { id: string }>(products: T[]): Promise<(T & { rating: number; reviewCount: number })[]> {
  if (products.length === 0) return [];
  const ids = products.map((p) => p.id);
  const grouped = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: ids }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map(grouped.map((g) => [g.productId, g]));
  return products.map((p) => {
    const g = map.get(p.id);
    return {
      ...p,
      rating: g?._avg.rating ? Math.round(g._avg.rating * 10) / 10 : 0,
      reviewCount: g?._count._all ?? 0,
    };
  });
}

export function toCard(
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    isNewArrival: boolean;
    isBestSeller: boolean;
    isLimitedEdition: boolean;
    images: { url: string; alt: string | null; color: string | null }[];
    variants: { id: string; color: string; colorHex: string | null; size: string; stock: number; reserved: number }[];
    category: { name: string };
  },
  rating = 0,
  reviewCount = 0,
): ProductCard {
  const effectivePrice = product.salePrice ?? product.price;
  const colorMap = new Map<string, string | null>();
  for (const v of product.variants) {
    if (!colorMap.has(v.color)) colorMap.set(v.color, v.colorHex ?? null);
  }
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const inStock = product.variants.some((v) => v.stock - v.reserved > 0);
  const variants = product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    available: Math.max(0, v.stock - v.reserved),
  }));
  const image = product.images[0];
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    effectivePrice,
    discountPercent: percentOff(product.price, product.salePrice),
    imageUrl: image?.url ?? placeholderUrl(product.name, { sub: product.category.name }),
    imageAlt: image?.alt ?? product.name,
    colors: Array.from(colorMap.entries()).map(([color, hex]) => ({ color, hex })),
    sizes,
    variants,
    inStock,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isLimitedEdition: product.isLimitedEdition,
    categoryName: product.category.name,
    rating,
    reviewCount,
  };
}

export async function listProducts(query: ProductQuery) {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(48, Math.max(4, query.perPage ?? 12));

  const where: Record<string, unknown> = { isPublished: true };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { parentSku: { contains: query.search } },
      { tags: { contains: query.search } },
      { shortDescription: { contains: query.search } },
    ];
  }
  if (query.categoryIds && query.categoryIds.length) where.categoryId = { in: query.categoryIds };
  else if (query.categorySlug) where.category = { slug: query.categorySlug };
  if (query.brandSlugs && query.brandSlugs.length) where.brand = { slug: { in: query.brandSlugs } };
  if (query.fabrics && query.fabrics.length) where.fabric = { in: query.fabrics };
  if (query.fits && query.fits.length) where.fit = { in: query.fits };
  if (query.occasions && query.occasions.length) where.occasion = { in: query.occasions };
  if (query.onSale) where.salePrice = { not: null };
  if (query.collection === "new-arrivals") where.isNewArrival = true;
  if (query.collection === "best-sellers") where.isBestSeller = true;

  if (query.minPrice || query.maxPrice) {
    where.price = {};
    const priceFilter = where.price as Record<string, number>;
    if (query.minPrice) priceFilter.gte = query.minPrice;
    if (query.maxPrice) priceFilter.lte = query.maxPrice;
  }

  const variantFilter: Record<string, unknown> = { isActive: true };
  if (query.sizes && query.sizes.length) variantFilter.size = { in: query.sizes };
  if (query.colors && query.colors.length) variantFilter.color = { in: query.colors };
  if (query.inStockOnly) variantFilter.stock = { gt: 0 };
  if (Object.keys(variantFilter).length > 1) {
    where.variants = { some: variantFilter };
  }

  const orderBy = (() => {
    switch (query.sort) {
      case "price-asc":
        return [{ price: "asc" as const }];
      case "price-desc":
        return [{ price: "desc" as const }];
      case "popular":
        return [{ isBestSeller: "desc" as const }, { createdAt: "desc" as const }];
      case "discount":
        return [{ salePrice: "desc" as const }];
      case "newest":
      default:
        return [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];
    }
  })();

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: cardInclude,
    }),
  ]);

  const withRatings = await attachRatings(products);

  return {
    items: withRatings.map((p) => toCard(p, p.rating, p.reviewCount)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
    perPage,
  };
}

export async function getFacets() {
  const [sizes, colors, fabrics, fits, occasions, brands, priceAgg] = await Promise.all([
    prisma.productVariant.findMany({ where: { isActive: true }, select: { size: true }, distinct: ["size"] }),
    prisma.productVariant.findMany({ where: { isActive: true }, select: { color: true }, distinct: ["color"] }),
    prisma.product.findMany({ where: { isPublished: true, fabric: { not: null } }, select: { fabric: true }, distinct: ["fabric"] }),
    prisma.product.findMany({ where: { isPublished: true, fit: { not: null } }, select: { fit: true }, distinct: ["fit"] }),
    prisma.product.findMany({ where: { isPublished: true, occasion: { not: null } }, select: { occasion: true }, distinct: ["occasion"] }),
    prisma.brand.findMany({ where: { isActive: true }, select: { name: true, slug: true } }),
    prisma.product.aggregate({ where: { isPublished: true }, _min: { price: true }, _max: { price: true } }),
  ]);
  return {
    sizes: sizes.map((s) => s.size),
    colors: colors.map((c) => c.color),
    fabrics: fabrics.map((f) => f.fabric).filter(Boolean) as string[],
    fits: fits.map((f) => f.fit).filter(Boolean) as string[],
    occasions: occasions.map((o) => o.occasion).filter(Boolean) as string[],
    brands,
    priceMin: priceAgg._min.price ?? 0,
    priceMax: priceAgg._max.price ?? 0,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { where: { isActive: true }, orderBy: { size: "asc" } },
      category: true,
      brand: true,
    },
  });
  if (!product || !product.isPublished) return null;

  const rating = await prisma.review.aggregate({
    where: { productId: product.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    product,
    rating: rating._avg.rating ? Math.round(rating._avg.rating * 10) / 10 : 0,
    reviewCount: rating._count._all,
    reviews,
  };
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const products = await prisma.product.findMany({
    where: { isPublished: true, categoryId, id: { not: productId } },
    take: limit,
    include: cardInclude,
    orderBy: { createdAt: "desc" },
  });
  const withRatings = await attachRatings(products);
  return withRatings.map((p) => toCard(p, p.rating, p.reviewCount));
}

export async function getHomeSections() {
  const [newArrivals, bestSellers, featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, isNewArrival: true },
      take: 8,
      include: cardInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isPublished: true, isBestSeller: true },
      take: 8,
      include: cardInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 4,
      include: cardInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: "asc" }, take: 10 }),
  ]);
  const all = await attachRatings([...newArrivals, ...bestSellers, ...featured]);
  const map = new Map(all.map((p) => [p.id, p]));
  const conv = (list: typeof newArrivals) =>
    list.map((p) => {
      const r = map.get(p.id);
      return toCard(p, r?.rating ?? 0, r?.reviewCount ?? 0);
    });
  return {
    newArrivals: conv(newArrivals),
    bestSellers: conv(bestSellers),
    featured: conv(featured),
    categories,
  };
}
