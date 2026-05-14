# HonestY

A Next.js 15 + MongoDB e-commerce storefront, modeled on the layout/feel of the
Shopify [Electrode demo](https://electrode-demo.myshopify.com).

Stack:
- Next.js 16 (App Router) — JavaScript, **no TypeScript**
- Tailwind CSS 4
- MongoDB via Mongoose
- NextAuth (credentials provider — email + password)
- Client-side cart in `localStorage`
- Stubbed checkout (saves an order to MongoDB; no real payments)

## Quick start

```bash
# 1. install
npm install

# 2. configure env
cp .env.local.example .env.local
# then edit .env.local and set MONGODB_URI + NEXTAUTH_SECRET

# 3. (optional) seed the database
npm run seed

# 4. dev
npm run dev
```

Open http://localhost:3000.

> If you don't set `MONGODB_URI`, the storefront still works — it falls back to
> the in-repo seed data in `data/products.js`. You only need MongoDB if you
> want user accounts, login, or to place an order.

## Project layout

```
app/
  layout.js, page.js          home + root layout
  products/                   /products + /products/[slug]
  collections/[slug]/         category pages
  cart/                       cart
  checkout/                   stubbed checkout (auth required)
  login/, register/           NextAuth credentials login + signup
  api/auth/[...nextauth]/     NextAuth handler
  api/register/               POST: create account
  api/orders/                 POST: place an order (requires session)
components/                   Header, Footer, ProductCard, AddToCartButton, Providers
context/CartContext.js        client cart store (localStorage)
lib/
  mongodb.js                  mongoose connection cache
  auth.js                     NextAuth config
  products.js                 read products from DB or fall back to seed
models/                       Product, User, Order (Mongoose schemas)
data/products.js              seed catalogue (electronics theme)
scripts/seed.js               wipes + reseeds products into MongoDB
```

## Notes

- All catalog images come from Unsplash and are configured under
  `images.remotePatterns` in `next.config.mjs`.
- Project uses `"type": "module"` so server-side scripts can use `import`.
- To use a different image host, add it to `next.config.mjs`.
