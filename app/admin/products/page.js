import { unstable_cache } from "next/cache";
import { dbConnect } from "../../../lib/mongodb";
import Product from "../../../models/Product";
import ProductsManager from "../../../components/admin/ProductsManager";

export const dynamic = "force-dynamic";

// 60s cache keyed by tag so any product mutation can bust it instantly
// via revalidateTag("admin-products"). Cuts the full catalog read out of
// every admin nav.
const cachedProducts = unstable_cache(
  async () => {
    await dbConnect();
    const products = await Product.find({}).sort({ updatedAt: -1 }).lean();
    return products.map((p) => ({
      _id: String(p._id),
      slug: p.slug,
      title: p.title,
      collection: p.collection || "",
      price: p.price,
      compareAtPrice: p.compareAtPrice || null,
      inventory: p.inventory ?? 0,
      featured: !!p.featured,
      image: p.image || "",
      variantsCount: (p.variants || []).length,
      updatedAt: p.updatedAt,
    }));
  },
  ["admin-products-list-v1"],
  { revalidate: 60, tags: ["admin-products"] }
);

export default async function AdminProducts() {
  const items = await cachedProducts();
  return <ProductsManager initial={items} />;
}
