import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentBySlug, toParagraphs } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getContentBySlug(slug);
  if (!entry || entry.type !== "PAGE") return { title: "Page introuvable", robots: { index: false } };
  return {
    title: entry.seoTitle || entry.title,
    description: entry.seoDescription || entry.excerpt || undefined
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getContentBySlug(slug);
  if (!entry || entry.type !== "PAGE") notFound();

  const paragraphs = toParagraphs(entry.body);

  return (
    <main className="bg-white">
      <section className="container-pad py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-loden-ink sm:text-4xl">{entry.title}</h1>
          {entry.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.coverImageUrl} alt={entry.title} className="mt-6 aspect-[16/9] w-full rounded-3xl border border-slate-200 object-cover" />
          ) : null}
          <div className="mt-6 space-y-4 text-base leading-7 text-loden-ink">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
