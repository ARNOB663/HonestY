import { NextResponse } from "next/server";
import { requireAdminApi } from "./adminAuth";
import { dbConnect } from "./mongodb";
import AuditLog from "../models/AuditLog";

const REDACT_KEYS = new Set(["password", "passwordHash", "token", "apiKey"]);

function redact(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const k of Object.keys(obj)) {
    if (REDACT_KEYS.has(k)) out[k] = "[redacted]";
    else if (typeof obj[k] === "object") out[k] = redact(obj[k]);
    else out[k] = obj[k];
  }
  return out;
}

// Soft cap on the audit log so it doesn't grow unbounded over a long-running
// site. ~1% of writes trim anything older than the cap, fire-and-forget.
const AUDIT_LOG_CAP = 10000;
const PRUNE_PROBABILITY = 0.01;

async function maybePruneAuditLog() {
  if (Math.random() > PRUNE_PROBABILITY) return;
  try {
    const count = await AuditLog.estimatedDocumentCount();
    if (count <= AUDIT_LOG_CAP) return;
    const surplus = await AuditLog.find({})
      .sort({ createdAt: 1 })
      .limit(count - AUDIT_LOG_CAP)
      .select("_id")
      .lean();
    if (surplus.length) {
      await AuditLog.deleteMany({ _id: { $in: surplus.map((d) => d._id) } });
    }
  } catch {}
}

async function logAction({ req, session, body, status }) {
  if (req.method === "GET" || req.method === "HEAD") return;
  try {
    await dbConnect();
    const url = new URL(req.url);
    await AuditLog.create({
      actorEmail: session?.user?.email,
      method: req.method,
      path: url.pathname,
      status,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent")?.slice(0, 300),
      body: body ? redact(body) : undefined,
    });
    maybePruneAuditLog();
  } catch {
    // Never let audit logging break the actual request.
  }
}

// Wrap an admin route handler with auth + origin check + JSON parsing
// + uniform error responses. Usage:
//
//   export const PUT = withAdmin(async ({ body, params, session, req }) => {
//     ...
//     return { ok: true };
//   });
//
// The wrapped handler may return:
//   - a NextResponse (used as-is)
//   - a plain object (serialized to JSON 200)
//   - throw to produce a 500 with the error message
export function withAdmin(handler, options = {}) {
  return async function wrapped(req, ctx) {
    const auth = await requireAdminApi(req);
    if (auth.error) return auth.error;

    let body;
    if (options.parseBody !== false && req.method !== "GET" && req.method !== "DELETE") {
      // An empty body is legitimate (e.g. POST endpoints that take no params),
      // so only error out when content was actually sent but isn't valid JSON.
      const len = Number(req.headers.get("content-length") || 0);
      if (len === 0) {
        body = {};
      } else {
        try {
          body = await req.json();
        } catch {
          return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
      }
    }

    const params = ctx?.params ? await ctx.params : undefined;

    let response;
    let status = 200;
    try {
      const result = await handler({ req, body, params, session: auth.session });
      response = result instanceof NextResponse ? result : NextResponse.json(result ?? { ok: true });
      status = response.status;
    } catch (e) {
      status = e.status || 500;
      response = NextResponse.json({ error: e.message || "Server error" }, { status });
    }
    await logAction({ req, session: auth.session, body, status });
    return response;
  };
}

export function httpError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}
