"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { useMedia, type Media } from "@/components/crm/site/useMedia";

// Modal de sélection d'image dans la médiathèque (avec upload rapide intégré).
export function MediaPickerModal({
  open,
  onClose,
  onSelect
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
}) {
  const { items, loading, upload } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const images = items.filter((media) => media.mimeType.startsWith("image/"));

  const quickUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const created = await upload(file, "", "formations");
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
          <h2 className="text-lg font-semibold text-loden-ink">Choisir une image</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-loden-muted hover:bg-loden-50">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl bg-loden-pearl/50 p-3">
          <input ref={fileRef} type="file" accept="image/*" className="field-input flex-1" />
          <button type="button" onClick={quickUpload} disabled={busy} className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-70">
            <UploadCloud className="h-4 w-4" aria-hidden="true" /> {busy ? "Envoi…" : "Téléverser & choisir"}
          </button>
        </div>
        {error ? <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={() => {
                onSelect(media);
                onClose();
              }}
              className="focus-ring group overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-loden-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.url} alt={media.altText || media.originalName} className="h-28 w-full object-cover" />
              <span className="block truncate px-2 py-1 text-xs text-loden-muted" title={media.originalName}>{media.originalName}</span>
            </button>
          ))}
        </div>
        {!loading && images.length === 0 ? <p className="mt-4 text-sm text-loden-muted">Aucune image. Téléverse-en une ci-dessus.</p> : null}
      </div>
    </div>
  );
}
