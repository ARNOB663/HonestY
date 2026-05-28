// Async rate limiter with two backends:
//
// 1. **Upstash Redis** (preferred for production / multi-instance hosting)
//    Activated when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
//    (Vercel's Upstash integration injects these automatically). Shares counters
//    across every serverless instance, so a real attacker can't bypass limits
//    by hitting different lambdas.
//
// 2. **In-memory sliding window** (default for local dev / single-VPS)
//    Counters live in process memory. Resets per restart and per instance.
//
// Public API stays the same shape — but is now async. Callers `await rateLimit(...)`.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redisClient = null;
function redis() {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

// One Ratelimit instance per unique (limit, windowMs) pair so we don't
// reconstruct it on every call.
const limiterCache = new Map();
function getUpstashLimiter(limit, windowMs) {
  const cacheKey = `${limit}:${windowMs}`;
  let lim = limiterCache.get(cacheKey);
  if (!lim) {
    lim = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rl",
      analytics: false,
    });
    limiterCache.set(cacheKey, lim);
  }
  return lim;
}

// In-memory fallback ---------------------------------------------------------
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
function memoryLimit({ key, limit, windowMs }) {
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

// Public API -----------------------------------------------------------------

export async function rateLimit({ key, limit, windowMs }) {
  if (!hasUpstash) return memoryLimit({ key, limit, windowMs });
  try {
    const lim = getUpstashLimiter(limit, windowMs);
    const r = await lim.limit(key);
    const retryAfter = Math.max(0, Math.ceil((r.reset - Date.now()) / 1000));
    return { ok: r.success, remaining: r.remaining, resetAt: r.reset, retryAfter };
  } catch {
    // Upstash down → fall back to in-memory rather than locking real users out.
    return memoryLimit({ key, limit, windowMs });
  }
}

export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
