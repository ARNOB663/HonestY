import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?from=/admin");
  return session;
}

function checkOrigin(req) {
  if (!req || SAFE_METHODS.has(req.method)) return true;
  const expected = process.env.NEXTAUTH_URL;
  if (!expected) return true; // fallback in dev when not configured
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const src = origin || referer;
  if (!src) return false;
  try {
    return new URL(src).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

export async function requireAdminApi(req) {
  if (req && !checkOrigin(req)) {
    return { error: NextResponse.json({ error: "Bad origin" }, { status: 403 }) };
  }
  const session = await getAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
