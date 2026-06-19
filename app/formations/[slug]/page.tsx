import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formationImageMeta } from "@/lib/formation-image";
import { ArrowRight, BadgeCheck, CalendarCheck, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { formations, productLineLabels } from "@/data/site";
import { formatCurrency } from "@/lib/utils";
import { safeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return formations.map((formation) => ({ slug: formation.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const formation = formations.find((item) => item.slug === slug);

  if (!formation) {
    return {
      title: "Formation introuvable"
    };
  }

  const description = `${formation.description} Durée : ${formation.duration}. Tarif sur devis personnalisé.`;
  const path = `/formations/${formation.slug}`;
  return {
    title: `${formation.title} à Conflans-Sainte-Honorine`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${formation.title} | LODENE Auto-École`,
      description,
      url: path,
      type: "article"
    }
  };
}

export default async function FormationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const formation = formations.find((item) => item.slug === slug);

  if (!formation) notFound();

  const productLine = formation.productLine ?? "AUTO_ECOLE";
  const isPro = productLine !== "AUTO_ECOLE";
  const eyebrow = isPro ? `Formation ${productLineLabels[productLine]}` : `Formation ${formation.mode}`;
  const headerImage = formationImageMeta(formation.slug, productLine);

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: formation.title,
    description: formation.description,
    provider: {
      "@type": ["LocalBusiness", "DrivingSchool"],
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      sameAs: SITE_URL
    },
    // Pas de prix officiel confirmé -> on n'émet pas d'Offer chiffrée (tarif sur devis).
    ...(formation.price > 0
      ? {
          offers: {
            "@type": "Offer",
            price: formation.price,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/formations/${formation.slug}`)
          }
        }
      : {})
  };

  const programSteps = [
    "Diagnostic du niveau et choix du rythme",
    "Créneaux planifiés avec un moniteur référent",
    "Suivi de progression et ajustement des objectifs",
    "Préparation à l'examen ou à l'objectif de conduite"
  ];

  const guarantees = [
    formation.cpf ? "Parcours compatible CPF selon le dossier" : "Conseil financement selon la situation",
    isPro ? "Financement entreprise / OPCO possible" : "Planning visible et suivi élève digital",
    "Devis clair avant engagement",
    "Accompagnement administratif jusqu'au démarrage"
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(courseSchema) }}
      />
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="relative h-44 overflow-hidden rounded-3xl shadow-soft sm:h-52 lg:col-span-2">
            <Image
              src={headerImage.src}
              alt={headerImage.alt}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: headerImage.objectPosition ?? "50% 50%" }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-loden-ink sm:text-6xl">
              {formation.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-loden-muted">{formation.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {formation.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-loden-700 shadow-soft">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/contact?formation=${formation.slug}#demande`}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white shadow-soft transition hover:bg-loden-800"
              >
                Demander un devis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`/inscription?formation=${formation.slug}`}
                className="focus-ring inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-4 font-semibold text-loden-ink transition hover:border-loden-300 hover:bg-loden-50"
              >
                Pré-inscription
              </Link>
            </div>
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Résumé</p>
            <div className="mt-5 grid gap-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 h-5 w-5 text-loden-600" />
                <div>
                  <p className="font-semibold text-loden-ink">{formation.duration}</p>
                  <p className="text-sm text-loden-muted">Durée ou accès indicatif</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-1 h-5 w-5 text-loden-600" />
                <div>
                  <p className="font-semibold text-loden-ink">{formation.price > 0 ? `Dès ${formatCurrency(formation.price)}` : "Sur devis"}</p>
                  <p className="text-sm text-loden-muted">Devis confirmé avant inscription</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-loden-600" />
                <div>
                  <p className="font-semibold text-loden-ink">{formation.cpf ? "CPF possible" : "Financement accompagné"}</p>
                  <p className="text-sm text-loden-muted">Analyse selon le profil élève</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Programme</p>
            <h2 className="mt-3 text-3xl font-semibold text-loden-ink">Un parcours cadré de bout en bout</h2>
            <div className="mt-7 grid gap-4">
              {programSteps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-3xl border border-slate-200 bg-loden-pearl p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white font-semibold text-loden-700 shadow-soft">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-loden-ink">{step}</p>
                    <p className="mt-1 text-sm leading-6 text-loden-muted">
                      L&apos;objectif est d&apos;avancer avec un rythme clair, des retours concrets et une prochaine action visible.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-loden-700">Garanties LODENE</p>
            <h2 className="mt-3 text-3xl font-semibold text-loden-ink">Des conditions lisibles avant de commencer</h2>
            <div className="mt-7 grid gap-4">
              {guarantees.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-loden-600" />
                  <p className="text-sm font-medium leading-6 text-loden-muted">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl bg-loden-800 p-6 text-white">
              <CalendarCheck className="h-7 w-7" />
              <h3 className="mt-4 text-2xl font-semibold">Besoin d&apos;un planning précis ?</h3>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Envoie tes disponibilités et ton objectif. LODENE te propose un rythme réaliste avant l&apos;engagement.
              </p>
              <Link
                href={`/contact?formation=${formation.slug}#demande`}
                className="focus-ring mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-loden-800 transition hover:bg-loden-pearl"
              >
                Demander mon planning
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
