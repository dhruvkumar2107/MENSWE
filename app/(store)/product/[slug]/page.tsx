import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductViewer, type ViewerProduct } from "@/components/store/product-viewer";
import { ProductGrid } from "@/components/store/product-card";
import { ReviewForm } from "@/components/store/review-form";
import { SectionHeading } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };
  return {
    title: data.product.seoTitle || `${data.product.name} | MAISON HOMME`,
    description: data.product.seoDescription || data.product.shortDescription || undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!data) notFound();

  const { product, rating, reviewCount, reviews } = data;
  const related = await getRelatedProducts(product.id, product.categoryId, 4);

  const viewer: ViewerProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    parentSku: product.parentSku,
    price: product.price,
    salePrice: product.salePrice,
    description: product.description,
    fabric: product.fabric,
    careInstructions: product.careInstructions,
    fit: product.fit,
    occasion: product.occasion,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isLimitedEdition: product.isLimitedEdition,
    variants: product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      priceOverride: v.priceOverride,
      available: Math.max(0, v.stock - v.reserved),
      sku: v.sku,
    })),
    images: product.images.map((i) => ({ url: i.url, alt: i.alt, color: i.color })),
    rating,
    reviewCount,
    categoryName: product.category.name,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images[0]?.url,
    description: product.description,
    sku: product.parentSku,
    brand: { "@type": "Brand", name: product.brand?.name ?? "MAISON HOMME" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: ((product.salePrice ?? product.price) / 100).toFixed(2),
      availability: rating >= 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: reviewCount > 0 ? { "@type": "AggregateRating", ratingValue: rating, reviewCount } : undefined,
  };

  return (
    <div className="container-wide py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-graphite">
        <Link href="/" className="hover:text-obsidian">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/collections/${product.category.slug}`} className="hover:text-obsidian">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-obsidian">{product.name}</span>
      </nav>

      <ProductViewer product={viewer} pricePerUnit />

      {/* Reviews */}
      <section id="reviews" className="mt-20 scroll-mt-24">
        <SectionHeading eyebrow="Verified Reviews" title={`${reviewCount} Reviews`} align="left" />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <article key={r.id} className="border border-line bg-white p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={i < r.rating ? "h-3.5 w-3.5 fill-gold text-gold" : "h-3.5 w-3.5 text-line"} />
                      ))}
                    </span>
                    <span className="text-sm font-medium">{r.title || "Review"}</span>
                  </div>
                  {r.isVerifiedPurchase && <span className="text-[10px] uppercase tracking-wider text-success">✓ Verified</span>}
                </div>
                <p className="text-sm leading-relaxed text-charcoal">{r.body}</p>
                <p className="mt-3 text-xs text-graphite">
                  {r.authorName} · {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                {r.adminReply && (
                  <div className="mt-4 border-l-2 border-gold bg-sand/60 p-3 text-xs text-graphite">
                    <span className="font-semibold text-obsidian">MAISON HOMME: </span>
                    {r.adminReply}
                  </div>
                )}
              </article>
            ))}
            {reviews.length === 0 && (
              <p className="border border-line bg-white p-6 text-sm text-graphite">
                No reviews yet — be the first to share your experience.
              </p>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            {user ? (
              <ReviewForm productId={product.id} productSlug={product.slug} userName={user.name.split(" ")[0]} />
            ) : (
              <div className="border border-line bg-white p-6 text-center">
                <p className="text-sm text-graphite">Sign in to review this product</p>
                <Link href="/account/login" className="mt-4 inline-block border border-obsidian px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="Complete the Look" title="You May Also Like" align="left" />
          <ProductGrid products={related} />
        </section>
      )}

      <p className="mt-10 text-center text-xs text-graphite">MRP inclusive of all taxes.</p>
    </div>
  );
}