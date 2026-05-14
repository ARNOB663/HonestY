const REVIEWS = [
  {
    name: "Amelia R.",
    title: "Verified buyer",
    body: "The quality is genuinely beautiful. You can feel the difference the moment you open the box — it's clear care went into every detail.",
    rating: 5,
  },
  {
    name: "James K.",
    title: "Verified buyer",
    body: "Refreshing to find a shop with this much transparency about sourcing. Items arrived faster than promised and exactly as described.",
    rating: 5,
  },
  {
    name: "Priya S.",
    title: "Verified buyer",
    body: "I've ordered three times now and every piece has been thoughtful, beautifully packaged, and made to last. My go-to.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[#f5f1e8] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Words from our community</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">What customers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="bg-white rounded-lg p-7 border border-[#e8e4d8]">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#c9a961">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="font-serif text-lg leading-relaxed text-[#1a2b4a] mb-5">
                “{r.body}”
              </blockquote>
              <figcaption className="border-t border-[#e8e4d8] pt-4">
                <p className="font-medium text-sm text-[#1a2b4a]">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
