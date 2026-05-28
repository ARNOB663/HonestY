export default function Loading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
          <span>Home</span><span>/</span><span>Collection</span>
        </div>
      </div>
      <div className="bg-[#eff6ff] border-b border-[#e5e7eb] py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e8e4d8] rounded-lg p-3">
              <div className="aspect-square bg-gray-100 rounded-md animate-pulse mb-3" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
