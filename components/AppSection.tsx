import { appFeatures } from "@/data/site";
import { SectionHeader } from "@/components/SectionHeader";
import { MotionReveal } from "@/components/MotionReveal";

export function AppSection() {
  return (
    <section className="bg-white py-8 md:py-12 xl:py-16">
      <div className="container-pad grid items-center gap-5 md:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <MotionReveal>
          <SectionHeader
            eyebrow="Application mobile LODENE"
            title="Toute ton auto-école dans ta poche"
            text="Réserve, révise, suis ta progression et reçois tes notifications sans friction."
          />
          <div className="mt-5 grid gap-3 md:mt-7 sm:grid-cols-2">
            {appFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-loden-pearl p-3 md:rounded-2xl md:p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold text-loden-ink">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </MotionReveal>
        <MotionReveal delay={0.1}>
          <div className="mx-auto max-w-xs rounded-2xl border border-slate-200 bg-loden-ink p-2 shadow-premium sm:max-w-sm md:rounded-[2rem] md:p-3">
            <div className="rounded-xl bg-loden-pearl p-4 md:rounded-[1.5rem] md:p-5">
              <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-slate-300 md:mb-5" />
              <div className="rounded-xl bg-white p-4 shadow-soft md:rounded-2xl md:p-5">
                <p className="text-sm font-semibold text-loden-700">LODENE App</p>
                <p className="mt-2 text-xl font-semibold leading-tight text-loden-ink md:text-2xl">Prochaine leçon</p>
                <div className="mt-4 rounded-xl bg-loden-700 p-4 text-white md:mt-5 md:rounded-2xl">
                  <p className="text-sm text-white">Vendredi · 09:30</p>
                  <p className="mt-1 text-lg font-semibold">Créneau confirmé</p>
                </div>
                <div className="mt-4 grid gap-3 md:mt-5">
                  <div className="rounded-xl bg-loden-fog p-4 md:rounded-2xl">
                    <div className="h-2 w-28 rounded-full bg-loden-200" />
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                      <div className="h-2 w-[78%] rounded-full bg-loden-500" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-loden-fog p-4 md:rounded-2xl">
                    <p className="text-sm font-semibold text-loden-ink">Code de la route</p>
                    <p className="mt-1 text-sm text-loden-muted">12 séries restantes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
