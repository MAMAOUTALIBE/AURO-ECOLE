"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, FileText, ImageIcon, Plus, Trash2 } from "lucide-react";
import { MediaPickerModal } from "@/components/crm/site/MediaPickerModal";
import { useSiteSetting } from "@/components/crm/site/useSiteSetting";
import { defaultPasserellePage, type PageDocument, type PasserellePage } from "@/lib/site-content";
import { PASSERELLE_PATH } from "@/lib/passerelle";

/** Déplace un élément dans un tableau (bornes ignorées si hors limites). */
function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function PasserelleEditor() {
  const setting = useSiteSetting<PasserellePage>("page.passerelle", defaultPasserellePage);
  const { value, setValue, loading, saving, error, savedAt, save, reset } = setting;
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [docPickerFor, setDocPickerFor] = useState<number | null>(null);

  const patch = (partial: Partial<PasserellePage>) => setValue({ ...value, ...partial });

  const documents = value.documents ?? [];
  const setDocuments = (next: PageDocument[]) => patch({ documents: next });
  const patchDocument = (index: number, partial: Partial<PageDocument>) =>
    setDocuments(documents.map((doc, i) => (i === index ? { ...doc, ...partial } : doc)));

  const addDocument = () =>
    setDocuments([
      ...documents,
      { id: `doc-${Date.now().toString(36)}`, label: "", description: "", url: "" }
    ]);

  if (loading) return <p className="text-sm text-loden-muted">Chargement…</p>;

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-loden-ink">Illustration de la page</h2>
          <Link
            href={PASSERELLE_PATH}
            target="_blank"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-loden-700 hover:text-loden-900"
          >
            Voir la page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-loden-pearl">
            {value.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={value.image} alt={value.imageAlt || "Illustration de la page passerelle"} className="h-36 w-full object-cover" />
            ) : (
              <div className="grid h-36 place-items-center text-loden-muted">
                <ImageIcon className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Chemin de l’image</span>
              <input className="field-input" value={value.image} onChange={(e) => patch({ image: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-loden-muted">Texte alternatif (accessibilité et SEO)</span>
              <input className="field-input" value={value.imageAlt} onChange={(e) => patch({ imageAlt: e.target.value })} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setImagePickerOpen(true)}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50"
              >
                <ImageIcon className="h-4 w-4" aria-hidden="true" /> Choisir dans la médiathèque
              </button>
              <button
                type="button"
                onClick={() => patch({ image: defaultPasserellePage.image, imageAlt: defaultPasserellePage.imageAlt })}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-muted hover:bg-loden-50"
              >
                Remettre la photo d’origine
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Documents à télécharger</h2>
        <p className="mt-1 text-sm text-loden-muted">
          Les fichiers proposés au visiteur en bas de page. Une seule saisie ici alimente <strong>deux pages</strong> : la
          page passerelle et la fiche formation « Passerelle BVA vers boîte manuelle ». La section reste masquée sur les
          deux tant qu’aucun document n’est ajouté.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Titre de la section</span>
            <input
              className="field-input"
              value={value.documentsTitle}
              onChange={(e) => patch({ documentsTitle: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Phrase d’introduction (facultative)</span>
            <input
              className="field-input"
              value={value.documentsIntro}
              onChange={(e) => patch({ documentsIntro: e.target.value })}
            />
          </label>
        </div>

        <ul className="mt-4 grid gap-3">
          {documents.map((doc, index) => (
            <li key={doc.id || index} className="rounded-2xl border border-slate-200 bg-loden-pearl/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-loden-ink">
                  <FileText className="h-4 w-4 text-loden-700" aria-hidden="true" />
                  Document {index + 1}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Monter"
                    onClick={() => setDocuments(move(documents, index, index - 1))}
                    className="focus-ring rounded text-loden-muted hover:text-loden-ink"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Descendre"
                    onClick={() => setDocuments(move(documents, index, index + 1))}
                    className="focus-ring rounded text-loden-muted hover:text-loden-ink"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer le document"
                    onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                    className="focus-ring ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-loden-muted">Libellé affiché</span>
                  <input
                    className="field-input"
                    value={doc.label}
                    placeholder="Programme de la formation passerelle"
                    onChange={(e) => patchDocument(index, { label: e.target.value })}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-loden-muted">Description (facultative)</span>
                  <input
                    className="field-input"
                    value={doc.description}
                    placeholder="PDF · 2 pages"
                    onChange={(e) => patchDocument(index, { description: e.target.value })}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="grid min-w-0 flex-1 gap-1 text-sm">
                  <span className="font-medium text-loden-muted">Fichier</span>
                  <input
                    className="field-input"
                    value={doc.url}
                    placeholder="/uploads/programme-passerelle.pdf"
                    onChange={(e) => patchDocument(index, { url: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setDocPickerFor(index)}
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" /> Choisir un PDF
                </button>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-semibold text-loden-700 hover:text-loden-900"
                  >
                    Ouvrir <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addDocument}
          className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-loden-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter un document
        </button>
      </section>

      {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save(value)}
          disabled={saving}
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-70"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Réinitialiser la page passerelle ?")) void reset(defaultPasserellePage);
          }}
          disabled={saving}
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-loden-muted hover:bg-loden-50 disabled:opacity-70"
        >
          Réinitialiser
        </button>
        {savedAt ? <span className="text-sm text-loden-muted">Enregistré à {savedAt}</span> : null}
      </div>

      <MediaPickerModal
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        accept="image"
        category="passerelle"
        onSelect={(media) => patch({ image: media.url, imageAlt: media.altText || value.imageAlt })}
      />

      <MediaPickerModal
        open={docPickerFor !== null}
        onClose={() => setDocPickerFor(null)}
        accept="document"
        category="passerelle"
        onSelect={(media) => {
          if (docPickerFor === null) return;
          patchDocument(docPickerFor, {
            url: media.url,
            label: documents[docPickerFor]?.label || media.originalName.replace(/\.pdf$/i, "")
          });
        }}
      />
    </div>
  );
}
