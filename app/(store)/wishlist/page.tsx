import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCard } from "@/lib/catalog";
import { ProductGrid } from "@/components/store/product-card";

export const metadata = { title: "Wishlist | MAISON HOMME" };

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-wide py-24 text-center">
        <h1 className="font-display text-4xl">Your Wishlist</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-graphite">
          Sign in to save your favourite pieces and revisit them any time.
        </p>
        <Link
          href="/account/login?next=/wishlist"
          className="mt-8 inline-block h-12 bg-obsidian px-8 text-xs font-medium uppercase leading-[3rem] tracking-[0.2em] text-ivory hover:bg-charcoal"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" } },
          variants: { where: { isActive: true }, orderBy: { size: "asc" } },
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const savedIds = items.map((i) => i.productId);
  const products = items.map((i) => toCard(i.product));

  return (
    <div className="container-wide py-14">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="font-display text-4xl">Your Wishlist</h1>
        <span className="text-xs uppercase tracking-[0.18em] text-graphite">{products.length} item{products.length === 1 ? "" : "s"}</span>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-graphite">Your wishlist is empty.</p>
          <Link href="/collections/all" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-obsidian underline">
            Explore the collection
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} savedIds={savedIds} />
      )}
    </div>
  );
}