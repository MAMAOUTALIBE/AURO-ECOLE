import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FormationCard } from "@/components/FormationCard";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { formations, poleLandings, productLineLabels } from "@/data/site";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

// Page d'atterrissage d'un pôle professionnel (VTC / CACES) : hero, atouts,
// catalogue filtré du pôle et appel au devis. Server component (SSG, bon pour le SEO).
export function PoleLanding({ pole }: { pole: "VTC" | "SST" | "LOGISTIQUE_SECURITE" }) {
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
        url: absoluteUrl(`/formations/${formation.slug}`),
        provider: {
          "@type": ["LocalBusiness", "DrivingSchool"],
          name: SITE_NAME,
          sameAs: SITE_URL
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

      <section className="bg-white py-8 md:py-10 xl:py-14">
        <div className="container-pad">
          <p className="mx-auto hidden max-w-3xl text-center text-base leading-7 text-loden-muted md:block md:text-lg md:leading-8">{content.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2 md:mt-7 md:gap-4 lg:grid-cols-4 xl:mt-9">
            {content.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                <CheckCircle2 className="h-6 w-6 text-loden-600" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-loden-ink">{benefit.title}</h3>
                <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-loden-pearl py-8 md:py-10 xl:py-14">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Nos formations"
            title={`Formations ${productLineLabels[pole]}`}
            text="Choisis ta certification : financement CPF, entreprise ou OPCO selon ta situation."
            align="center"
          />
          <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-2 md:gap-4 xl:mt-8 xl:grid-cols-3">
            {poleFormations.map((formation) => (
              <FormationCard key={formation.slug} formation={formation} />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 rounded-xl bg-loden-800 p-4 text-white sm:flex-row sm:items-center sm:justify-between md:rounded-2xl md:p-6 xl:mt-10">
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">Un projet en entreprise ou un financement OPCO ?</h2>
              <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-white/85 sm:block">
                Demande un devis personnalisé : nous adaptons les sessions à tes effectifs et au financement.
              </p>
            </div>
            <Link
              href={`/contact?pole=${pole}#demande`}
              className="focus-ring inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-800 transition hover:bg-loden-pearl sm:w-auto md:py-4"
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
