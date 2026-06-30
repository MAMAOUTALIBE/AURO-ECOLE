import type { Metadata } from "next";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité LODENE Auto-École : données collectées, finalités, conservation, droits et contact."
};

const privacySections = [
  {
    title: "Données collectées",
    content: [
      "Les formulaires peuvent collecter ton nom, ton email, ton téléphone, ton objectif de formation, ton besoin de financement, tes disponibilités et ton message.",
      "Les demandes CPF peuvent inclure des informations utiles à l'analyse du dossier, sans collecte de mot de passe CPF."
    ]
  },
  {
    title: "Finalités",
    content: [
      "Ces données servent à répondre aux demandes, préparer un devis, organiser un rappel, gérer une inscription, suivre un dossier CPF et améliorer la qualité du service.",
      "Elles ne sont pas revendues à des tiers."
    ]
  },
  {
    title: "Durée de conservation",
    content: [
      "Les demandes commerciales sont conservées pendant la durée nécessaire au suivi de la relation, puis archivées ou supprimées selon les obligations légales applicables.",
      "Les données liées à un contrat de formation peuvent être conservées plus longtemps pour répondre aux obligations administratives et comptables."
    ]
  },
  {
    title: "Destinataires",
    content: [
      "Les données sont accessibles aux équipes LODENE Auto-École habilitées et aux prestataires techniques nécessaires au fonctionnement du site.",
      "Chaque prestataire doit être encadré par des garanties de confidentialité et de sécurité."
    ]
  },
  {
    title: "Tes droits",
    content: [
      "Tu peux demander l'accès, la rectification, l'effacement ou la limitation du traitement de tes données.",
      contactInfo.email
        ? `Pour exercer tes droits, contacte LODENE à ${contactInfo.email}.`
        : "Pour exercer tes droits, contacte LODENE via le formulaire de la page Contact."
    ]
  },
  {
    title: "Sécurité",
    content: [
      "LODENE met en place des mesures techniques et organisationnelles pour limiter les accès non autorisés.",
      "Les secrets de production, accès administrateurs et bases de données doivent être configurés de façon sécurisée avant mise en ligne."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad py-8 md:py-12 xl:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm md:tracking-[0.14em]">Données personnelles</p>
          <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:mt-3 md:text-[2.8rem]">
            Politique de confidentialité
          </h1>
          <p className="mt-3 hidden text-sm leading-6 text-loden-muted md:block md:text-base md:leading-7">
            Cette page explique quelles données peuvent être traitées par LODENE Auto-École et comment exercer tes droits.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:mt-7 md:gap-4">
          {privacySections.map((section) => (
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
