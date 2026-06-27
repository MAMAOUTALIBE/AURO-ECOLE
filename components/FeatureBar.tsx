import { benefits } from "@/data/site";
import { MotionReveal } from "@/components/MotionReveal";

export function FeatureBar() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <h2 className="sr-only">Avantages de LODENE Auto-École</h2>
      <div className="container-pad grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <MotionReveal key={benefit.title} delay={index * 0.04}>
              <div className="h-full rounded-2xl border border-slate-200 bg-loden-pearl p-4 transition hover:-translate-y-1 hover:border-loden-200 hover:shadow-soft sm:rounded-3xl sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-loden-ink sm:mt-5 sm:text-lg">{benefit.title}</h3>
                <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">{benefit.text}</p>
              </div>
            </MotionReveal>
          );
        })}
      </div>
    </section>
  );
}
