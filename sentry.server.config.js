// Sentry server SDK init. Runs in Node.js lambdas (API routes, server components).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  sampleRate: 1.0,
  tracesSampleRate: 0,
  // Capture local variables on server exceptions — invaluable for debugging
  // checkout/order errors where you need to see what was in the body.
  includeLocalVariables: true,
});
