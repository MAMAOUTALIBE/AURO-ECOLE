import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FormationCard } from "@/components/FormationCard";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { formations, poleLandings, productLineLabels } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";

// Page d'atterrissage d'un pôle professionnel (VTC / CACES) : hero, atouts,
// catalogue filtré du pôle et appel au devis. Server component (SSG, bon pour le SEO).
export function PoleLanding({ pole }: { pole: "VTC" | "CACES" }) {
  const content = poleLandings[pole];
  const poleFormations = formations.filter((formation) => formation.productLine === pole);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Formations ${productLineLabels[pole]} — LODENE`,
    itemListElement: poleFormations.map((formation, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: formation.title,
        description: formation.description,
        url: `https://loden-autoecole.fr/formations/${formation.slug}`,
        provider: {
          "@type": ["LocalBusiness", "DrivingSchool"],
          name: "LODENE Auto-École",
          sameAs: "https://loden-autoecole.fr"
        },
        offers: { "@type": "Offer", price: formation.price, priceCurrency: "EUR" }
      }
    }))
  };

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListSchema) }}
      />
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        text={content.text}
        cta="Demander un devis"
        ctaHref={`/contact?pole=${pole}#demande`}
      />

      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad">
          <p className="mx-auto max-w-3xl text-center text-lg leading-8 text-loden-muted">{content.intro}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-3xl border border-slate-200 bg-loden-pearl p-5 shadow-soft">
                <CheckCircle2 className="h-6 w-6 text-loden-600" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-loden-ink">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-loden-muted">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Nos formations"
            title={`Formations ${productLineLabels[pole]}`}
            text="Choisis ta certification : financement CPF, entreprise ou OPCO selon ta situation."
            align="center"
          />
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {poleFormations.map((formation) => (
              <FormationCard key={formation.slug} formation={formation} />
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-5 rounded-3xl bg-loden-800 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Un projet en entreprise ou un financement OPCO ?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                Demande un devis personnalisé : nous adaptons les sessions à tes effectifs et au financement.
              </p>
            </div>
            <Link
              href={`/contact?pole=${pole}#demande`}
              className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-semibold text-loden-800 transition hover:bg-loden-pearl"
            >
              Demander un devis
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
