import { credibilityBadges, trustProofs } from "@/data/site";
import { SectionHeader } from "@/components/SectionHeader";

export function TrustProofSection() {
  return (
    <section className="bg-white py-8 md:py-12 xl:py-16">
      <div className="container-pad">
        <div className="grid gap-5 md:gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Preuves"
              title="Une auto-école lisible avant même l'inscription"
              text="Les élèves doivent comprendre vite ce qui est inclus, comment le financement fonctionne et qui les accompagne."
            />
            <div className="mt-4 flex flex-wrap gap-2 md:mt-6">
              {credibilityBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-loden-100 bg-loden-50 px-3 py-1.5 text-xs font-semibold text-loden-800 md:px-4 md:py-2 md:text-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
            {trustProofs.map((proof) => {
              const Icon = proof.icon;
              return (
                <article key={proof.title} className="rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:rounded-2xl md:p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft md:h-12 md:w-12 md:rounded-2xl">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-loden-ink md:mt-5 md:text-lg">{proof.title}</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">{proof.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
