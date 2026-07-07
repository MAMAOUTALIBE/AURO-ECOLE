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
    <section className="block w-full bg-loden-800 py-4 text-white sm:py-5 md:py-7" aria-labelledby="partners-title">
      <div className="container-pad">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between md:gap-5">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-loden-100 sm:text-sm">Ils nous font confiance</p>
            <h2 id="partners-title" className="mt-1.5 text-xl font-semibold leading-tight text-white sm:mt-2 sm:text-3xl">
              Un réseau de partenaires autour de la formation
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-5 text-loden-100/90 sm:leading-6">
            Entreprises, prescripteurs et acteurs locaux accompagnent les parcours LODENE.
          </p>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white py-2 shadow-premium sm:mt-4 sm:py-2.5 md:mt-5 md:rounded-2xl md:py-3">
          <div className="marquee" role="marquee" aria-label="Partenaires LODENE">
            <div className="marquee-track gap-2.5 px-2.5 sm:gap-3 sm:px-3 md:gap-4 md:px-4" style={{ animationDuration: `${Math.max(34, marqueePartners.length * 3)}s` }}>
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
      className="h-8 w-auto max-w-[120px] object-contain sm:h-10 sm:max-w-[150px] md:h-12"
    />
  ) : (
    <span className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-loden-50 text-xs font-bold text-loden-700 sm:h-9 sm:w-9 sm:text-sm">
        {initials(partner.companyName)}
      </span>
      <span className="text-xs font-semibold text-loden-ink sm:text-sm md:text-base">{partner.companyName}</span>
    </span>
  );

  const cardClass =
    "flex h-12 min-w-[7.5rem] items-center justify-center rounded-full border border-slate-200 bg-white px-3 shadow-soft transition hover:-translate-y-0.5 hover:border-loden-200 hover:shadow-premium sm:h-14 sm:min-w-[9rem] sm:px-4 md:h-16 md:min-w-[11rem] md:px-6";

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
