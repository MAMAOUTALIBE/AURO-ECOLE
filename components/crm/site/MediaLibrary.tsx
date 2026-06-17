"use client";

import { useRef, useState } from "react";
import { Check, Copy, FileText, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { formatBytes, useMedia, type Media } from "@/components/crm/site/useMedia";

function MediaThumb({ media }: { media: Media }) {
  if (media.mimeType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.url} alt={media.altText || media.originalName} className="h-32 w-full rounded-xl object-cover" />;
  }
  return (
    <div className="flex h-32 w-full items-center justify-center rounded-xl bg-loden-pearl/60 text-loden-muted">
      <FileText className="h-10 w-10" aria-hidden="true" />
    </div>
  );
}

export function MediaLibrary() {
  const { items, loading, error, upload, update, remove } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choisis un fichier.");
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      await upload(file, altText, category);
      setAltText("");
      setCategory("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload impossible.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (media: Media) => {
    try {
      await navigator.clipboard.writeText(media.url);
      setCopiedId(media.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard indisponible */
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-loden-ink">Téléverser un média</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Fichier (image ou PDF, max 8 Mo)</span>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="field-input" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Texte alternatif (SEO)</span>
            <input className="field-input" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Description de l’image" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-loden-muted">Catégorie</span>
            <input className="field-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex : formations" />
          </label>
        </div>
        <button
          type="button"
          onClick={onUpload}
          disabled={busy}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <UploadCloud className="h-4 w-4" aria-hidden="true" /> {busy ? "Téléversement…" : "Téléverser"}
        </button>
        {uploadError ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{uploadError}</p> : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-loden-ink">Médiathèque ({items.length})</h2>
        {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((media) => (
            <div key={media.id} className="rounded-2xl border border-slate-100 bg-loden-pearl/40 p-3">
              <MediaThumb media={media} />
              <p className="mt-2 truncate text-sm font-semibold text-loden-ink" title={media.originalName}>{media.originalName}</p>
              <p className="text-xs text-loden-muted">{formatBytes(media.sizeBytes)}{media.category ? ` · ${media.category}` : ""}</p>
              <input
                className="field-input mt-2 text-xs"
                defaultValue={media.altText}
                placeholder="Texte alternatif"
                onBlur={(e) => {
                  if (e.target.value !== media.altText) void update(media.id, { altText: e.target.value });
                }}
                aria-label="Texte alternatif"
              />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" onClick={() => copy(media)} className="focus-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-loden-700 hover:bg-loden-50">
                  {copiedId === media.id ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copiedId === media.id ? "Copié" : "Copier l’URL"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Supprimer « ${media.originalName} » ?`)) void remove(media.id);
                  }}
                  aria-label="Supprimer"
                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!loading && items.length === 0 ? <p className="mt-4 text-sm text-loden-muted">Aucun média pour le moment. Téléverse une première image ci-dessus.</p> : null}
      </div>
    </div>
  );
}
