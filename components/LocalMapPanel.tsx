import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { contactInfo } from "@/data/site";

export function LocalMapPanel() {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(contactInfo.mapQuery)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.mapQuery)}`;

  return (
    <div id="agences" className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-loden-pearl shadow-soft sm:rounded-3xl">
      <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft sm:h-12 sm:w-12">
          <MapPin className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">Nous trouver</p>
          <h2 className="mt-1 text-lg font-semibold text-loden-ink sm:text-xl">Conflans-Sainte-Honorine</h2>
          <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">{contactInfo.address}</p>
        </div>
      </div>
      <iframe
        title="Carte du point de rendez-vous LODENE"
        src={mapSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-[4/3] w-full border-0 sm:aspect-[16/10]"
      />
      <div className={`grid gap-3 border-t border-slate-200 bg-white p-4 ${contactInfo.phone ? "sm:grid-cols-2" : ""}`}>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-loden-700 px-4 py-3 text-sm font-semibold text-white hover:bg-loden-800 sm:rounded-full"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Itinéraire
        </a>
        {contactInfo.phone ? (
          <a
            href={`tel:${contactInfo.phone.replaceAll(" ", "")}`}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-loden-ink hover:bg-loden-50 sm:rounded-full"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Appeler
          </a>
        ) : null}
      </div>
    </div>
  );
}
