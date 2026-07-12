import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { formatDateFr, getContentBySlug, toParagraphs } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getContentBySlug(slug);
  if (!entry || entry.type !== "ARTICLE") return { title: "Article introuvable", robots: { index: false } };
  return {
    title: entry.seoTitle || entry.title,
    description: entry.seoDescription || entry.excerpt || undefined,
    alternates: { canonical: `/blog/${slug}` },
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
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: entry.title, path: `/blog/${slug}` }
        ]}
      />
      <article className="container-pad py-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-loden-700 hover:text-loden-900">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au blog
          </Link>

          <header className="mt-5 sm:mt-6">
            {entry.category ? (
              <span className="inline-flex rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">{entry.category}</span>
            ) : null}
            <h1 className="mt-3 text-2xl font-bold leading-tight text-loden-ink sm:text-4xl">{entry.title}</h1>
            {entry.publishedAt ? <p className="mt-2 text-sm text-loden-muted">Publié le {formatDateFr(entry.publishedAt)}</p> : null}
          </header>

          {entry.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.coverImageUrl} alt={entry.title} className="mt-5 aspect-[16/9] w-full rounded-2xl border border-slate-200 object-cover sm:mt-6 sm:rounded-3xl" />
          ) : null}

          {entry.excerpt ? <p className="mt-5 text-base leading-7 text-loden-ink sm:mt-6 sm:text-lg">{entry.excerpt}</p> : null}

          <div className="mt-5 space-y-4 text-[15px] leading-7 text-loden-ink sm:mt-6 sm:text-base">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
