"use client";
// TEMPORARY — DELETE THIS PAGE AFTER VERIFYING SENTRY WORKS.
// Two test triggers: server (throws from a server component) and client
// (throws from a button onClick). One or the other proves your DSN is wired.
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <div style={{ maxWidth: 560, margin: "10vh auto", padding: 24, fontFamily: "system-ui, sans-serif", color: "#1a2b4a" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Sentry test page</h1>
      <p style={{ fontSize: 14, color: "#555", marginTop: 8 }}>
        Click a button to throw an error. Open <a href="https://sentry.io" target="_blank" rel="noreferrer" style={{ color: "#1a35d4" }}>sentry.io</a> → your project → Issues to see it land within ~30s.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <button
          onClick={() => { throw new Error("SENTRY_TEST: client browser error"); }}
          style={{ background: "#1a2b4a", color: "white", padding: "10px 16px", borderRadius: 6, border: 0, fontSize: 14, cursor: "pointer" }}
        >
          Throw a browser error
        </button>

        <button
          onClick={() => Sentry.captureMessage("SENTRY_TEST: explicit captureMessage", "error")}
          style={{ background: "white", color: "#1a2b4a", padding: "10px 16px", borderRadius: 6, border: "1px solid #1a2b4a", fontSize: 14, cursor: "pointer" }}
        >
          Send a manual captureMessage
        </button>

        <a
          href="/api/sentry-test"
          style={{ background: "white", color: "#1a2b4a", padding: "10px 16px", borderRadius: 6, border: "1px solid #1a2b4a", fontSize: 14, textDecoration: "none", textAlign: "center" }}
        >
          Trigger a server-side error (opens /api/sentry-test)
        </a>
      </div>

      <p style={{ fontSize: 12, color: "#888", marginTop: 32 }}>
        Once you see the errors in Sentry, delete <code>app/sentry-test/</code> and <code>app/api/sentry-test/</code>.
      </p>
    </div>
  );
}
