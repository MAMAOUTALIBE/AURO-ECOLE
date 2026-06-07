import { CalendarClock } from "lucide-react";
import { socialChannels } from "@/components/SocialIcons";

const tickerItems = [
  { highlight: true, label: "Prochaine leçon disponible — aujourd'hui à 17h30" },
  { highlight: false, label: "Réservation en ligne 7j/7" },
  { highlight: false, label: "CPF accepté — financement jusqu'à 100 %" },
  { highlight: false, label: "Paiement en 4× sans frais" },
  { highlight: false, label: "98 % de réussite — +2000 élèves formés" }
];

function TickerGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden}>
      {tickerItems.map((item, index) => (
        <span key={index} className="flex items-center gap-2 text-white/90">
          {item.highlight ? (
            <CalendarClock className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" aria-hidden="true" />
          )}
          <span className="whitespace-nowrap">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function HeaderTop() {
  return (
    <div className="hidden border-b border-loden-600 bg-loden-700 text-sm text-white lg:block">
      <div className="container-pad flex h-10 items-center gap-6">
        <div className="marquee min-w-0 flex-1" role="marquee" aria-label="Informations LODEN">
          <div className="marquee-track">
            <TickerGroup />
            <TickerGroup hidden />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5" aria-label="Réseaux sociaux">
          {socialChannels.map(({ label, href, Icon }) => (
            <a
              key={label}
              className="focus-ring flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-white/40 transition hover:scale-110 hover:shadow-md"
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
