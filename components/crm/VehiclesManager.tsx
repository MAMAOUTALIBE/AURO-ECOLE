"use client";

import { useEffect, useState } from "react";
import { Car, Plus } from "lucide-react";
import { Badge, Card, EmptyState, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";

type Vehicle = {
  id: string;
  label: string;
  transmission: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  registration?: string | null;
  instructorId?: string | null;
  active: boolean;
};

const TRANSMISSIONS = [
  { key: "MANUEL", label: "Manuelle" },
  { key: "AUTOMATIQUE", label: "Automatique" },
  { key: "MIXTE", label: "Mixte" },
  { key: "CODE", label: "Code" }
];
const TRANS_VARIANT: Record<string, BadgeVariant> = {
  MANUEL: "brand",
  AUTOMATIQUE: "info",
  MIXTE: "indigo",
  CODE: "warning"
};

const EMPTY = { label: "", transmission: "MANUEL", registration: "", instructorId: "" };

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()).catch(() => null),
      fetch("/api/instructors").then((r) => r.json()).catch(() => null)
    ])
      .then(([vehiclePayload, instructorPayload]) => {
        if (Array.isArray(vehiclePayload?.data)) setVehicles(vehiclePayload.data as Vehicle[]);
        else setError(vehiclePayload?.error?.message ?? "Chargement du parc impossible.");
        if (Array.isArray(instructorPayload?.data)) {
          setInstructors(Object.fromEntries(instructorPayload.data.map((i: { id: string; name: string }) => [i.id, i.name])));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!form.label.trim()) {
      setError("Le libellé du véhicule est requis.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim(),
          transmission: form.transmission,
          ...(form.registration.trim() ? { registration: form.registration.trim() } : {}),
          ...(form.instructorId ? { instructorId: form.instructorId } : {})
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Création impossible.");
      setForm(EMPTY);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (vehicle: Vehicle) => {
    setVehicles((cur) => cur.map((v) => (v.id === vehicle.id ? { ...v, active: !v.active } : v)));
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !vehicle.active })
      });
      if (!response.ok) throw new Error();
    } catch {
      setVehicles((cur) => cur.map((v) => (v.id === vehicle.id ? { ...v, active: vehicle.active } : v)));
      setError("Mise à jour du véhicule impossible.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <SectionHeader title="Ajouter un véhicule" subtitle="Parc automobile de l'auto-école." icon={Plus} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="field-input" placeholder="Libellé * (ex. Clio 1)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} aria-label="Libellé" />
          <select className="field-input" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} aria-label="Transmission">
            {TRANSMISSIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input className="field-input" placeholder="Immatriculation" value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} aria-label="Immatriculation" />
          <select className="field-input" value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })} aria-label="Moniteur affecté">
            <option value="">— Moniteur affecté —</option>
            {Object.entries(instructors).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-loden-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:opacity-70"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {creating ? "Ajout…" : "Ajouter le véhicule"}
        </button>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>

      <div>
        <SectionHeader title="Parc automobile" subtitle={loading ? undefined : `${vehicles.length} véhicule(s)`} icon={Car} />
        <div className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
          ) : vehicles.length === 0 ? (
            <Card className="p-6"><EmptyState icon={Car} title="Aucun véhicule" description="Ajoute ton premier véhicule au parc ci-dessus." /></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <Card key={v.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
                        <Car className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-semibold text-loden-ink">{v.label}</p>
                        <p className="text-xs text-loden-muted">{v.registration || "Sans immatriculation"}</p>
                      </div>
                    </div>
                    <Badge variant={v.active ? "success" : "neutral"} dot>{v.active ? "Actif" : "Hors service"}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-loden-muted">
                    <Badge variant={TRANS_VARIANT[v.transmission] ?? "neutral"}>
                      {TRANSMISSIONS.find((t) => t.key === v.transmission)?.label ?? v.transmission}
                    </Badge>
                    {v.instructorId && instructors[v.instructorId] ? <span>· {instructors[v.instructorId]}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(v)}
                    className="focus-ring mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-loden-ink transition hover:bg-loden-50"
                  >
                    {v.active ? "Mettre hors service" : "Remettre en service"}
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
