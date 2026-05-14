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
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
