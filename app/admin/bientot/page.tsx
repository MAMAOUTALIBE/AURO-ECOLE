import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hammer, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Module en préparation",
  robots: { index: false, follow: false }
};

export default async function ComingSoonPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const moduleName = m?.trim() || "Ce module";

  return (
    <div className="mx-auto max-w-2xl py-6">
      <Link href="/admin" className="focus-ring mb-6 inline-flex items-center gap-2 text-sm font-semibold text-loden-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au tableau de bord
      </Link>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-100 bg-loden-50/50 p-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-loden-700 shadow-soft">
            <Hammer className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <Badge variant="brand" dot>
              En préparation
            </Badge>
            <h1 className="mt-2 text-xl font-bold text-loden-ink">{moduleName}</h1>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-sm leading-7 text-loden-muted">
            Cet écran est cartographié dans la nouvelle architecture du CRM LODENE mais n&apos;est pas encore activé. Il sera
            branché sur l&apos;API et conçu avec le même soin que le tableau de bord — sans aucune donnée fictive d&apos;ici là.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-loden-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-loden-800"
            >
              Tableau de bord
            </Link>
            <Link
              href="/admin/assistant"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-loden-200 bg-loden-50 px-4 py-2.5 text-sm font-semibold text-loden-700 transition hover:bg-loden-100"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Assistant IA
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
