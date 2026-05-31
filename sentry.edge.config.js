// Sentry edge SDK init. Runs in the edge runtime — used by proxy.js for
// admin auth guarding.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  sampleRate: 1.0,
  tracesSampleRate: 0,
});
