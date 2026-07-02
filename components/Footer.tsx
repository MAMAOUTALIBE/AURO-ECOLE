import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Mail,
  MapPin,
  MessageCircle,
  MonitorCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/SocialIcons";
import { contactInfo, navItems } from "@/data/site";

type FooterLinkItem = {
  href: string;
  label: string;
};

type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

const brandSignals: { label: string; icon: LucideIcon }[] = [
  { label: "Pédagogie de qualité", icon: ShieldCheck },
  { label: "Suivi digital personnalisé", icon: MonitorCheck },
  { label: "Équipe à votre écoute", icon: UsersRound },
  { label: "Conflans-Sainte-Honorine", icon: MapPin }
];

const formationLinks: FooterLinkItem[] = [
  { href: "/formations/permis-b-manuel-essentiel", label: "Permis B Conflans-Sainte-Honorine" },
  { href: "/cpf", label: "Auto-école CPF Conflans-Sainte-Honorine" },
  { href: "/formations/permis-b-auto-declic", label: "CPF permis" },
  { href: "/tarifs", label: "Tarifs" }
];

const financeLinks: FooterLinkItem[] = [
  { href: "/cpf", label: "CPF" },
  { href: "/financement", label: "Aides au permis" },
  { href: "/financement", label: "Financement personnel" },
  { href: "/financement", label: "Paiement en plusieurs fois" },
  { href: "/contact?objet=documents", label: "Documents nécessaires" }
];

const practicalLinks: FooterLinkItem[] = [
  { href: "/formations/permis-b-manuel-essentiel", label: "Permis B" },
  { href: "/cpf", label: "CPF" },
  { href: "/permis-b-paris-11", label: "Auto-école à Conflans-Sainte-Honorine" },
  { href: "/contact?objet=horaires", label: "Horaires" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Nous écrire" }
];

const legalBottomLinks: FooterLinkItem[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/mentions-legales", label: "CGV" },
  { href: "/sitemap.xml", label: "Plan du site" }
];

const socialButtons: { label: string; href: string; Icon: SocialIcon }[] = [
  { label: "Facebook", href: "/contact", Icon: FacebookIcon },
  { label: "Instagram", href: "/contact", Icon: InstagramIcon },
  { label: "TikTok", href: "/contact", Icon: TiktokIcon },
  { label: "YouTube", href: "/contact", Icon: YoutubeIcon }
];

function normalizePhone(source: string) {
  return source.replace(/\s/g, "");
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div>
      <p className="text-base font-black text-loden-ink">{children}</p>
      <span className="mt-3 block h-0.5 w-7 rounded-full bg-loden-600" aria-hidden="true" />
    </div>
  );
}

function FooterLink({ href, label }: FooterLinkItem) {
  return (
    <Link
      href={href}
      className="group/link flex min-w-0 items-start gap-3 rounded-xl py-1.5 text-sm font-semibold leading-6 text-loden-muted transition hover:translate-x-1 hover:text-loden-800"
    >
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-loden-600 transition group-hover/link:text-loden-800" aria-hidden="true" />
      <span className="min-w-0">{label}</span>
    </Link>
  );
}

function BrandSignal({ label, icon: Icon }: (typeof brandSignals)[number]) {
  return (
    <li className="flex items-center gap-3 text-sm font-semibold text-loden-muted">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-loden-100 bg-white text-loden-700 shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </li>
  );
}

function ContactLine({
  href,
  icon: Icon,
  label,
  text,
  external
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  text: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex min-w-0 items-start gap-3 rounded-2xl p-2 transition hover:bg-loden-50"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-loden-50 text-loden-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black leading-5 text-loden-ink">{text}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-loden-muted">{label}</span>
      </span>
    </a>
  );
}

export function Footer() {
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.mapQuery)}`;
  const phoneHref = contactInfo.phone ? `tel:${normalizePhone(contactInfo.phone)}` : "/contact";
  const emailHref = contactInfo.email ? `mailto:${contactInfo.email}` : "/contact";
  const whatsappHref = contactInfo.whatsapp ? `https://wa.me/${contactInfo.whatsapp}` : phoneHref;

  return (
    <footer className="relative overflow-hidden bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] text-loden-ink md:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(226,251,251,0.72)_0%,rgba(255,255,255,0.96)_28%,#ffffff_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-loden-50/70 to-transparent" aria-hidden="true" />

      <div className="container-pad relative py-10 md:py-12 lg:py-16">
        <div className="grid gap-10 xl:grid-cols-[1.05fr_2.55fr_1.15fr] xl:gap-12">
          <div className="lg:pr-4">
            <Link href="/" className="focus-ring inline-flex rounded-3xl" aria-label="LODENE - Accueil">
              <Image
                src="/lodene-logo-wordmark.png"
                alt="LODENE Formation"
                width={1320}
                height={660}
                className="h-24 w-auto max-w-[260px] sm:h-28"
              />
            </Link>
            <p className="mt-5 max-w-sm text-base leading-7 text-loden-muted">
              Une auto-école lumineuse, digitale et exigeante pour apprendre à conduire avec confiance.
            </p>
            <ul className="mt-6 grid gap-3" aria-label="Points forts LODENE">
              {brandSignals.map((item) => (
                <BrandSignal key={item.label} {...item} />
              ))}
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-10">
            <div>
              <SectionTitle>Navigation</SectionTitle>
              <nav className="mt-5 grid gap-1" aria-label="Navigation du footer">
                {navItems.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div>
              <SectionTitle>Formations</SectionTitle>
              <nav className="mt-5 grid gap-1" aria-label="Formations du footer">
                {formationLinks.map((item) => (
                  <FooterLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div>
              <SectionTitle>Financement & aides</SectionTitle>
              <nav className="mt-5 grid gap-1" aria-label="Financement et aides du footer">
                {financeLinks.map((item) => (
                  <FooterLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div>
              <SectionTitle>Infos pratiques</SectionTitle>
              <nav className="mt-5 grid gap-1" aria-label="Informations pratiques du footer">
                {practicalLinks.map((item) => (
                  <FooterLink key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,45,60,0.10)]">
            <SectionTitle>Contact</SectionTitle>
            <div className="mt-5 grid gap-3">
              <ContactLine href={phoneHref} icon={Phone} text={contactInfo.phone || "Nous appeler"} label="Du lundi au samedi" />
              <ContactLine href={emailHref} icon={Mail} text={contactInfo.email || "Nous écrire"} label="Réponse rapide" />
              <ContactLine href={directionsHref} icon={MapPin} text={contactInfo.address} label="Facile d’accès" external />
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <Link href="/contact" className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-loden-50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-loden-50 text-loden-700">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-loden-muted">Une question ?</span>
                  <span className="mt-1 inline-flex items-center gap-2 text-sm font-black text-loden-700">
                    Nous écrire <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,45,60,0.10)] md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.75fr_0.75fr] lg:items-center">
            <div className="flex min-w-0 gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-loden-50 text-loden-700">
                <CalendarCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-base font-black text-loden-ink">Prêt à prendre le volant ?</span>
                <span className="mt-1 block text-sm leading-6 text-loden-muted">
                  Notre équipe vous accompagne à chaque étape de votre réussite.
                </span>
              </span>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(37,211,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1fbd58]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp {contactInfo.phone}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>

            <Link
              href="/contact"
              className="focus-ring inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#0b6f82] to-[#06485b] px-6 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(7,72,91,0.22)] transition hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Assistant LODENE
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-gradient-to-r from-[#043044] via-[#07566a] to-[#043044]">
        <div className="container-pad grid gap-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 text-sm text-white md:grid-cols-[1fr_auto_1fr] md:items-center md:pb-28">
          <div>
            <p className="font-semibold">© 2026 LODENE Auto-École. Tous droits réservés.</p>
            <p className="mt-1 font-semibold text-loden-200">Apprendre à conduire, gagner en liberté.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 md:justify-center" aria-label="Liens légaux">
            {legalBottomLinks.map((item) => (
              <Link key={`${item.href}-${item.label}`} href={item.href} className="font-semibold text-white/90 transition hover:text-loden-200">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap gap-3 md:justify-end" aria-label="Réseaux sociaux">
            {socialButtons.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-loden-300 hover:text-loden-950"
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
