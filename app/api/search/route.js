import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongodb";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import Product from "../../../models/Product";

// Cached "no text index" flag — once we detect the index is missing on this
// process, skip the $text attempt entirely.
let textIndexAvailable = true;

export async function GET(req) {
  const rl = rateLimit({ key: `search:${clientIp(req)}`, limit: 60, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { results: [], error: "Too many search requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit")) || 8));
  if (!q || q.length < 2 || q.length > 80) return NextResponse.json({ results: [] });

  await dbConnect();

  const projection = { slug: 1, title: 1, price: 1, image: 1, collection: 1, inventory: 1, variants: 1 };

  if (textIndexAvailable) {
    try {
      const results = await Product.find(
        { $text: { $search: q } },
        { ...projection, score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
      return NextResponse.json({ results: results.map(shape) });
    } catch (e) {
      // Mongo error codes for "text index required" or "no text index" — fall
      // through to regex and remember not to retry on this process.
      if (e?.code === 27 || e?.code === 17287 || /text index/i.test(e?.message || "")) {
        textIndexAvailable = false;
      } else {
        return NextResponse.json({ results: [] });
      }
    }
  }

  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(safe, "i");
  const results = await Product.find(
    { $or: [{ title: re }, { tags: re }, { collection: re }] },
    projection
  )
    .limit(limit)
    .lean();
  return NextResponse.json({ results: results.map(shape) });
}

function shape(p) {
  const variantStock = (p.variants || []).reduce((s, v) => s + (v.inventory || 0), 0);
  const stock = p.variants?.length ? variantStock : (p.inventory ?? 0);
  return {
    slug: p.slug,
    title: p.title,
    price: p.price,
    image: p.image,
    collection: p.collection,
    inStock: stock > 0,
  };
}
