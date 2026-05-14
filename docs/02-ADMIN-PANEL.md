# Honesty — Admin Panel: Complete Feature Plan

> Goal: the operator should never need to open a database client or call a developer.

---

## 0. Architecture

- **Route:** `/admin/*` (separate from public site, same Next.js app)
- **Auth:** NextAuth with role-based access (`role` field on User: `admin` | `manager` | `staff`)
- **Layout:** Sidebar nav + top bar + main content area
- **Components:** Reuse shadcn-style primitives or build a small in-house kit (Button, Input, Table, Modal, Toast)
- **Data tables:** Server-paginated, with column sort + filter + bulk actions
- **Activity log:** Every write action is logged (`who`, `what`, `when`, `before`, `after`)
- **Audit trail visible** in each entity's detail view

---

## 1. Dashboard `/admin`

The first thing the operator sees. Should answer "what do I need to do today?" in under 5 seconds.

### KPI cards (today / 7d / 30d toggle)
- Revenue
- Orders
- Avg. order value
- Conversion rate
- New customers
- Refunds issued

### Lists requiring action
- **Unfulfilled orders** (oldest first, with age in hours)
- **Pending refunds**
- **Out-of-stock products** (with sales velocity)
- **Pending reviews** awaiting moderation
- **Abandoned carts >$50** (last 24h)
- **New customer questions** (from contact form)

### Charts
- Revenue trend (line, 30 day)
- Orders by status (donut)
- Top 5 products by revenue (bar)
- Traffic source breakdown (if analytics integrated)

---

## 2. Products `/admin/products`

The single most-used module. Optimize for speed.

### List view
- Columns: thumb · name · SKU · category · price · stock · status · updated
- Inline edit: price, stock, status (toggle)
- Filters: category, status, stock-level, on-sale, has-photos
- Bulk actions: change category, change status, set sale price, archive, export CSV
- Search: title, SKU, slug, tag

### Detail / Edit view — tabbed
1. **Basics** — title, slug, short desc, long desc (rich-text), category, tags
2. **Pricing** — price, compare-at-price, cost (margin auto-calc), tax class
3. **Inventory** — SKU, barcode, stock-per-warehouse, low-stock threshold, allow-backorder
4. **Variants** — size, colour, material combos (auto-generate SKU matrix)
5. **Media** — drag-drop gallery, alt text required, drag to reorder, set primary, crop
6. **Shipping** — weight, dimensions, ships-from, freight class
7. **SEO** — meta title, meta desc, OG image override, canonical
8. **Sourcing & transparency** — *brand-critical:* maker name, origin country, materials list, certifications, care instructions (these surface on the product page)
9. **Related products** — manually curate cross-sells, upsells, "frequently bought with"
10. **History** — audit log of all edits

### Bulk product import
- CSV upload with column mapping wizard
- Validates before commit, shows errors per row
- Auto-fetch placeholder images from URLs

---

## 3. Categories / Collections `/admin/categories`

- Tree view (drag to reorder, drag to nest)
- Per category: name, slug, hero image, description, SEO meta
- "Smart collection" rules (e.g., auto-include products tagged "linen")
- Visibility toggle + scheduled publish/unpublish
- URL preview

---

## 4. Orders `/admin/orders`

### List
- Columns: order# · customer · date · total · payment status · fulfillment status · channel
- Filters: status, date range, payment method, country, tag
- Bulk: print packing slips, mark as fulfilled, export to shipping provider

### Detail
- Customer block (name, email, phone, lifetime value, # past orders) — click → customer profile
- Line items (image, qty, price, options, refund button each)
- Timeline: placed → paid → fulfilled → delivered, each with timestamp
- Payment block: method, transaction id, refund button
- Shipping block: address, tracking #, label download, edit address (with audit)
- Internal notes (staff-only)
- Customer-facing notes
- Tags
- Actions: refund (partial/full), cancel, duplicate, send invoice, email customer

### Returns / RMA
- Customer requests return from their account → admin reviews
- Approve → print return label → on receipt → refund
- Reason codes for reporting

---

## 5. Customers `/admin/customers`

- List: name, email, signup date, # orders, lifetime spend, last order
- Filters: spend tier, location, signup source, tag
- Detail:
  - Profile + address book
  - Order history with totals
  - Cart abandonment history
  - Email opens / clicks (if integrated with email tool)
  - Review history
  - Tags (segmentation: "VIP", "wholesale", "newsletter-only", etc.)
  - Notes (staff-only)
  - Account actions: send password reset, merge duplicates, GDPR export, GDPR delete

---

## 6. Discounts & Promotions `/admin/discounts`

### Code-based (customer enters at checkout)
- Code, type (% / $ / free shipping), value
- Eligibility: products, categories, customer tags, min-order
- Usage limits: per customer, total, date range
- One-use vs reusable
- Stackable yes/no

### Automatic (no code required)
- Buy X get Y free
- Free shipping over $X
- Tiered: spend $100 = 10%, $200 = 15%, $300 = 20%
- First-time customer auto-discount

### Bundles
- "Buy these 3 together for $X" — predefined sets at fixed price

---

## 7. Content / CMS `/admin/content`

### Pages (About, Sustainability, FAQ, Shipping Policy, etc.)
- Drag-drop block editor: text, image, gallery, video, CTA, product picker, testimonial, FAQ block
- Live preview
- Version history with restore

### Homepage builder
- Reorder hero / featured / category-tabs / story / testimonials / journal sections
- Each section's content edited inline (titles, CTAs, images, linked products)

### Banners & announcements
- Top header bar message (with start/end date)
- Site-wide popup (newsletter, sale, etc.) with frequency capping
- Per-page hero overrides

### Blog / Journal
- Same block editor
- Author, category, tags, scheduled publish, SEO meta
- Linked products embeds (turn a journal post into a shoppable look)

---

## 8. Media library `/admin/media`

- Centralised image store (uploads to S3 / Cloudinary)
- Folder organisation, tags, search
- Per-image: alt text (required), credits, focal point
- Auto-generates responsive variants (next/image-ready)
- Replace original keeps URL stable
- Image usage tracker — see where each is used before deleting

---

## 9. Reviews & Q&A `/admin/reviews`

- Queue: pending / approved / hidden / spam
- Per review: customer, product, rating, body, photos, reply
- Tools: approve, hide, reply publicly, mark as spam, flag (legal review)
- **Honest-brand rule:** cannot delete a verified-buyer review for being negative — only reply
- Q&A on products: same queue, answer publicly, customer is notified

---

## 10. Marketing `/admin/marketing`

### Email campaigns (or sync to Klaviyo / Mailchimp)
- Newsletter list with segments
- Campaign builder: template + content
- Automations:
  - Welcome series (3 emails over 7 days)
  - Abandoned cart (1h, 24h, 3d)
  - Post-purchase (thank you, review request, replenishment reminder)
  - Win-back (no purchase 90 days)
  - Birthday / anniversary

### Popups & banners
- Newsletter signup with timing rules
- Exit-intent popup
- Geo-targeted shipping banner

### Affiliate / referral program (v2)
- Generate referral codes per customer
- Track + payout commission

### Gift cards
- Sell digital gift cards
- Bulk corporate gifting

---

## 11. Analytics `/admin/analytics`

- Sales: revenue, orders, AOV, conversion, refund rate (compare periods)
- Products: best/worst sellers, view-to-cart rate, cart-to-checkout rate
- Customers: new vs returning, cohort retention, LTV by acquisition source
- Marketing: campaign performance, discount usage, abandoned recovery rate
- Traffic: sources, landing pages, devices (or link to GA4)
- Reports: schedule weekly email summary

---

## 12. Settings `/admin/settings`

Organised in sections:

### Store
- Name, address, contact email, support phone
- Currencies, default
- Timezone

### Brand
- Logo, favicon, OG defaults
- Colour tokens (so admin can adjust theme without code)
- Email header/footer template

### Shipping
- Zones (US, CA, …)
- Rates per zone (flat, weight-based, free over $X)
- Carrier integrations (USPS, FedEx, UPS, DHL)
- Local pickup option

### Tax
- Auto via TaxJar/Avalara, or manual rates per region
- Tax classes per product

### Payments
- Stripe / PayPal / Apple Pay / Google Pay toggles
- Test vs live mode indicator
- Refund handling rules

### Notifications
- Per-event email templates (order confirmation, shipped, refunded, etc.)
- Variables shown for testing
- Send test to staff email

### Policies
- Editable text for Returns, Shipping, Privacy, Terms — versioned

### Integrations
- API keys for analytics, email, search (Algolia), CRM
- Webhooks
- Zapier/Make connectors

---

## 13. Staff & permissions `/admin/staff`

- Invite by email
- Roles:
  - **Owner** — everything
  - **Admin** — everything except billing & staff
  - **Manager** — orders, customers, products, content
  - **Editor** — content & products only
  - **Fulfillment** — orders only
- 2FA required for Admin+
- Last-login timestamp + IP shown
- Force sign-out everywhere button

---

## 14. SEO toolkit `/admin/seo`

- Sitemap generator (auto-refresh)
- robots.txt editor
- Redirects manager (old URL → new URL, useful when slugs change)
- Broken-link checker (cron)
- Schema.org preview per product/page
- Meta-title / desc bulk-edit

---

## 15. System / Developer `/admin/system`

For technical operators:
- Job queue status (email sends, image processing, exports)
- Error log viewer
- Database backups (last run, restore)
- Cache controls (purge CDN, rebuild static pages)
- Maintenance mode toggle
- Feature flags

---

## Cross-cutting features

- **Universal command palette** (`Cmd/Ctrl+K`) — jump to any record, run any action
- **Global search** — orders, customers, products in one search
- **Notifications bell** — new orders, low stock, refund requests, mentions
- **Help drawer** — context-aware docs (e.g., on Products page → "How to add variants" link)
- **Dark mode** for late-night sessions
- **Mobile-responsive admin** — at minimum: view orders + mark fulfilled from phone

---

## What to build first (MVP admin)

If shipping fast matters more than feature completeness:

1. Products CRUD (no variants yet)
2. Orders list + detail + mark fulfilled
3. Basic customer list
4. Single discount-code type
5. Page content for About / FAQ / Shipping
6. Settings: store name, shipping rates, tax flat-rate
7. Staff (single admin role for now)

Everything else is v1.1+.

See [04-ROADMAP.md](./04-ROADMAP.md) for phased plan.
