"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type FieldDef = { key: string; label: string; group: string; placeholder?: string };

// Champs administrables. Les champs non confirmés sont laissés vides : le site public
// masque automatiquement toute coordonnée vide (pas de donnée fictive affichée).
const FIELDS: FieldDef[] = [
  { key: "brandName", label: "Nom commercial", group: "Identité" },
  { key: "legalName", label: "Raison sociale", group: "Identité", placeholder: "À confirmer" },
  { key: "address", label: "Adresse", group: "Coordonnées" },
  { key: "postalCode", label: "Code postal", group: "Coordonnées" },
  { key: "city", label: "Ville", group: "Coordonnées" },
  { key: "country", label: "Pays", group: "Coordonnées" },
  { key: "phone", label: "Téléphone", group: "Coordonnées", placeholder: "Masqué tant que vide" },
  { key: "email", label: "Email", group: "Coordonnées", placeholder: "Masqué tant que vide" },
  { key: "hours", label: "Horaires", group: "Coordonnées", placeholder: "Masqués tant que vide" },
  { key: "siret", label: "SIRET", group: "Informations légales" },
  { key: "approvalNumber", label: "Numéro d'agrément préfectoral", group: "Informations légales" },
  { key: "legalForm", label: "Forme juridique", group: "Informations légales", placeholder: "À confirmer" },
  { key: "capital", label: "Capital social", group: "Informations légales", placeholder: "À confirmer" },
  { key: "publicationDirector", label: "Directeur de publication", group: "Informations légales", placeholder: "À confirmer" },
  { key: "hostingProvider", label: "Hébergeur", group: "Informations légales", placeholder: "À confirmer" },
  { key: "instagram", label: "Instagram (URL)", group: "Réseaux sociaux", placeholder: "Masqué tant que vide" },
  { key: "facebook", label: "Facebook (URL)", group: "Réseaux sociaux", placeholder: "Masqué tant que vide" },
  { key: "tiktok", label: "TikTok (URL)", group: "Réseaux sociaux", placeholder: "Masqué tant que vide" },
  { key: "youtube", label: "YouTube (URL)", group: "Réseaux sociaux", placeholder: "Masqué tant que vide" }
];

const GROUPS = ["Identité", "Coordonnées", "Informations légales", "Réseaux sociaux"];

export function CompanyInfoManager() {
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/content/company")
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.data) {
          setForm(Object.fromEntries(FIELDS.map((field) => [field.key, payload.data[field.key] ?? ""])));
        } else {
          setStatus({ tone: "error", text: "Impossible de charger les informations société." });
        }
      })
      .catch(() => setStatus({ tone: "error", text: "Le service LODENE est momentanément indisponible." }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/content/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message ?? "Échec de l'enregistrement.");
      setStatus({ tone: "success", text: "Informations société enregistrées." });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Échec de l'enregistrement." });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return <p className="text-sm text-loden-muted">{status?.text ?? "Chargement…"}</p>;
  }

  return (
    <form onSubmit={handleSave} className="grid gap-5" noValidate>
      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-loden-muted">
        Renseignez uniquement des informations <strong>vérifiées</strong>. Tout champ laissé vide est
        automatiquement masqué sur le site public (aucune donnée fictive n&apos;est affichée).
      </p>

      {GROUPS.map((group) => (
        <section key={group} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-loden-ink">{group}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.filter((field) => field.group === group).map((field) => (
              <label key={field.key} className="grid gap-2">
                <span className="text-sm font-semibold text-loden-ink">{field.label}</span>
                <input
                  value={form[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => setForm((current) => ({ ...(current ?? {}), [field.key]: event.target.value }))}
                  className="field-input"
                />
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {status ? (
          <p className={`text-sm font-medium ${status.tone === "success" ? "text-loden-700" : "text-red-700"}`}>{status.text}</p>
        ) : null}
      </div>
    </form>
  );
}
