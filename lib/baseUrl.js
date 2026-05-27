// Resolves the site's absolute base URL for server-side use (emails, sitemap,
// robots, SEO canonicals, JSON-LD). Falls back through Vercel's auto-provided
// env vars so absolute links still work even if NEXTAUTH_URL was never set.
//
// Order of preference:
//   1. NEXTAUTH_URL            — explicit, what you should set
//   2. NEXT_PUBLIC_SITE_URL    — explicit alternative
//   3. VERCEL_PROJECT_PRODUCTION_URL — stable prod domain Vercel injects
//   4. VERCEL_URL              — per-deployment URL Vercel injects
export function getBaseUrl() {
  const explicit = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}
