import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock3, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { LocalMapPanel } from "@/components/LocalMapPanel";
import { PageHero } from "@/components/PageHero";
import { contactInfo } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Contacter LODENE Auto-École, demander une inscription, écrire ou trouver le point de rendez-vous à Conflans-Sainte-Honorine.",
  path: "/contact"
});

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
      <section id="demande" className="bg-white py-8 md:py-10 xl:py-14">
        <div className="container-pad grid gap-5 md:gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="order-2 grid gap-3 lg:order-1">
            {buildContactTiles().map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-loden-pearl p-4 shadow-soft md:gap-4 md:rounded-2xl md:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-loden-700 shadow-soft md:h-12 md:w-12 md:rounded-2xl">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">{item.label}</p>
                    <p className="mt-1 break-words font-semibold text-loden-ink">{item.value}</p>
                  </div>
                </div>
              );
              return item.href ? (
                <a key={item.label} href={item.href} className="focus-ring rounded-2xl">
                  {content}
                </a>
              ) : (
                <div key={item.label}>{content}</div>
              );
            })}
            <LocalMapPanel />
          </div>
          <div className="order-1 lg:order-2">
            <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium md:rounded-[1.75rem] md:p-6">Chargement du formulaire...</div>}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
