import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Car,
  CarTaxiFront,
  Clock3,
  Construction,
  Forklift,
  Gauge,
  HardHat,
  MonitorPlay,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon
} from "lucide-react";
import { productLineLabels, type Formation } from "@/data/site";
import { formationImage } from "@/lib/formation-image";
import { formatCurrency } from "@/lib/utils";

type Visual = { icon: LucideIcon; gradient: string };

// Identité visuelle dédiée par formation (couleur + icône) — reconnaissable au premier regard,
// tout en restant cohérent avec la charte LODENE (turquoise dominant + accents maîtrisés).
const BY_SLUG: Record<string, Visual> = {
  "permis-b-manuel": { icon: Car, gradient: "linear-gradient(135deg,#0e7490,#08AEB8 55%,#22d3ee)" },
  "permis-b-automatique": { icon: Gauge, gradient: "linear-gradient(135deg,#0891a0,#22d3ee 55%,#38bdf8)" },
  "conduite-accompagnee": { icon: ShieldCheck, gradient: "linear-gradient(135deg,#0f766e,#10b981 55%,#34d399)" },
  "permis-accelere": { icon: Zap, gradient: "linear-gradient(135deg,#b45309,#f59e0b 55%,#fbbf24)" },
  "code-en-ligne": { icon: MonitorPlay, gradient: "linear-gradient(135deg,#3730a3,#4f46e5 55%,#6366f1)" },
  "stage-code": { icon: BookOpenCheck, gradient: "linear-gradient(135deg,#6d28d9,#8b5cf6 55%,#a78bfa)" },
  "annulation-permis": { icon: RotateCcw, gradient: "linear-gradient(135deg,#9f1239,#e11d48 55%,#fb7185)" },
  perfectionnement: { icon: TrendingUp, gradient: "linear-gradient(135deg,#155e75,#0e7490 55%,#14b8a6)" },
  // Pôle VTC (indigo) & CACES (ambre/BTP) — visuellement distincts du permis.
  "formation-vtc": { icon: CarTaxiFront, gradient: "linear-gradient(135deg,#3730a3,#4f46e5 55%,#818cf8)" },
  "vtc-formation-continue": { icon: Car, gradient: "linear-gradient(135deg,#1e3a8a,#2563eb 55%,#60a5fa)" },
  "caces-r489-chariots": { icon: Forklift, gradient: "linear-gradient(135deg,#b45309,#f59e0b 55%,#fbbf24)" },
  "caces-r486-nacelles": { icon: Construction, gradient: "linear-gradient(135deg,#92400e,#d97706 55%,#fbbf24)" },
  "caces-r482-engins-chantier": { icon: HardHat, gradient: "linear-gradient(135deg,#78350f,#b45309 55%,#f59e0b)" }
};

const BY_MODE: Record<Formation["mode"], Visual> = {
  Manuel: BY_SLUG["permis-b-manuel"],
  Automatique: BY_SLUG["permis-b-automatique"],
  Mixte: { icon: Sparkles, gradient: "linear-gradient(135deg,#155e75,#0e7490 55%,#14b8a6)" },
  Code: BY_SLUG["code-en-ligne"]
};

export function FormationCard({ formation }: { formation: Formation }) {
  const visual = BY_SLUG[formation.slug] ?? BY_MODE[formation.mode];
  const Icon = visual.icon;
  const headerImage = formationImage(formation.slug, formation.productLine);
  // Badge = pôle métier pour VTC/CACES, sinon le mode (Manuel/Auto/…).
  const badgeLabel =
    formation.productLine && formation.productLine !== "AUTO_ECOLE"
      ? productLineLabels[formation.productLine]
      : formation.mode;

  return (
    <Link
      href={`/formations/${formation.slug}`}
      aria-label={`Voir la formation ${formation.title}`}
      className="focus-ring group block h-full rounded-[1.75rem]"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft transition duration-300 group-hover:-translate-y-1.5 group-hover:border-loden-200 group-hover:shadow-premium">
        {/* En-tête illustré (SVG on-brand par formation) */}
        <div className="relative h-40 overflow-hidden" style={{ backgroundImage: visual.gradient }}>
          <Image
            src={headerImage}
            alt=""
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {/* Voile sombre en haut pour la lisibilité des badges */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/40 backdrop-blur">
              {badgeLabel}
            </span>
            {formation.cpf ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-loden-700 shadow-soft">CPF</span>
            ) : null}
          </div>
          <span className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-loden-700 shadow-soft">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>

        {/* Corps */}
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-semibold leading-tight text-loden-ink">{formation.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-6 text-loden-muted">{formation.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {formation.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-loden-fog px-3 py-1 text-xs font-medium text-loden-muted">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-5">
            <div className="text-sm">
              <span className="flex items-center gap-2 font-semibold text-loden-ink">
                <Clock3 className="h-4 w-4 text-loden-500" aria-hidden="true" />
                {formation.duration}
              </span>
              <span className="mt-1.5 flex items-center gap-2 text-loden-muted">
                <BadgeCheck className="h-4 w-4 text-loden-500" aria-hidden="true" />
                {formation.price > 0 ? `Dès ${formatCurrency(formation.price)}` : "Sur devis"}
              </span>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-loden-700 text-white shadow-soft transition group-hover:translate-x-0.5 group-hover:bg-loden-800">
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
