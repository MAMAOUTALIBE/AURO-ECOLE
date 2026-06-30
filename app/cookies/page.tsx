import type { Metadata } from "next";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Gestion des cookies",
  description: "Informations sur les cookies et traceurs utilisés par LODENE Auto-École."
};

const cookieSections = [
  {
    title: "Cookies nécessaires",
    content: [
      "Le site peut utiliser des cookies ou stockages techniques indispensables au fonctionnement des formulaires, de la session élève ou de l'espace administrateur.",
      "Ces éléments ne nécessitent pas de consentement lorsqu'ils sont strictement nécessaires au service demandé."
    ]
  },
  {
    title: "Mesure d'audience",
    content: [
      "Une solution de mesure d'audience peut être ajoutée pour comprendre les pages consultées et améliorer le site.",
      "Si elle n'est pas strictement exemptée de consentement, elle devra être intégrée à un bandeau de choix."
    ]
  },
  {
    title: "Services externes",
    content: [
      "Les liens vers Google Maps, réseaux sociaux ou services de paiement peuvent ouvrir des services tiers disposant de leurs propres politiques de cookies.",
      "LODENE ne dépose pas directement leurs cookies tant que ces services ne sont pas chargés dans la page."
    ]
  },
  {
    title: "Gérer tes choix",
    content: [
      "Tu peux configurer ton navigateur pour bloquer, supprimer ou limiter les cookies.",
      contactInfo.email
        ? `Pour toute question, contacte LODENE à ${contactInfo.email}.`
        : "Pour toute question, contacte LODENE via le formulaire de la page Contact."
    ]
  }
];

export default function CookiesPage() {
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad py-8 md:py-12 xl:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm md:tracking-[0.14em]">Cookies</p>
          <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:mt-3 md:text-[2.8rem]">
            Gestion des cookies
          </h1>
          <p className="mt-3 hidden text-sm leading-6 text-loden-muted md:block md:text-base md:leading-7">
            Cette page précise les traceurs susceptibles d&apos;être utilisés sur le site LODENE Auto-École.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:mt-7 md:gap-4">
          {cookieSections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:rounded-2xl md:p-5">
              <h2 className="text-lg font-semibold text-loden-ink md:text-2xl">{section.title}</h2>
              <div className="mt-4 grid gap-2 text-sm leading-6 text-loden-muted">
                {section.content.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
