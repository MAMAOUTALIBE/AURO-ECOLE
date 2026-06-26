import { CalendarClock } from "lucide-react";
import { socialChannels } from "@/components/SocialIcons";

// Bandeau d'informations : uniquement des éléments factuels (offres et financement),
// sans statistique ni horaire non vérifiés.
const tickerItems = [
  { highlight: true, label: "Réservation de leçons en ligne" },
  { highlight: false, label: "Permis B, conduite accompagnée, VTC et CACES" },
  { highlight: false, label: "CPF accepté pour les formations éligibles" },
  { highlight: false, label: "Accompagnement administratif de ton dossier" }
];

function TickerGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden}>
      {tickerItems.map((item, index) => (
        <span key={index} className="flex items-center gap-2 text-loden-muted">
          {item.highlight ? (
            <CalendarClock className="h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-loden-300" aria-hidden="true" />
          )}
          <span className="whitespace-nowrap">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function HeaderTop() {
  return (
    <div className="hidden border-b border-[#f97316]/20 bg-white/95 text-sm text-loden-ink backdrop-blur-xl lg:block">
      <div className="container-pad flex h-10 items-center gap-6">
        <div className="marquee min-w-0 flex-1" role="marquee" aria-label="Informations LODENE">
          <div className="marquee-track">
            <TickerGroup />
            <TickerGroup hidden />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5" aria-label="Réseaux sociaux" hidden={socialChannels.length === 0}>
          {socialChannels.map(({ label, href, Icon }) => (
            <a
              key={label}
              className="focus-ring flex h-6 w-6 items-center justify-center rounded-full bg-loden-50 text-loden-700 shadow-sm ring-1 ring-loden-100 transition hover:scale-110 hover:shadow-md"
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
