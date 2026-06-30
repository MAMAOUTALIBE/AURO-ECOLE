import { benefits } from "@/data/site";
import { MotionReveal } from "@/components/MotionReveal";

export function FeatureBar() {
  return (
    <section className="bg-white py-7 md:py-10">
      <h2 className="sr-only">Avantages de LODENE Auto-École</h2>
      <div className="container-pad grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <MotionReveal key={benefit.title} delay={index * 0.04}>
              <div className="h-full rounded-xl border border-slate-200 bg-loden-pearl p-4 transition hover:-translate-y-1 hover:border-loden-200 hover:shadow-soft md:rounded-2xl md:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft md:h-12 md:w-12 md:rounded-2xl">
                  <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-loden-ink md:mt-5 md:text-lg">{benefit.title}</h3>
                <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">{benefit.text}</p>
              </div>
            </MotionReveal>
          );
        })}
      </div>
    </section>
  );
}
