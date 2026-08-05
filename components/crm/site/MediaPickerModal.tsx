"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { useMedia, formatBytes, type Media } from "@/components/crm/site/useMedia";

// Modal de sélection dans la médiathèque (avec upload rapide intégré).
// `accept` bascule entre les images (défaut) et les documents (PDF) : le backend
// n'accepte de toute façon que ces deux familles de fichiers.
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  accept = "image",
  category = "formations"
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  /** Famille de médias proposée à la sélection. */
  accept?: "image" | "document";
  /** Catégorie appliquée aux fichiers téléversés depuis ce sélecteur. */
  category?: string;
}) {
  const { items, loading, upload } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const wantsImage = accept === "image";
  const visible = items.filter((media) => media.mimeType.startsWith("image/") === wantsImage);

  const quickUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const created = await upload(file, "", category);
      onSelect(created);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-loden-ink">{wantsImage ? "Choisir une image" : "Choisir un document"}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-loden-muted hover:bg-loden-50">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl bg-loden-pearl/50 p-3">
          <input ref={fileRef} type="file" accept={wantsImage ? "image/*" : "application/pdf"} className="field-input flex-1" />
          <button type="button" onClick={quickUpload} disabled={busy} className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-70">
            <UploadCloud className="h-4 w-4" aria-hidden="true" /> {busy ? "Envoi…" : "Téléverser & choisir"}
          </button>
        </div>
        {error ? <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        <div className={wantsImage ? "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" : "mt-4 grid gap-2"}>
          {visible.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={() => {
                onSelect(media);
                onClose();
              }}
              className={
                wantsImage
                  ? "focus-ring group overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-loden-500"
                  : "focus-ring flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-loden-500"
              }
            >
              {wantsImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt={media.altText || media.originalName} className="h-28 w-full object-cover" />
                  <span className="block truncate px-2 py-1 text-xs text-loden-muted" title={media.originalName}>{media.originalName}</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 shrink-0 text-loden-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-loden-ink" title={media.originalName}>{media.originalName}</span>
                    <span className="block text-xs text-loden-muted">{formatBytes(media.sizeBytes)}</span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
        {!loading && visible.length === 0 ? (
          <p className="mt-4 text-sm text-loden-muted">
            {wantsImage ? "Aucune image. Téléverse-en une ci-dessus." : "Aucun document. Téléverse un PDF ci-dessus."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
