"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { ACTIVE_AGENCY_KEY } from "@/components/AgencySwitcher";

type Student = {
  id: string;
  fileStatus: string;
  progressPercent: number;
  agencyId?: string | null;
  user: { firstName: string; lastName: string; email: string } | null;
};

export const FILE_STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  INCOMPLET: "Incomplet",
  EN_COURS: "En cours",
  PRET_EXAMEN: "Prêt examen",
  EXAMEN_PLANIFIE: "Examen planifié",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé"
};

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const agency = window.localStorage.getItem(ACTIVE_AGENCY_KEY);
    const query = agency && agency !== "all" ? `?agencyId=${encodeURIComponent(agency)}` : "";

    fetch(`/api/students${query}`)
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload?.data)) setStudents(payload.data as Student[]);
        else setError(payload?.error?.message ?? "Impossible de charger les élèves.");
      })
      .catch(() => setError("Le service LODEN est momentanément indisponible."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-loden-ink">Élèves</h2>
          <p className="text-sm text-loden-muted">{students.length} dossier(s)</p>
        </div>
      </div>

      {loading ? <p className="mt-6 text-sm text-loden-muted">Chargement…</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-loden-muted">
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 font-semibold">Élève</th>
                <th className="py-3 pr-4 font-semibold">Statut</th>
                <th className="py-3 pr-4 font-semibold">Progression</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-loden-ink">
                      {student.user ? `${student.user.firstName} ${student.user.lastName}` : "—"}
                    </p>
                    <p className="text-xs text-loden-muted">{student.user?.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">
                      {FILE_STATUS_LABELS[student.fileStatus] ?? student.fileStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-loden-500" style={{ width: `${student.progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-loden-muted">{student.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Link
                      href={`/admin/eleves/${student.id}`}
                      className="focus-ring inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-loden-ink hover:bg-loden-50"
                    >
                      Ouvrir
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-loden-muted">
                    Aucun élève pour cette sélection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
