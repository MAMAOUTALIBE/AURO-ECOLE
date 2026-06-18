import { appFeatures } from "@/data/site";
import { SectionHeader } from "@/components/SectionHeader";
import { MotionReveal } from "@/components/MotionReveal";

export function AppSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-pad grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <MotionReveal>
          <SectionHeader
            eyebrow="Application mobile LODENE"
            title="Toute ton auto-école dans ta poche"
            text="Réserve, révise, suis ta progression et reçois tes notifications sans friction."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {appFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-loden-pearl p-4">
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
          <div className="mx-auto max-w-sm rounded-[2rem] border border-slate-200 bg-loden-ink p-3 shadow-premium">
            <div className="rounded-[1.5rem] bg-loden-pearl p-5">
              <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-slate-300" />
              <div className="rounded-3xl bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold text-loden-700">LODENE App</p>
                <p className="mt-2 text-2xl font-semibold leading-tight text-loden-ink">Prochaine leçon</p>
                <div className="mt-5 rounded-2xl bg-loden-700 p-4 text-white">
                  <p className="text-sm text-white">Vendredi · 09:30</p>
                  <p className="mt-1 text-lg font-semibold">Créneau confirmé</p>
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-loden-fog p-4">
                    <div className="h-2 w-28 rounded-full bg-loden-200" />
                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                      <div className="h-2 w-[78%] rounded-full bg-loden-500" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-loden-fog p-4">
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
