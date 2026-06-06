import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3 } from "lucide-react";
import type { Formation } from "@/data/site";
import { formatCurrency } from "@/lib/utils";

export function FormationCard({ formation }: { formation: Formation }) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-loden-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-loden-700">{formation.mode}</p>
          <h3 className="mt-2 text-xl font-semibold text-loden-ink">{formation.title}</h3>
        </div>
        {formation.cpf ? (
          <span className="rounded-full bg-loden-50 px-3 py-1 text-xs font-semibold text-loden-700">
            CPF
          </span>
        ) : null}
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 text-loden-muted">{formation.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {formation.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-loden-fog px-3 py-1 text-xs font-medium text-loden-muted">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
        <div className="text-sm text-loden-muted">
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-loden-500" />
            {formation.duration}
          </span>
          <span className="mt-2 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-loden-500" />
            Dès {formatCurrency(formation.price)}
          </span>
        </div>
        <Link
          href="/inscription"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-loden-700 text-white transition group-hover:bg-loden-800"
          aria-label={`S'inscrire à ${formation.title}`}
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </article>
  );
}
