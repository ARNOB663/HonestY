// Generic admin skeleton used while server data loads. Keeps the perceived
// transition smooth — the sidebar stays mounted (layout.js), only the main
// pane swaps for this skeleton until the page is ready.
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="h-2.5 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-7 w-20 bg-gray-100 rounded mb-1.5" />
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="h-3 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <div className="col-span-3 h-3 bg-gray-100 rounded" />
              <div className="col-span-5 h-3 bg-gray-100 rounded" />
              <div className="col-span-2 h-3 bg-gray-100 rounded" />
              <div className="col-span-2 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
