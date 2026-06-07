import type { Metadata } from "next";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de LODEN Auto-École : éditeur, contact, hébergement, propriété intellectuelle et responsabilités."
};

const legalSections = [
  {
    title: "Éditeur du site",
    content: [
      "LODEN Auto-École",
      contactInfo.address,
      `Email : ${contactInfo.email}`,
      `Téléphone : ${contactInfo.phone}`,
      "SIRET, forme juridique, capital social et numéro d'agrément préfectoral : à compléter avec les informations officielles de l'établissement."
    ]
  },
  {
    title: "Directeur de la publication",
    content: [
      "Direction LODEN Auto-École.",
      "Cette information doit être confirmée avec le représentant légal avant publication définitive."
    ]
  },
  {
    title: "Hébergement",
    content: [
      "Hébergeur technique : à renseigner selon le prestataire retenu pour la mise en production.",
      "Les coordonnées complètes de l'hébergeur doivent être ajoutées avant ouverture publique."
    ]
  },
  {
    title: "Propriété intellectuelle",
    content: [
      "Les textes, interfaces, visuels, marques, logos et éléments graphiques présents sur ce site sont protégés.",
      "Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite."
    ]
  },
  {
    title: "Responsabilité",
    content: [
      "LODEN Auto-École s'efforce de maintenir des informations exactes et à jour.",
      "Les tarifs, disponibilités, financements et conditions d'inscription sont confirmés par devis ou échange avec un conseiller."
    ]
  }
];

export default function LegalNoticePage() {
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Cadre légal</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-loden-ink sm:text-5xl">
            Mentions légales
          </h1>
          <p className="mt-5 text-lg leading-8 text-loden-muted">
            Les informations ci-dessous cadrent l&apos;éditeur du site, les responsabilités et les éléments à compléter avant la mise en production.
          </p>
        </div>
        <div className="mt-10 grid gap-5">
          {legalSections.map((section) => (
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
