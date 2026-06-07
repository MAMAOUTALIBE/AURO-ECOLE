import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppSection } from "@/components/AppSection";
import { BookingCalendar } from "@/components/BookingCalendar";
import { DiagnosticCtaSection } from "@/components/DiagnosticCtaSection";
import { FeatureBar } from "@/components/FeatureBar";
import { FormationCard } from "@/components/FormationCard";
import { HeroSection } from "@/components/HeroSection";
import { InstructorCard } from "@/components/InstructorCard";
import { MotionReveal } from "@/components/MotionReveal";
import { PricingCard } from "@/components/PricingCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SimulatorCard } from "@/components/SimulatorCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { TrustProofSection } from "@/components/TrustProofSection";
import { formations, instructors, pricingPlans, testimonials } from "@/data/site";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeatureBar />
      <TrustProofSection />

      <section className="bg-loden-pearl py-16 sm:py-20">
        <div className="container-pad">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              eyebrow="Formations"
              title="Un parcours adapté à chaque objectif"
              text="Permis B, accéléré, conduite accompagnée ou boîte automatique avec suivi digital."
            />
            <Link className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-loden-ink shadow-soft hover:bg-loden-50" href="/formations">
              Toutes les formations
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {formations.slice(0, 4).map((formation, index) => (
              <MotionReveal key={formation.slug} delay={index * 0.06}>
                <FormationCard formation={formation} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="reservation" className="bg-white py-16 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-2">
          <MotionReveal>
            <SimulatorCard />
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <BookingCalendar />
          </MotionReveal>
        </div>
      </section>

      <section className="bg-loden-pearl py-16 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Tarifs"
            title="Des packs clairs, sans surprise"
            text="Chaque pack est lisible, modulable et pensé pour limiter les frictions à l'inscription."
            align="center"
          />
          <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan, index) => (
              <MotionReveal key={plan.title} delay={index * 0.06}>
                <PricingCard plan={plan} featured={index === 0} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Moniteurs"
            title="Des coachs exigeants et bienveillants"
            text="Chaque élève est suivi par une équipe qui combine pédagogie, ponctualité et exigence d'examen."
          />
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {instructors.map((instructor, index) => (
              <MotionReveal key={instructor.name} delay={index * 0.06}>
                <InstructorCard instructor={instructor} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-loden-pearl py-16 sm:py-20">
        <div className="container-pad">
          <SectionHeader
            eyebrow="Avis clients"
            title="Une expérience pensée pour rassurer"
            text="Des retours élèves qui confirment la qualité du suivi, la disponibilité et la clarté du parcours."
            align="center"
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <MotionReveal key={testimonial.name} delay={index * 0.04}>
                <TestimonialCard testimonial={testimonial} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <DiagnosticCtaSection />

      <AppSection />

      <section className="bg-loden-700 py-14 text-white">
        <div className="container-pad flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/90">Inscription</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Prêt à construire ton planning permis ?</h2>
          </div>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-semibold text-loden-ink shadow-soft hover:bg-loden-50" href="/inscription">
            Créer mon compte élève
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
