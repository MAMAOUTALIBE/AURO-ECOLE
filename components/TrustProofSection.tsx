import { credibilityBadges, trustProofs } from "@/data/site";
import { SectionHeader } from "@/components/SectionHeader";

export function TrustProofSection() {
  return (
    <section className="bg-white py-8 sm:py-20">
      <div className="container-pad">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Preuves"
              title="Une auto-école lisible avant même l'inscription"
              text="Les élèves doivent comprendre vite ce qui est inclus, comment le financement fonctionne et qui les accompagne."
            />
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-7">
              {credibilityBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-loden-100 bg-loden-50 px-3 py-1.5 text-xs font-semibold text-loden-800 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {trustProofs.map((proof) => {
              const Icon = proof.icon;
              return (
                <article key={proof.title} className="rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft sm:rounded-3xl sm:p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-loden-ink sm:mt-5 sm:text-lg">{proof.title}</h3>
                  <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">{proof.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
