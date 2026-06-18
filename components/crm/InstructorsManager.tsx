"use client";

import { useEffect, useState } from "react";
import { Plus, Star, UserCog } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton } from "@/components/crm/ui";

type Instructor = {
  id: string;
  name: string;
  specialties: string[];
  interventionZones: string[];
  ratingAverage: number;
  ratingCount: number;
  active: boolean;
};

const EMPTY_FORM = { firstName: "", lastName: "", email: "", phone: "", specialties: "", interventionZones: "" };

export function InstructorsManager() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    fetch("/api/instructors")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setInstructors(p.data as Instructor[]);
      })
      .catch(() => setError("Chargement des moniteurs impossible."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toList = (value: string) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const create = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Prénom, nom et email sont requis.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          specialties: toList(form.specialties),
          interventionZones: toList(form.interventionZones)
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (instructor: Instructor) => {
    // Optimiste, avec rollback en cas d'échec.
    const next = !instructor.active;
    setInstructors((cur) => cur.map((i) => (i.id === instructor.id ? { ...i, active: next } : i)));
    try {
      const response = await fetch(`/api/instructors/${instructor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next })
      });
      if (!response.ok) throw new Error();
    } catch {
      setInstructors((cur) => cur.map((i) => (i.id === instructor.id ? { ...i, active: instructor.active } : i)));
      setError("Mise à jour du moniteur impossible.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Création */}
      <Card className="p-5">
        <SectionHeader title="Ajouter un moniteur" subtitle="Crée un compte MONITEUR + son profil." icon={Plus} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className="field-input" placeholder="Prénom *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} aria-label="Prénom" />
          <input className="field-input" placeholder="Nom *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} aria-label="Nom" />
          <input className="field-input" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
          <input className="field-input" placeholder="Téléphone (optionnel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Téléphone" />
          <input className="field-input" placeholder="Spécialités (séparées par ,)" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} aria-label="Spécialités" />
          <input className="field-input" placeholder="Zones d'intervention (,)" value={form.interventionZones} onChange={(e) => setForm({ ...form, interventionZones: e.target.value })} aria-label="Zones d'intervention" />
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {creating ? "Ajout…" : "Ajouter le moniteur"}
        </button>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>

      {/* Liste */}
      <div>
        <SectionHeader title="Moniteurs" subtitle={loading ? undefined : `${instructors.length} profil(s)`} icon={UserCog} />
        <div className="mt-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={UserCog} title="Aucun moniteur" description="Ajoute un premier moniteur via le formulaire ci-dessus." />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {instructors.map((instructor) => (
                <Card key={instructor.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-loden-700 text-sm font-bold text-white">
                        {instructor.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?"}
                      </span>
                      <div>
                        <p className="font-semibold text-loden-ink">{instructor.name || "Moniteur"}</p>
                        <p className="flex items-center gap-1 text-xs text-loden-muted">
                          <Star className="h-3 w-3 text-amber-500" aria-hidden="true" />
                          {instructor.ratingCount > 0 ? `${instructor.ratingAverage.toFixed(1)} (${instructor.ratingCount})` : "Pas d'avis"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={instructor.active ? "success" : "neutral"} dot>
                      {instructor.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-1 flex-wrap gap-1.5">
                    {instructor.specialties.length === 0 && instructor.interventionZones.length === 0 ? (
                      <span className="text-xs text-loden-muted">Aucune spécialité renseignée</span>
                    ) : (
                      [...instructor.specialties, ...instructor.interventionZones].slice(0, 6).map((tag, i) => (
                        <span key={`${tag}-${i}`} className="rounded-full bg-loden-fog px-2.5 py-0.5 text-xs font-medium text-loden-muted">
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(instructor)}
                    className="focus-ring mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-loden-ink transition hover:bg-loden-50"
                  >
                    {instructor.active ? "Désactiver" : "Réactiver"}
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
