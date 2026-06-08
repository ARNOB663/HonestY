import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import ProductForm from "../../../../components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const doc = await prisma.product.findUnique({
    where: { id: numId },
    include: { variants: true },
  });
  if (!doc) notFound();
  const product = {
    ...doc,
    _id: String(doc.id),
    variants: doc.variants.map((v) => ({
      id: v.variantId,
      name: v.name,
      sku: v.sku,
      price: v.price,
      inventory: v.inventory,
      image: v.image,
      colorHex: v.colorHex,
    })),
  };
  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:underline">← Products</Link>
      <h1 className="text-2xl font-semibold">Edit · {product.title}</h1>
      <ProductForm product={product} />
    </div>
  );
}
