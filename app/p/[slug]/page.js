import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";
import { sanitizePageBody } from "../../../lib/sanitize";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const page = await prisma.page.findUnique({ where: { slug } });
    if (!page || !page.published) return {};
    return {
      title: page.metaTitle || `${page.title} — Honesty`,
      description: page.metaDescription,
    };
  } catch { return {}; }
}

export default async function PublicPage({ params }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();
  const safeBody = sanitizePageBody(page.body);
  return (
    <article className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-serif mb-6 text-[#1a2b4a]">{page.title}</h1>
      <div className="prose prose-neutral whitespace-pre-wrap text-[#1a2b4a]/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: safeBody }} />
    </article>
  );
}
