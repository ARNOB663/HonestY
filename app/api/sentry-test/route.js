// TEMPORARY — DELETE AFTER VERIFYING SENTRY WORKS.
// Throws on every request so Sentry's server SDK captures it.
export function GET() {
  throw new Error("SENTRY_TEST: server route error");
}
