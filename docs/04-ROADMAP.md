# Honesty — Phased Build Roadmap

> Working backwards from "we can take real customer orders" → "we have a polished, scalable platform".

---

## Current status (where we are now)

✅ Storefront UI complete — homepage, products, collections, cart, checkout, login, register
✅ Cart context with localStorage persistence
✅ MongoDB Atlas connected, 22 seed products across 7 categories
✅ NextAuth credentials provider (email/password)
✅ Order placement (stubbed payment — saves order, no charge)
✅ Brand: Honesty rebrand done (navy + gold, serif headlines, custom logo)

❌ No admin panel
❌ No real payment processing
❌ No transactional emails
❌ No wishlist / reviews / search
❌ No deployment

---

## Phase 1 — Make it transactable (2–3 weeks)

**Goal:** Take real money for real orders. Operate from the database for now (manual fulfillment).

- [ ] Stripe Checkout integration (hosted page, simplest)
- [ ] Email service setup (Resend or Postmark)
- [ ] Order confirmation email
- [ ] Order shipped email (manually triggered from DB for now)
- [ ] Customer order history page (`/account/orders`)
- [ ] Password reset flow
- [ ] Real shipping rates table (per US state, flat-tier)
- [ ] Real tax calculation (TaxJar or hardcoded by state)
- [ ] Legal pages: Privacy Policy, Terms, Returns, Shipping
- [ ] Deploy to production (Vercel) with proper env vars
- [ ] Custom domain + SSL
- [ ] Sentry error tracking
- [ ] Analytics: GA4 or PostHog

**Definition of done:** A friend who's never seen the site can buy a real product, get an email confirmation, and we know it worked.

---

## Phase 2 — Admin MVP (3–4 weeks)

**Goal:** Stop touching the database directly. Operator can run the shop.

- [ ] `/admin` route group with NextAuth role guard
- [ ] Admin layout (sidebar, top bar)
- [ ] Dashboard (basic KPIs from last 30d)
- [ ] Products list + create/edit (no variants yet)
- [ ] Media upload to S3 / Cloudinary
- [ ] Categories CRUD (flat list)
- [ ] Orders list + detail
- [ ] Mark order as fulfilled → triggers "shipped" email
- [ ] Issue refund (full only) → Stripe API call
- [ ] Customers list + detail
- [ ] Settings: store info, shipping zones, tax rates
- [ ] Discount codes (single % or $ off type)
- [ ] Activity log (who did what when)
- [ ] Audit-friendly: every admin write logged

**Definition of done:** Operator can run a full day's business without engineering help.

---

## Phase 3 — Conversion features (2–3 weeks)

**Goal:** Increase the percentage of visitors who buy.

- [ ] Product variants (size, colour) with per-variant SKU + stock
- [ ] Wishlist (saved to user account, accessible across devices)
- [ ] Product reviews (verified-buyer only)
- [ ] Star ratings aggregate on product cards
- [ ] Quick-view modal on product cards
- [ ] Recently-viewed products row
- [ ] Related products / "frequently bought with"
- [ ] Search with autocomplete (Algolia or MongoDB Atlas Search)
- [ ] Filters on product listing (already built UI ✓ — wire up to DB queries)
- [ ] Free-shipping progress bar in cart
- [ ] Abandoned cart email (24h after abandonment)
- [ ] Welcome email series for new signups

**Definition of done:** Conversion rate measurably improves (compare 4-week before/after).

---

## Phase 4 — Content & marketing (2 weeks)

**Goal:** Drive traffic and tell the brand story.

- [ ] Journal / blog with rich-text block editor
- [ ] Maker stories template (interviews + linked products)
- [ ] Homepage builder in admin (reorder sections)
- [ ] Newsletter signup → Mailchimp / Klaviyo sync
- [ ] Marketing pop-up with frequency capping
- [ ] Email templates editable from admin
- [ ] Social meta / OG image per page
- [ ] SEO: sitemap, schema.org JSON-LD, redirects manager

**Definition of done:** Operator can publish a journal post + linked product launch without dev help.

---

## Phase 5 — Customer experience polish (2 weeks)

**Goal:** Loyalty + repeat purchase.

- [ ] Customer account: addresses, payment methods, subscriptions (placeholder), wishlist
- [ ] Order tracking page with carrier link
- [ ] Self-service return / RMA flow
- [ ] Gift cards (purchase + redeem at checkout)
- [ ] Referral program (one-tap share, credit applied)
- [ ] Reviews: photo upload, helpful-vote, vendor reply
- [ ] Live chat or contact form integration
- [ ] PWA: installable, offline shell

---

## Phase 6 — Scale & advanced ops (ongoing)

- [ ] Multi-warehouse inventory
- [ ] Multi-currency
- [ ] Internationalisation (i18n)
- [ ] B2B / wholesale portal
- [ ] Subscriptions (replenishment cadence)
- [ ] Loyalty points / tiers
- [ ] Mobile app (React Native sharing components)
- [ ] AR product preview (where applicable — home goods)

---

## Decision log

Record decisions here as they happen. Reduces "why did we do X?" archaeology later.

| Date | Decision | Reason |
|------|----------|--------|
| 2026-05 | Use MongoDB Atlas, not Postgres | Faster setup, schema flexibility for product variants |
| 2026-05 | NextAuth credentials, not OAuth-only | Simpler for v1, OAuth in Phase 2 |
| 2026-05 | Stripe Checkout (hosted), not Elements | PCI scope reduced, faster to build |
| 2026-05 | Cormorant + Inter typography pair | Editorial feel matches "Honesty" brand |
| 2026-05 | Navy + gold palette | Pulled from logo; navy = trust, gold = premium |

---

## Sprint cadence suggestion

- **2-week sprints**
- Day 1 (Mon): planning, scope confirmation
- Days 2–8: build
- Day 9: QA + bug fixes
- Day 10 (Fri): demo + retro + plan next sprint
- Deploy at end of each sprint behind feature flags
- Cut releases on Tuesdays (avoid Friday production pushes)

---

## Related docs
- [01-CLIENT-BRIEF.md](./01-CLIENT-BRIEF.md) — the "why"
- [02-ADMIN-PANEL.md](./02-ADMIN-PANEL.md) — admin feature inventory
- [03-BEST-PRACTICES.md](./03-BEST-PRACTICES.md) — quality bars
