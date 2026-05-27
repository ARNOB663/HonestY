// Same-origin guard for state-changing API routes.
// Browsers send Origin/Referer; a CSRF attack from another site carries a
// different origin. A request is safe when its Origin/Referer host matches
// EITHER the site's own host (same-origin) OR the configured NEXTAUTH_URL.
//
// Matching the request's own host (via x-forwarded-host on Vercel) means this
// works across every deployment URL — canonical domain, *.vercel.app preview,
// and git-branch URLs — without hardcoding each one.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hostOf(value) {
  if (!value) return null;
  try {
    // Accept either a full URL or a bare host.
    return new URL(value.includes("://") ? value : `https://${value}`).host;
  } catch {
    return null;
  }
}

export function checkOrigin(req) {
  if (!req || SAFE_METHODS.has(req.method)) return true;

  const src = req.headers.get("origin") || req.headers.get("referer");
  if (!src) return false;
  const srcHost = hostOf(src);
  if (!srcHost) return false;

  // The host the browser actually requested (Vercel sets x-forwarded-host).
  const selfHost = hostOf(req.headers.get("x-forwarded-host") || req.headers.get("host"));
  if (selfHost && srcHost === selfHost) return true;

  // Also accept the configured canonical URL, if any.
  const expectedHost = hostOf(process.env.NEXTAUTH_URL);
  if (expectedHost && srcHost === expectedHost) return true;

  return false;
}
