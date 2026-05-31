// Next.js calls register() once per server process at boot. We use it to
// load the runtime-specific Sentry config (node vs edge).
// See: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.mdx
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Auto-captures errors thrown inside React Server Components / route handlers.
export const onRequestError = Sentry.captureRequestError;
