"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Check, Handshake, KeyRound, Mail, Phone, Plus, Search, ShieldCheck, UploadCloud, X } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";
import { Badge, Card, EmptyState, KpiCard, Pagination, Skeleton } from "@/components/crm/ui";
import {
  mapApiPartner,
  type ApiPartner,
  type CommissionType,
  type Partner
} from "@/lib/partner-mappers";
import { uploadAdminMedia } from "@/lib/media-upload";

const PAGE_SIZE = 12;

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  commissionType: "FLAT" as CommissionType,
  commissionValue: "",
  notes: "",
  logoUrl: "",
  websiteUrl: "",
  publicVisible: false,
  createAccount: true
};

function activeAgency(): string | null {
  const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
  return agency && agency !== "all" ? agency : null;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PartnersList() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<{ email: string; password: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter((partner) => {
      const haystack = `${partner.companyName} ${partner.contactName ?? ""} ${partner.email}`.toLowerCase();
      return (!q || haystack.includes(q)) && (statusFilter === "ALL" || partner.status === statusFilter);
    });
  }, [partners, query, statusFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = useMemo(() => {
    const actifs = partners.filter((p) => p.status === "ACTIF").length;
    const avecCompte = partners.filter((p) => p.hasAccount).length;
    return { total: partners.length, actifs, avecCompte };
  }, [partners]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  async function loadPartners() {
    setLoading(true);
    setError(null);
    try {
      const agency = activeAgency();
      const q = agency ? `?agencyId=${encodeURIComponent(agency)}` : "";
      const response = await fetch(`/api/partners${q}`);
      const payload = await response.json();
      if (Array.isArray(payload?.data)) setPartners((payload.data as ApiPartner[]).map(mapApiPartner));
      else setError(payload?.error?.message ?? "Impossible de charger les partenaires.");
    } catch {
      setError("Le service LODENE est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPartners();
  }, []);

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setCreatedPassword(null);
    try {
      const agency = activeAgency();
      // FLAT : euros saisis → cents (×100). PERCENT : pourcentage saisi → points de base (×100).
      const rawValue = Number(form.commissionValue.replace(",", "."));
      const commissionValue = Number.isFinite(rawValue) ? Math.round(rawValue * 100) : 0;
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          commissionType: form.commissionType,
          commissionValue,
          notes: form.notes.trim() || undefined,
          logoUrl: form.logoUrl.trim() || undefined,
          websiteUrl: form.websiteUrl.trim() || undefined,
          publicVisible: form.publicVisible,
          createAccount: form.createAccount,
          ...(agency ? { agencyId: agency } : {})
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setFormError(payload?.error?.message ?? "Création impossible.");
        return;
      }
      const data = payload?.data as (ApiPartner & { temporaryPassword?: string }) | undefined;
      if (data?.temporaryPassword) {
        setCreatedPassword({ email: data.email, password: data.temporaryPassword });
      }
      setForm(EMPTY_FORM);
      setLogoUploadError(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      setShowForm(false);
      await loadPartners();
    } catch {
      setFormError("Le service LODENE est momentanément indisponible.");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadPartnerLogo() {
    const file = logoInputRef.current?.files?.[0];
    if (!file) {
      setLogoUploadError("Choisis une image à téléverser.");
      return;
    }
    setLogoUploading(true);
    setLogoUploadError(null);
    try {
      const media = await uploadAdminMedia(file, {
        altText: form.companyName.trim() || file.name,
        category: "partners"
      });
      setForm((current) => ({ ...current, logoUrl: media.url }));
      if (logoInputRef.current) logoInputRef.current.value = "";
    } catch (error) {
      setLogoUploadError(error instanceof Error ? error.message : "Téléversement impossible.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function toggleStatus(partner: Partner) {
    setBusyId(partner.id);
    try {
      const next = partner.status === "ACTIF" ? "SUSPENDU" : "ACTIF";
      const response = await fetch(`/api/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (response.ok) await loadPartners();
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(partner: Partner) {
    setBusyId(partner.id);
    setCreatedPassword(null);
    try {
      const response = await fetch(`/api/partners/${partner.id}/reset-password`, { method: "POST" });
      const payload = await response.json();
      if (response.ok && payload?.data?.tempPassword) {
        setCreatedPassword({ email: payload.data.email, password: payload.data.tempPassword });
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard icon={Handshake} label="Partenaires" value={loading ? "—" : kpis.total} accent="brand" loading={loading} />
        <KpiCard icon={ShieldCheck} label="Actifs" value={loading ? "—" : kpis.actifs} accent="emerald" loading={loading} />
        <KpiCard icon={KeyRound} label="Avec compte" value={loading ? "—" : kpis.avecCompte} accent="indigo" loading={loading} />
      </div>

      {createdPassword ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-sm text-emerald-800">
            Mot de passe temporaire pour <span className="font-semibold">{createdPassword.email}</span> :{" "}
            <code className="rounded bg-white px-2 py-0.5 font-mono text-emerald-900">{createdPassword.password}</code>
            <span className="ml-2 text-emerald-700">— communiquez-le une seule fois, il ne sera plus affiché.</span>
          </p>
          <button
            type="button"
            onClick={() => setCreatedPassword(null)}
            className="focus-ring rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un partenaire…"
            className="focus-ring w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-loden-ink placeholder:text-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-loden-ink"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="SUSPENDU">Suspendus</option>
        </select>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-700"
        >
          <Plus className="h-4 w-4" /> Nouveau partenaire
        </button>
      </div>

      {showForm ? (
        <Card className="p-5">
          <form onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">Structure / raison sociale *</span>
              <input
                required
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">Contact référent</span>
              <input
                value={form.contactName}
                onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">Email *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">Téléphone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">Type de commission</span>
              <select
                value={form.commissionType}
                onChange={(event) => setForm({ ...form, commissionType: event.target.value as CommissionType })}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="FLAT">Montant fixe (€ / inscription)</option>
                <option value="PERCENT">Pourcentage (% du prix)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">
                {form.commissionType === "PERCENT" ? "Pourcentage (%)" : "Montant (€)"}
              </span>
              <input
                inputMode="decimal"
                value={form.commissionValue}
                onChange={(event) => setForm({ ...form, commissionValue: event.target.value })}
                placeholder={form.commissionType === "PERCENT" ? "10" : "50"}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-loden-ink">Notes internes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                rows={2}
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid gap-3 text-sm sm:col-span-2">
              <span className="font-medium text-loden-ink">Logo du partenaire</span>
              <div className="grid gap-3 rounded-xl bg-loden-pearl/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-loden-muted">Fichier image</span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={uploadPartnerLogo}
                  disabled={logoUploading}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-loden-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-700 disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" />
                  {logoUploading ? "Téléversement…" : "Téléverser"}
                </button>
              </div>
              {logoUploadError ? <p className="text-sm text-rose-600">{logoUploadError}</p> : null}
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-loden-muted">URL du logo</span>
                <input
                  value={form.logoUrl}
                  onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                  placeholder="Téléverse une image ou colle une URL"
                  className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              {form.logoUrl.trim() ? (
                <div className="flex flex-wrap items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'un logo arbitraire */}
                  <img
                    src={form.logoUrl}
                    alt="Aperçu du logo partenaire"
                    className="h-14 w-auto max-w-[180px] rounded border border-slate-200 bg-white object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logoUrl: "" })}
                    className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-loden-ink hover:bg-slate-50"
                  >
                    Retirer le logo
                  </button>
                </div>
              ) : null}
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-loden-ink">Site web</span>
              <input
                value={form.websiteUrl}
                onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })}
                placeholder="https://…"
                className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.publicVisible}
                onChange={(event) => setForm({ ...form, publicVisible: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-loden-600"
              />
              <span className="text-loden-muted">
                Afficher ce partenaire sur le site public (section « Ils nous font confiance »).
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.createAccount}
                onChange={(event) => setForm({ ...form, createAccount: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-loden-600"
              />
              <span className="text-loden-muted">
                Créer un compte de connexion (accès à l’espace partenaire) — un mot de passe temporaire sera généré.
              </span>
            </label>

            {formError ? <p className="text-sm text-rose-600 sm:col-span-2">{formError}</p> : null}

            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="focus-ring inline-flex items-center gap-2 rounded-lg bg-loden-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loden-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> {submitting ? "Création…" : "Créer le partenaire"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="focus-ring rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-loden-ink hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Handshake} title="Chargement impossible" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="Aucun partenaire"
            description="Créez un premier partenaire prescripteur pour suivre ses prospects et ses commissions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-loden-muted">
                  <th className="px-4 py-3 font-semibold">Partenaire</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Barème</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Depuis</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((partner) => (
                  <tr key={partner.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/partenaires/${partner.id}`}
                        className="focus-ring flex items-center gap-2 font-semibold text-loden-ink hover:text-loden-700"
                      >
                        <Building2 className="h-4 w-4 shrink-0 text-loden-500" />
                        <span className="truncate">{partner.companyName}</span>
                      </Link>
                      {partner.contactName ? (
                        <p className="mt-0.5 truncate text-xs text-loden-muted">{partner.contactName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${partner.email}`} className="flex items-center gap-1.5 text-loden-ink hover:text-loden-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="truncate">{partner.email}</span>
                      </a>
                      {partner.phone ? (
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-loden-muted">
                          <Phone className="h-3 w-3 text-slate-400" /> {partner.phone}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-loden-ink">{partner.commissionLabel}</td>
                    <td className="px-4 py-3">
                      <Badge variant={partner.status === "ACTIF" ? "success" : "warning"} dot>
                        {partner.statusLabel}
                      </Badge>
                      {partner.publicVisible ? (
                        <Badge variant="info" className="ml-1">
                          En ligne
                        </Badge>
                      ) : null}
                      {!partner.hasAccount ? (
                        <Badge variant="neutral" className="ml-1">
                          Sans compte
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-loden-muted">{fmtDate(partner.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === partner.id}
                          onClick={() => toggleStatus(partner)}
                          className="focus-ring rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-loden-ink transition hover:bg-slate-50 disabled:opacity-40"
                        >
                          {partner.status === "ACTIF" ? "Suspendre" : "Réactiver"}
                        </button>
                        {partner.hasAccount ? (
                          <button
                            type="button"
                            disabled={busyId === partner.id}
                            onClick={() => resetPassword(partner)}
                            className="focus-ring inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-loden-ink transition hover:bg-slate-50 disabled:opacity-40"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Mot de passe
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
    </div>
  );
}
