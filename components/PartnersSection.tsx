import type { PublicPartner } from "@/lib/partner-mappers";

// Vitrine « Ils nous font confiance » sur la page d'accueil. Rendue uniquement s'il
// existe au moins un partenaire opt-in (sinon la section disparaît, jamais de bloc vide).

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "•"
  );
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function PartnersSection({ partners }: { partners: PublicPartner[] }) {
  if (!partners.length) return null;
  const visiblePartners = Array.from({ length: Math.max(1, Math.ceil(10 / partners.length)) }, () => partners).flat();
  const marqueePartners = [...visiblePartners, ...visiblePartners];

  return (
    <section className="bg-loden-pearl py-4 md:py-6" aria-labelledby="partners-title">
      <div className="container-pad">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Ils nous font confiance</p>
            <h2 id="partners-title" className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-3xl">
              Un réseau de partenaires autour de la formation
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-loden-muted">
            Entreprises, prescripteurs et acteurs locaux accompagnent les parcours LODENE.
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-loden-100 bg-white py-2.5 shadow-soft md:mt-5 md:rounded-2xl md:py-3">
          <div className="marquee" role="marquee" aria-label="Partenaires LODENE">
            <div className="marquee-track gap-3 px-3 md:gap-4 md:px-4" style={{ animationDuration: `${Math.max(34, marqueePartners.length * 3)}s` }}>
              {marqueePartners.map((partner, index) => (
                <PartnerBadge key={`${partner.id}-${index}`} partner={partner} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerBadge({ partner }: { partner: PublicPartner }) {
  const content = partner.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- logo partenaire arbitraire (URL externe possible)
    <img
      src={partner.logoUrl}
      alt={partner.companyName}
      loading="lazy"
      className="h-10 w-auto max-w-[150px] object-contain md:h-12"
    />
  ) : (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-loden-50 text-sm font-bold text-loden-700">
        {initials(partner.companyName)}
      </span>
      <span className="text-sm font-semibold text-loden-ink md:text-base">{partner.companyName}</span>
    </span>
  );

  const cardClass =
    "flex h-14 min-w-[9rem] items-center justify-center rounded-full border border-slate-200 bg-white px-4 shadow-soft transition hover:-translate-y-0.5 hover:border-loden-200 hover:shadow-premium md:h-16 md:min-w-[11rem] md:px-6";

  if (partner.websiteUrl) {
    return (
      <a
        href={normalizeUrl(partner.websiteUrl)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        title={partner.companyName}
        className={`focus-ring ${cardClass}`}
      >
        {content}
      </a>
    );
  }
  return (
    <div title={partner.companyName} className={cardClass}>
      {content}
    </div>
  );
}
