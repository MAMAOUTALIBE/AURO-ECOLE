import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { contactInfo } from "@/data/site";

export function LocalMapPanel() {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(contactInfo.mapQuery)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.mapQuery)}`;

  return (
    <div id="agences" className="scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-loden-pearl shadow-soft">
      <div className="flex items-start gap-4 p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
          <MapPin className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-loden-700">Nous trouver</p>
          <h2 className="mt-1 text-xl font-semibold text-loden-ink">Conflans-Sainte-Honorine</h2>
          <p className="mt-2 text-sm leading-6 text-loden-muted">{contactInfo.address}</p>
        </div>
      </div>
      <iframe
        title="Carte du point de rendez-vous LODENE"
        src={mapSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-[16/10] w-full border-0"
      />
      <div className={`grid gap-3 border-t border-slate-200 bg-white p-4 ${contactInfo.phone ? "sm:grid-cols-2" : ""}`}>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-loden-700 px-4 py-3 text-sm font-semibold text-white hover:bg-loden-800"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Itinéraire
        </a>
        {contactInfo.phone ? (
          <a
            href={`tel:${contactInfo.phone.replaceAll(" ", "")}`}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-loden-ink hover:bg-loden-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Appeler
          </a>
        ) : null}
      </div>
    </div>
  );
}
