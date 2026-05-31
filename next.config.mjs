import { withSentryConfig } from "@sentry/nextjs";

// Content-Security-Policy. Notes:
//  - 'unsafe-inline' on script-src is required because Next.js inlines its
//    hydration bootstrap; moving to a nonce would require a per-request layer.
//  - 'unsafe-eval' is needed by Next's dev mode (RSC payloads) and a few
//    third-party widgets. It is the most common compromise on Next 13/14/15/16.
//  - img-src is wide-open to https + data + blob because admins paste product
//    images from arbitrary suppliers and Cloudinary is used widely.
//  - connect-src includes Upstash + Cloudinary direct uploads.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: data:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://accounts.google.com https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow any HTTPS image host. Admins paste product/banner image URLs from
    // arbitrary sources (Cloudinary, Unsplash, suppliers); without this a
    // non-whitelisted host makes next/image throw and breaks the storefront.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

// Wrap with Sentry. `tunnelRoute: "/monitoring"` makes the browser send error
// reports to /monitoring on your own domain, which Sentry then forwards. This:
//   1. bypasses ad blockers (which often kill direct calls to sentry.io)
//   2. means we don't need to add Sentry hosts to CSP connect-src
//   3. keeps the actual ingest DSN out of the client bundle
//
// Source map upload is OPT-IN via env: only enabled when SENTRY_AUTH_TOKEN +
// SENTRY_ORG + SENTRY_PROJECT are all set. Without them errors still arrive,
// stack traces just point to minified code. `sourcemaps.disable` mutes the
// loud build-time warning when the token isn't configured.
const sourceMapsEnabled = !!(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

export default withSentryConfig(nextConfig, {
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !sourceMapsEnabled },
  release: { create: sourceMapsEnabled },
});
