import { getBaseUrl } from "../lib/baseUrl";

export default function robots() {
  const base = getBaseUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/account", "/checkout", "/cart", "/reset", "/forgot"] },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
