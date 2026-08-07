import { Download, FileText } from "lucide-react";
import type { PageDocument } from "@/lib/site-content";

/**
 * Liste de documents téléchargeables pilotée depuis le CRM (médiathèque).
 *
 * Partagée par la landing `/passerelle-boite-automatique-manuelle` et la fiche
 * catalogue `/formations/passerelle-bva-manuelle` : les deux lisent le même réglage
 * `page.passerelle`, une seule saisie alimente les deux pages — le rendu des cartes
 * doit donc rester identique. Chaque page fournit sa propre section et son propre
 * titre, pour respecter la typographie qui lui est propre.
 *
 * Les documents doivent avoir été filtrés par `pageDocuments()` en amont.
 */
export function DocumentDownloadList({ documents }: { documents: PageDocument[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
      {documents.map((doc) => (
        <li key={doc.id || doc.url}>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:border-loden-300 hover:shadow-premium md:p-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black text-loden-ink">{doc.label}</span>
              {doc.description ? (
                <span className="mt-1 block text-sm leading-6 text-loden-muted">{doc.description}</span>
              ) : null}
            </span>
            <Download className="mt-1 h-5 w-5 shrink-0 text-loden-muted transition group-hover:text-loden-700" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
