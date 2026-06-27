import { ChevronDown } from "lucide-react";
import { faqEntries } from "@/data/site";
import type { FaqItem } from "@/lib/faq";
import { safeJsonLd } from "@/lib/json-ld";
import { SectionHeader } from "@/components/SectionHeader";

export function FaqSection({
  items = faqEntries,
  eyebrow = "Questions fréquentes",
  title = "Les réponses utiles avant de s'engager",
  text = "CPF, tarifs, inscription, planning et formation : les points clés sont clarifiés avant le premier rendez-vous."
}: {
  items?: FaqItem[];
  eyebrow?: string;
  title?: string;
  text?: string;
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <section id="faq" className="scroll-mt-28 bg-white py-8 md:py-14 xl:py-20">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />
      <div className="container-pad">
        <SectionHeader eyebrow={eyebrow} title={title} text={text} align="center" />
        <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:mt-9">
          {items.map((item, index) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-loden-pearl p-4 shadow-soft open:bg-white md:rounded-3xl md:p-5"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-loden-ink">
                <span>{item.question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-loden-600 transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm leading-6 text-loden-muted">{item.answer}</p>
              <p className="mt-3 hidden text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:block">
                {item.category}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
