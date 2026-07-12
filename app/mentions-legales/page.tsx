import type { Metadata } from "next";
import { companyInfo, contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de LODENE Auto-École : éditeur, agrément, SIRET, hébergement, propriété intellectuelle et responsabilités."
};

const legalSections = [
  {
    title: "Éditeur du site",
    content: [
      "LODENE Auto-École",
      contactInfo.address,
      ...(companyInfo.legalName ? [`Dénomination : ${companyInfo.legalName}`] : []),
      ...(companyInfo.legalForm ? [`Forme juridique : ${companyInfo.legalForm}`] : []),
      ...(companyInfo.capital ? [`Capital social : ${companyInfo.capital}`] : []),
      `SIRET : ${companyInfo.siret}`,
      `Numéro d'agrément préfectoral : ${companyInfo.approvalNumber}`,
      ...(contactInfo.email ? [`Email : ${contactInfo.email}`] : []),
      ...(contactInfo.phone ? [`Téléphone : ${contactInfo.phone}`] : [])
    ]
  },
  {
    title: "Directeur de la publication",
    content: [
      companyInfo.publicationDirector
        ? companyInfo.publicationDirector
        : "La direction de LODENE Auto-École."
    ]
  },
  {
    title: "Hébergement",
    content: [
      "Hébergeur : Hostinger International Ltd",
      "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
      "https://www.hostinger.fr"
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
      "LODENE Auto-École s'efforce de maintenir des informations exactes et à jour.",
      "Les tarifs, disponibilités, financements et conditions d'inscription sont confirmés par devis ou échange avec un conseiller."
    ]
  }
];

export default function LegalNoticePage() {
  return (
    <main className="bg-loden-pearl">
      <section className="container-pad py-8 md:py-12 xl:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 md:text-sm md:tracking-[0.14em]">Cadre légal</p>
          <h1 className="mt-2 text-[1.85rem] font-semibold leading-tight text-loden-ink sm:text-4xl md:mt-3 md:text-[2.8rem]">
            Mentions légales
          </h1>
          <p className="mt-3 text-sm leading-6 text-loden-muted md:text-base md:leading-7">
            Les informations ci-dessous précisent l&apos;éditeur du site, l&apos;hébergement, la propriété intellectuelle et les responsabilités.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:mt-7 md:gap-4">
          {legalSections.map((section) => (
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
