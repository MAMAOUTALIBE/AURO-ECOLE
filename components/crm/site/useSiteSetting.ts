"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook CRM pour charger/enregistrer une clé de réglage du site (SiteSetting).
 * Lecture via le proxy Next (cookie de session relayé), écriture protégée côté backend.
 */
export function useSiteSetting<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/site/${key}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        const loaded = payload?.data?.value;
        if (loaded != null) setValue(loaded as T);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key]);

  const save = useCallback(
    async (next: T) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/site/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next)
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message ?? "Enregistrement impossible.");
        setValue(next);
        setSavedAt(new Date().toLocaleTimeString("fr-FR"));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Enregistrement impossible.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [key]
  );

  const reset = useCallback(
    async (defaults: T) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/site/${key}`, { method: "DELETE" });
        if (!response.ok && response.status !== 204) throw new Error("Réinitialisation impossible.");
        setValue(defaults);
        setSavedAt(new Date().toLocaleTimeString("fr-FR"));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [key]
  );

  return { value, setValue, loading, saving, error, savedAt, save, reset };
}
