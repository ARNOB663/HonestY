import { unstable_cache } from "next/cache";
import { prisma } from "../../../lib/db";
import ProductsManager from "../../../components/admin/ProductsManager";

export const dynamic = "force-dynamic";

const cachedProducts = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { variants: { select: { id: true } } },
    });
    return products.map((p) => ({
      _id: String(p.id),
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
