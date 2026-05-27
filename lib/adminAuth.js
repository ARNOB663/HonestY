import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { checkOrigin } from "./origin";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  return session;
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
