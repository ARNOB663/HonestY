// Shown while the /products server component fetches data. Matches the
// ProductsFilter grid shape so the layout doesn't jump on hydration.
export default function Loading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
          <span>Home</span><span>/</span><span>Products</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block space-y-7">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </aside>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e8e4d8] rounded-lg p-3">
              <div className="aspect-square bg-gray-100 rounded-md animate-pulse mb-3" />
              <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse mb-1.5" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
