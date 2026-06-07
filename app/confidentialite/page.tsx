import type { Metadata } from "next";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité LODEN Auto-École : données collectées, finalités, conservation, droits et contact."
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
      "Les données sont accessibles aux équipes LODEN Auto-École habilitées et aux prestataires techniques nécessaires au fonctionnement du site.",
      "Chaque prestataire doit être encadré par des garanties de confidentialité et de sécurité."
    ]
  },
  {
    title: "Tes droits",
    content: [
      "Tu peux demander l'accès, la rectification, l'effacement ou la limitation du traitement de tes données.",
      `Pour exercer tes droits, contacte LODEN à ${contactInfo.email}.`
    ]
  },
  {
    title: "Sécurité",
    content: [
      "LODEN met en place des mesures techniques et organisationnelles pour limiter les accès non autorisés.",
      "Les secrets de production, accès administrateurs et bases de données doivent être configurés de façon sécurisée avant mise en ligne."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Données personnelles</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-loden-ink sm:text-5xl">
            Politique de confidentialité
          </h1>
          <p className="mt-5 text-lg leading-8 text-loden-muted">
            Cette page explique quelles données peuvent être traitées par LODEN Auto-École et comment exercer tes droits.
          </p>
        </div>
        <div className="mt-10 grid gap-5">
          {privacySections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-semibold text-loden-ink">{section.title}</h2>
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
