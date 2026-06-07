import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { LocalMapPanel } from "@/components/LocalMapPanel";
import { PageHero } from "@/components/PageHero";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter LODEN Auto-École, demander une inscription, appeler, écrire ou trouver le point de rendez-vous."
};

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Parle à un conseiller LODEN"
        text="Formulaire, téléphone, WhatsApp et point de rendez-vous : tout est prévu pour démarrer simplement."
        cta="Envoyer une demande"
        ctaHref="#demande"
      />
      <section id="demande" className="bg-white py-14 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {[
              { icon: Phone, label: "Téléphone", value: contactInfo.phone, href: `tel:${contactInfo.phone.replaceAll(" ", "")}` },
              { icon: Mail, label: "Email", value: contactInfo.email, href: `mailto:${contactInfo.email}` },
              { icon: MapPin, label: "Adresse", value: contactInfo.address },
              { icon: Clock3, label: "Horaires", value: contactInfo.hours },
              { icon: MessageCircle, label: "WhatsApp", value: "Réponse rapide", href: `https://wa.me/${contactInfo.whatsapp}` }
            ].map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-loden-pearl p-5 shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">{item.label}</p>
                    <p className="mt-1 font-semibold text-loden-ink">{item.value}</p>
                  </div>
                </div>
              );
              return item.href ? (
                <a key={item.label} href={item.href} className="focus-ring rounded-3xl">
                  {content}
                </a>
              ) : (
                <div key={item.label}>{content}</div>
              );
            })}
            <LocalMapPanel />
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
