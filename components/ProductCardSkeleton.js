// Visual placeholder for product cards while the catalog loads. Same shape
// as ProductCard so there's no layout shift when real data arrives.
export default function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-[#e8e4d8] rounded-lg p-3">
      <div className="relative aspect-square bg-gray-100 rounded-md overflow-hidden animate-pulse" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
        <div className="h-3.5 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
