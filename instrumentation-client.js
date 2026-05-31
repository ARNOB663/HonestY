// Sentry browser SDK init. Runs in every customer's browser.
// Conservative quota settings:
//  - sampleRate 1.0: capture every error (the whole point)
//  - tracesSampleRate 0: skip performance traces (would eat the free 5k/mo)
//  - no Session Replay: adds ~50KB to client bundle and quota
//  - ignore noisy browser-extension / network blip errors
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  sampleRate: 1.0,
  tracesSampleRate: 0,
  // Drop common no-signal noise so the quota doesn't burn on third-party junk.
  ignoreErrors: [
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    /^Script error\.?$/,
    /^extension /i,
    /chrome-extension:/,
    /moz-extension:/,
  ],
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
