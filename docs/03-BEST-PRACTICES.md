# Honesty — Best Practices Checklist

> Cross-cutting concerns. Apply to every page, every feature, every release.

---

## 1. Performance

| Target | Why it matters |
|---|---|
| LCP ≤ 2.5s | Bounce rises sharply above 3s |
| INP ≤ 200ms | Felt as "smooth" interaction |
| CLS ≤ 0.1 | No janky reflows mid-tap |
| First-load JS ≤ 200kb | Cheap data plans, older phones |
| Image weight ≤ 200kb above the fold | Single biggest perf lever |

### Concrete actions
- Use `next/image` everywhere with explicit `sizes`, `priority` only on LCP
- Lazy-load below-the-fold images & components (`next/dynamic`)
- Serve images as AVIF → WebP → JPEG (Next.js handles automatically)
- Use Server Components for everything except interactive bits
- Cache product/category pages with ISR (revalidate hourly or on save)
- Self-host fonts via `next/font` (avoids 3rd-party FOUT)
- Run Lighthouse CI on every PR — fail build if scores drop

### Bundle hygiene
- Audit `node_modules` size quarterly; remove unused deps
- Prefer native browser APIs over libraries (date, fetch, etc.)
- Tree-shake icon libraries — import individually, not whole packages

---

## 2. SEO

### Technical
- Server-rendered HTML for all product/collection pages (already done in App Router)
- `sitemap.xml` auto-generated from DB
- `robots.txt` allows crawl, blocks `/admin`, `/api/*`, `/cart`, `/checkout`
- Canonical URLs on every page (especially for `/products?q=` variants → canonical to base)
- Schema.org JSON-LD:
  - `Product` schema on detail pages (price, availability, reviews aggregate)
  - `BreadcrumbList` everywhere
  - `Organization` on home
  - `Article` on journal posts

### Content
- Unique `<title>` and meta description per page (max 60 / 155 chars)
- One `<h1>` per page; heading hierarchy preserved
- Image `alt` text mandatory — admin enforces on upload
- Internal linking: every product links to its category; journal posts link to relevant products

### URLs
- Lowercase, hyphen-separated, no IDs
- Stable — when a slug changes, auto-create 301 redirect
- Short and meaningful: `/products/rose-face-oil` not `/products/12345`

---

## 3. Accessibility (WCAG 2.1 AA)

- Colour contrast: text on background ≥ 4.5:1 (verified for navy on cream ✓)
- All interactive elements keyboard-reachable + visible focus ring
- `aria-label` on icon-only buttons (cart, search, wishlist)
- Form fields: associated `<label>`, error text linked via `aria-describedby`
- Skip-to-content link in header
- Semantic HTML: `<nav>`, `<main>`, `<footer>`, `<article>` — not just divs
- Respects `prefers-reduced-motion` (disable autoplay carousels, slide animations)
- Test with screen reader: VoiceOver on Mac, NVDA on Windows
- No element relies on colour alone (e.g., sale price has both colour AND strikethrough)

---

## 4. Security

### Auth
- NextAuth with bcrypt password hashing ✓ (already in place)
- Password requirements: min 8 chars, mix recommended (not strictly enforced — UX cost > security gain at this scale)
- Rate-limit `/api/login`, `/api/register`, `/api/forgot-password` (5/min per IP)
- 2FA for admin accounts (TOTP via authenticator app)
- Session expiry: 30 days remember-me, 4 hours admin

### Data
- Never log passwords, tokens, full card numbers
- PII access in admin = logged in audit trail
- GDPR-compliant export & delete from customer profile
- Soft-delete (mark deleted, purge after 30 days) for accidental deletes

### Web app
- Strict Content-Security-Policy header
- HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- Sanitise all user-generated HTML (reviews, Q&A) via DOMPurify
- SQL injection — using Prisma ORM ✓ (parameterised queries; raw `$queryRaw` only with `Prisma.sql` tagged templates)
- CSRF — NextAuth handles via signed tokens ✓

### Payments
- Never store card details — Stripe Elements or Stripe Checkout hosted form
- PCI-DSS SAQ A scope only
- Verify webhook signatures on every Stripe callback

### Secrets
- `.env.local` never committed (already in `.gitignore` — verify)
- Rotate keys quarterly
- Per-environment secrets (dev / staging / prod)

---

## 5. Conversion optimisation

### Hero & above-the-fold
- Single clearest action ("Shop New In"), supporting CTA secondary
- Hero image: real product / real people, no stock cliché
- Trust signal visible: "Free shipping over $99" or similar

### Product cards
- Image, title, price, rating — nothing else
- Hover/tap → quick view (don't force full page navigation for browsing)
- Show savings absolutely AND as percentage

### Product detail page
- 3+ images, zoom on hover/tap
- "Buy It Now" alongside "Add to Cart" for express checkout
- Stock indicator only if low (avoid "100 in stock" — looks unloved)
- Reviews summary at top, full reviews lower
- "Frequently bought with" section
- Free shipping eligibility callout if cart is near threshold

### Cart
- Item-level remove without confirmation (just an undo toast)
- Cross-sell: "people who bought this also bought…"
- Free-shipping progress bar ("Add $12 more for free shipping")
- Discount code field — but collapsed by default (visible = signals "look for codes elsewhere")

### Checkout
- One-page if possible (3 columns: contact / shipping / payment)
- Guest checkout default ON, account creation optional at end
- Auto-detect card type, validate inline
- Address autocomplete (Google Places or HereMaps)
- Show order summary always visible (sticky)
- Final "Place Order" button: clear, prominent, includes total

### Post-purchase
- Thank-you page with order #, expected delivery
- Account creation prompt (one-click via emailed link)
- Share / refer-a-friend prompt
- Order confirmation email within 30s

---

## 6. Mobile-first principles

- Tap targets ≥ 44×44px
- Sticky add-to-cart bar on product detail
- Native pull-to-refresh respected
- No hover-only interactions
- Bottom-aligned primary actions (thumb zone)
- Modal sheets instead of dropdowns where possible

---

## 7. Trust signals (brand-specific)

For the *Honesty* brand, trust signals are not optional decoration — they're the product.

- ✓ Real verified-buyer badges (with date)
- ✓ Maker bio with photo on product pages
- ✓ Materials list, origin country, certifications
- ✓ Sustainability/sourcing page linked from footer + product pages
- ✓ Press / awards / certifications row (when earned)
- ✓ Photo of real warehouse / team / packing process
- ✓ Honest return policy stated up front, not in fine print
- ✗ No fake countdown timers
- ✗ No fake "27 people viewing this now"
- ✗ No fake review filtering

---

## 8. Email & transactional comms

- All transactional emails: order confirmed, paid, shipped, delivered, refunded
- From-name = "Honesty" (not "noreply@" — feels human)
- Reply-to is monitored, not a black hole
- Plain-text fallback for every HTML email
- Footer always has unsubscribe + business address (CAN-SPAM)
- A/B test subject lines on marketing sends

---

## 9. Testing

- Unit tests for utilities and pricing/discount calc (critical correctness)
- Integration tests for checkout end-to-end (Playwright — already installed ✓)
- Visual regression tests for key pages (Percy or Chromatic)
- Manual QA checklist per release:
  - Add to cart → checkout → place order (mock payment)
  - Sign up → sign in → place order
  - Apply discount code → verify total
  - Refund order from admin
  - Mobile + desktop
  - Slow 3G throttled

---

## 10. Monitoring & ops

- **Error tracking:** Sentry — alert on new errors only, not every recurrence
- **Uptime:** UptimeRobot or Better Stack ping every minute, page goes to Slack
- **Logging:** Structured logs (JSON) to a log aggregator (Logflare, Axiom)
- **Real-user monitoring (RUM):** Vercel Analytics or PostHog for actual user perf
- **Cron jobs:** abandoned cart emails, sitemap refresh, broken-link check, backup
- **On-call rotation** when staff > 2

---

## 11. Documentation discipline

- Every public-facing copy change goes through one editor (consistency)
- `CHANGELOG.md` for shipped features (helps customer support too)
- Internal runbooks: "how to refund an order", "how to fix a broken image" — in admin help drawer
- API docs if/when public API exists (Swagger / Redoc auto-generated)

---

## Related docs
- [01-CLIENT-BRIEF.md](./01-CLIENT-BRIEF.md) — brand & business context
- [02-ADMIN-PANEL.md](./02-ADMIN-PANEL.md) — feature inventory
- [04-ROADMAP.md](./04-ROADMAP.md) — what to build when
