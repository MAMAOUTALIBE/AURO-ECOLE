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

  return (
    <section className="bg-white py-7 md:py-10">
      <div className="container-pad">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-loden-700 sm:text-sm">Ils nous font confiance</p>
          <h2 className="mt-2 text-[1.45rem] font-semibold leading-tight text-loden-ink sm:text-3xl">Nos partenaires</h2>
        </div>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8 md:gap-4">
          {partners.map((partner) => (
            <li key={partner.id}>
              <PartnerBadge partner={partner} />
            </li>
          ))}
        </ul>
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
    <span className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-loden-50 text-sm font-bold text-loden-700">
        {initials(partner.companyName)}
      </span>
      <span className="text-sm font-semibold text-loden-ink">{partner.companyName}</span>
    </span>
  );

  const cardClass =
    "flex h-16 min-w-[130px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-premium";

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
