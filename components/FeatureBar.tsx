import { benefits } from "@/data/site";
import { MotionReveal } from "@/components/MotionReveal";

export function FeatureBar() {
  return (
    <section className="bg-white py-12">
      <h2 className="sr-only">Avantages de LODEN Auto-École</h2>
      <div className="container-pad grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <MotionReveal key={benefit.title} delay={index * 0.04}>
              <div className="h-full rounded-3xl border border-slate-200 bg-loden-pearl p-6 transition hover:-translate-y-1 hover:border-loden-200 hover:shadow-soft">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-loden-ink">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-loden-muted">{benefit.text}</p>
              </div>
            </MotionReveal>
          );
        })}
      </div>
    </section>
  );
}
