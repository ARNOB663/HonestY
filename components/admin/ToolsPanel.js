"use client";
import { useEffect, useState, useRef } from "react";

function Tile({ title, sub, children, ok, error, accent, danger }) {
  const border = danger ? "border-red-200" : accent ? "border-amber-200" : "border-gray-200";
  return (
    <div className={`bg-white border ${border} rounded-lg p-5 shadow-sm`}>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{sub}</p>
      <div className="mt-3">{children}</div>
      {ok && <p className="text-xs text-green-700 mt-2">✓ {ok}</p>}
      {error && <p className="text-xs text-red-700 mt-2">✗ {error}</p>}
    </div>
  );
}

const BTN = "bg-[#1a2b4a] text-white text-sm font-medium px-4 py-1.5 rounded disabled:opacity-50";
const BTN_GREEN = "bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded disabled:opacity-50";
const BTN_RED = "bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded disabled:opacity-50";
const FIELD = "border border-gray-300 rounded px-3 py-1.5 text-sm w-full";

export default function ToolsPanel() {
  const [stats, setStats] = useState(null);
  const [statsBusy, setStatsBusy] = useState(false);

  async function loadStats() {
    setStatsBusy(true);
    try {
      const r = await fetch("/api/admin/tools/db-stats");
      setStats(await r.json());
    } catch {} finally { setStatsBusy(false); }
  }
  useEffect(() => { loadStats(); }, []);

  // ── Generic helper for the simple "click button → POST → show result" tiles
  function useAction() {
    const [s, setS] = useState({});
    async function run(url, body) {
      setS({ busy: true });
      try {
        const r = await fetch(url, body !== undefined ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body || {}),
        } : { method: "POST" });
        const data = await r.json();
        if (r.ok) setS({ ok: data });
        else setS({ error: data.error || `HTTP ${r.status}` });
      } catch (e) { setS({ error: e.message }); }
    }
    return [s, run];
  }

  const [cacheS, runCache] = useAction();
  const [emailS, runEmail] = useAction();
  const [recompS, runRecomp] = useAction();
  const [remindS, runRemind] = useAction();
  const [alertsS, runAlerts] = useAction();
  const [lowStockS, runLowStock] = useAction();
  const [priceS, runPrice] = useAction();
  const [blastS, runBlast] = useAction();

  // ── Bulk price form state
  const [priceForm, setPriceForm] = useState({ changePercent: 10, collection: "all", round: 0 });

  // ── Bulk newsletter form
  const [blastForm, setBlastForm] = useState({ subject: "", message: "" });

  // ── Low stock form
  const [lowStockThresh, setLowStockThresh] = useState(5);

  // ── Restore from Excel
  const restoreRef = useRef(null);
  const [restoreS, setRestoreS] = useState({});
  async function uploadRestore(e) {
    e.preventDefault();
    const file = restoreRef.current?.files?.[0];
    if (!file) { setRestoreS({ error: "Pick an .xlsx first" }); return; }
    if (!confirm("Restore from this Excel file? Existing rows with matching keys will be OVERWRITTEN. Continue?")) return;
    setRestoreS({ busy: true });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/tools/restore-excel", { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok) setRestoreS({ ok: data });
      else setRestoreS({ error: data.error || `HTTP ${r.status}` });
    } catch (e) { setRestoreS({ error: e.message }); }
  }

  function exportExcel() { window.location.href = "/api/admin/tools/export-excel"; }
  function exportLabels() { window.location.href = "/api/admin/tools/print-labels"; }

  function summary(s) {
    if (!s) return "";
    if (s.busy) return "Working…";
    if (s.ok) return null;
    return null;
  }

  return (
    <div className="space-y-8">
      {/* ── 1. DATABASE STATS ────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Overview</h2>
        <Tile title="Database stats" sub="Row counts across every table.">
          {stats?.counts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {Object.entries(stats.counts).map(([k, v]) => (
                <div key={k} className="border border-gray-200 rounded px-3 py-2 bg-gray-50">
                  <p className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="text-base font-semibold">{v}</p>
                </div>
              ))}
            </div>
          ) : statsBusy ? <p className="text-xs text-gray-500">Loading…</p> : null}
          <button onClick={loadStats} disabled={statsBusy} className={`${BTN} mt-3`}>
            {statsBusy ? "Refreshing…" : "Refresh"}
          </button>
        </Tile>
      </section>

      {/* ── 2. BACKUP + RESTORE ─────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Backup & restore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Tile title="Download backup" sub="One .xlsx with every table as a sheet. Save weekly to Google Drive for disaster recovery." accent>
            <button onClick={exportExcel} className={BTN_GREEN}>↓ Download .xlsx</button>
          </Tile>
          <Tile title="Restore from backup" sub="Upload a previously-downloaded backup .xlsx. Rows matching by key (slug, email, code) are OVERWRITTEN. No deletes." danger>
            <form onSubmit={uploadRestore} className="space-y-2">
              <input ref={restoreRef} type="file" accept=".xlsx" className="text-xs block" />
              <button type="submit" disabled={restoreS.busy} className={BTN_RED}>
                {restoreS.busy ? "Importing…" : "↑ Upload and restore"}
              </button>
            </form>
            {restoreS.ok && (
              <p className="text-xs text-green-700 mt-2">
                ✓ Imported: {Object.entries(restoreS.ok.imported || {}).map(([k, v]) => `${v} ${k}`).join(", ")}
              </p>
            )}
            {restoreS.error && <p className="text-xs text-red-700 mt-2">✗ {restoreS.error}</p>}
          </Tile>
        </div>
      </section>

      {/* ── 3. SHIPPING / ORDERS ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Orders & shipping</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Tile title="Print shipping labels" sub="Download a CSV of every order ready to ship (confirmed / paid / fulfilled). Compatible with Pathao, Steadfast, RedX label upload.">
            <button onClick={exportLabels} className={BTN}>↓ Download labels.csv</button>
          </Tile>
          <Tile title="Recompute order totals" sub="Recalculates subtotal + total for every order from items × qty − discount + shipping. Use after fixing item rows manually.">
            <button onClick={() => runRecomp("/api/admin/tools/recompute-totals")} disabled={recompS.busy} className={BTN}>
              {recompS.busy ? "Recomputing…" : "Recompute"}
            </button>
            {recompS.ok && <p className="text-xs text-green-700 mt-2">✓ Fixed {recompS.ok.fixed} of {recompS.ok.scanned} orders</p>}
            {recompS.error && <p className="text-xs text-red-700 mt-2">✗ {recompS.error}</p>}
          </Tile>
          <Tile title="Send pending reminders" sub="Emails customers whose orders are still pending after 24 hours. Common cause: prepaid order with missing TrxID.">
            <button onClick={() => runRemind("/api/admin/tools/order-reminders")} disabled={remindS.busy} className={BTN}>
              {remindS.busy ? "Sending…" : "Send reminders"}
            </button>
            {remindS.ok && <p className="text-xs text-green-700 mt-2">✓ Sent {remindS.ok.sent} of {remindS.ok.scanned}, skipped {remindS.ok.skipped}</p>}
            {remindS.error && <p className="text-xs text-red-700 mt-2">✗ {remindS.error}</p>}
          </Tile>
          <Tile title="Clear stuck stock alerts" sub="Delete back-in-stock requests older than 30 days. Frees DB space and avoids notifying customers who no longer care.">
            <button onClick={() => runAlerts("/api/admin/tools/clear-alerts", { olderThanDays: 30 })} disabled={alertsS.busy} className={BTN}>
              {alertsS.busy ? "Clearing…" : "Clear (>30 days)"}
            </button>
            {alertsS.ok && <p className="text-xs text-green-700 mt-2">✓ Deleted {alertsS.ok.deleted} alerts</p>}
            {alertsS.error && <p className="text-xs text-red-700 mt-2">✗ {alertsS.error}</p>}
          </Tile>
        </div>
      </section>

      {/* ── 4. INVENTORY ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Tile title="Low-stock alert email" sub="Email the admin a list of products at or below a threshold.">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] uppercase text-gray-500 mb-1">Threshold</label>
                <input type="number" min={0} value={lowStockThresh} onChange={(e) => setLowStockThresh(Number(e.target.value))} className={FIELD} />
              </div>
              <button onClick={() => runLowStock("/api/admin/tools/low-stock", { threshold: lowStockThresh })} disabled={lowStockS.busy} className={BTN}>
                {lowStockS.busy ? "Working…" : "Send"}
              </button>
            </div>
            {lowStockS.ok?.sent === false && <p className="text-xs text-gray-500 mt-2">{lowStockS.ok.message}</p>}
            {lowStockS.ok?.sent && <p className="text-xs text-green-700 mt-2">✓ Sent report on {lowStockS.ok.products} products to {lowStockS.ok.to}</p>}
            {lowStockS.error && <p className="text-xs text-red-700 mt-2">✗ {lowStockS.error}</p>}
          </Tile>
          <Tile title="Bulk price change" sub="Apply % change to all products or one collection. Optional round to nearest ৳ for cleaner prices." accent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">% change</label>
                  <input type="number" step={0.1} value={priceForm.changePercent} onChange={(e) => setPriceForm({ ...priceForm, changePercent: Number(e.target.value) })} className={FIELD} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Collection</label>
                  <input value={priceForm.collection} onChange={(e) => setPriceForm({ ...priceForm, collection: e.target.value })} placeholder="all" className={FIELD} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1">Round to</label>
                  <select value={priceForm.round} onChange={(e) => setPriceForm({ ...priceForm, round: Number(e.target.value) })} className={FIELD}>
                    <option value={0}>No rounding</option>
                    <option value={10}>৳10</option>
                    <option value={50}>৳50</option>
                    <option value={100}>৳100</option>
                  </select>
                </div>
              </div>
              <button onClick={() => {
                if (confirm(`Apply ${priceForm.changePercent}% price change to ${priceForm.collection === "all" || !priceForm.collection ? "ALL products" : `collection "${priceForm.collection}"`}? This cannot be auto-undone.`)) {
                  runPrice("/api/admin/tools/bulk-price", priceForm);
                }
              }} disabled={priceS.busy} className={`${BTN} mt-1`}>
                {priceS.busy ? "Applying…" : "Apply"}
              </button>
            </div>
            {priceS.ok && (
              <div className="text-xs text-green-700 mt-2">
                ✓ Updated {priceS.ok.updated} of {priceS.ok.scanned} products
                {priceS.ok.sample?.length > 0 && (
                  <ul className="mt-1 text-gray-600">
                    {priceS.ok.sample.map((p) => (
                      <li key={p.slug}>· {p.slug}: ৳{p.before} → ৳{p.after}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {priceS.error && <p className="text-xs text-red-700 mt-2">✗ {priceS.error}</p>}
          </Tile>
        </div>
      </section>

      {/* ── 5. EMAIL / CACHE ────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Email & cache</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Tile title="Send test email" sub="Verify SMTP works by sending a test to your admin address.">
            <button onClick={() => runEmail("/api/admin/tools/test-email")} disabled={emailS.busy} className={BTN}>
              {emailS.busy ? "Sending…" : "Send test"}
            </button>
            {emailS.ok && <p className="text-xs text-green-700 mt-2">✓ Sent to {emailS.ok.to}</p>}
            {emailS.error && <p className="text-xs text-red-700 mt-2">✗ {emailS.error}</p>}
          </Tile>
          <Tile title="Reset dashboard cache" sub="Clears all admin caches so the dashboard re-reads from DB immediately.">
            <button onClick={() => runCache("/api/admin/tools/clear-cache")} disabled={cacheS.busy} className={BTN}>
              {cacheS.busy ? "Clearing…" : "Clear cache"}
            </button>
            {cacheS.ok && <p className="text-xs text-green-700 mt-2">✓ Cleared {cacheS.ok.busted.tags} tags + {cacheS.ok.busted.paths} paths</p>}
            {cacheS.error && <p className="text-xs text-red-700 mt-2">✗ {cacheS.error}</p>}
          </Tile>
          <Tile title="Bulk newsletter blast" sub="Email every subscriber. Paced at ~5/sec to stay under Gmail's per-second limit." danger>
            <div className="space-y-2">
              <input value={blastForm.subject} onChange={(e) => setBlastForm({ ...blastForm, subject: e.target.value })} placeholder="Subject" className={FIELD} />
              <textarea value={blastForm.message} onChange={(e) => setBlastForm({ ...blastForm, message: e.target.value })} placeholder="Plain text message. Newlines become paragraphs." rows={4} className={FIELD} />
              <button onClick={() => {
                if (!blastForm.subject || !blastForm.message) { alert("Fill subject + message"); return; }
                if (confirm("Send this to EVERY subscriber? This cannot be undone.")) {
                  runBlast("/api/admin/tools/newsletter-blast", blastForm);
                }
              }} disabled={blastS.busy} className={BTN_RED}>
                {blastS.busy ? "Sending…" : "Send to all subscribers"}
              </button>
            </div>
            {blastS.ok && <p className="text-xs text-green-700 mt-2">✓ Sent {blastS.ok.sent} of {blastS.ok.total}, {blastS.ok.failed} failed</p>}
            {blastS.error && <p className="text-xs text-red-700 mt-2">✗ {blastS.error}</p>}
          </Tile>
          <Tile title="Open Prisma Studio (dev only)" sub="Direct GUI to browse and edit every table. Local machine only.">
            <code className="block bg-gray-100 px-3 py-2 rounded text-xs font-mono">npm run db:studio</code>
          </Tile>
        </div>
      </section>
    </div>
  );
}
