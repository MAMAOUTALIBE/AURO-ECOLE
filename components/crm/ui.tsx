import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Primitives UI partagées du CRM LODENE.
 * Présentationnelles (aucun hook) → utilisables côté serveur comme client.
 * Charte : surfaces blanches, bordures slate fines, radius doux, ombre LODENE.
 * ------------------------------------------------------------------ */

/** Surface / panneau de base. */
export function Card({
  className,
  children,
  as: Tag = "div"
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-soft", className)}>{children}</Tag>
  );
}

/** En-tête de section : titre + sous-titre + action à droite. */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-loden-50 text-loden-700">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-loden-ink">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-loden-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const BADGE_VARIANTS = {
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-loden-50 text-loden-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
  indigo: "bg-indigo-50 text-indigo-700"
} as const;

export type BadgeVariant = keyof typeof BADGE_VARIANTS;

export function Badge({
  children,
  variant = "neutral",
  className,
  dot = false
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        BADGE_VARIANTS[variant],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** Bloc squelette (chargement). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} aria-hidden="true" />;
}

/** État vide élégant — guide l'action, jamais de fausse donnée. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-6" : "gap-3 py-10",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-loden-50 text-loden-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-loden-ink">{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 text-loden-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

const TREND_TONE = {
  up: "text-emerald-600",
  down: "text-rose-600",
  flat: "text-slate-400"
} as const;

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;

const KPI_ACCENT: Record<string, string> = {
  brand: "bg-loden-50 text-loden-700",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600"
};

/**
 * Carte KPI compacte (une seule ligne) :
 *   [icône]  valeur libellé · subLabel        [tendance]
 * Tout tient sur une ligne (nowrap + ellipsis) pour un dashboard dense et lisible.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  subLabel,
  trend,
  accent = "brand",
  loading = false,
  href
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  subLabel?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  accent?: "brand" | "indigo" | "amber" | "emerald" | "rose" | "sky";
  loading?: boolean;
  href?: string;
}) {
  const showTrend = !loading && trend && trend.value && trend.value !== "—";
  const TrendIcon = trend ? TREND_ICON[trend.direction] : Minus;

  const inner = (
    <div className="flex items-center gap-3">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", KPI_ACCENT[accent])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <p className="truncate text-sm leading-tight text-loden-muted">
            <span className="text-[15px] font-bold tracking-tight text-loden-ink">{value}</span>{" "}
            <span className="font-medium text-loden-ink">{label}</span>
            {subLabel ? <span className="text-loden-muted"> · {subLabel}</span> : null}
          </p>
        )}
      </div>
      {showTrend ? (
        <span className={cn("inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold", TREND_TONE[trend!.direction])}>
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {trend!.value}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Card className="p-0 transition duration-300 hover:-translate-y-0.5 hover:shadow-premium">
        <Link href={href} className="focus-ring block rounded-2xl px-4 py-3.5">
          {inner}
        </Link>
      </Card>
    );
  }
  return <Card className="px-4 py-3.5">{inner}</Card>;
}

/** Pagination simple (côté client) : « X–Y sur N » + Précédent/Suivant. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-loden-muted">
        {from}–{to} sur {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-loden-ink transition hover:bg-loden-50 disabled:opacity-40"
        >
          Précédent
        </button>
        <span className="text-loden-muted">
          Page {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="focus-ring rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-loden-ink transition hover:bg-loden-50 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

/** En-tête de page CRM compact (remplace le hero marketing dans le shell). */
export function CrmPageHeader({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-loden-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-loden-ink">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-loden-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Conteneur de graphique : header + corps à hauteur fixe, gère loading/empty. */
export function ChartCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  bodyClassName
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} action={action} />
      <div className={cn("mt-4 flex-1", bodyClassName)}>{children}</div>
    </Card>
  );
}
