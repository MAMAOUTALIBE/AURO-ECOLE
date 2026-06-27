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
      <section className="container-pad py-8 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Cookies</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-loden-ink sm:mt-4 sm:text-5xl">
            Gestion des cookies
          </h1>
          <p className="mt-4 hidden text-sm leading-6 text-loden-muted sm:mt-5 sm:block sm:text-lg sm:leading-8">
            Cette page précise les traceurs susceptibles d&apos;être utilisés sur le site LODENE Auto-École.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:mt-10 sm:gap-5">
          {cookieSections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:rounded-3xl sm:p-6">
              <h2 className="text-xl font-semibold text-loden-ink sm:text-2xl">{section.title}</h2>
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
