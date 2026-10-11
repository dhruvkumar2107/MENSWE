# MAISON HOMME

A production-grade, full-stack premium menswear e-commerce platform for the Indian market — storefront, customer accounts, and a complete role-based back office. Prices are stored and rendered in INR (paise), payments run through Razorpay, and every piece of storefront content is editable from the admin panel.

Built with **Next.js 16** (App Router, Turbopack), **React 19**, **Prisma 6**, **Tailwind CSS v4**, and a small **react-three-fiber** 3D hero.

---

## Features

### Storefront
- Editorial homepage with a real-time 3D gold centrepiece (react-three-fiber / drei), animated hero, category tiles, featured rails.
- Catalog with faceted filtering (size, colour, fabric, fit, occasion, price, sale, in-stock), sorting, grid/list toggle, and pagination — `/collections/[slug]`, `/collections/all`, `/search`.
- Product detail pages: colour/size variant selection, stock awareness, image gallery, structured data (JSON-LD), approved reviews + review submission, related products.
- Cart and coupon codes, checkout with saved addresses, and order confirmation. Standard shipping thresholds and COD.
- Wishlist, order history, order detail with timeline, cancellations, returns/exchanges, address book, and profile management.
- Content pages (size guide, shipping, returns, FAQs, contact, about, privacy, terms) backed by editable settings/content blocks.

### Payments
- Razorpay order creation + client checkout, HMAC **signature verification** on the client callback, and a signed **webhook** handler (`payment.captured` / `payment.failed`) as the source of truth.
- Runs in a clearly-labelled **sandbox mode** when keys are absent — online payment is disabled and COD is offered instead. No payment is ever faked as successful.

### Inventory
- Transactional reserve → commit / release lifecycle so stock can never oversell across concurrent checkouts.
- Every change is written to an `InventoryMovement` ledger (reservation, release, stock-out, returns, manual adjustments).

### Back office (`/admin`)
- Role-based access control with six staff roles and granular permissions (see `lib/constants.ts`).
- Dashboard with live revenue, orders, AOV, customer and low-stock metrics plus a 14-day sales chart.
- Products (full edit form + variant management), Inventory (adjust + activate/deactivate), Orders (status workflow + tracking + timeline + refunds), Customers, Returns (process + restock), Reviews (moderate + reply), Coupons, Content & Settings (brand, hero, contact, shipping, social, SEO, policies, content blocks, FAQs), Reports, and Staff (role management).
- CSV export for orders and products, and an audit log for sensitive actions.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma 6 ORM — SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT session cookie (`jose`) + bcrypt hashing |
| Payments | Razorpay (orders, signature verify, webhooks) |
| Email | Nodemailer (console fallback when unconfigured) |
| 3D | three + @react-three/fiber + @react-three/drei |
| Tests | Node.js built-in test runner (`node:test`) |

---

## Getting started

```bash
# 1. Install (runs `prisma generate` automatically)
npm install

# 2. Configure environment
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
# then edit .env and set at least AUTH_SECRET

# 3. Create the database schema
npm run db:push

# 4. Seed demo data (products, categories, coupons, PIN codes, staff, reviews)
npm run db:seed

# 5. Run the dev server
npm run dev
```

Open http://localhost:3000 — and the back office at http://localhost:3000/admin.

### Demo credentials (change before going live)

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@maisonhomme.in` | `Admin@123` |
| Store manager | `manager@maisonhomme.in` | `Manager@123` |
| Customer | `rohan@example.com` | `Demo@123` |

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the test suite |
| `npm run db:push` | Push the schema to the database (no migration files) |
| `npm run db:migrate` | Create a dev migration |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the database and re-run migrations |

---

## Environment variables

See `.env.example`. Key variables:

- `DATABASE_URL` — SQLite (`file:./dev.db`) in dev; PostgreSQL connection string in production.
- `AUTH_SECRET` — long random string used to sign session tokens.
- `NEXT_PUBLIC_SITE_URL` — public site origin (used in metadata, sitemap, robots).
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` — leave blank for sandbox mode.
- `SMTP_*`, `MAIL_FROM` — transactional email; logs to console when unset.

---

## Project structure

```
app/
  (store)/            Storefront route group (header/footer shell)
    account/          Customer account area
    collections/      Catalog + special collections
    product/[slug]    Product detail
    cart, checkout, order/[orderNumber]
    pages/            Static content (size guide, policies, FAQs, contact…)
    wishlist
  admin/              Back office (login + guarded (panel) group)
  api/                Route handlers (img, analytics, pincode, payments, admin export)
components/
  store/              Storefront components (incl. 3D hero, viewer, forms)
  admin/              Back-office components
  ui.tsx              Shared primitives (Button, Badge, inputs…)
lib/
  actions/            Server actions (cart, checkout, account, admin, auth…)
  catalog.ts          Product queries + card mapping
  inventory.ts        Transactional stock operations
  pricing.ts          Pure pricing / coupon engine
  auth.ts, session.ts, settings.ts, reports.ts …
prisma/
  schema.prisma       Data model
  seed.ts             Demo data
proxy.ts              Route guard for /admin (Next 16 middleware)
```

---

## Money & data conventions

- All monetary values are integers in **paise** (`₹1 = 100`). Helpers live in `lib/money.ts`.
- The schema avoids DB enums/arrays/JSON columns, so it works identically on SQLite and PostgreSQL (JSON-ish fields are stored as strings).
- Demo records are flagged (`isDemo`) so they can be identified and removed for production.

---

## Deployment notes

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set a strong `AUTH_SECRET` and your real `NEXT_PUBLIC_SITE_URL`.
3. Run `npm run db:deploy` (migrations) — then seed or import real data.
4. Add Razorpay keys and register the webhook endpoint at `/api/payments/webhook`.
5. Configure SMTP for order and account emails.
6. Build and start: `npm run build && npm run start`.
7. Change all demo staff credentials, then remove demo accounts and `isDemo` products.
