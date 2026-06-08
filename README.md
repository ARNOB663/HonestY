# HonestY

A Next.js 16 + MySQL e-commerce storefront, modeled on the layout/feel of the
Shopify [Electrode demo](https://electrode-demo.myshopify.com).

Stack:
- Next.js 16 (App Router) — JavaScript, **no TypeScript**
- Tailwind CSS 4
- Prisma ORM on MySQL 8
- NextAuth (credentials + Google providers)
- Cloudinary for media
- Nodemailer (Gmail SMTP) for transactional + admin emails
- Client-side cart in `localStorage`, server-synced for signed-in users
- COD / bKash / Nagad checkout (manual verification flow)

## Quick start

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env.local
# fill in DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_*, SMTP_*, CLOUDINARY_*, ADMIN_EMAIL

# 3. create the schema in your MySQL database
npx prisma db push

# 4. dev
npm run dev
```

Open http://localhost:3000.

Windows convenience: `scripts/local-setup.ps1` does steps 2–3 end-to-end against
a local MySQL install.

## Useful npm scripts

| script | what it does |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | `prisma generate && next build` — production build |
| `npm start` | run the built app |
| `npm run db:studio` | open Prisma Studio against your DB |
| `npm run db:push` | apply the current `prisma/schema.prisma` to the DB |
| `npm run make-admin` | promote a user to `role=admin` |
| `npm run check:cloudinary` | sanity-check Cloudinary credentials |
| `npm run smoke` | 71-check end-to-end smoke test (needs dev server running) |

## Project layout

```
app/
  layout.js, page.js          home + root layout
  products/                   /products + /products/[slug]
  collections/[slug]/         category pages
  cart/                       cart
  checkout/                   COD / bKash / Nagad checkout
  login/, register/           NextAuth credentials login + signup
  account/                    customer self-service (orders, profile)
  admin/                      admin panel (products, orders, tools, …)
  api/auth/[...nextauth]/     NextAuth handler
  api/admin/tools/            admin utilities (Excel backup, CSV export, etc.)
components/                   Header, Footer, ProductCard, ToolsPanel, etc.
context/                      client-side cart/wishlist stores (localStorage + sync)
lib/
  db.js                       Prisma client singleton
  auth.js                     NextAuth config
  products.js                 product reads + caching
  rateLimit.js                in-memory limiter for public mutating routes
prisma/schema.prisma          source of truth for the MySQL schema
scripts/                      one-off CLI tools (admin promotion, smoke test, etc.)
```

## Deployment (BDIX cPanel)

1. Create a MySQL database in cPanel; copy the connection string into
   `DATABASE_URL` on the Node.js Selector environment.
2. Configure the Node.js Selector: app root, app URL, startup file = `node_modules/next/dist/bin/next` with `start` as the argument (or use a `passenger_wsgi.js` shim).
3. Upload the repo (excluding `node_modules`, `.next`, `.env.local`).
4. cPanel will run `npm install` which triggers `postinstall` → `prisma generate`.
5. Run `npx prisma db push` once to create tables, then start the app.
6. Set the Google OAuth callback URL to `https://yourdomain/api/auth/callback/google`.

## Notes

- All catalog images come from Cloudinary or Unsplash; remote hosts are wildcarded under `images.remotePatterns` in `next.config.mjs`.
- Project uses `"type": "module"` so server-side scripts can use `import`.
- The admin email list is configured via the `ADMIN_EMAIL` env var (comma-separated for multiple admins).
