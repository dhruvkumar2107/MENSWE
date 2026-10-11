import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { listProducts, getFacets, type ProductQuery } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { ProductGrid, ProductListRow } from "@/components/store/product-card";
import { ViewToggle } from "@/components/store/view-toggle";
import { MobileFilters } from "@/components/store/mobile-filters";
import { SortSelect } from "@/components/store/sort-select";
import { EmptyState } from "@/components/ui";

type ParamMap = Record<string, string>;

export function buildHref(basePath: string, params: ParamMap, overrides: ParamMap): string {
  const url = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "") url.set(k, v);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v && v !== "") url.set(k, v);
    else url.delete(k);
  }
  url.delete("page");
  const qs = url.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Popularity" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "discount", label: "Discount" },
];

export function toQuery(params: ParamMap): ProductQuery {
  const split = (v?: string) =>
    v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  return {
    search: params.q || undefined,
    categorySlug: params.cat === "all" ? undefined : params.cat || undefined,
    collection: params.collection || undefined,
    sizes: split(params.size),
    colors: split(params.color),
    fabrics: split(params.fabric),
    fits: split(params.fit),
    occasions: split(params.occasion),
    brandSlugs: split(params.brand),
    minPrice: params.min ? Number(params.min) : undefined,
    maxPrice: params.max ? Number(params.max) : undefined,
    inStockOnly: params.in_stock === "1",
    onSale: params.on_sale === "1",
    sort: (params.sort as ProductQuery["sort"]) || "newest",
    page: params.page ? Number(params.page) : 1,
  };
}

export function Facet({
  basePath,
  params,
  label,
  keyName,
  options,
}: {
  basePath: string;
  params: ParamMap;
  label: string;
  keyName: "size" | "color" | "fabric" | "fit" | "occasion" | "brand";
  options: { label: string; value: string }[];
}) {
  const active = (params[keyName] || "").split(",").filter(Boolean);
  const toggle = (value: string) => {
    const next = active.includes(value)
      ? active.filter((v) => v !== value).join(",")
      : [...active, value].join(",");
    return buildHref(basePath, params, { [keyName]: next });
  };
  if (options.length === 0) return null;
  return (
    <div className="border-t border-line py-5">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">{label}</h3>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <Link
            key={opt.value}
            href={toggle(opt.value)}
            className={cn(
              "flex items-center gap-2 text-sm",
              active.includes(opt.value) ? "font-medium text-obsidian" : "text-graphite hover:text-obsidian",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-4 w-4 items-center justify-center border",
                active.includes(opt.value) ? "border-obsidian bg-obsidian" : "border-line bg-white",
              )}
            >
              {active.includes(opt.value) && <span className="h-2 w-2 bg-gold" />}
            </span>
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function CatalogView({
  basePath,
  params,
  title,
  eyebrow,
  description,
}: {
  basePath: string;
  params: ParamMap;
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  const query = toQuery(params);
  const [facets, categories, currentCategory] = await Promise.all([
    getFacets(),
    prisma.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { sortOrder: "asc" } }),
    params.cat && params.cat !== "all"
      ? prisma.category.findUnique({ where: { slug: params.cat }, include: { children: true } })
      : Promise.resolve(null),
  ]);

  if (currentCategory) {
    query.categoryIds = [currentCategory.id, ...currentCategory.children.map((c) => c.id)];
    query.categorySlug = undefined;
  }
  const result = await listProducts(query);

  const activeFilters = (() => {
    const chips: { label: string; href: string }[] = [];
    if (params.q) chips.push({ label: `“${params.q}”`, href: buildHref(basePath, params, { q: "" }) });
    if (params.size) params.size.split(",").forEach((s) => chips.push({ label: `Size ${s}`, href: buildHref(basePath, params, { size: params.size.split(",").filter((x) => x !== s).join(",") }) }));
    if (params.color) params.color.split(",").forEach((c) => chips.push({ label: c, href: buildHref(basePath, params, { color: params.color.split(",").filter((x) => x !== c).join(",") }) }));
    if (params.min || params.max) chips.push({ label: "Price range", href: buildHref(basePath, params, { min: "", max: "" }) });
    if (params.in_stock === "1") chips.push({ label: "In stock", href: buildHref(basePath, params, { in_stock: "" }) });
    if (params.on_sale === "1") chips.push({ label: "On sale", href: buildHref(basePath, params, { on_sale: "" }) });
    return chips.filter((c) => c.label !== "" && c.label !== "Size " && c.label !== "Price range ");
  })();

  const sortHref = (value: string) => buildHref(basePath, params, { sort: value });

  const page = result.page;
  const pages = result.pages;

  const filterGroup = (
    <div>
      <h3 className="border-t border-line py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
        Category
      </h3>
      <div className="flex flex-col">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref(basePath, params, { cat: c.slug })}
            className={cn("border-l-2 py-2 pl-3 text-sm", params.cat === c.slug ? "border-gold font-medium" : "border-transparent text-graphite hover:text-obsidian")}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <Facet basePath={basePath} params={params} label="Size" keyName="size" options={facets.sizes.map((s) => ({ label: s, value: s }))} />
      <Facet basePath={basePath} params={params} label="Colour" keyName="color" options={facets.colors.map((c) => ({ label: c, value: c }))} />
      <Facet basePath={basePath} params={params} label="Fabric" keyName="fabric" options={facets.fabrics.map((f) => ({ label: f, value: f }))} />
      <Facet basePath={basePath} params={params} label="Fit" keyName="fit" options={facets.fits.map((f) => ({ label: f, value: f }))} />
      <Facet basePath={basePath} params={params} label="Occasion" keyName="occasion" options={facets.occasions.map((f) => ({ label: f, value: f }))} />
      {facets.brands.length > 0 && (
        <Facet basePath={basePath} params={params} label="Brand" keyName="brand" options={facets.brands.map((b) => ({ label: b.name, value: b.slug }))} />
      )}
      <div className="border-t border-line py-5">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">Price (₹)</h3>
        <form action={basePath} method="GET" className="flex items-center gap-2">
          <input
            name="min"
            type="number"
            defaultValue={params.min || ""}
            placeholder="Min"
            className="h-9 w-full border border-line bg-white px-2 text-xs focus:border-obsidian focus:outline-none"
          />
          <span className="text-graphite">–</span>
          <input
            name="max"
            type="number"
            defaultValue={params.max || ""}
            placeholder="Max"
            className="h-9 w-full border border-line bg-white px-2 text-xs focus:border-obsidian focus:outline-none"
          />
          <button type="submit" className="h-9 border border-obsidian px-3 text-[10px] font-semibold uppercase">Go</button>
        </form>
        <div className="mt-4 flex flex-col gap-2">
          <Link href={buildHref(basePath, params, { in_stock: params.in_stock === "1" ? "" : "1" })} className={cn("text-sm", params.in_stock === "1" ? "font-medium" : "text-graphite")}>
            In stock only
          </Link>
          <Link href={buildHref(basePath, params, { on_sale: params.on_sale === "1" ? "" : "1" })} className={cn("text-sm", params.on_sale === "1" ? "font-medium" : "text-graphite")}>
            On sale
          </Link>
        </div>
      </div>
    </div>
  );

  if (result.total === 0) {
    return (
      <div className="container-wide py-16">
        <header className="mb-8 flex flex-col gap-2">
          {eyebrow && <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">{eyebrow}</span>}
          <h1 className="font-display text-4xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm text-graphite">{description}</p>}
        </header>
        <EmptyState
          title="No products found"
          description="Try removing some filters or browse the full collection."
          action={
            <Link href={buildHref(basePath, {}, {})} className="border border-obsidian px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
              Clear all filters
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-wide py-12">
      <header className="mb-10 flex flex-col gap-2">
        {eyebrow && <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">{eyebrow}</span>}
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-graphite">{description}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="hidden lg:block">{filterGroup}</aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="lg:hidden">
              <MobileFilters>{filterGroup}</MobileFilters>
            </div>
            <div className="flex items-center gap-2">
              {activeFilters.length > 0 && (
                <Link href={buildHref(basePath, {}, {})} className="text-xs text-graphite underline">
                  Clear all
                </Link>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-graphite">
              Sort
              <SortSelect
              value={sortHref(params.sort || "newest")}
              options={sortOptions.map((o) => ({ value: sortHref(o.value), label: o.label }))}
            />
            </label>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {activeFilters.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="flex items-center gap-1.5 border border-line bg-white px-3 py-1.5 text-xs"
                >
                  {chip.label}
                  <X className="h-3 w-3 text-graphite" />
                </Link>
              ))}
            </div>
          )}

          <ViewToggle
            count={result.total}
            grid={<ProductGrid products={result.items} />}
            list={result.items.map((p) => <ProductListRow key={p.id} product={p} />)}
          />

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={buildHref(basePath, params, { page: String(page - 1) })} className="flex h-10 w-10 items-center justify-center border border-line bg-white hover:border-obsidian" aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages)
                .map((p) => (
                  <Link
                    key={p}
                    href={buildHref(basePath, params, { page: String(p) })}
                    aria-current={p === page ? "page" : undefined}
                    className={cn(
                      "flex h-10 min-w-10 items-center justify-center border px-2 text-sm",
                      p === page ? "border-obsidian bg-obsidian text-ivory" : "border-line bg-white hover:border-obsidian",
                    )}
                  >
                    {p}
                  </Link>
                ))}
              {page < pages && (
                <Link href={buildHref(basePath, params, { page: String(page + 1) })} className="flex h-10 w-10 items-center justify-center border border-line bg-white hover:border-obsidian" aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}