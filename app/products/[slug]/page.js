import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailClient from "../../../components/ProductDetailClient";
import ProductInfoTabs from "../../../components/ProductInfoTabs";
import { getProductBySlug, getCollection, getRelatedProducts } from "../../../lib/products";
import { getStoreSettings } from "../../../lib/settings";
import ProductCard from "../../../components/ProductCard";
import { formatMoney } from "../../../lib/format";
import { getBaseUrl } from "../../../lib/baseUrl";

export const revalidate = 3600;

function siteUrl() {
  return getBaseUrl();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product — Honesty" };
  const desc = (p.description || `Shop ${p.title} at Honesty — honestly made, honestly priced.`).slice(0, 160);
  const url = `${siteUrl()}/products/${p.slug}`;
  const image = p.image;
  return {
    title: `${p.title} — Honesty`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description: desc,
      url,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: desc,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const collection = getCollection(product.collection);
  const [related, settings] = await Promise.all([getRelatedProducts(product, 6), getStoreSettings()]);
  const freeOver = Number(settings.freeShippingThreshold) || 0;
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  const stock = Array.isArray(product.variants) && product.variants.length
    ? product.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0)
    : (product.inventory ?? 0);
  const inStock = stock > 0;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    image: product.image ? [product.image] : undefined,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/products/${product.slug}`,
      priceCurrency: "BDT",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-[#1a35d4]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#1a35d4]">Products</Link>
          {collection && (
            <>
              <span>/</span>
              <Link href={`/collections/${collection.slug}`} className="hover:text-[#1a35d4]">{collection.title}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#1a1a1a] font-medium line-clamp-1">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Product info banner — title, price, collection — sits above the unified gallery+addtocart */}
        <div className="mb-6">
          {collection && (
            <Link href={`/collections/${collection.slug}`} className="text-[#1a35d4] text-xs font-semibold uppercase tracking-wider hover:underline">
              {collection.title}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mt-2 leading-snug">{product.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <p className={`text-xs font-semibold ${inStock ? "text-[#16a34a]" : "text-red-600"}`}>
              {inStock ? "In Stock" : "Out of Stock"}
            </p>
            <span className="text-2xl font-bold text-[#e53935]">{formatMoney(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-gray-400 line-through text-sm">{formatMoney(product.compareAtPrice)}</span>
            )}
            {discount && (
              <span className="bg-[#1a35d4] text-white text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>
            )}
          </div>
        </div>

        <ProductDetailClient product={product} />

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            freeOver > 0
              ? { icon: "🚚", title: "Free Shipping", sub: `On orders over ${formatMoney(freeOver)}` }
              : { icon: "🚚", title: "Nationwide Delivery", sub: "Across Bangladesh" },
            { icon: "↩️", title: "7-Day Returns", sub: "Hassle-free policy" },
            { icon: "🛡️", title: "Quality Assured", sub: "From local makers" },
            { icon: "⚡", title: "Fast Delivery", sub: "Dhaka same-day, others 2-3d" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-2.5 border border-[#e5e7eb] rounded p-3">
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-[#1a1a1a]">{f.title}</p>
                <p className="text-[11px] text-gray-400">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <ProductInfoTabs
          specs={product.specs}
          description={product.description}
          warranty={product.warranty}
        />

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-5">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
