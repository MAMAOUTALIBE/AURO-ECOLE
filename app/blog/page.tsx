import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Car, Newspaper, WalletCards } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { formatDateFr, getPublishedContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Conseils LODENE Auto-École pour choisir sa formation, financer son permis et préparer le code.",
  alternates: { canonical: "/blog" }
};

// Cartes de repli (affichées tant qu'aucun article n'est publié dans le CMS).
const fallbackArticles = [
  {
    icon: Car,
    title: "Choisir entre permis manuel et automatique",
    text: "Les critères utiles pour décider selon ton budget, ton planning et ton objectif d'examen.",
    href: "/formations"
  },
  {
    icon: WalletCards,
    title: "Comprendre le financement du permis",
    text: "CPF, paiement fractionné, reste à charge : les points à clarifier avant de s'inscrire.",
    href: "/cpf"
  },
  {
    icon: BookOpenCheck,
    title: "Préparer le code sans perdre de temps",
    text: "Une méthode simple pour réviser régulièrement, suivre ses erreurs et arriver prêt à l'examen.",
    href: "/formations"
  }
];

export default async function BlogPage() {
  const articles = await getPublishedContent("ARTICLE");

  return (
    <main>
      <PageHero
        eyebrow="Blog"
        title="Conseils permis et financement"
        text="Des guides courts pour comprendre les formations, préparer ton budget et avancer avec un planning clair."
        cta="Parler à un conseiller"
        ctaHref="/contact"
      />
      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Guides LODENE"
            title="Les sujets utiles avant de démarrer"
            text="Chaque guide renvoie vers une page concrète pour comparer, simuler ou demander un accompagnement."
            align="center"
          />

          {articles.length > 0 ? (
            <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="focus-ring group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-premium md:rounded-2xl"
                >
                  <div className="relative h-36 overflow-hidden bg-loden-pearl md:h-44">
                    {article.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.coverImageUrl} alt={article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-loden-300">
                        <Newspaper className="h-10 w-10" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    {article.category ? (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-loden-50 px-2.5 py-0.5 text-xs font-semibold text-loden-700">{article.category}</span>
                    ) : null}
                    <h2 className="text-lg font-semibold text-loden-ink">{article.title}</h2>
                    {article.excerpt ? <p className="mt-2 hidden flex-1 text-sm leading-6 text-loden-muted md:block">{article.excerpt}</p> : <span className="flex-1" />}
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-loden-700">
                      Lire l’article
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                    {article.publishedAt ? <span className="mt-2 text-xs text-loden-muted">{formatDateFr(article.publishedAt)}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-4">
              {fallbackArticles.map((article) => {
                const Icon = article.icon;
                return (
                  <article key={article.title} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft md:h-12 md:w-12 md:rounded-2xl">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                    </span>
                    <h2 className="mt-3 text-lg font-semibold text-loden-ink md:mt-5 md:text-xl">{article.title}</h2>
                    <p className="mt-3 hidden text-sm leading-6 text-loden-muted md:block">{article.text}</p>
                    <Link
                      href={article.href}
                      className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-loden-700 hover:text-loden-900"
                    >
                      Lire le guide
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
