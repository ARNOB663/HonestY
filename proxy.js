// Next.js 16 Proxy (formerly Middleware). Defense-in-depth: rejects unauthenticated
// requests to /admin/* and /api/admin/* before they ever hit the page/route handler.
//
// This is an *optimistic* check — it only reads the JWT cookie, never the DB.
// The actual role/permission enforcement still lives in requireAdminPage() and
// requireAdminApi() (which do hit the DB). If those checks ever get forgotten on
// a new admin route, this proxy still blocks anonymous access at the edge.
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Only guard admin surfaces. Everything else passes through.
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  // Read the NextAuth JWT directly from the cookie (no DB).
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthed = !!token && token.role === "admin";

  if (!isAuthed) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Page request — redirect to login with callback back to where they wanted.
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
