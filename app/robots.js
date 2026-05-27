export default function robots() {
  const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/account", "/checkout", "/cart", "/reset", "/forgot"] },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
