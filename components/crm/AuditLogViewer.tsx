"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { Badge, Card, EmptyState, Pagination, SectionHeader, Skeleton, type BadgeVariant } from "@/components/crm/ui";

const PAGE_SIZE = 20;

type AuditLog = {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
};

// Couleur d'après le verbe d'action (create/update/delete/login…).
function actionVariant(action: string): BadgeVariant {
  const a = action.toLowerCase();
  if (a.includes("create") || a.includes("add")) return "success";
  if (a.includes("delete") || a.includes("remove") || a.includes("reject")) return "danger";
  if (a.includes("update") || a.includes("status") || a.includes("edit")) return "warning";
  if (a.includes("login") || a.includes("auth")) return "info";
  return "neutral";
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      `${log.action} ${log.entityType} ${log.entityId ?? ""} ${log.userId ?? ""}`.toLowerCase().includes(q)
    );
  }, [logs, query]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    fetch("/api/audit-logs?limit=200")
      .then((r) => r.json())
      .then((p) => {
        if (Array.isArray(p?.data)) setLogs(p.data as AuditLog[]);
        else setError(p?.error?.message ?? "Chargement des journaux impossible.");
      })
      .catch(() => setError("Chargement des journaux impossible."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="p-5">
      <SectionHeader
        title="Journaux d'activité"
        subtitle={loading ? undefined : `${filtered.length} entrée(s) · 200 plus récentes`}
        icon={ScrollText}
        action={
          !loading && logs.length > 0 ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer (action, entité…)"
                aria-label="Filtrer les journaux"
                className="focus-ring w-48 rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-loden-200 focus:bg-white"
              />
            </div>
          ) : undefined
        }
      />
      {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={logs.length === 0 ? "Aucune entrée" : "Aucun résultat"}
            description={
              logs.length === 0
                ? "Les actions sensibles (créations, changements de statut, modération…) seront tracées ici."
                : "Aucune entrée ne correspond au filtre."
            }
            compact
          />
        ) : (
          <>
          <div className="grid gap-3 md:hidden">
            {paged.map((log) => (
              <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                    <p className="mt-2 truncate text-sm font-semibold text-loden-ink">{log.entityType}</p>
                  </div>
                  <time className="shrink-0 text-right text-xs font-medium text-loden-muted">
                    {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </time>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-loden-muted">
                  <p className="break-all"><span className="font-semibold text-loden-ink">Référence : </span>{log.entityId ?? "—"}</p>
                  <p className="break-all"><span className="font-semibold text-loden-ink">Auteur : </span>{log.userId ?? "système"}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-loden-muted">
                <tr className="border-b border-slate-200">
                  <th className="py-2.5 pr-4 font-semibold">Action</th>
                  <th className="py-2.5 pr-4 font-semibold">Entité</th>
                  <th className="py-2.5 pr-4 font-semibold">Référence</th>
                  <th className="py-2.5 pr-4 font-semibold">Auteur</th>
                  <th className="py-2.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4"><Badge variant={actionVariant(log.action)}>{log.action}</Badge></td>
                    <td className="py-2.5 pr-4 text-loden-ink">{log.entityType}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-loden-muted">{log.entityId ?? "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-loden-muted">{log.userId ?? "système"}</td>
                    <td className="py-2.5 text-loden-muted">
                      {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
          </>
        )}
      </div>
    </Card>
  );
}
