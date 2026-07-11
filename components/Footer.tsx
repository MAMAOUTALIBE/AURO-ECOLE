import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { contactInfo, legalLinks } from "@/data/site";

type FooterLinkItem = {
  href: string;
  label: string;
};

const brandSignals: { label: string; icon: LucideIcon }[] = [
  { label: "Auto-école agréée", icon: ShieldCheck },
  { label: "À Conflans-Sainte-Honorine", icon: MapPin }
];

const mainLinks: FooterLinkItem[] = [
  { href: "/formations", label: "Nos formations" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/financement", label: "Financement" },
  { href: "/cpf", label: "Permis avec le CPF" }
];

const companyLinks: FooterLinkItem[] = [
  { href: "/a-propos", label: "À propos" },
  { href: "/avis", label: "Avis des élèves" },
  { href: "/faq", label: "Questions fréquentes" },
  { href: "/contact", label: "Nous contacter" }
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

  return (
    <footer className="relative overflow-hidden bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] text-loden-ink md:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(226,251,251,0.72)_0%,rgba(255,255,255,0.96)_28%,#ffffff_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-loden-50/70 to-transparent" aria-hidden="true" />

      <div className="container-pad relative py-10 md:py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr_1.2fr] lg:gap-12">
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
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1" aria-label="Points forts LODENE">
              {brandSignals.map((item) => (
                <BrandSignal key={item.label} {...item} />
              ))}
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <SectionTitle>Découvrir</SectionTitle>
              <nav className="mt-5 grid gap-1" aria-label="Découvrir nos offres">
                {mainLinks.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div>
              <SectionTitle>LODENE</SectionTitle>
              <nav className="mt-5 grid gap-1" aria-label="À propos de LODENE">
                {companyLinks.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
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
          </aside>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-gradient-to-r from-[#043044] via-[#07566a] to-[#043044]">
        <div className="container-pad flex flex-col gap-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 text-sm text-white md:flex-row md:items-center md:justify-between md:pb-28">
          <div>
            <p className="font-semibold">© 2026 LODENE Auto-École. Tous droits réservés.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end" aria-label="Liens légaux">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="font-semibold text-white/90 transition hover:text-loden-200">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
