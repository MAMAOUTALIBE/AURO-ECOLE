"use client";

import { useCallback, useEffect, useState } from "react";

export type Media = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  category?: string | null;
  createdAt: string;
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Hook CRM : liste/upload/màj/suppression de médias via le proxy Next (auth relayée).
export function useMedia() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/media")
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload?.data)) setItems(payload.data as Media[]);
        else setError(payload?.error?.message ?? "Chargement de la médiathèque impossible.");
      })
      .catch(() => setError("Le service LODENE est momentanément indisponible."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const upload = useCallback(async (file: File, altText: string, category: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (altText) formData.append("altText", altText);
    if (category) formData.append("category", category);
    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message ?? "Upload impossible.");
    const created = payload.data as Media;
    setItems((current) => [created, ...current]);
    return created;
  }, []);

  const update = useCallback(async (id: string, body: { altText?: string; category?: string | null }) => {
    const response = await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message ?? "Mise à jour impossible.");
    const updated = payload.data as Media;
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) throw new Error("Suppression impossible.");
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return { items, loading, error, load, upload, update, remove };
}
