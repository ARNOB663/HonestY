import { notFound } from "next/navigation";
import { dbConnect } from "../../../lib/mongodb";
import Page from "../../../models/Page";
import { sanitizePageBody } from "../../../lib/sanitize";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    await dbConnect();
    const page = await Page.findOne({ slug, published: true }).lean();
    if (!page) return {};
    return {
      title: page.metaTitle || `${page.title} — Honesty`,
      description: page.metaDescription,
    };
  } catch { return {}; }
}

export default async function PublicPage({ params }) {
  const { slug } = await params;
  await dbConnect();
  const page = await Page.findOne({ slug, published: true }).lean();
  if (!page) notFound();
  const safeBody = sanitizePageBody(page.body);
  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-serif mb-6 text-[#1a2b4a]">{page.title}</h1>
      <div className="prose prose-neutral whitespace-pre-wrap text-[#1a2b4a]/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: safeBody }} />
    </article>
  );
}
