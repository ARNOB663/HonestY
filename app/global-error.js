"use client";
// Root-level error boundary. Catches errors that escape every other error.js
// boundary (including layout errors). Reports to Sentry then renders a minimal
// fallback so the site never shows a white screen.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fafaf7", color: "#1a2b4a", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "10vh auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
            We&apos;ve been notified. Please refresh the page, or head back home.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{ background: "#1a2b4a", color: "white", padding: "10px 18px", borderRadius: 6, border: 0, fontSize: 14, cursor: "pointer" }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ background: "white", color: "#1a2b4a", padding: "10px 18px", borderRadius: 6, border: "1px solid #1a2b4a", fontSize: 14, textDecoration: "none" }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
