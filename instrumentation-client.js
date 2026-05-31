// Sentry browser SDK init — deferred to after first paint to keep LCP/INP fast.
// Errors during the first ~1s of page load are NOT captured, but everything
// after that is. For a customer-facing storefront the tradeoff is worth it:
// captured errors are most often interaction-driven (clicks, form submits)
// which happen well after load.
//
// Quota-conscious settings: sampleRate 1.0, no traces, no Session Replay,
// ignore browser-extension noise.
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    sampleRate: 1.0,
    tracesSampleRate: 0,
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
}

if (typeof window !== "undefined" && DSN) {
  // Defer until the browser is idle (post-LCP). Fallback to a short timeout
  // for browsers without requestIdleCallback (older Safari).
  const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
  ric(() => initSentry(), { timeout: 3000 });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
