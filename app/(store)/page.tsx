import Link from "next/link";
import { Scissors, ShieldCheck, RotateCcw, Truck, Headphones, Star, Quote } from "lucide-react";
import { prisma } from "@/lib/db";
import { getHomeSections } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { placeholderUrl } from "@/lib/images";
import { ProductGrid } from "@/components/store/product-card";
import { NewsletterForm } from "@/components/store/newsletter-form";
import HeroSculpture from "@/components/store/hero-sculpture-lazy";
import { SectionHeading, ButtonLink } from "@/components/ui";

const values = [
  { icon: Scissors, title: "Premium Fabric", text: "Hand-selected cloth and considered construction in every piece." },
  { icon: ShieldCheck, title: "Secure Payments", text: "UPI, cards, netbanking and COD with encrypted checkout." },
  { icon: RotateCcw, title: "Easy Returns", text: "7-day returns on eligible items, refunded after inspection." },
  { icon: Truck, title: "Reliable Delivery", text: "Dispatched within 48 hours across India with live tracking." },
  { icon: Headphones, title: "Concierge Support", text: "Styling and sizing help from our customer care team." },
];

export default async function HomePage() {
  const [settings, sections, testimonials, reviewAgg] = await Promise.all([
    getSettings(),
    getHomeSections(),
    prisma.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { product: { select: { name: true } } },
    }),
    prisma.review.aggregate({ where: { status: "APPROVED" }, _avg: { rating: true }, _count: { _all: true } }),
  ]);

  const heroImage = settings["hero.image"] || placeholderUrl("Autumn / Winter", { sub: "Editorial Campaign", w: 1600, h: 1100 });
  const avgRating = reviewAgg._avg.rating ? reviewAgg._avg.rating.toFixed(1) : "4.8";
  const reviewCount = reviewAgg._count._all || 128;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[78vh] overflow-hidden bg-obsidian text-ivory">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt="MAISON HOMME campaign"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/85 via-obsidian/40 to-transparent" />
        <div className="container-wide relative flex min-h-[78vh] flex-col justify-center py-24">
          <div className="max-w-2xl animate-fade-up">
            <span className="mb-5 inline-block text-[11px] font-semibold uppercase tracking-[0.4em] text-gold">
              Autumn / Winter Collection
            </span>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {settings["hero.heading"]}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ivory/80">
              {settings["hero.subheading"]}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href={settings["hero.ctaPrimaryHref"]} variant="gold" size="lg">
                {settings["hero.ctaPrimaryLabel"]}
              </ButtonLink>
              <ButtonLink
                href={settings["hero.ctaSecondaryHref"]}
                size="lg"
                className="border border-ivory/40 text-ivory hover:bg-ivory hover:text-obsidian"
              >
                {settings["hero.ctaSecondaryLabel"]}
              </ButtonLink>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 top-0 hidden w-[44%] lg:block" aria-hidden>
          <HeroSculpture />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-white">
        <div className="container-wide grid grid-cols-2 gap-6 py-6 text-center text-[11px] uppercase tracking-[0.18em] text-graphite md:grid-cols-4">
          <span>Free shipping over ₹1,499</span>
          <span>7-day easy returns</span>
          <span>Cash on delivery</span>
          <span>Rated {avgRating}/5 by {reviewCount}+ men</span>
        </div>
      </section>

      {/* Categories */}
      <section className="container-wide py-20">
        <SectionHeading
          eyebrow="Shop by Category"
          title="Dress for Every Occasion"
          align="left"
          action={
            <ButtonLink href="/collections/all" variant="outline" size="sm">
              View all
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {sections.categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className={`group relative overflow-hidden bg-sand ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <div className={i === 0 ? "aspect-square" : "aspect-[4/5]"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.imageUrl || placeholderUrl(cat.name, { sub: "Collection" })}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <span className="text-sm font-medium uppercase tracking-[0.16em] text-ivory">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      {sections.newArrivals.length > 0 && (
        <section className="container-wide py-16">
          <SectionHeading
            eyebrow="Just In"
            title="New Arrivals"
            align="left"
            action={
              <ButtonLink href="/collections/new-arrivals" variant="outline" size="sm">
                Shop new
              </ButtonLink>
            }
          />
          <ProductGrid products={sections.newArrivals} />
        </section>
      )}

      {/* Editorial campaign */}
      <section className="my-20 grid lg:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={placeholderUrl("Boardroom", { sub: "To After Hours", w: 1200, h: 1400 })}
            alt="From boardroom to after hours"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center bg-obsidian px-8 py-20 text-ivory sm:px-16">
          <span className="mb-5 text-[11px] font-semibold uppercase tracking-[0.4em] text-gold">The Edit</span>
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">FROM BOARDROOM TO AFTER HOURS</h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/75">
            Tailoring that moves with you. Sharp enough for the meeting, effortless enough for the
            evening. Build a wardrobe that works as hard as you do.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href="/collections/blazers-suits" variant="gold" size="lg">
              Shop Tailoring
            </ButtonLink>
            <ButtonLink href="/collections/shirts" size="lg" className="border border-ivory/40 text-ivory hover:bg-ivory hover:text-obsidian">
              Shop Shirts
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      {sections.bestSellers.length > 0 && (
        <section className="container-wide py-16">
          <SectionHeading
            eyebrow="Most Wanted"
            title="Best Sellers"
            align="left"
            action={
              <ButtonLink href="/collections/best-sellers" variant="outline" size="sm">
                Shop best sellers
              </ButtonLink>
            }
          />
          <ProductGrid products={sections.bestSellers} />
        </section>
      )}

      {/* Why shop with us */}
      <section className="bg-white py-20">
        <div className="container-wide">
          <SectionHeading eyebrow="The Promise" title="Why Shop With Us" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((v) => (
              <div key={v.title} className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">{v.title}</h3>
                <p className="text-xs leading-relaxed text-graphite">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="container-wide py-20">
        <SectionHeading eyebrow="Verified Reviews" title="What Our Customers Say" />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="flex flex-col gap-4 border border-line bg-white p-7">
              <Quote className="h-6 w-6 text-gold" />
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-charcoal">{t.body}</blockquote>
              <figcaption className="mt-auto text-xs text-graphite">
                {t.authorName} · {t.product.name}
                {t.isVerifiedPurchase && <span className="ml-2 text-success">✓ Verified</span>}
              </figcaption>
            </figure>
          ))}
          {testimonials.length === 0 && (
            <p className="col-span-3 text-center text-sm text-graphite">
              Reviews appear here once customers rate their purchases.
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {["Tailoring", "Shirts", "Denim", "Occasion", "Casual", "Accessories"].map((label) => (
            <div key={label} className="relative aspect-square overflow-hidden bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={placeholderUrl(label, { sub: "@maisonhomme", w: 500, h: 500 })}
                alt={label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-obsidian py-20 text-ivory">
        <div className="container-wide grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl">Join the house list</h2>
            <p className="mt-4 max-w-md text-sm text-ivory/70">
              Be first to shop new collections and private sales. Unsubscribe anytime.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
