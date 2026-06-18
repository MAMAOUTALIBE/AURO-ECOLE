"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, FileCheck2, Printer, Trash2 } from "lucide-react";
import { Badge, Skeleton, type BadgeVariant } from "@/components/crm/ui";
import { euros, contractDate, CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/contract-mappers";

type Snapshot = Record<string, string>;
type Contract = {
  id: string;
  number: string | null;
  status: ContractStatus;
  clientUserId: string;
  title: string;
  body: string;
  totalCents: number;
  issuerSnapshot?: Snapshot | null;
  clientSnapshot?: { name: string; email: string; address: string } | null;
  signedAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  notes?: string | null;
};
type Company = Record<string, string>;

const STATUS_VARIANT: Record<ContractStatus, BadgeVariant> = {
  BROUILLON: "neutral",
  ACTIF: "success",
  RESILIE: "danger",
  TERMINE: "info"
};

export function ContractDetail({ id }: { id: string }) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    Promise.all([
      fetch(`/api/contracts/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/content/company").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/students").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ])
      .then(([contractPayload, companyPayload, studentPayload]) => {
        if (contractPayload?.data) setContract(contractPayload.data as Contract);
        else setError(contractPayload?.error?.message ?? "Contrat introuvable.");
        if (companyPayload?.data) setCompany(companyPayload.data as Company);
        const c = contractPayload?.data as Contract | undefined;
        if (c && !c.clientSnapshot && Array.isArray(studentPayload?.data)) {
          const s = studentPayload.data.find((x: { userId: string }) => x.userId === c.clientUserId);
          if (s?.user) setClientName(`${s.user.firstName} ${s.user.lastName}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const act = async (run: () => Promise<Response>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return false;
    setBusy(true);
    setError(null);
    try {
      const response = await run();
      if (!response.ok && response.status !== 204) {
        const p = await response.json().catch(() => null);
        throw new Error(p?.error?.message ?? "Action impossible.");
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    if (await act(() => fetch(`/api/contracts/${id}/activate`, { method: "POST" }), "Activer le contrat ? Cela attribue un numéro définitif et fige le document (signature).")) load();
  };
  const setStatus = async (status: "RESILIE" | "TERMINE", confirmMsg?: string) => {
    if (await act(() => fetch(`/api/contracts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }), confirmMsg)) load();
  };
  const remove = async () => {
    if (await act(() => fetch(`/api/contracts/${id}`, { method: "DELETE" }), "Supprimer ce brouillon ?")) router.push("/admin/contrats");
  };

  if (loading) return <Skeleton className="h-[60vh] w-full rounded-2xl" />;
  if (!contract) return <p className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error ?? "Contrat introuvable."}</p>;

  const issuer = contract.issuerSnapshot ?? company ?? {};
  const client = contract.clientSnapshot ?? { name: clientName || "Client", email: "", address: "" };
  const isDraft = contract.status === "BROUILLON";
  const line = (v?: string) => (v && v.trim() ? v : null);
  const watermark = isDraft ? "BROUILLON" : contract.status === "RESILIE" ? "RÉSILIÉ" : null;

  return (
    <div>
      <div className="print-hidden mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/contrats" className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-loden-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Contrats
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[contract.status]}>{CONTRACT_STATUS_LABELS[contract.status]}</Badge>
          {isDraft ? (
            <>
              <button type="button" disabled={busy} onClick={activate} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-loden-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-loden-800 disabled:opacity-60">
                <FileCheck2 className="h-4 w-4" aria-hidden="true" /> Activer / signer
              </button>
              <button type="button" disabled={busy} onClick={remove} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
              </button>
            </>
          ) : null}
          {contract.status === "ACTIF" ? (
            <>
              <button type="button" disabled={busy} onClick={() => setStatus("TERMINE")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                <Check className="h-4 w-4" aria-hidden="true" /> Terminer
              </button>
              <button type="button" disabled={busy} onClick={() => setStatus("RESILIE", "Résilier ce contrat ? Le numéro est conservé.")} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60">
                <Ban className="h-4 w-4" aria-hidden="true" /> Résilier
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => window.print()} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-loden-ink transition hover:bg-loden-50">
            <Printer className="h-4 w-4" aria-hidden="true" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {error ? <p className="print-hidden mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="invoice-print relative mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        {watermark ? (
          <span className={`pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black opacity-[0.07] ${contract.status === "RESILIE" ? "text-rose-600" : "text-slate-500"}`} aria-hidden="true">
            {watermark}
          </span>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-black tracking-tight text-loden-700">LODENE</p>
            <div className="mt-2 text-xs leading-5 text-loden-muted">
              {line(issuer.legalName) ? <p className="font-semibold text-loden-ink">{issuer.legalName}</p> : null}
              {line(issuer.address) ? <p>{issuer.address}</p> : null}
              {line(issuer.postalCode) || line(issuer.city) ? <p>{[issuer.postalCode, issuer.city].filter(Boolean).join(" ")}</p> : null}
              {line(issuer.siret) ? <p>SIRET : {issuer.siret}</p> : null}
              {line(issuer.approvalNumber) ? <p>Agrément : {issuer.approvalNumber}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-loden-ink">{contract.number ? `Contrat N° ${contract.number}` : "BROUILLON — non numéroté"}</p>
            <p className="mt-1 text-xs text-loden-muted">Signé le : {contractDate(contract.signedAt)}</p>
            {contract.startsAt ? <p className="text-xs text-loden-muted">Début : {contractDate(contract.startsAt)}</p> : null}
          </div>
        </div>

        <h1 className="mt-8 text-center text-xl font-bold text-loden-ink">{contract.title}</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">L&apos;auto-école</p>
            <p className="mt-1 font-semibold text-loden-ink">{line(issuer.legalName) ?? "LODENE"}</p>
            {line(issuer.address) ? <p className="text-xs text-loden-muted">{issuer.address}</p> : null}
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-loden-muted">L&apos;élève</p>
            <p className="mt-1 font-semibold text-loden-ink">{client.name || "—"}</p>
            {client.email ? <p className="text-xs text-loden-muted">{client.email}</p> : null}
            {client.address ? <p className="text-xs text-loden-muted">{client.address}</p> : null}
          </div>
        </div>

        <div className="mt-6 whitespace-pre-line text-sm leading-7 text-loden-ink">{contract.body}</div>

        {contract.totalCents > 0 ? (
          <p className="mt-6 text-sm font-semibold text-loden-ink">Montant du contrat : {euros(contract.totalCents)} TTC</p>
        ) : null}
        {contract.notes ? <p className="mt-4 whitespace-pre-line text-xs text-loden-muted">{contract.notes}</p> : null}

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div className="border-t border-slate-300 pt-2 text-xs text-loden-muted">Signature de l&apos;auto-école</div>
          <div className="border-t border-slate-300 pt-2 text-xs text-loden-muted">Signature de l&apos;élève {contract.signedAt ? `(le ${contractDate(contract.signedAt)})` : ""}</div>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-4 text-[10px] leading-4 text-loden-muted">
          Document généré par un outil de gestion (non certifié). La signature électronique qualifiée n&apos;est pas gérée :
          la signature manuscrite ou un dispositif tiers fait foi.
        </p>
      </div>
    </div>
  );
}
