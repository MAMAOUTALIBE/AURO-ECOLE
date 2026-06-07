import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, MapPin } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Permis B Paris 11",
  description:
    "Passez votre permis B à Paris 11 avec LODEN Auto-École : boîte manuelle, automatique, CPF, planning flexible et point de rendez-vous République."
};

const highlights = [
  "Formation permis B manuel ou automatique",
  "Point de rendez-vous République, Paris 11",
  "CPF et paiement fractionné possibles",
  "Planning adapté aux soirs, samedis et parcours accélérés"
];

export default function PermisBParis11Page() {
  return (
    <main>
      <PageHero
        eyebrow="Permis B Paris 11"
        title="Passe ton permis B près de République"
        text="LODEN accompagne les élèves de Paris 11 et de l'Est parisien avec une formation claire, flexible et orientée réussite à l'examen."
        cta="Demander un diagnostic"
        ctaHref="/contact"
      />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="Formation locale"
            title="Un parcours pensé pour la conduite urbaine"
            text="La circulation parisienne demande des réflexes précis : priorités, intersections, stationnement, périphérie et conduite dense. Le parcours LODEN prépare ces situations avec des moniteurs habitués au secteur."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <article key={item} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 shadow-soft">
                <BadgeCheck className="h-6 w-6 text-loden-700" aria-hidden="true" />
                <p className="mt-4 font-semibold text-loden-ink">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-loden-pearl py-14 sm:py-20">
        <div className="container-pad grid gap-5 md:grid-cols-3">
          <InfoCard icon={MapPin} title="Adresse" text={contactInfo.address} />
          <InfoCard icon={CalendarCheck} title="Horaires" text={contactInfo.hours} />
          <InfoCard icon={BadgeCheck} title="Financement" text="CPF, packs et paiement 3x / 4x selon dossier." />
        </div>
      </section>
      <section className="bg-loden-700 py-14 text-white">
        <div className="container-pad flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Devis permis B</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Vérifie ton niveau et ton budget avant de t&apos;inscrire</h2>
          </div>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-semibold text-loden-ink shadow-soft hover:bg-loden-50" href="/contact">
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
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <Icon className="h-6 w-6 text-loden-700" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-loden-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-loden-muted">{text}</p>
    </article>
  );
}
