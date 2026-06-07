import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Car, WalletCards } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Blog",
  description: "Conseils LODEN Auto-École pour choisir sa formation, financer son permis et préparer le code."
};

const articles = [
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
    href: "/formations/code-en-ligne"
  }
];

export default function BlogPage() {
  return (
    <main>
      <PageHero
        eyebrow="Blog"
        title="Conseils permis et financement"
        text="Des guides courts pour comprendre les formations, préparer ton budget et avancer avec un planning clair."
        cta="Parler à un conseiller"
        ctaHref="/contact"
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Guides LODEN"
            title="Les sujets utiles avant de démarrer"
            text="Chaque guide renvoie vers une page concrète pour comparer, simuler ou demander un accompagnement."
            align="center"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {articles.map((article) => {
              const Icon = article.icon;

              return (
                <article key={article.title} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold text-loden-ink">{article.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-loden-muted">{article.text}</p>
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
        </div>
      </section>
    </main>
  );
}
