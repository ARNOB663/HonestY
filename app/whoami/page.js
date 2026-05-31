// Temporary diagnostic page. Visit /whoami while logged in to see what email
// and role the server actually has for your session, vs what ADMIN_EMAIL is
// configured to. Helps diagnose "I logged in but /admin won't open" issues.
// DELETE THIS PAGE after diagnosing.
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "../../lib/auth";
import { dbConnect } from "../../lib/mongodb";
import User from "../../models/User";

export const dynamic = "force-dynamic";

function adminListRaw() {
  return process.env.ADMIN_EMAIL || "(not set)";
}
function adminListParsed() {
  return (process.env.ADMIN_EMAIL || "")
    .split(/[,;|\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function WhoAmI() {
  const session = await getServerSession(authOptions);
  let dbUser = null;
  if (session?.user?.email) {
    try {
      await dbConnect();
      dbUser = await User.findOne({ email: session.user.email.toLowerCase() })
        .select("email role tokenVersion provider name")
        .lean();
    } catch (e) {
      dbUser = { _err: e.message };
    }
  }

  const sessionEmail = session?.user?.email || null;
  const adminByEnvCheck = sessionEmail ? isAdminEmail(sessionEmail) : false;
  const adminList = adminListParsed();
  const exactMatchInList = sessionEmail ? adminList.includes(sessionEmail.toLowerCase()) : false;

  return (
    <div style={{ maxWidth: 720, margin: "5vh auto", padding: 24, fontFamily: "ui-monospace, monospace", color: "#1a2b4a" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Who Am I — debug</h1>

      <Section title="Session (NextAuth)">
        <Row k="signed in?" v={String(!!session?.user)} />
        <Row k="email" v={sessionEmail || "—"} highlight />
        <Row k="role" v={session?.user?.role || "—"} highlight />
        <Row k="name" v={session?.user?.name || "—"} />
      </Section>

      <Section title="ADMIN_EMAIL env on this server">
        <Row k="raw value" v={adminListRaw()} />
        <Row k="parsed list" v={JSON.stringify(adminList)} />
        <Row k="isAdminEmail(yourEmail)" v={String(adminByEnvCheck)} highlight />
        <Row k="exact match in list?" v={String(exactMatchInList)} highlight />
      </Section>

      <Section title="Database row for your email">
        <pre style={{ background: "#f5f1e8", padding: 12, borderRadius: 6, overflow: "auto", fontSize: 12 }}>
{dbUser ? JSON.stringify(dbUser, null, 2) : "(not found)"}
        </pre>
      </Section>

      <Section title="Diagnosis">
        <Diagnose
          session={session}
          sessionEmail={sessionEmail}
          adminByEnvCheck={adminByEnvCheck}
          exactMatchInList={exactMatchInList}
          dbUser={dbUser}
          adminList={adminList}
        />
      </Section>

      <p style={{ fontSize: 12, color: "#888", marginTop: 32 }}>
        Once fixed, delete <code>app/whoami/page.js</code>.
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ border: "1px solid #e8e4d8", borderRadius: 8, padding: 16, marginBottom: 16, background: "white" }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: "#c9a961", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v, highlight }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: "#888" }}>{k}</span>
      <span style={{ color: highlight ? "#b8553a" : "#1a2b4a", fontWeight: highlight ? 700 : 400, wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}

function Diagnose({ session, sessionEmail, adminByEnvCheck, exactMatchInList, dbUser, adminList }) {
  if (!session?.user) {
    return <p style={{ fontSize: 14, color: "#b8553a" }}>You are not signed in. Log in first, then revisit this page.</p>;
  }
  if (!sessionEmail) {
    return <p style={{ fontSize: 14, color: "#b8553a" }}>Session has no email — NextAuth misconfigured.</p>;
  }
  if (adminList.length === 0) {
    return (
      <p style={{ fontSize: 14, color: "#b8553a" }}>
        ADMIN_EMAIL is empty on this Vercel deployment. Add your email there and redeploy.
      </p>
    );
  }
  if (!exactMatchInList) {
    return (
      <div style={{ fontSize: 14, color: "#b8553a" }}>
        <p style={{ fontWeight: 700 }}>Your session email isn&apos;t in ADMIN_EMAIL.</p>
        <p style={{ marginTop: 6 }}>
          You signed in as <code>{sessionEmail}</code> but the env var lists{" "}
          <code>{JSON.stringify(adminList)}</code>.
        </p>
        <p style={{ marginTop: 6 }}>Fix on Vercel: Settings → Environment Variables → ADMIN_EMAIL → add <code>{sessionEmail}</code>.</p>
      </div>
    );
  }
  if (!dbUser) {
    return (
      <p style={{ fontSize: 14, color: "#b8553a" }}>
        Your email matches ADMIN_EMAIL but no DB user row was found. This shouldn&apos;t happen — Google sign-in
        upserts a user. Check the server logs for a Mongo write error.
      </p>
    );
  }
  if (session.user.role !== "admin") {
    return (
      <div style={{ fontSize: 14, color: "#b8553a" }}>
        <p style={{ fontWeight: 700 }}>Email matches ADMIN_EMAIL but session role is &quot;{session.user.role}&quot;.</p>
        <p style={{ marginTop: 6 }}>
          This means the JWT callback didn&apos;t run since the env was updated. Try: sign out, clear cookies,
          sign back in.
        </p>
      </div>
    );
  }
  return (
    <p style={{ fontSize: 14, color: "#15803d", fontWeight: 700 }}>
      ✓ Everything looks correct. You should be able to access /admin. If it still bounces, share a screenshot of this page.
    </p>
  );
}
