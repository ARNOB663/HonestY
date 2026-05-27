import { dbConnect } from "../../../lib/mongodb";
import Product from "../../../models/Product";
import ProductsManager from "../../../components/admin/ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await dbConnect();
  const products = await Product.find({}).sort({ updatedAt: -1 }).lean();
  const items = products.map((p) => ({
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
  return <ProductsManager initial={items} />;
}
