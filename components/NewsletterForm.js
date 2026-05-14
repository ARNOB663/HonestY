"use client";
export default function NewsletterForm() {
  return (
    <form
      className="flex gap-2 max-w-md mx-auto"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Your email address"
        className="flex-1 px-4 py-3 rounded text-sm outline-none text-[#1a2b4a]"
      />
      <button
        type="submit"
        className="bg-[#c9a961] text-white font-bold px-6 py-3 rounded text-sm hover:bg-[#a68a4f] transition-colors whitespace-nowrap"
      >
        SUBSCRIBE
      </button>
    </form>
  );
}
