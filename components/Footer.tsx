import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Facebook, Instagram, Link2, Mail, MapPin, Phone } from "lucide-react";
import { contactInfo, legalLinks, localSeoPages, navItems, socialLinks } from "@/data/site";

function socialIcon(label: string) {
  const value = label.toLowerCase();
  if (value.includes("facebook")) return Facebook;
  if (value.includes("instagram")) return Instagram;
  return Link2;
}

function MobileFooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="focus-ring flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 text-[15px] font-semibold text-loden-ink shadow-sm transition hover:border-loden-200 hover:bg-loden-50"
      href={href}
    >
      <span>{label}</span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-loden-100 text-loden-700">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function Footer() {
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.mapQuery)}`;
  const phoneHref = contactInfo.phone ? `tel:${contactInfo.phone.replaceAll(" ", "")}` : "";
  const localGuideLinks = [
    ...localSeoPages,
    { href: "/cpf", label: "CPF permis" },
    { href: "/tarifs", label: "Tarifs" }
  ];

  return (
    <footer className="border-t border-slate-200 bg-loden-petrol/70 pb-24 md:bg-white md:pb-0">
      <div className="container-pad py-7 md:hidden">
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-soft">
          <div className="px-5 pb-5 pt-6">
            <Link href="/" className="focus-ring inline-flex rounded-2xl" aria-label="LODENE - Accueil">
              <Image
                src="/lodene-logo-wordmark.png"
                alt="LODENE Formation"
                width={1320}
                height={660}
                className="h-20 w-auto max-w-[260px]"
              />
            </Link>
            <p className="mt-4 max-w-xs text-[15px] leading-6 text-loden-muted">
              Auto-école & centre de formation à Conflans.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Link
                className="focus-ring flex min-h-[52px] items-center justify-center gap-1.5 rounded-full bg-loden-700 px-2 text-center text-sm font-bold text-white shadow-soft transition hover:bg-loden-800"
                href="/inscription"
              >
                <span>S&apos;inscrire</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
              {contactInfo.phone ? (
                <a
                  className="focus-ring flex min-h-[52px] items-center justify-center gap-1.5 rounded-full border border-loden-100 bg-loden-50 px-2 text-center text-sm font-bold text-loden-800 transition hover:bg-loden-100"
                  href={phoneHref}
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Appeler</span>
                </a>
              ) : null}
              <Link
                className="focus-ring flex min-h-[52px] items-center justify-center gap-1.5 rounded-full border border-loden-100 bg-loden-50 px-2 text-center text-sm font-bold text-loden-800 transition hover:bg-loden-100"
                href="/contact"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Écrire</span>
              </Link>
            </div>
          </div>

          <div className="border-y border-slate-100 bg-loden-fog/70 px-5 py-5">
            <p className="text-base font-bold text-loden-ink">Navigation</p>
            <nav className="mt-3" aria-label="Navigation secondaire mobile">
              <ul className="grid gap-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <MobileFooterLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="px-5 py-5">
            <p className="text-base font-bold text-loden-ink">Guides locaux</p>
            <nav className="mt-3" aria-label="Guides locaux mobile">
              <ul className="grid gap-2">
                {localGuideLinks.map((item) => (
                  <li key={item.href}>
                    <MobileFooterLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="border-t border-slate-100 bg-white px-5 pb-6 pt-5">
            <p className="text-base font-bold text-loden-ink">Contact</p>
            <div className="mt-4 grid gap-3 text-[15px] leading-6 text-loden-muted">
              {contactInfo.phone ? (
                <a className="flex gap-3 font-semibold hover:text-loden-700" href={phoneHref}>
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                  {contactInfo.phone}
                </a>
              ) : null}
              {contactInfo.email ? (
                <a className="flex gap-3 font-semibold hover:text-loden-700" href={`mailto:${contactInfo.email}`}>
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                  {contactInfo.email}
                </a>
              ) : null}
              <a
                className="flex gap-3 hover:text-loden-700"
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                <span>{contactInfo.address}</span>
              </a>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                className="focus-ring flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-loden-100 bg-loden-50 px-3 text-sm font-bold text-loden-800 transition hover:bg-loden-100"
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
              >
                Itinéraire
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                className="focus-ring flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-loden-700 px-3 text-sm font-bold text-white shadow-soft transition hover:bg-loden-800"
                href="/contact"
              >
                Nous écrire
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-xs leading-5 text-loden-muted">
          <p>© 2026 LODENE Auto-École. Tous droits réservés.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {legalLinks.map((item) => (
              <Link key={item.href} className="font-medium hover:text-loden-700" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container-pad hidden gap-10 py-12 md:grid lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link href="/" className="focus-ring inline-flex rounded-2xl" aria-label="LODENE - Accueil">
            <Image
              src="/lodene-logo-wordmark.png"
              alt="LODENE Formation"
              width={1320}
              height={660}
              className="h-24 w-auto"
            />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-loden-muted">
            Une auto-école lumineuse, digitale et exigeante pour apprendre à conduire avec confiance.
          </p>
          {socialLinks.length > 0 ? (
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = socialIcon(social.label);
                return (
                  <a
                    key={social.href}
                    className="rounded-full border border-slate-200 p-2 text-loden-muted hover:text-loden-700 focus-ring"
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <div>
          <p className="font-semibold text-loden-ink">Navigation</p>
          <div className="mt-4 grid gap-3 text-sm text-loden-muted">
            {navItems.map((item) => (
              <Link key={item.href} className="hover:text-loden-700" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold text-loden-ink">Guides locaux</p>
          <div className="mt-4 grid gap-3 text-sm text-loden-muted">
            {localSeoPages.map((item) => (
              <Link key={item.href} className="hover:text-loden-700" href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="hover:text-loden-700" href="/cpf">CPF permis</Link>
            <Link className="hover:text-loden-700" href="/tarifs">Tarifs</Link>
          </div>
        </div>

        <div>
          <p className="font-semibold text-loden-ink">Contact</p>
          <div className="mt-4 grid gap-3 text-sm text-loden-muted">
            {contactInfo.phone ? (
              <a className="flex gap-2 hover:text-loden-700" href={`tel:${contactInfo.phone.replaceAll(" ", "")}`}>
                <Phone className="mt-0.5 h-4 w-4 text-loden-500" aria-hidden="true" />
                {contactInfo.phone}
              </a>
            ) : null}
            {contactInfo.email ? (
              <a className="flex gap-2 hover:text-loden-700" href={`mailto:${contactInfo.email}`}>
                <Mail className="mt-0.5 h-4 w-4 text-loden-500" aria-hidden="true" />
                {contactInfo.email}
              </a>
            ) : null}
            <a className="flex gap-2 hover:text-loden-700" href={directionsHref} target="_blank" rel="noreferrer">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-loden-500" aria-hidden="true" />
              {contactInfo.address}
            </a>
            <Link className="flex gap-2 font-medium text-loden-700 hover:text-loden-800" href="/contact">
              <Mail className="mt-0.5 h-4 w-4" aria-hidden="true" />
              Nous écrire
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden border-t border-slate-200 py-5 md:block">
        <div className="container-pad flex flex-col gap-2 text-sm text-loden-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 LODENE Auto-École. Tous droits réservés.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((item) => (
              <Link key={item.href} className="hover:text-loden-700" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
