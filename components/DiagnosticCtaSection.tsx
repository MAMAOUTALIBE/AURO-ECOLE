import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { contactInfo, diagnosticSteps } from "@/data/site";
import { SectionHeader } from "@/components/SectionHeader";

export function DiagnosticCtaSection() {
  return (
    <section className="bg-loden-700 py-16 text-white sm:py-20">
      <div className="container-pad grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Diagnostic gratuit"
            title="Obtiens un parcours clair avant de payer"
            text="LODEN doit rassurer avant de vendre : on vérifie ton besoin, ton financement et ton planning, puis on t'oriente vers le bon pack."
            tone="light"
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-semibold text-loden-ink shadow-soft hover:bg-loden-50"
            >
              Demander mon diagnostic
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <a
              href={`https://wa.me/${contactInfo.whatsapp}`}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-4 font-semibold text-white hover:bg-white/10"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
          <a
            href={`tel:${contactInfo.phone.replaceAll(" ", "")}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Réponse rapide au {contactInfo.phone}
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
          {diagnosticSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-loden-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/75">Étape {index + 1}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/80">{step.text}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
