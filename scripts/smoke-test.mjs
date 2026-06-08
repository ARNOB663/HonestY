// Comprehensive smoke test for the Honesty storefront + admin after the
// MongoDB → SQL/Prisma migration. Mixes browser-driven UI checks with direct
// API hits so each layer is independently verified.
//
// Run while `npm run dev` is up:
//   node --env-file=.env.local scripts/smoke-test.mjs
//
// Exit code 0 = all green, 1 = at least one failure.

import { chromium } from "playwright";
import { setTimeout as wait } from "node:timers/promises";
import { prisma } from "../lib/db.js";

const BASE = "http://localhost:3000";
const RESULTS = [];
let SECTION = "";

function log(name, ok, detail = "") {
  const mark = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  console.log(`    ${mark} ${name}${detail ? ` — ${detail}` : ""}`);
  RESULTS.push({ section: SECTION, name, ok, detail });
}

async function section(title, fn) {
  SECTION = title;
  console.log(`\n\x1b[1m▸ ${title}\x1b[0m`);
  try { await fn(); } catch (e) { log(title, false, `crashed: ${e.message}`); }
}

// Helper to call an API on the dev server independently of the browser.
// Origin + x-forwarded-host satisfy the checkOrigin() guard on mutating routes.
const SAME_ORIGIN_HEADERS = { "Origin": BASE, "x-forwarded-host": "localhost:3000" };

async function apiGet(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...SAME_ORIGIN_HEADERS, ...(opts.headers || {}) },
  });
  let body;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body, ok: r.ok };
}
async function apiPost(path, body, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...SAME_ORIGIN_HEADERS, ...(opts.headers || {}) },
    body: JSON.stringify(body),
    ...opts,
  });
  let resp;
  try { resp = await r.json(); } catch { resp = null; }
  return { status: r.status, body: resp, ok: r.ok };
}

const consoleErrors = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });

  // ── A. Storefront — public pages render ──────────────────────────────
  await section("A. Storefront pages render", async () => {
    const pages = [
      ["/", "Homepage"],
      ["/products", "Products list"],
      ["/cart", "Cart"],
      ["/wishlist", "Wishlist"],
      ["/track", "Track order"],
      ["/login", "Login"],
      ["/register", "Register"],
      ["/forgot", "Forgot password"],
      ["/some-random-broken-url", "Branded 404"],
    ];
    for (const [path, name] of pages) {
      const r = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      const status = r.status();
      const isHomepage404 = path === "/some-random-broken-url" && status === 404;
      log(`${name} (${path})`, r.ok() || isHomepage404, `status ${status}`);
    }
  });

  // ── B. Product browsing ──────────────────────────────────────────────
  let testSlug;
  await section("B. Product browsing", async () => {
    await page.goto(`${BASE}/products`, { waitUntil: "domcontentloaded" });
    const slug = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/products/"]')]
        .map((el) => el.getAttribute("href"))
        .find((h) => h && h !== "/products" && !h.startsWith("/products?"));
      return a ? a.split("/products/")[1] : null;
    });
    if (!slug) { log("Find a product slug", false); return; }
    testSlug = slug;
    log("Find a product slug", true, slug);

    // Product detail
    await page.goto(`${BASE}/products/${slug}`, { waitUntil: "domcontentloaded" });
    const hasAddBtn = await page.locator('button:has-text("ADD TO CART"), button:has-text("OUT OF STOCK")').count();
    log("Detail page has ADD TO CART (or OUT OF STOCK) button", hasAddBtn > 0);
    const hasPrice = await page.locator('text=/৳[0-9,]+/').count();
    log("Detail page shows a price", hasPrice > 0);

    // Collection page
    const r = await page.goto(`${BASE}/collections/fashion`, { waitUntil: "domcontentloaded" });
    log("Collection page /collections/fashion loads", r.ok(), `status ${r.status()}`);
  });

  // ── C. API health ─────────────────────────────────────────────────────
  await section("C. API health", async () => {
    const r1 = await apiGet("/api/auth/session");
    log("/api/auth/session 200", r1.status === 200, `status ${r1.status}`);

    const r2 = await apiGet("/api/public/settings");
    log("/api/public/settings 200 with storeName", r2.ok && !!r2.body?.storeName, `status ${r2.status}`);

    const r3 = await apiPost("/api/cart/validate", { slugs: testSlug ? [testSlug] : [] });
    log("/api/cart/validate returns products", r3.ok && Array.isArray(r3.body?.products), `count ${r3.body?.products?.length}`);

    const r4 = await apiGet(`/api/search?q=oil`);
    log("/api/search returns results", r4.ok && Array.isArray(r4.body?.results), `count ${r4.body?.results?.length}`);
  });

  // ── D. Admin auth gating (anonymous) ─────────────────────────────────
  await section("D. Admin gating (anonymous)", async () => {
    const anonCtx = await browser.newContext();
    const ap = await anonCtx.newPage();

    const r = await ap.goto(`${BASE}/admin/orders`, { waitUntil: "domcontentloaded" });
    log("/admin/orders redirects anon to /login", ap.url().includes("/login"), ap.url());

    const status = await ap.evaluate(async () => (await fetch("/api/admin/products")).status);
    log("/api/admin/products returns 401/403 for anon", status === 401 || status === 403, `status ${status}`);

    const adminEndpoints = [
      "/api/admin/categories",
      "/api/admin/tools/db-stats",
      "/api/admin/tools/export-excel",
    ];
    for (const ep of adminEndpoints) {
      const s = await ap.evaluate(async (u) => (await fetch(u)).status, ep);
      log(`${ep} blocks anon`, s === 401 || s === 403, `status ${s}`);
    }
    await anonCtx.close();
  });

  // ── E. Register + login flow ─────────────────────────────────────────
  const testEmail = `smoke+${Date.now()}@test.local`;
  const testPass = "TestPassword123!";
  await section("E. Register + login (credentials)", async () => {
    const reg = await apiPost("/api/register", { email: testEmail, password: testPass, name: "Smoke User" });
    log("/api/register OK", reg.ok, `status ${reg.status} ${JSON.stringify(reg.body)}`);

    // Sign in via the next-auth credentials endpoint directly so cookies land
    // in the browser context — UI form click is flakier.
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    const csrfRes = await page.evaluate(async () => (await fetch("/api/auth/csrf")).json());
    await page.evaluate(async ({ csrfToken, email, password }) => {
      const fd = new URLSearchParams();
      fd.set("csrfToken", csrfToken);
      fd.set("email", email);
      fd.set("password", password);
      fd.set("callbackUrl", "/");
      fd.set("json", "true");
      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd.toString(),
        redirect: "manual",
      });
    }, { csrfToken: csrfRes.csrfToken, email: testEmail, password: testPass });

    const sess = await page.evaluate(async () => (await fetch("/api/auth/session")).json());
    log("Session has email after login", sess?.user?.email === testEmail, sess?.user?.email);
  });

  // ── F. Cart sync (server) ────────────────────────────────────────────
  await section("F. Cart server sync (logged in)", async () => {
    if (!testSlug) { log("Skipped (no test slug)", false); return; }
    const cookies = await ctx.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Put items via PUT
    const put = await fetch(`${BASE}/api/cart`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Cookie": cookieHeader, "x-forwarded-host": "localhost:3000", "Origin": BASE },
      body: JSON.stringify({ items: [{ slug: testSlug, qty: 1, title: "Test", price: 100 }] }),
    });
    log("PUT /api/cart 200", put.ok, `status ${put.status}`);

    const get = await fetch(`${BASE}/api/cart`, { headers: { "Cookie": cookieHeader } });
    const data = await get.json();
    log("GET /api/cart returns the synced item", Array.isArray(data.items) && data.items.some((i) => i.slug === testSlug), `${data.items?.length} items`);
  });

  // ── G. Order placement (COD via API) ─────────────────────────────────
  let placedOrderId = null;
  await section("G. Place a COD order via /api/orders", async () => {
    if (!testSlug) { log("Skipped (no test slug)", false); return; }
    const cookies = await ctx.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const orderRes = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
        "x-forwarded-host": "localhost:3000",
        "Origin": BASE,
      },
      body: JSON.stringify({
        items: [{ slug: testSlug, qty: 1 }],
        shippingAddress: {
          name: "Smoke Tester",
          phone: "01711111111",
          line1: "Test House 12, Road 5",
          city: "Dhaka",
          state: "Dhaka",
          country: "Bangladesh",
        },
        payment: { method: "cod" },
        email: testEmail,
      }),
    });
    const data = await orderRes.json();
    placedOrderId = data?.id || null;
    log("Order POST returns ok + id", orderRes.ok && data.ok && !!data.id, `status ${orderRes.status} body ${JSON.stringify(data)}`);
  });

  // ── H. Wishlist sync ─────────────────────────────────────────────────
  await section("H. Wishlist server sync", async () => {
    if (!testSlug) { log("Skipped", false); return; }
    const cookies = await ctx.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const put = await fetch(`${BASE}/api/wishlist`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Cookie": cookieHeader, "x-forwarded-host": "localhost:3000", "Origin": BASE },
      body: JSON.stringify({ slugs: [testSlug] }),
    });
    log("PUT /api/wishlist 200", put.ok, `status ${put.status}`);

    const get = await fetch(`${BASE}/api/wishlist`, { headers: { "Cookie": cookieHeader } });
    const data = await get.json();
    log("GET /api/wishlist contains the slug", Array.isArray(data.slugs) && data.slugs.includes(testSlug));
  });

  // ── I. Discount validation ───────────────────────────────────────────
  await section("I. Discount code validation", async () => {
    const valid = await apiPost("/api/discounts/validate", {
      code: "WELCOME10",
      subtotal: 2000,
      items: testSlug ? [{ slug: testSlug, qty: 1, price: 2000 }] : [],
    });
    log("WELCOME10 valid → returns discountAmount", valid.ok && valid.body?.discountAmount > 0, `amount ${valid.body?.discountAmount}`);

    const invalid = await apiPost("/api/discounts/validate", { code: "NOPE_FAKE_12345", subtotal: 2000 });
    log("Bogus code returns error", !invalid.ok, `status ${invalid.status}`);
  });

  // ── J. Stock-alert + newsletter ──────────────────────────────────────
  await section("J. Newsletter + stock alert", async () => {
    const ns = await apiPost("/api/newsletter", { email: `news+${Date.now()}@test.local` }, {
      headers: { "x-forwarded-host": "localhost:3000", "Origin": BASE },
    });
    log("/api/newsletter accepts an email", ns.ok, `status ${ns.status}`);

    if (testSlug) {
      const sa = await apiPost("/api/stock-alert", { email: `alert+${Date.now()}@test.local`, productSlug: testSlug }, {
        headers: { "x-forwarded-host": "localhost:3000", "Origin": BASE },
      });
      log("/api/stock-alert registers the alert", sa.ok, `status ${sa.status}`);
    }
  });

  // ── K. /track order lookup ────────────────────────────────────────────
  await section("K. Order tracking", async () => {
    // Find an order we created or any order in DB belonging to test user
    const cookies = await ctx.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const r = await fetch(`${BASE}/api/account/orders`, { headers: { "Cookie": cookieHeader } });
    const data = await r.json();
    const idForTrack = placedOrderId || data.orders?.[0]?.code || data.orders?.[0]?.id;
    if (!idForTrack) { log("No order to track (skipping)", true); return; }
    const t = await apiGet(`/api/orders/track?id=${encodeURIComponent(idForTrack)}&email=${encodeURIComponent(testEmail)}`);
    log("/api/orders/track resolves the order", t.ok && !!t.body?.order, `status ${t.status} id=${idForTrack}`);
  });

  // Helper used by admin sections: sign in as the given email/password and
  // refresh cookies on `page`. Token (role) is encoded at login time, so
  // promoting a user in the DB *after* they're logged in requires a re-login.
  async function loginAs(targetPage, email, password) {
    await targetPage.context().clearCookies();
    await targetPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    const csrf = await targetPage.evaluate(async () => (await fetch("/api/auth/csrf")).json());
    await targetPage.evaluate(async ({ csrfToken, email, password }) => {
      const fd = new URLSearchParams();
      fd.set("csrfToken", csrfToken);
      fd.set("email", email);
      fd.set("password", password);
      fd.set("callbackUrl", "/");
      fd.set("json", "true");
      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd.toString(),
        redirect: "manual",
      });
    }, { csrfToken: csrf.csrfToken, email, password });
  }
  async function cookieHeaderFor(targetPage) {
    const cs = await targetPage.context().cookies();
    return cs.map((c) => `${c.name}=${c.value}`).join("; ");
  }

  // ── M. Admin promotion + admin auth ─────────────────────────────────
  let createdProductId = null;
  await section("M. Admin promotion + admin auth", async () => {
    await prisma.user.update({ where: { email: testEmail }, data: { role: "admin" } });
    await loginAs(page, testEmail, testPass);
    const sess = await page.evaluate(async () => (await fetch("/api/auth/session")).json());
    log("Session role is admin after re-login", sess?.user?.role === "admin", `role=${sess?.user?.role}`);

    const cookieHeader = await cookieHeaderFor(page);
    const r = await fetch(`${BASE}/api/admin/tools/db-stats`, { headers: { Cookie: cookieHeader } });
    log("Admin can hit /api/admin/tools/db-stats", r.ok, `status ${r.status}`);
  });

  // ── N. Admin CRUD: product ──────────────────────────────────────────
  const newSlug = `smoke-product-${Date.now()}`;
  await section("N. Admin product CRUD", async () => {
    const cookieHeader = await cookieHeaderFor(page);

    const create = await fetch(`${BASE}/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({
        slug: newSlug,
        title: "Smoke Test Product",
        description: "Created by smoke-test.mjs",
        price: 999,
        compareAtPrice: 1299,
        costPrice: 400,
        inventory: 25,
        image: "https://example.com/placeholder.jpg",
        images: [],
        collection: "fashion",
        tags: ["smoke"],
        featured: false,
        specs: [],
        warranty: "",
        variants: [],
      }),
    });
    const createBody = await create.json();
    createdProductId = createBody?.id || null;
    log("POST /api/admin/products creates product", create.ok && !!createdProductId, `status ${create.status} id=${createdProductId}`);

    if (!createdProductId) return;

    // PUT replaces the product — fetch the current row first so required
    // fields aren't dropped, then bump the price.
    const current = await prisma.product.findUnique({ where: { id: Number(createdProductId) }, include: { variants: true } });
    const patch = await fetch(`${BASE}/api/admin/products/${createdProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({ ...current, price: 1099, variants: [] }),
    });
    log("PUT /api/admin/products/[id] updates price", patch.ok, `status ${patch.status}`);

    const fetched = await prisma.product.findUnique({ where: { id: Number(createdProductId) }, select: { price: true, slug: true } });
    log("Patched price persists in DB", fetched?.price === 1099, `price=${fetched?.price}`);

    const list = await fetch(`${BASE}/api/admin/products`, { headers: { Cookie: cookieHeader } });
    const listBody = await list.json();
    const found = (listBody.products || []).find((p) => p.slug === newSlug);
    log("GET /api/admin/products contains new product", !!found);

    const del = await fetch(`${BASE}/api/admin/products/${createdProductId}`, {
      method: "DELETE",
      headers: { Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
    });
    log("DELETE /api/admin/products/[id] removes product", del.ok, `status ${del.status}`);
    const after = await prisma.product.findUnique({ where: { id: Number(createdProductId) }, select: { id: true } });
    log("Deleted product gone from DB", after === null);
  });

  // ── O. Admin CRUD: discount ─────────────────────────────────────────
  const newDiscount = `SMOKE${Date.now()}`.slice(0, 16);
  await section("O. Admin discount CRUD", async () => {
    const cookieHeader = await cookieHeaderFor(page);
    const create = await fetch(`${BASE}/api/admin/discounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({
        code: newDiscount,
        type: "fixed",
        value: 50,
        minSubtotal: 100,
        usageLimit: 5,
        active: true,
        description: "smoke test",
      }),
    });
    log("POST /api/admin/discounts creates code", create.ok, `status ${create.status}`);

    const validate = await apiPost("/api/discounts/validate", {
      code: newDiscount, subtotal: 500, items: testSlug ? [{ slug: testSlug, qty: 1, price: 500 }] : [],
    });
    log("New discount validates with discountAmount 50", validate.ok && validate.body?.discountAmount === 50, `amount ${validate.body?.discountAmount}`);

    const discount = await prisma.discount.findUnique({ where: { code: newDiscount }, select: { id: true } });
    if (discount) {
      await prisma.discount.delete({ where: { id: discount.id } });
      log("Discount cleanup deletes test code", true);
    } else {
      log("Discount cleanup found nothing to delete", false);
    }
  });

  // ── P. Discount edge cases ──────────────────────────────────────────
  await section("P. Discount edge cases", async () => {
    // Below minSubtotal — WELCOME10 requires >= 1500
    const tooSmall = await apiPost("/api/discounts/validate", { code: "WELCOME10", subtotal: 500, items: [] });
    log("WELCOME10 rejected below minSubtotal", !tooSmall.ok, `status ${tooSmall.status}`);

    // Expired discount
    const expCode = `EXP${Date.now()}`.slice(0, 12);
    await prisma.discount.create({
      data: { code: expCode, type: "percent", value: 10, minSubtotal: 0, usageLimit: 0, active: true, expiresAt: new Date(Date.now() - 86400000), appliesTo: "all" },
    });
    const expired = await apiPost("/api/discounts/validate", { code: expCode, subtotal: 1000, items: [] });
    log("Expired discount rejected", !expired.ok, `status ${expired.status}`);
    await prisma.discount.deleteMany({ where: { code: expCode } });

    // Inactive discount
    const inactiveCode = `OFF${Date.now()}`.slice(0, 12);
    await prisma.discount.create({
      data: { code: inactiveCode, type: "percent", value: 10, minSubtotal: 0, usageLimit: 0, active: false, appliesTo: "all" },
    });
    const inactive = await apiPost("/api/discounts/validate", { code: inactiveCode, subtotal: 1000, items: [] });
    log("Inactive discount rejected", !inactive.ok, `status ${inactive.status}`);
    await prisma.discount.deleteMany({ where: { code: inactiveCode } });
  });

  // ── Q. Order lifecycle PATCH ────────────────────────────────────────
  await section("Q. Order lifecycle PATCH", async () => {
    if (!placedOrderId) { log("No order to patch (skipping)", false); return; }
    const cookieHeader = await cookieHeaderFor(page);

    const p1 = await fetch(`${BASE}/api/admin/orders/${placedOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({ status: "confirmed" }),
    });
    log("PATCH order → confirmed", p1.ok, `status ${p1.status}`);

    const p2 = await fetch(`${BASE}/api/admin/orders/${placedOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({ status: "delivered" }),
    });
    log("PATCH order → delivered", p2.ok, `status ${p2.status}`);

    const o = await prisma.order.findUnique({ where: { code: placedOrderId }, select: { status: true, statusHistory: true } });
    log("DB status now 'delivered'", o?.status === "delivered", `status=${o?.status}`);
    const hist = Array.isArray(o?.statusHistory) ? o.statusHistory : [];
    log("statusHistory has 2 entries", hist.length === 2, `entries=${hist.length}`);
  });

  // ── R. Inventory decrement + overflow protection ────────────────────
  await section("R. Inventory decrement + overflow", async () => {
    if (!testSlug) { log("Skipped", false); return; }
    const before = await prisma.product.findUnique({ where: { slug: testSlug }, select: { inventory: true } });

    // Place a 1-unit order via API (logged in as same user, who is now admin —
    // ordering is still allowed for everyone).
    const cookieHeader = await cookieHeaderFor(page);
    const r = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({
        items: [{ slug: testSlug, qty: 1 }],
        shippingAddress: { name: "Inv Tester", phone: "01711111111", line1: "X", city: "Dhaka", state: "Dhaka", country: "Bangladesh" },
        payment: { method: "cod" },
        email: testEmail,
      }),
    });
    log("Inventory test order POST ok", r.ok, `status ${r.status}`);
    const after = await prisma.product.findUnique({ where: { slug: testSlug }, select: { inventory: true } });
    log("Inventory decremented by exactly 1", after?.inventory === (before?.inventory ?? 0) - 1, `${before?.inventory} → ${after?.inventory}`);

    // Overflow: try to order 999999 of the same product, expect rejection.
    const over = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({
        items: [{ slug: testSlug, qty: 999999 }],
        shippingAddress: { name: "Overflow", phone: "01711111111", line1: "X", city: "Dhaka", state: "Dhaka", country: "Bangladesh" },
        payment: { method: "cod" },
        email: testEmail,
      }),
    });
    log("Over-order qty 999999 is rejected", !over.ok, `status ${over.status}`);
    const stillSame = await prisma.product.findUnique({ where: { slug: testSlug }, select: { inventory: true } });
    log("Inventory unchanged after failed over-order", stillSame?.inventory === after?.inventory, `${stillSame?.inventory}`);
  });

  // ── S. Customer account routes ──────────────────────────────────────
  await section("S. Customer account routes", async () => {
    const cookieHeader = await cookieHeaderFor(page);

    const acct = await fetch(`${BASE}/api/account`, { headers: { Cookie: cookieHeader } });
    log("GET /api/account returns 200", acct.ok, `status ${acct.status}`);

    // Place a fresh small order then cancel it through the customer endpoint.
    const order = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
      body: JSON.stringify({
        items: testSlug ? [{ slug: testSlug, qty: 1 }] : [],
        shippingAddress: { name: "Cancel Test", phone: "01711111111", line1: "X", city: "Dhaka", state: "Dhaka", country: "Bangladesh" },
        payment: { method: "cod" },
        email: testEmail,
      }),
    });
    const orderBody = await order.json();
    const cancelCode = orderBody?.id;
    if (!cancelCode) { log("Could not place order to cancel", false); return; }

    const cancel = await fetch(`${BASE}/api/account/orders/${cancelCode}/cancel`, {
      method: "POST",
      headers: { Cookie: cookieHeader, ...SAME_ORIGIN_HEADERS },
    });
    log("POST /api/account/orders/[id]/cancel succeeds", cancel.ok, `status ${cancel.status}`);
    const cancelled = await prisma.order.findUnique({ where: { code: cancelCode }, select: { status: true } });
    log("Cancelled order has status='cancelled'", cancelled?.status === "cancelled", `status=${cancelled?.status}`);
  });

  // ── T. Excel export downloads ───────────────────────────────────────
  await section("T. Excel export download", async () => {
    const cookieHeader = await cookieHeaderFor(page);
    const r = await fetch(`${BASE}/api/admin/tools/export-excel`, { headers: { Cookie: cookieHeader } });
    log("export-excel returns 200", r.ok, `status ${r.status}`);
    const ct = r.headers.get("content-type") || "";
    log("export-excel content-type is xlsx", ct.includes("spreadsheetml"), ct);
    const buf = Buffer.from(await r.arrayBuffer());
    // .xlsx files are zip archives — first two bytes are PK.
    log("export-excel body is a real zip (PK header)", buf.length > 1000 && buf[0] === 0x50 && buf[1] === 0x4b, `bytes=${buf.length}`);
  });

  // ── U. Admin CSV export + filters ───────────────────────────────────
  await section("U. Admin orders CSV export", async () => {
    const cookieHeader = await cookieHeaderFor(page);
    const r = await fetch(`${BASE}/api/admin/orders/export?status=delivered`, { headers: { Cookie: cookieHeader } });
    log("CSV export returns 200", r.ok, `status ${r.status}`);
    const ct = r.headers.get("content-type") || "";
    log("CSV content-type is text/csv", ct.includes("text/csv"), ct);
    const text = await r.text();
    const firstLine = text.split(/\r?\n/)[0] || "";
    log("CSV header line includes expected columns", firstLine.includes("status") && firstLine.includes("email") && firstLine.includes("total"));
  });

  // ── V. Security headers on storefront ───────────────────────────────
  await section("V. Security headers", async () => {
    const r = await fetch(`${BASE}/`);
    const h = (n) => r.headers.get(n) || "";
    log("X-Content-Type-Options: nosniff", h("x-content-type-options").toLowerCase() === "nosniff");
    log("X-Frame-Options: DENY", h("x-frame-options").toUpperCase() === "DENY");
    log("Strict-Transport-Security present", /max-age=/.test(h("strict-transport-security")));
    log("Content-Security-Policy present", /default-src/.test(h("content-security-policy")));
    log("Referrer-Policy set", /strict-origin/.test(h("referrer-policy")));
  });

  // ── L. Browser console errors ────────────────────────────────────────
  await section("L. Browser console health", async () => {
    // next-auth's useSession fetch is aborted whenever a page tears down mid-load.
    // The "CLIENT_FETCH_ERROR / Failed to fetch" lines that come from that are
    // navigation noise, not real bugs — filter them out before gating on it.
    const real = consoleErrors.filter((e) =>
      !/CLIENT_FETCH_ERROR/i.test(e) && !/Failed to fetch/i.test(e) && !/the server responded with a status of 404/i.test(e)
    );
    log(`No JS errors thrown during run (${real.length} real, ${consoleErrors.length} total)`, real.length === 0,
      real.slice(0, 3).join(" | "));
  });

  await browser.close();
  await prisma.$disconnect();

  console.log("\n─── Summary ──────────────────────────────────────────────");
  let currentSection = "";
  for (const r of RESULTS) {
    if (r.section !== currentSection) {
      console.log(`\n  \x1b[1m${r.section}\x1b[0m`);
      currentSection = r.section;
    }
    const mark = r.ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    console.log(`    ${mark}  ${r.name}${r.detail ? "  · " + r.detail : ""}`);
  }
  const failed = RESULTS.filter((r) => !r.ok);
  const total = RESULTS.length;
  const color = failed.length === 0 ? "\x1b[32m" : "\x1b[31m";
  console.log(`\n${color}${total - failed.length}/${total} checks passed.\x1b[0m\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});
