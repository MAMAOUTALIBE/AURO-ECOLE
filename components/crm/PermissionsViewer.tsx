"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Card, EmptyState, SectionHeader, Skeleton } from "@/components/crm/ui";

type Matrix = {
  permissions: string[];
  roles: { role: string; permissions: string[] }[];
};

const ROLE_SHORT: Record<string, string> = {
  SUPER_ADMIN: "S.Admin",
  DIRECTEUR: "Dir.",
  RESPONSABLE_AGENCE: "R.Agence",
  RESPONSABLE_PEDAGOGIQUE: "R.Péda",
  ADMIN: "Admin",
  SECRETAIRE: "Secrét.",
  COMPTABLE: "Compta",
  MONITEUR: "Monit.",
  ELEVE: "Élève",
  VISITEUR: "Visit."
};

export function PermissionsViewer() {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((p) => {
        if (p?.data?.permissions) setMatrix(p.data as Matrix);
        else setError(p?.error?.message ?? "Chargement de la matrice impossible.");
      })
      .catch(() => setError("Chargement de la matrice impossible."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="p-5">
      <SectionHeader
        title="Matrice des permissions"
        subtitle="Référentiel RBAC (lecture seule) — défini dans le code et appliqué côté API."
        icon={ShieldCheck}
      />
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : !matrix ? (
          <EmptyState icon={ShieldCheck} title="Matrice indisponible" compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-loden-muted">
                  <th className="sticky left-0 z-10 bg-white py-2 pr-4 font-semibold">Permission</th>
                  {matrix.roles.map((r) => (
                    <th key={r.role} className="px-2 py-2 text-center font-semibold" title={r.role}>
                      {ROLE_SHORT[r.role] ?? r.role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.permissions.map((permission) => (
                  <tr key={permission} className="border-b border-slate-100 last:border-0">
                    <td className="sticky left-0 z-10 bg-white py-2 pr-4 font-mono text-xs text-loden-ink">{permission}</td>
                    {matrix.roles.map((r) => {
                      const granted = r.permissions.includes(permission);
                      return (
                        <td key={r.role} className="px-2 py-2 text-center">
                          {granted ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Autorisé" />
                          ) : (
                            <span className="text-slate-300" aria-label="Refusé">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
