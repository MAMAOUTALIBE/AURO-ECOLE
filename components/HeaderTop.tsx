import { Clock3, Facebook, Instagram, MapPin, Phone } from "lucide-react";
import { contactInfo } from "@/data/site";

export function HeaderTop() {
  return (
    <div className="hidden border-b border-slate-200/80 bg-white text-sm text-loden-muted lg:block">
      <div className="container-pad flex h-10 items-center justify-between">
        <div className="flex items-center gap-6">
          <a className="flex items-center gap-2 hover:text-loden-700" href={`tel:${contactInfo.phone.replaceAll(" ", "")}`}>
            <Phone className="h-4 w-4 text-loden-500" aria-hidden="true" />
            {contactInfo.phone}
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-loden-500" aria-hidden="true" />
            {contactInfo.address}
          </span>
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-loden-500" aria-hidden="true" />
            {contactInfo.hours}
          </span>
        </div>
        <div className="flex items-center gap-3" aria-label="Réseaux sociaux">
          <a className="rounded-full p-1 hover:bg-loden-50 hover:text-loden-700 focus-ring" href="#" aria-label="Instagram LODEN">
            <Instagram className="h-4 w-4" />
          </a>
          <a className="rounded-full p-1 hover:bg-loden-50 hover:text-loden-700 focus-ring" href="#" aria-label="Facebook LODEN">
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
