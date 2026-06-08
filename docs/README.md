# Honesty — Planning Documents

Start here. All strategic & planning docs live in this folder.

## Reading order

1. **[01-CLIENT-BRIEF.md](./01-CLIENT-BRIEF.md)** — brand identity, target customer, business goals, what "honest" means in practice
2. **[02-ADMIN-PANEL.md](./02-ADMIN-PANEL.md)** — exhaustive admin panel feature list, module by module
3. **[03-BEST-PRACTICES.md](./03-BEST-PRACTICES.md)** — performance, SEO, security, accessibility, conversion checklists
4. **[04-ROADMAP.md](./04-ROADMAP.md)** — phased build plan, what to ship in what order

## When to update

| If you… | Update… |
|---|---|
| Change brand voice / colours / target customer | `01-CLIENT-BRIEF.md` |
| Add or remove a planned admin feature | `02-ADMIN-PANEL.md` |
| Hit a new perf / security / a11y standard | `03-BEST-PRACTICES.md` |
| Finish a phase or re-prioritise | `04-ROADMAP.md` (mark items done, log decisions) |

## Where assets live

Brand assets (logos, social cards, photography) go in **[`/public/brand/`](../public/brand/README.md)** — see that folder's README for the structure.

## Where code lives

- `/app/` — Next.js App Router pages
- `/components/` — React components (UI)
- `/lib/` — server-side helpers (Prisma client, products fetcher, auth)
- `/prisma/schema.prisma` — Prisma schema (source of truth for the MySQL DB)
- `/scripts/` — one-off CLI tools (admin promotion, smoke test, etc.)
- `/context/` — React contexts (CartContext)
