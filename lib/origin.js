// Same-origin guard for state-changing API routes.
// Browsers send Origin/Referer; CSRF attacks from another site will have a
// different origin. We require the Origin (or Referer) to match NEXTAUTH_URL.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function checkOrigin(req) {
  if (!req || SAFE_METHODS.has(req.method)) return true;
  const expected = process.env.NEXTAUTH_URL;
  if (!expected) {
    // Fail closed in production: missing NEXTAUTH_URL means we can't safely
    // verify the request origin, so we refuse rather than allow.
    return process.env.NODE_ENV !== "production";
  }
  const src = req.headers.get("origin") || req.headers.get("referer");
  if (!src) return false;
  try {
    return new URL(src).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}
