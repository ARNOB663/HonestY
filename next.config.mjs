import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.dirname(fileURLToPath(import.meta.url));

// cPanel/CloudLinux Node Selector replaces ./node_modules with a symlink into
// ~/nodevenv/<app>/<version>/lib/node_modules. Turbopack refuses to follow
// symlinks that resolve outside its filesystem root ("Symlink node_modules is
// invalid, it points out of the filesystem root"). The documented fix is to
// set `turbopack.root` to the common parent of the project and the symlink
// target (the home directory on cPanel). Detect that layout at config time so
// local builds (real node_modules) keep the default root.
function detectTurbopackRoot() {
  try {
    const nm = path.join(projectDir, "node_modules");
    const real = realpathSync(nm);
    if (real === nm) return undefined; // not a symlink — default root is fine
    let common = projectDir;
    while (!real.startsWith(common + path.sep)) {
      const parent = path.dirname(common);
      if (parent === common) return undefined; // hit filesystem root — give up
      common = parent;
    }
    return common;
  } catch {
    return undefined;
  }
}
const turbopackRoot = detectTurbopackRoot();

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
  // See detectTurbopackRoot() above — only set when node_modules is symlinked
  // outside the project (cPanel/CloudLinux layout).
  ...(turbopackRoot ? { turbopack: { root: turbopackRoot } } : {}),
  // The generated Prisma client must load its native query engine from disk —
  // keep it external to the server bundle.
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    optimizePackageImports: ["nodemailer", "sanitize-html"],
    // CloudLinux LVE caps processes/threads on shared hosting; the default
    // 7-worker page-data collection dies with "OS can't spawn worker thread"
    // (EAGAIN). Single-worker builds are slower but stay inside the limit.
    // Reuses the symlink detection as the "are we on cPanel" signal.
    ...(turbopackRoot ? { cpus: 1, workerThreads: false } : {}),
  },
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
