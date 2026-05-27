const DEFAULT = [
  { name: "Nusrat A.", role: "Dhaka", quote: "The linen shirt fits perfectly and the delivery was same-day. Will definitely order again." },
  { name: "Tahmid R.", role: "Chattogram", quote: "Honest pricing for genuinely well-made things. Quality matches what they promise." },
  { name: "Ayesha K.", role: "Sylhet", quote: "Customer service replied within minutes when I had a question. Felt looked after." },
];

export default function Testimonials({ items }) {
  const list = Array.isArray(items) && items.length ? items : DEFAULT;
  return (
    <section className="bg-[#f5f1e8] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Words from our community</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">What customers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {list.map((r, i) => (
            <figure key={i} className="bg-white rounded-lg p-7 border border-[#e8e4d8]">
              <blockquote className="font-serif text-lg leading-relaxed text-[#1a2b4a] mb-5">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="border-t border-[#e8e4d8] pt-4">
                <p className="font-medium text-sm text-[#1a2b4a]">{r.name}</p>
                {r.role && <p className="text-xs text-gray-500 mt-0.5">{r.role}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
