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
  // Drop ETags & x-powered-by for slightly faster mobile responses.
  poweredByHeader: false,
  // Mark Prisma + next-auth as runtime externals so webpack does not try to
  // bundle their mixed ESM/CJS internals — without this, the cPanel webpack
  // build surfaces "TypeError: e is not a function" during page-data
  // collection. These are server-only anyway.
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "next-auth",
    "next-auth/providers/credentials",
    "next-auth/providers/google",
    "xlsx",
    "bcryptjs",
    "nodemailer",
    "cloudinary",
    "jose",
    "@panva/hkdf",
    "sanitize-html",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Aggressively externalize the listed packages from the server bundle so
      // their CJS internals never get touched by webpack's interop layer.
      const extra = [
        "next-auth",
        "next-auth/providers/credentials",
        "next-auth/providers/google",
        "next-auth/react",
        "next-auth/jwt",
        "@prisma/client",
        "xlsx",
        "bcryptjs",
        "nodemailer",
        "cloudinary",
        "jose",
        "@panva/hkdf",
        "sanitize-html",
      ];
      const original = config.externals || [];
      config.externals = [
        ...(Array.isArray(original) ? original : [original]),
        ({ request }, callback) => {
          if (extra.some((m) => request === m || request.startsWith(m + "/"))) {
            return callback(null, "commonjs " + request);
          }
          return callback();
        },
      ];
    }
    return config;
  },
  // Reduce client JS by tree-shaking heavy named exports (only client-side libs).
  experimental: { optimizePackageImports: [] },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Limit device sizes — fewer image variants generated, faster cold start
    // on cPanel.
    deviceSizes: [360, 640, 750, 1080, 1280, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    // Cache optimized images for a year — Cloudinary delivers permanent URLs.
    minimumCacheTTL: 60 * 60 * 24 * 365,
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

export default nextConfig;
