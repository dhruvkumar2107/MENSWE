/**
 * Demo data seed for MAISON HOMME.
 *
 * Everything created here is marked `isDemo = true` or otherwise labelled as
 * demo content so it can be distinguished from production records. Re-running
 * the seed is safe: rows are upserted by their unique keys.
 *
 * Creates:
 *  - Roles: SUPER_ADMIN + STORE_MANAGER accounts (see credentials below)
 *  - Demo customer accounts
 *  - Category tree, brand, ~20 products with colour/size variants + stock
 *  - Coupons, PIN-code coverage, site settings, demo reviews, subscribers
 *
 * Admin credentials (DEMO ONLY — change before going live):
 *   admin@maisonhomme.in  /  Admin@123
 *   manager@maisonhomme.in / Manager@123
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const R = (rupees: number) => Math.round(rupees * 100); // ₹ → paise

type VariantSpec = {
  color: string;
  hex: string;
  sizes: Record<string, number>; // size → stock
};

type ProductSpec = {
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  salePrice?: number;
  fabric: string;
  fit: string;
  occasion: string;
  tags?: string;
  variants: VariantSpec[];
  isNew?: boolean;
  isBest?: boolean;
  isLimited?: boolean;
  isFeatured?: boolean;
};

const CATEGORIES: { name: string; slug: string; image?: string; children?: { name: string; slug: string }[] }[] = [
  {
    name: "Shirts",
    slug: "shirts",
    children: [
      { name: "Formal Shirts", slug: "formal-shirts" },
      { name: "Casual Shirts", slug: "casual-shirts" },
    ],
  },
  { name: "T-Shirts & Polos", slug: "tshirts-polos" },
  { name: "Trousers & Chinos", slug: "trousers" },
  { name: "Denim", slug: "denim" },
  { name: "Blazers & Suits", slug: "blazers-suits" },
  { name: "Wedding & Occasion", slug: "wedding-occasion" },
  { name: "Ethnic Wear", slug: "ethnic-wear" },
  { name: "Jackets", slug: "jackets" },
  { name: "Accessories", slug: "accessories" },
];

const TS_SHIRTS = ["S", "M", "L", "XL", "XXL"];
const TS_BOTTOMS = ["30", "32", "34", "36"];
const stock = (sizes: string[], qty = 12) =>
  Object.fromEntries(sizes.map((s) => [s, qty]));
const lowStock = (sizes: string[]) => Object.fromEntries(sizes.map((s, i) => [s, i === 0 ? 2 : 6]));

const PRODUCTS: ProductSpec[] = [
  {
    name: "Luxury Slim Fit Formal Shirt",
    slug: "luxury-slim-fit-formal-shirt",
    category: "formal-shirts",
    description: "A tailored formal essential in wrinkle-resistant cotton. Sharp lapel, mother-of-pearl buttons and a clean spread collar for the boardroom.",
    price: 2799,
    salePrice: 2099,
    fabric: "100% Egyptian Cotton",
    fit: "Slim Fit",
    occasion: "Office",
    tags: "formal,office,cotton",
    isNew: true,
    isBest: true,
    variants: [
      { color: "White", hex: "#F5F5F5", sizes: { ...stock(TS_SHIRTS, 16), S: 3, XXL: 1 } },
      { color: "Navy", hex: "#1F2A44", sizes: stock(TS_SHIRTS) },
      { color: "Sky Blue", hex: "#A8C4E2", sizes: lowStock(TS_SHIRTS) },
      { color: "Black", hex: "#1a1a1a", sizes: stock(TS_SHIRTS, 8) },
    ],
  },
  {
    name: "Classic Oxford Casual Shirt",
    slug: "classic-oxford-casual-shirt",
    category: "casual-shirts",
    description: "The weekend favourite. Brushed oxford weave, button-down collar and a relaxed fit that dresses up or down with ease.",
    price: 2499,
    fabric: "Cotton Oxford",
    fit: "Regular Fit",
    occasion: "Casual",
    tags: "casual,oxford,weekend",
    isFeatured: true,
    isBest: true,
    variants: [
      { color: "Ivory", hex: "#EDE7DC", sizes: stock(TS_SHIRTS) },
      { color: "Olive", hex: "#6B6A44", sizes: lowStock(TS_SHIRTS) },
      { color: "Brick", hex: "#9C4A3A", sizes: stock(TS_SHIRTS, 10) },
    ],
  },
  {
    name: "Linen Weekend Casual Shirt",
    slug: "linen-weekend-casual-shirt",
    category: "casual-shirts",
    description: "Breathable pure linen with a lived-in drape. Made for long lunches and coastal escapes.",
    price: 3199,
    salePrice: 2559,
    fabric: "100% Linen",
    fit: "Relaxed Fit",
    occasion: "Casual",
    tags: "linen,summer,casual",
    isNew: true,
    variants: [
      { color: "Sand", hex: "#D9C9A3", sizes: stock(TS_SHIRTS) },
      { color: "Off White", hex: "#F0EBDF", sizes: stock(TS_SHIRTS) },
    ],
  },
  {
    name: "Supima Cotton Pique Polo",
    slug: "supima-cotton-pique-polo",
    category: "tshirts-polos",
    description: "Ultra-soft supima pique with a ribbed collar and hem. The smart-casual answer to a t-shirt.",
    price: 1799,
    fabric: "Supima Cotton",
    fit: "Modern Fit",
    occasion: "Casual",
    tags: "polo,pique,supima",
    isBest: true,
    variants: [
      { color: "Black", hex: "#1a1a1a", sizes: stock(TS_SHIRTS, 20) },
      { color: "Forest", hex: "#25472D", sizes: stock(TS_SHIRTS) },
      { color: "Burgundy", hex: "#5E1F2E", sizes: lowStock(TS_SHIRTS) },
      { color: "Grey", hex: "#8A8A8A", sizes: stock(TS_SHIRTS) },
    ],
  },
  {
    name: "Heavyweight Graphic Tee",
    slug: "heavyweight-graphic-tee",
    category: "tshirts-polos",
    description: "240 GSM combed cotton tee with a tonal house crest print. Boxier cut, reinforced shoulder seams.",
    price: 1299,
    salePrice: 1049,
    fabric: "Combed Cotton 240 GSM",
    fit: "Oversized Fit",
    occasion: "Casual",
    tags: "tee,graphic,oversized",
    isNew: true,
    variants: [
      { color: "White", hex: "#F5F5F5", sizes: stock(TS_SHIRTS, 20) },
      { color: "Obsidian", hex: "#101010", sizes: stock(TS_SHIRTS, 20) },
      { color: "Mocha", hex: "#6B5646", sizes: stock(TS_SHIRTS) },
    ],
  },
  {
    name: "Stretch Slub Jersey Polo",
    slug: "stretch-slub-jersey-polo",
    category: "tshirts-polos",
    description: "A modern polo in breathable slub jersey with a hint of stretch and a barely-there sheen.",
    price: 1999,
    fabric: "Slub Jersey (95% Cotton, 5% Elastane)",
    fit: "Slim Fit",
    occasion: "Office",
    tags: "polo,slub,stretch",
    isFeatured: true,
    variants: [
      { color: "Navy", hex: "#1F2A44", sizes: stock(TS_SHIRTS) },
      { color: "Teal", hex: "#2A5A5A", sizes: lowStock(TS_SHIRTS) },
    ],
  },
  {
    name: "Slim Fit Stretch Chino",
    slug: "slim-fit-stretch-chino",
    category: "trousers",
    description: "4-way stretch chinos in a sharp slim cut. Engineered for meetings and the metro in equal measure.",
    price: 2599,
    fabric: "Cotton Stretch Twill",
    fit: "Slim Fit",
    occasion: "Office",
    tags: "chino,slim,stretch,office",
    isBest: true,
    variants: [
      { color: "Beige", hex: "#D8C9A8", sizes: stock(TS_BOTTOMS) },
      { color: "Charcoal", hex: "#303030", sizes: stock(TS_BOTTOMS) },
      { color: "Stone", hex: "#B7AF9B", sizes: lowStock(TS_BOTTOMS) },
      { color: "Olive", hex: "#6B6A44", sizes: stock(TS_BOTTOMS) },
    ],
  },
  {
    name: "Tapered Herringbone Trouser",
    slug: "tapered-herringbone-trouser",
    category: "trousers",
    description: "Dress trousers in a fine herringbone weave with a tailored taper and half-canvas construction.",
    price: 3499,
    salePrice: 2799,
    fabric: "Wool Blend (72% Polyester, 28% Viscose)",
    fit: "Tapered Fit",
    occasion: "Office",
    tags: "trouser,herringbone,formal",
    isNew: true,
    variants: [
      { color: "Grey Melange", hex: "#9C9891", sizes: stock(TS_BOTTOMS) },
      { color: "Midnight", hex: "#232A36", sizes: stock(TS_BOTTOMS) },
    ],
  },
  {
    name: "Premium Washed Denim",
    slug: "premium-washed-denim",
    category: "denim",
    description: "14oz raw-feel denim with a garment wash, in a classic straight fit that only gets better with age.",
    price: 2999,
    fabric: "100% Cotton Denim 14oz",
    fit: "Straight Fit",
    occasion: "Casual",
    tags: "denim,jeans,washed",
    isBest: true,
    variants: [
      { color: "Indigo", hex: "#31446E", sizes: stock(TS_BOTTOMS) },
      { color: "Mid Wash", hex: "#6A7FA8", sizes: stock(TS_BOTTOMS) },
      { color: "Black", hex: "#1a1a1a", sizes: lowStock(TS_BOTTOMS) },
    ],
  },
  {
    name: "Slim Dark Denim",
    slug: "slim-dark-denim",
    category: "denim",
    description: "Clean, dark and sharp. A versatile slim jean that pairs with everything from tee to blazer.",
    price: 2799,
    salePrice: 2239,
    fabric: "Cotton-Elastane Denim",
    fit: "Slim Fit",
    occasion: "Casual",
    tags: "denim,slim,dark",
    isNew: true,
    variants: [
      { color: "Jet Black", hex: "#111111", sizes: stock(TS_BOTTOMS) },
      { color: "Deep Indigo", hex: "#28365C", sizes: stock(TS_BOTTOMS) },
    ],
  },
  {
    name: "Unstructured Linen Blazer",
    slug: "unstructured-linen-blazer",
    category: "blazers-suits",
    description: "A relaxed half-canvas blazer with a soft shoulder. Dresses a tee up and a suit down.",
    price: 6499,
    salePrice: 5199,
    fabric: "Linen Blend",
    fit: "Relaxed Fit",
    occasion: "Party",
    tags: "blazer,linen,unstructured",
    isLimited: true,
    isFeatured: true,
    variants: [
      { color: "Natural", hex: "#D6CBAC", sizes: { S: 6, M: 8, L: 8, XL: 5, XXL: 3 } },
      { color: "Navy", hex: "#1F2A44", sizes: { S: 4, M: 6, L: 6, XL: 5, XXL: 2 } },
    ],
  },
  {
    name: "Wool-Mix Structured Suit",
    slug: "wool-mix-structured-suit",
    category: "blazers-suits",
    description: "A two-piece suit with structured shoulders and a notch lapel, in a year-round wool mix with a subtle twill.",
    price: 18999,
    salePrice: 15199,
    fabric: "Wool Rich Blend",
    fit: "Structured Fit",
    occasion: "Wedding",
    tags: "suit,formal,wedding,two-piece",
    isFeatured: true,
    variants: [
      { color: "Charcoal", hex: "#303030", sizes: { 38: 4, 40: 6, 42: 6, 44: 3 } },
      { color: "Midnight", hex: "#232A36", sizes: { 38: 3, 40: 5, 42: 5, 44: 2 } },
    ],
  },
  {
    name: "Velvet Evening Blazer",
    slug: "velvet-evening-blazer",
    category: "wedding-occasion",
    description: "Sumptuous cotton-velvet blazer for receptions that demand a statement. Shawl collar, satin lining.",
    price: 7999,
    salePrice: 6399,
    fabric: "Cotton Velvet",
    fit: "Regular Fit",
    occasion: "Wedding",
    tags: "velvet,blazer,reception,wedding",
    isLimited: true,
    isBest: true,
    variants: [
      { color: "Bordeaux", hex: "#5E1F2E", sizes: { S: 5, M: 7, L: 7, XL: 4, XXL: 2 } },
      { color: "Emerald", hex: "#14473A", sizes: { S: 3, M: 5, L: 5, XL: 3, XXL: 1 } },
    ],
  },
  {
    name: "Printed Bandhgala",
    slug: "printed-bandhgala",
    category: "ethnic-wear",
    description: "A celebration-ready bandhgala with an all-over tonal print and gold-tone buttons. Cut for the sangeet floor.",
    price: 5499,
    salePrice: 4399,
    fabric: "Cotton Blend",
    fit: "Regular Fit",
    occasion: "Wedding",
    tags: "bandhgala,ethnic,wedding",
    isNew: true,
    variants: [
      { color: "Bottle Green", hex: "#1E4D3C", sizes: { S: 5, M: 8, L: 8, XL: 5, XXL: 3 } },
      { color: "Maroon", hex: "#6E2233", sizes: { S: 4, M: 6, L: 6, XL: 4, XXL: 2 } },
    ],
  },
  {
    name: "Kurta Set with Nehru Jacket",
    slug: "kurta-set-with-nehru-jacket",
    category: "ethnic-wear",
    description: "A three-piece in soft chanderi-inspired weave: kurta, pyjama and a signature Nehru jacket.",
    price: 6999,
    fabric: "Cotton Silk",
    fit: "Relaxed Fit",
    occasion: "Wedding",
    tags: "kurta,nehru,set,ethnic",
    variants: [
      { color: "Ivory & Gold", hex: "#EDE0C4", sizes: { M: 6, L: 8, XL: 6, XXL: 3 } },
      { color: "Sage", hex: "#8B9B8B", sizes: { M: 5, L: 7, XL: 5, XXL: 2 } },
    ],
  },
  {
    name: "Quilted Bomber Jacket",
    slug: "quilted-bomber-jacket",
    category: "jackets",
    description: "A padded bomber with a matte shell and tonal quilting. The outer layer for crisp evenings.",
    price: 4499,
    salePrice: 3599,
    fabric: "Polyester Shell, Cotton Fill",
    fit: "Regular Fit",
    occasion: "Casual",
    tags: "bomber,jacket,quilted",
    isNew: true,
    variants: [
      { color: "Black", hex: "#1a1a1a", sizes: TS_SHIRTS.reduce((a, s) => ({ ...a, [s]: s === "XL" ? 3 : 8 }), {}) },
      { color: "Olive", hex: "#6B6A44", sizes: TS_SHIRTS.reduce((a, s) => ({ ...a, [s]: 6 }), {}) },
    ],
  },
  {
    name: "Leather-Look Moto Jacket",
    slug: "leather-look-moto-jacket",
    category: "jackets",
    description: "A vegan-leather moto with asymmetric zip and quilted panels. For after-dark plans.",
    price: 5999,
    salePrice: 4799,
    fabric: "Polyurethane Coated Fabric",
    fit: "Slim Fit",
    occasion: "Party",
    tags: "moto,jacket,leather",
    isLimited: true,
    variants: [
      { color: "Obsidian", hex: "#101010", sizes: { S: 4, M: 6, L: 6, XL: 4, XXL: 2 } },
      { color: "Tobacco", hex: "#8A5A33", sizes: { S: 2, M: 4, L: 4, XL: 3, XXL: 1 } },
    ],
  },
  {
    name: "Genuine Leather Belt",
    slug: "genuine-leather-belt",
    category: "accessories",
    description: "Full-grain leather belt with a brushed gold-tone buckle. Understated, tensile, built to last a decade.",
    price: 1499,
    salePrice: 1199,
    fabric: "Full-Grain Leather",
    fit: "One Size",
    occasion: "Office",
    tags: "belt,leather,accessory",
    isBest: true,
    variants: [
      { color: "Black", hex: "#1a1a1a", sizes: { ONE: 40 } },
      { color: "Tan", hex: "#B08968", sizes: { ONE: 30 } },
    ],
  },
  {
    name: "Silk Pocket Square Set",
    slug: "silk-pocket-square-set",
    category: "accessories",
    description: "A trio of hand-rolled silk pocket squares in classic prints. The finishing touch to any jacket.",
    price: 999,
    fabric: "Silk",
    fit: "One Size",
    occasion: "Wedding",
    tags: "pocket-square,silk,accessory",
    isFeatured: true,
    variants: [
      { color: "Ivory Set", hex: "#EDE0C4", sizes: { ONE: 25 } },
      { color: "Navy Set", hex: "#1F2A44", sizes: { ONE: 25 } },
    ],
  },
  {
    name: "Casual Knit Socks (3-Pack)",
    slug: "casual-knit-socks-3-pack",
    category: "accessories",
    description: "Fine-gauge cotton socks in a coordinated 3-pack. Reinforced heel and toe.",
    price: 599,
    salePrice: 479,
    fabric: "Cotton Blend",
    fit: "One Size",
    occasion: "Casual",
    tags: "socks,knit,pack",
    isNew: true,
    variants: [
      { color: "Assorted", hex: "#5A5A5A", sizes: { ONE: 60 } },
    ],
  },
];

const PINCODES: { code: string; city: string; state: string; etaDays: number; codAvailable?: boolean }[] = [
  { code: "110001", city: "New Delhi", state: "Delhi", etaDays: 4 },
  { code: "110019", city: "New Delhi", state: "Delhi", etaDays: 4 },
  { code: "400001", city: "Mumbai", state: "Maharashtra", etaDays: 3 },
  { code: "400063", city: "Mumbai", state: "Maharashtra", etaDays: 3 },
  { code: "560001", city: "Bengaluru", state: "Karnataka", etaDays: 4 },
  { code: "560034", city: "Bengaluru", state: "Karnataka", etaDays: 4 },
  { code: "700001", city: "Kolkata", state: "West Bengal", etaDays: 5 },
  { code: "600001", city: "Chennai", state: "Tamil Nadu", etaDays: 5 },
  { code: "500001", city: "Hyderabad", state: "Telangana", etaDays: 4 },
  { code: "380001", city: "Ahmedabad", state: "Gujarat", etaDays: 4 },
  { code: "411001", city: "Pune", state: "Maharashtra", etaDays: 3 },
  { code: "201301", city: "Noida", state: "Uttar Pradesh", etaDays: 4 },
  { code: "122001", city: "Gurugram", state: "Haryana", etaDays: 4 },
  { code: "682001", city: "Kochi", state: "Kerala", etaDays: 6 },
  { code: "226001", city: "Lucknow", state: "Uttar Pradesh", etaDays: 5 },
  // Non-serviceable example
  { code: "191111", city: "Pahalgam", state: "Jammu & Kashmir", etaDays: 9, codAvailable: false },
];

const COUPONS: { code: string; type: string; value: number; minCartValue: number; maxDiscount?: number; scope: string; categorySlug?: string; firstOrderOnly?: boolean }[] = [
  { code: "WELCOME10", type: "PERCENT", value: 1000, minCartValue: 99900, maxDiscount: 100000, scope: "ALL", firstOrderOnly: true },
  { code: "FLAT500", type: "FIXED", value: 50000, minCartValue: 249900, scope: "ALL" },
  { code: "FREESHIP", type: "FREE_SHIPPING", value: 0, minCartValue: 0, scope: "ALL" },
  { code: "SHIRT15", type: "PERCENT", value: 1500, minCartValue: 199900, maxDiscount: 150000, scope: "CATEGORY", categorySlug: "shirts" },
];

const SETTINGS: Record<string, string> = {
  "brand.name": "MAISON HOMME",
  "brand.tagline": "The Art of Dressing Well",
  "contact.email": "care@maisonhomme.in",
  "contact.phone": "+91 98100 00000",
  "hero.heading": "THE ART OF DRESSING WELL.",
  "hero.subheading": "Refined essentials. Modern silhouettes. Confidence in every detail.",
  "hero.ctaPrimaryLabel": "Explore the Collection",
  "hero.ctaPrimaryHref": "/collections/new-arrivals",
  "hero.ctaSecondaryLabel": "Shop Best Sellers",
  "hero.ctaSecondaryHref": "/collections/best-sellers",
  "announcement.messages":
    "Free shipping on orders above ₹1,499|New Autumn/Winter Collection is live|Flat 10% off your first order — code WELCOME10",
};

async function main() {
  console.log("Seeding MAISON HOMME demo data…");

  // --- Users / staff ---
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const managerHash = await bcrypt.hash("Manager@123", 10);
  const customerHash = await bcrypt.hash("Demo@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@maisonhomme.in" },
    update: {},
    create: {
      email: "admin@maisonhomme.in",
      name: "House Administrator",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });
  await prisma.user.upsert({
    where: { email: "manager@maisonhomme.in" },
    update: {},
    create: {
      email: "manager@maisonhomme.in",
      name: "Store Manager",
      role: "STORE_MANAGER",
      passwordHash: managerHash,
      emailVerified: true,
    },
  });
  for (const [email, name] of [
    ["rohan@example.com", "Rohan Mehta"],
    ["arjun@example.com", "Arjun Kapoor"],
    ["vikram@example.com", "Vikram Singh"],
  ] as const) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        phone: "9810000000",
        passwordHash: customerHash,
        role: "CUSTOMER",
        emailVerified: true,
      },
    });
  }

  // --- Categories ---
  for (const cat of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: `${cat.name} — premium menswear by MAISON HOMME.`,
        imageUrl: `/api/img?label=${encodeURIComponent(cat.name)}&sub=Collection&w=700&h=900`,
        sortOrder: CATEGORIES.findIndex((c) => c.slug === cat.slug),
        isActive: true,
      },
    });
    for (const child of cat.children ?? []) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { parentId: parent.id },
        create: {
          name: child.name,
          slug: child.slug,
          description: `${child.name} — premium menswear by MAISON HOMME.`,
          imageUrl: `/api/img?label=${encodeURIComponent(child.name)}&sub=Collection&w=700&h=900`,
          parentId: parent.id,
          sortOrder: 0,
          isActive: true,
        },
      });
    }
  }

  // --- Brand ---
  const brand = await prisma.brand.upsert({
    where: { slug: "maison-homme" },
    update: {},
    create: { name: "MAISON HOMME", slug: "maison-homme", isActive: true },
  });

  // --- Products ---
  let createdProducts = 0;
  for (const spec of PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { slug: spec.category } });
    if (!category) {
      console.warn(`  ! category not found for ${spec.name}: ${spec.category}`);
      continue;
    }
    const product = await prisma.product.upsert({
      where: { slug: spec.slug },
      update: {},
      create: {
        name: spec.name,
        slug: spec.slug,
        parentSku: `MH-${spec.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
        description: spec.description,
        shortDescription: spec.description.slice(0, 120),
        categoryId: category.id,
        brandId: brand.id,
        fabric: spec.fabric,
        fit: spec.fit,
        occasion: spec.occasion,
        careInstructions: "Machine wash cold. Do not bleach. Tumble dry low. Iron medium.",
        price: R(spec.price),
        salePrice: spec.salePrice ? R(spec.salePrice) : null,
        costPrice: Math.round(R(spec.price) * 0.55),
        taxRate: 500,
        lowStockThreshold: 5,
        tags: spec.tags ?? "",
        isPublished: true,
        isNewArrival: spec.isNew ?? false,
        isBestSeller: spec.isBest ?? false,
        isFeatured: spec.isFeatured ?? false,
        isLimitedEdition: spec.isLimited ?? false,
        isDemo: true,
        publishedAt: new Date(),
        seoTitle: `${spec.name} by MAISON HOMME`,
        seoDescription: spec.description.slice(0, 150),
      },
    });

    // images — one per colour (placeholder, replaced by real photography later)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    let pos = 0;
    for (const v of spec.variants) {
      for (const angle of ["front", "detail", "back"]) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: `/api/img?label=${encodeURIComponent(spec.name)}&sub=${encodeURIComponent(`${v.color} · ${angle}`)}&w=900&h=1200`,
            alt: `${spec.name} in ${v.color} (${angle})`,
            color: v.color,
            position: pos++,
          },
        });
      }
    }

    // variants (colour × size), atomic stock
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    for (const v of spec.variants) {
      for (const [size, qty] of Object.entries(v.sizes)) {
        const sku = `${product.parentSku}-${v.color.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${size}`;
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            color: v.color,
            colorHex: v.hex,
            size,
            stock: qty,
            reserved: 0,
            lowStockThreshold: 5,
            costPrice: product.costPrice,
            isActive: true,
          },
        });
      }
    }
    createdProducts += 1;
  }
  console.log(`  ✓ ${createdProducts} products`);

  // --- Coupons ---
  for (const c of COUPONS) {
    const categoryRow = c.categorySlug
      ? await prisma.category.findUnique({ where: { slug: c.categorySlug } })
      : null;
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        description: c.firstOrderOnly ? "10% off your first order" : undefined,
        type: c.type,
        value: c.value,
        minCartValue: c.minCartValue,
        maxDiscount: c.maxDiscount ?? null,
        scope: c.scope,
        categoryId: categoryRow?.id ?? null,
        firstOrderOnly: c.firstOrderOnly ?? false,
        perCustomerLimit: 1,
        usageLimit: 1000,
        isActive: true,
        startsAt: new Date(Date.now() - 86400000),
        endsAt: new Date(Date.now() + 90 * 86400000),
      },
    });
  }

  // --- Pincodes ---
  for (const p of PINCODES) {
    await prisma.pincode.upsert({
      where: { code: p.code },
      update: { etaDays: p.etaDays, codAvailable: p.codAvailable ?? p.code !== "191111" },
      create: {
        code: p.code,
        city: p.city,
        state: p.state,
        etaDays: p.etaDays,
        isServiceable: p.code !== "191111",
        codAvailable: p.codAvailable ?? true,
      },
    });
  }

  // --- Site settings ---
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // --- Demo reviews ---
  const reviewTargets = PRODUCTS.filter((p) => p.isBest || p.isFeatured).slice(0, 6);
  const demoUser = await prisma.user.findUnique({ where: { email: "rohan@example.com" } });
  let reviewCount = 0;
  for (const spec of reviewTargets) {
    const product = await prisma.product.findUnique({ where: { slug: spec.slug } });
    if (!product || !demoUser) continue;
    const existing = await prisma.review.findFirst({ where: { productId: product.id, userId: demoUser.id } });
    if (existing) continue;
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: demoUser.id,
        authorName: "Rohan M.",
        rating: 5,
        title: "Exceptional quality",
        body: "The fabric feels premium and the fit is exactly as described. Shipping was quick and the packaging felt luxury. Highly recommended.",
        status: "APPROVED",
        isVerifiedPurchase: true,
      },
    });
    reviewCount += 1;
  }
  console.log(`  ✓ ${reviewCount} demo reviews`);

  // --- Newsletter subscribers ---
  for (const email of ["first.customer@example.com", "style.scout@example.com"]) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, source: "seed", isActive: true, consent: true },
    });
  }

  // --- Content blocks ---
  const blocks: { key: string; type: string; title: string; subtitle: string; ctaLabel: string; ctaHref: string; position: number }[] = [
    { key: "campaign-boardroom", type: "CAMPAIGN", title: "FROM BOARDROOM TO AFTER HOURS", subtitle: "Tailoring that moves with you. Sharp enough for the meeting, effortless enough for the evening.", ctaLabel: "Shop Tailoring", ctaHref: "/collections/blazers-suits", position: 1 },
    { key: "campaign-linen", type: "CAMPAIGN", title: "LINEN SEASON", subtitle: "Lightweight, breathable, quietly confident.", ctaLabel: "Shop Casual Shirts", ctaHref: "/collections/casual-shirts", position: 2 },
  ];
  for (const b of blocks) {
    await prisma.contentBlock.upsert({
      where: { key: b.key },
      update: {},
      create: { key: b.key, type: b.type, title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel, ctaHref: b.ctaHref, position: b.position, isActive: true },
    });
  }

  console.log("\nSeed complete. Demo credentials:");
  console.log("  Admin:   admin@maisonhomme.in / Admin@123");
  console.log("  Manager: manager@maisonhomme.in / Manager@123");
  console.log("  Customer: rohan@example.com / Demo@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });