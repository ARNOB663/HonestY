// In-memory sliding-window rate limiter.
//
// We dropped Upstash Redis when migrating off Vercel — cPanel shared hosts
// typically block outbound to upstash.io and the Node app runs in a single
// persistent process anyway, so process-local counters are accurate.
//
// Counters live in process memory. They reset on app restart, which on
// cPanel is rare (Passenger keeps the app warm).

const buckets = new Map();
const SWEEP_INTERVAL = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(key);
  }
}

export async function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  sweep(now);
  let entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return {
    ok: entry.count <= limit,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
