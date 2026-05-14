# Honesty — Client Brief & Brand Analysis

> The "why" before the "what". Everything in the admin panel, every feature, every design decision should trace back to this document.

---

## 1. Brand identity

**Name:** Honesty
**Tagline:** *Honesty in every step.*
**Category:** Multi-category curated marketplace (fashion, home, beauty, wellness, electronics, kids, accessories)
**Brand archetype:** Caregiver + Sage — trustworthy, thoughtful, transparent.

### Visual identity
- **Primary navy** `#1a2b4a` — authority, trust, depth
- **Warm gold** `#c9a961` — premium accent, hospitality
- **Terracotta** `#b8553a` — sale / urgency (used sparingly)
- **Warm cream** `#fafaf7` — surface
- **Beige** `#f5f1e8` — secondary surface, warmth
- **Typography:** Cormorant Garamond serif for editorial headlines, Inter for body/UI
- **Logo cues:** sprouts, leaves, organic — implies natural, honest, hand-made

### Voice & tone
| ✅ Sound like | ❌ Avoid |
|---|---|
| Calm, considered, generous | Loud, salesy, urgency-spam |
| Specific ("kaolin clay, sulfate-free") | Vague ("amazing quality!") |
| Sentences that show care | Marketing buzzwords |
| Lowercase headlines occasionally | ALL CAPS shouting |

---

## 2. Target customer

### Primary persona — "The Considered Shopper"
- **Age:** 28–45
- **Income:** Upper-middle, disposable
- **Mindset:** Quality > quantity. Researches before buying. Reads labels, ingredients, sourcing.
- **Pain points:** Overwhelmed by mass-market sites, distrustful of fake reviews, hates aggressive upsell.
- **Wins on:** Transparent sourcing, maker stories, generous returns, beautiful packaging, longevity.
- **Shops on:** Mobile 60% / Desktop 40%. Browses on mobile, often completes on desktop.

### Secondary persona — "The Gift-Giver"
- Searches by occasion (birthday, housewarming, mother's day)
- Cares about packaging, gift notes, fast delivery
- Buys higher AOV ($80–$200 range)

---

## 3. Business goals (priority order)

1. **Trust** — establish brand credibility quickly with new visitors
2. **Conversion** — friction-free path from product discovery → checkout
3. **AOV** — increase average order via curated bundles, cross-sells, free-shipping threshold
4. **Retention** — turn one-time buyers into repeat customers (email, account, loyalty)
5. **Operational efficiency** — admin can manage everything without engineering help

### Success metrics
- Conversion rate: ≥2.5% (industry average ~1.8%)
- Avg. order value: ≥$95
- Return rate: ≤8%
- Email capture: ≥15% of visitors
- Repeat purchase rate: ≥25% within 6 months
- Page load (LCP): ≤2.5s
- Cart abandonment: ≤65%

---

## 4. What "honest" actually means here

Translating the brand promise into concrete product decisions:

| Promise | What it looks like on the site |
|---|---|
| Transparent pricing | No fake "compare-at" inflations. Real RRP, real discount, never both. |
| Transparent sourcing | Every product page shows materials, maker location, ethical certs |
| Real reviews only | Verified-buyer badge. No filtering of bad reviews. Reply publicly. |
| No dark patterns | No fake "low stock!" timers. No pre-checked add-ons. Easy unsubscribe. |
| Honest delivery | Real ship dates. Email if delayed. No "ships in 24h" lies. |
| Honest returns | Free return window stated up front. No restocking fees on first attempt. |

This list **is** the brand. Every admin panel module must support enforcing these promises.

---

## 5. Out of scope (decisions made)

- ❌ Auctions / bidding
- ❌ User-to-user marketplace (no third-party sellers)
- ❌ Subscriptions / boxes (revisit in v2 once product/market fit is proven)
- ❌ Live shopping / video commerce (v3+)
- ❌ International shipping at launch — US/CA only initially

These can be added later; documenting them as "no" now prevents scope creep.

---

## Related docs
- [02-ADMIN-PANEL.md](./02-ADMIN-PANEL.md) — full module breakdown
- [03-BEST-PRACTICES.md](./03-BEST-PRACTICES.md) — performance, SEO, security, accessibility
- [04-ROADMAP.md](./04-ROADMAP.md) — phased build plan
