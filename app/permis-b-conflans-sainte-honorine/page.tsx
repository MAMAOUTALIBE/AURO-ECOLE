import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { companyInfo, contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Permis B à Conflans-Sainte-Honorine",
  description:
    "Passez votre permis B à Conflans-Sainte-Honorine (78) avec LODENE Auto-École : boîte manuelle ou automatique, CPF et planning flexible.",
  alternates: { canonical: "/permis-b-conflans-sainte-honorine" }
};

const highlights = [
  "Formation permis B manuel ou automatique",
  "À Conflans-Sainte-Honorine et dans les Yvelines (78)",
  "CPF et financements selon le dossier",
  "Planning adapté aux soirs, samedis et parcours accélérés"
];

export default function PermisBConflansPage() {
  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Permis B à Conflans-Sainte-Honorine", path: "/permis-b-conflans-sainte-honorine" }
        ]}
      />
      <PageHero
        eyebrow="Permis B Conflans-Sainte-Honorine"
        title="Passe ton permis B à Conflans-Sainte-Honorine"
        text="LODENE accompagne les élèves de Conflans-Sainte-Honorine et des Yvelines avec une formation claire, flexible et orientée réussite à l'examen."
        cta="Demander un diagnostic"
        ctaHref="/contact"
      />
      <section className="bg-white py-8 md:py-12 xl:py-16">
        <div className="container-pad grid gap-5 md:gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Formation locale"
            title="Un parcours pensé pour ta réussite"
            text="Priorités, intersections, stationnement et conduite en conditions réelles : le parcours LODENE prépare ces situations avec des moniteurs habitués au secteur de Conflans-Sainte-Honorine."
          />
          <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
            {highlights.map((item) => (
              <article key={item} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                <BadgeCheck className="h-6 w-6 text-loden-700" aria-hidden="true" />
                <p className="mt-4 font-semibold text-loden-ink">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-loden-pearl py-8 md:py-12 xl:py-16">
        <div className="container-pad grid gap-3 md:grid-cols-3 md:gap-5">
          <InfoCard icon={MapPin} title="Adresse" text={contactInfo.address} />
          <InfoCard icon={ShieldCheck} title="Agrément préfectoral" text={companyInfo.approvalNumber} />
          <InfoCard icon={BadgeCheck} title="Financement" text="CPF et financements étudiés selon le dossier." />
        </div>
      </section>
      <section className="bg-loden-700 py-7 text-white md:py-10">
        <div className="container-pad flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Devis permis B</p>
            <h2 className="mt-2 text-[1.45rem] font-semibold sm:text-3xl lg:text-4xl">Vérifie ton niveau et ton budget avant de t&apos;inscrire</h2>
          </div>
          <Link className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-loden-ink shadow-soft hover:bg-loden-50 sm:w-auto md:py-4" href="/contact">
            Obtenir mon diagnostic
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft md:rounded-2xl md:p-5">
      <Icon className="h-6 w-6 text-loden-700" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold text-loden-ink md:mt-4 md:text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-loden-muted">{text}</p>
    </article>
  );
}
