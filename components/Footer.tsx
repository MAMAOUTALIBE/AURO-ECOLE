import Link from "next/link";
import { Facebook, Instagram, Link2, Mail, MapPin, Phone } from "lucide-react";
import { contactInfo, legalLinks, localSeoPages, navItems, socialLinks } from "@/data/site";

function socialIcon(label: string) {
  const value = label.toLowerCase();
  if (value.includes("facebook")) return Facebook;
  if (value.includes("instagram")) return Instagram;
  return Link2;
}

export function Footer() {
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.mapQuery)}`;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-pad grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-700 text-lg font-bold text-white">
              L
            </span>
            <div>
              <p className="text-lg font-semibold text-loden-ink">LODENE Auto-École</p>
              <p className="text-sm text-loden-muted">Permis nouvelle génération</p>
            </div>
          </div>
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
                <Phone className="mt-0.5 h-4 w-4 text-loden-500" />
                {contactInfo.phone}
              </a>
            ) : null}
            {contactInfo.email ? (
              <a className="flex gap-2 hover:text-loden-700" href={`mailto:${contactInfo.email}`}>
                <Mail className="mt-0.5 h-4 w-4 text-loden-500" />
                {contactInfo.email}
              </a>
            ) : null}
            <a className="flex gap-2 hover:text-loden-700" href={directionsHref} target="_blank" rel="noreferrer">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-loden-500" />
              {contactInfo.address}
            </a>
            <Link className="flex gap-2 font-medium text-loden-700 hover:text-loden-800" href="/contact">
              <Mail className="mt-0.5 h-4 w-4" />
              Nous écrire
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 py-5">
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
