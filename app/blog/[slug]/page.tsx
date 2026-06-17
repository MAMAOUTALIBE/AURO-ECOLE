import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatDateFr, getContentBySlug, toParagraphs } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getContentBySlug(slug);
  if (!entry || entry.type !== "ARTICLE") return { title: "Article introuvable", robots: { index: false } };
  return {
    title: entry.seoTitle || entry.title,
    description: entry.seoDescription || entry.excerpt || undefined,
    openGraph: entry.coverImageUrl ? { images: [{ url: entry.coverImageUrl }] } : undefined
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getContentBySlug(slug);
  if (!entry || entry.type !== "ARTICLE") notFound();

  const paragraphs = toParagraphs(entry.body);

  return (
    <main className="bg-white">
      <article className="container-pad py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-loden-700 hover:text-loden-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au blog
          </Link>

          <header className="mt-6">
            {entry.category ? (
              <span className="inline-flex rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">{entry.category}</span>
            ) : null}
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-loden-ink sm:text-4xl">{entry.title}</h1>
            {entry.publishedAt ? <p className="mt-2 text-sm text-loden-muted">Publié le {formatDateFr(entry.publishedAt)}</p> : null}
          </header>

          {entry.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.coverImageUrl} alt={entry.title} className="mt-6 aspect-[16/9] w-full rounded-3xl border border-slate-200 object-cover" />
          ) : null}

          {entry.excerpt ? <p className="mt-6 text-lg leading-7 text-loden-ink">{entry.excerpt}</p> : null}

          <div className="mt-6 space-y-4 text-base leading-7 text-loden-ink">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
