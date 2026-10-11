import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as ProductCardType } from "@/lib/catalog";
import { PriceTag, Badge } from "@/components/ui";
import { WishlistButton } from "@/components/store/wishlist-button";
import { QuickAdd } from "@/components/store/quick-add";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  saved = false,
  className,
}: {
  product: ProductCardType;
  saved?: boolean;
  className?: string;
}) {
  const soldOut = !product.inStock;
  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative overflow-hidden bg-sand">
        <Link href={`/product/${product.slug}`} aria-label={product.name}>
          <div className="aspect-[3/4] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.imageAlt}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105",
                soldOut && "opacity-70",
              )}
            />
          </div>
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {soldOut && <Badge tone="obsidian">Sold Out</Badge>}
          {!soldOut && product.isNewArrival && <Badge tone="gold">New</Badge>}
          {!soldOut && product.isLimitedEdition && <Badge tone="obsidian">Limited Edition</Badge>}
          {!soldOut && product.discountPercent > 0 && <Badge tone="sale">{product.discountPercent}% Off</Badge>}
        </div>

        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} initiallySaved={saved} />
        </div>

        <div className="absolute inset-x-0 bottom-0 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {soldOut ? (
            <div className="bg-obsidian/90 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory">
              Notify / Sold Out
            </div>
          ) : (
            <QuickAdd variants={product.variants} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-4">
        <span className="text-[10px] uppercase tracking-[0.18em] text-graphite">
          {product.categoryName}
        </span>
        <Link href={`/product/${product.slug}`} className="text-sm font-medium leading-snug hover:text-gold-deep">
          {product.name}
        </Link>
        <PriceTag price={product.price} salePrice={product.salePrice} size="sm" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.color}
                title={c.color}
                className="h-3 w-3 rounded-full border border-line"
                style={{ background: c.hex ?? "#ccc" }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-graphite">+{product.colors.length - 4}</span>
            )}
          </div>
          {product.reviewCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-graphite">
              <Star className="h-3 w-3 fill-gold text-gold" />
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductListRow({
  product,
  saved = false,
}: {
  product: ProductCardType;
  saved?: boolean;
}) {
  return (
    <article className="group flex gap-5 border border-line bg-white p-4">
      <Link href={`/product/${product.slug}`} className="relative w-32 shrink-0 overflow-hidden bg-sand sm:w-40">
        <div className="aspect-[3/4] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 bg-danger px-1.5 py-0.5 text-[9px] font-semibold text-white">
            {product.discountPercent}% OFF
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-graphite">
              {product.categoryName}
            </span>
            <Link href={`/product/${product.slug}`} className="mt-1 block font-display text-lg leading-snug hover:text-gold-deep">
              {product.name}
            </Link>
          </div>
          <WishlistButton productId={product.id} initiallySaved={saved} />
        </div>
        <p className="line-clamp-2 text-xs text-graphite">
          {product.sizes.join(", ")} · in {product.colors.length} colours
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <PriceTag price={product.price} salePrice={product.salePrice} />
          <div className="w-full sm:w-40">
            <QuickAdd variants={product.variants} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  savedIds = [],
}: {
  products: ProductCardType[];
  savedIds?: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} saved={savedIds.includes(p.id)} />
      ))}
    </div>
  );
}
