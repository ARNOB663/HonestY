// Next.js 16 Proxy (formerly Middleware). Defense-in-depth: rejects ANONYMOUS
// requests to /admin/* and /api/admin/* before they reach the page/route.
//
// IMPORTANT: this only checks "is the user signed in at all", not their role.
// Role enforcement is authoritative inside requireAdminPage() / requireAdminApi()
// because those hit Mongo (admin-by-env, tokenVersion, role) — the JWT cookie
// can be stale (e.g. session signed before the user was promoted to admin) and
// gating purely on it locks admins out. Anonymous traffic is still rejected
// here so a forgotten requireAdminPage() on a new page can't leak.
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  // Read the NextAuth JWT directly from the cookie (no DB). We accept any
  // signed-in token here — role check is done downstream against Mongo.
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    // Cookie present but un-decryptable (secret change, etc.) — treat as anon.
    token = null;
  }

  if (token) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
