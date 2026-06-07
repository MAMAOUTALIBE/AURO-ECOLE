import { credibilityBadges, trustProofs } from "@/data/site";
import { SectionHeader } from "@/components/SectionHeader";

export function TrustProofSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-pad">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Preuves"
              title="Une auto-école lisible avant même l'inscription"
              text="Les élèves doivent comprendre vite ce qui est inclus, comment le financement fonctionne et qui les accompagne."
            />
            <div className="mt-7 flex flex-wrap gap-2">
              {credibilityBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-loden-100 bg-loden-50 px-4 py-2 text-sm font-semibold text-loden-800"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustProofs.map((proof) => {
              const Icon = proof.icon;
              return (
                <article key={proof.title} className="rounded-3xl border border-slate-200 bg-loden-pearl p-6 shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-loden-ink">{proof.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-loden-muted">{proof.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
