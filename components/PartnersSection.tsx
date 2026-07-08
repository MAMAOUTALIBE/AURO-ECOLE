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

function isOdelicePartner(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .includes("odelice");
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

        <div className="mt-3 overflow-hidden py-2.5 sm:mt-4 sm:py-3 md:mt-5 md:py-4">
          <div className="marquee" role="marquee" aria-label="Partenaires LODENE">
            <div className="marquee-track gap-8 px-2 sm:gap-10 sm:px-3 md:gap-14 md:px-4" style={{ animationDuration: `${Math.max(34, marqueePartners.length * 3)}s` }}>
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
  const logoClass = isOdelicePartner(partner.companyName)
    ? "h-14 w-auto max-w-[150px] object-contain drop-shadow-sm sm:h-16 sm:max-w-[170px] md:h-20"
    : "h-10 w-auto max-w-[170px] object-contain drop-shadow-sm sm:h-12 sm:max-w-[210px] md:h-14 md:max-w-[250px]";
  const content = partner.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- logo partenaire arbitraire (URL externe possible)
    <img
      src={partner.logoUrl}
      alt={partner.companyName}
      loading="lazy"
      className={logoClass}
    />
  ) : (
    <span className="flex items-center gap-2 whitespace-nowrap sm:gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-loden-700 sm:h-9 sm:w-9 sm:text-sm">
        {initials(partner.companyName)}
      </span>
      <span className="text-xs font-semibold text-white sm:text-sm md:text-base">{partner.companyName}</span>
    </span>
  );

  const logoShellClass =
    "flex h-16 min-w-[8rem] items-center justify-center px-1 transition-opacity hover:opacity-90 sm:h-20 sm:min-w-[9.5rem] md:h-24 md:min-w-[12rem]";

  if (partner.websiteUrl) {
    return (
      <a
        href={normalizeUrl(partner.websiteUrl)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        title={partner.companyName}
        className={`focus-ring ${logoShellClass}`}
      >
        {content}
      </a>
    );
  }
  return (
    <div title={partner.companyName} className={logoShellClass}>
      {content}
    </div>
  );
}
