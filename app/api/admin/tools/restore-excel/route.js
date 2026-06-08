// Restore data from an .xlsx backup created by /api/admin/tools/export-excel.
// Uses upsert by natural key (slug, email, code, publicId) so re-runs and
// partial backups are safe. Does NOT delete rows that aren't in the backup —
// strictly additive / overwrite-by-key.
//
// Accepts multipart form-data with field "file" (the .xlsx).
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import * as XLSX from "xlsx";

function parseJson(v) {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return v; }
}

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function str(v) {
  return v === null || v === undefined || v === "" ? null : String(v);
}

function bool(v) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  return false;
}

function date(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function readSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

export const POST = withAdmin(async ({ req }) => {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) throw httpError("No file uploaded");
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });

  const results = { users: 0, products: 0, categories: 0, discounts: 0, pages: 0, subscribers: 0, salesGroups: 0 };

  // ── Categories ──
  for (const row of await readSheet(wb, "Categories")) {
    if (!row.slug) continue;
    await prisma.category.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title || row.slug,
        blurb: str(row.blurb),
        image: str(row.image),
        sortOrder: num(row.sortOrder),
      },
      update: {
        title: row.title || row.slug,
        blurb: str(row.blurb),
        image: str(row.image),
        sortOrder: num(row.sortOrder),
      },
    });
    results.categories++;
  }

  // ── Users ──
  for (const row of await readSheet(wb, "Users")) {
    if (!row.email) continue;
    const email = String(row.email).toLowerCase();
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: str(row.name),
        passwordHash: str(row.passwordHash),
        image: str(row.image),
        provider: row.provider || "credentials",
        role: row.role || "user",
        tokenVersion: num(row.tokenVersion),
        phone: str(row.phone),
        backupPhone: str(row.backupPhone),
        addrLine1: str(row.addrLine1),
        addrArea: str(row.addrArea),
        addrCity: str(row.addrCity),
        addrState: str(row.addrState),
        addrCountry: str(row.addrCountry),
        wishlist: parseJson(row.wishlist),
        cart: parseJson(row.cart),
        createdAt: date(row.createdAt) || undefined,
      },
      update: {
        name: str(row.name),
        provider: row.provider || "credentials",
        role: row.role || "user",
        phone: str(row.phone),
        backupPhone: str(row.backupPhone),
        addrLine1: str(row.addrLine1),
        addrArea: str(row.addrArea),
        addrCity: str(row.addrCity),
        addrState: str(row.addrState),
        addrCountry: str(row.addrCountry),
      },
    });
    results.users++;
  }

  // ── Products ──
  for (const row of await readSheet(wb, "Products")) {
    if (!row.slug) continue;
    await prisma.product.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title || row.slug,
        description: str(row.description),
        price: num(row.price),
        compareAtPrice: row.compareAtPrice !== "" ? num(row.compareAtPrice) : null,
        costPrice: num(row.costPrice),
        image: str(row.image),
        images: parseJson(row.images),
        tags: parseJson(row.tags),
        specs: parseJson(row.specs),
        collection: str(row.collection),
        inventory: num(row.inventory, 0),
        featured: bool(row.featured),
        warranty: str(row.warranty),
      },
      update: {
        title: row.title || row.slug,
        description: str(row.description),
        price: num(row.price),
        compareAtPrice: row.compareAtPrice !== "" ? num(row.compareAtPrice) : null,
        costPrice: num(row.costPrice),
        image: str(row.image),
        images: parseJson(row.images),
        tags: parseJson(row.tags),
        specs: parseJson(row.specs),
        collection: str(row.collection),
        inventory: num(row.inventory, 0),
        featured: bool(row.featured),
        warranty: str(row.warranty),
      },
    });
    results.products++;
  }

  // ── Discounts ──
  for (const row of await readSheet(wb, "Discounts")) {
    if (!row.code) continue;
    await prisma.discount.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        type: row.type || "percent",
        value: num(row.value),
        minSubtotal: num(row.minSubtotal),
        usageLimit: num(row.usageLimit),
        usedCount: num(row.usedCount),
        active: bool(row.active),
        expiresAt: date(row.expiresAt),
        description: str(row.description) || "",
        appliesTo: row.appliesTo || "all",
        collectionSlug: row.collectionSlug || "",
      },
      update: {
        type: row.type || "percent",
        value: num(row.value),
        minSubtotal: num(row.minSubtotal),
        usageLimit: num(row.usageLimit),
        active: bool(row.active),
        expiresAt: date(row.expiresAt),
        description: str(row.description) || "",
        appliesTo: row.appliesTo || "all",
        collectionSlug: row.collectionSlug || "",
      },
    });
    results.discounts++;
  }

  // ── Pages ──
  for (const row of await readSheet(wb, "Pages")) {
    if (!row.slug) continue;
    await prisma.page.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title || row.slug,
        body: str(row.body),
        published: bool(row.published),
        metaTitle: str(row.metaTitle),
        metaDescription: str(row.metaDescription),
      },
      update: {
        title: row.title || row.slug,
        body: str(row.body),
        published: bool(row.published),
        metaTitle: str(row.metaTitle),
        metaDescription: str(row.metaDescription),
      },
    });
    results.pages++;
  }

  // ── Subscribers ──
  for (const row of await readSheet(wb, "Subscribers")) {
    if (!row.email) continue;
    await prisma.subscriber.upsert({
      where: { email: String(row.email).toLowerCase() },
      create: { email: String(row.email).toLowerCase(), source: row.source || "newsletter" },
      update: {},
    });
    results.subscribers++;
  }

  // ── Sales Groups ──
  for (const row of await readSheet(wb, "Sales Groups")) {
    if (!row.slug) continue;
    await prisma.salesGroup.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title || row.slug,
        subtitle: str(row.subtitle) || "",
        eyebrow: row.eyebrow || "Limited Time",
        active: bool(row.active),
        sortOrder: num(row.sortOrder),
        productSlugs: parseJson(row.productSlugs),
      },
      update: {
        title: row.title || row.slug,
        subtitle: str(row.subtitle) || "",
        eyebrow: row.eyebrow || "Limited Time",
        active: bool(row.active),
        sortOrder: num(row.sortOrder),
        productSlugs: parseJson(row.productSlugs),
      },
    });
    results.salesGroups++;
  }

  return { ok: true, imported: results };
}, { parseBody: false });
