import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock3, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { LocalMapPanel } from "@/components/LocalMapPanel";
import { PageHero } from "@/components/PageHero";
import { contactInfo } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter LODENE Auto-École, demander une inscription, écrire ou trouver le point de rendez-vous à Conflans-Sainte-Honorine.",
  alternates: { canonical: "/contact" }
};

type ContactTile = { icon: LucideIcon; label: string; value: string; href?: string };

// On n'affiche que les coordonnées officiellement confirmées (les champs vides sont masqués).
function buildContactTiles(): ContactTile[] {
  const tiles: ContactTile[] = [];
  if (contactInfo.phone) {
    tiles.push({ icon: Phone, label: "Téléphone", value: contactInfo.phone, href: `tel:${contactInfo.phone.replaceAll(" ", "")}` });
  }
  if (contactInfo.email) {
    tiles.push({ icon: Mail, label: "Email", value: contactInfo.email, href: `mailto:${contactInfo.email}` });
  }
  tiles.push({ icon: MapPin, label: "Adresse", value: contactInfo.address });
  if (contactInfo.hours) {
    tiles.push({ icon: Clock3, label: "Horaires", value: contactInfo.hours });
  }
  if (contactInfo.whatsapp) {
    tiles.push({ icon: MessageCircle, label: "WhatsApp", value: "Réponse rapide", href: `https://wa.me/${contactInfo.whatsapp}` });
  }
  return tiles;
}

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Parle à un conseiller LODENE"
        text="Remplis le formulaire ci-dessous : un conseiller te recontacte avec un parcours et un devis adaptés."
        cta="Envoyer une demande"
        ctaHref="#demande"
      />
      <section id="demande" className="bg-white py-14 sm:py-20">
        <div className="container-pad grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {buildContactTiles().map((item) => {
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
          <Suspense fallback={<div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-premium">Chargement du formulaire...</div>}>
            <ContactForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
