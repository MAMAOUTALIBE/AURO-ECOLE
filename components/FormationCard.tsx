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
import { formationImageMeta } from "@/lib/formation-image";
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
  Manuel: { icon: Car, gradient: "linear-gradient(135deg,#0e7490,#08AEB8 55%,#22d3ee)" },
  Automatique: { icon: Gauge, gradient: "linear-gradient(135deg,#0891a0,#22d3ee 55%,#38bdf8)" },
  Mixte: { icon: Sparkles, gradient: "linear-gradient(135deg,#155e75,#0e7490 55%,#14b8a6)" },
  Code: { icon: MonitorPlay, gradient: "linear-gradient(135deg,#3730a3,#4f46e5 55%,#6366f1)" }
};

// Repli visuel par pôle métier (avant le repli par mode) — distingue VTC / SST / logistique.
const BY_PRODUCT_LINE: Partial<Record<NonNullable<Formation["productLine"]>, Visual>> = {
  VTC: { icon: CarTaxiFront, gradient: "linear-gradient(135deg,#3730a3,#4f46e5 55%,#818cf8)" },
  SST: { icon: ShieldCheck, gradient: "linear-gradient(135deg,#0f766e,#10b981 55%,#34d399)" },
  LOGISTIQUE_SECURITE: { icon: Forklift, gradient: "linear-gradient(135deg,#b45309,#f59e0b 55%,#fbbf24)" }
};

export function FormationCard({ formation }: { formation: Formation }) {
  const visual =
    BY_SLUG[formation.slug] ??
    (formation.productLine ? BY_PRODUCT_LINE[formation.productLine] : undefined) ??
    BY_MODE[formation.mode] ??
    BY_MODE.Manuel; // repli terminal : un mode DB inconnu ne doit jamais casser la carte (visual.icon)
  const Icon = visual.icon;
  // Image choisie au CMS (médiathèque) si définie, sinon photo réaliste par slug/pôle.
  const headerImage = formation.imageUrl
    ? { src: formation.imageUrl, alt: formation.subtitle ?? formation.title, objectPosition: "50% 50%" }
    : formationImageMeta(formation.slug, formation.productLine);
  // Badge = pôle métier pour VTC/CACES, sinon le mode (Manuel/Auto/…).
  const badgeLabel =
    formation.productLine && formation.productLine !== "AUTO_ECOLE"
      ? productLineLabels[formation.productLine]
      : formation.mode;

  return (
    <Link
      href={`/formations/${formation.slug}`}
      aria-label={`Voir la formation ${formation.title}`}
      className="focus-ring group block h-full min-w-0 rounded-xl sm:rounded-2xl md:rounded-[1.75rem]"
    >
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition duration-300 group-hover:-translate-y-1.5 group-hover:border-loden-200 group-hover:shadow-premium sm:rounded-2xl md:rounded-[1.75rem]">
        {/* En-tête photo réaliste par formation */}
        <div className="relative h-32 overflow-hidden sm:h-36 md:h-40" style={{ backgroundImage: visual.gradient }}>
          <Image
            src={headerImage.src}
            alt={headerImage.alt}
            fill
            loading="lazy"
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
            style={{ objectPosition: headerImage.objectPosition ?? "50% 50%" }}
          />
          {/* Voile sombre en haut pour la lisibilité des badges */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />
          <div className="absolute left-3 right-3 top-3 flex min-w-0 flex-wrap gap-2 sm:left-4 sm:right-4 sm:top-4">
            <span className="max-w-full truncate rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/40 backdrop-blur">
              {badgeLabel}
            </span>
            {formation.cpf ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-loden-700 shadow-soft">CPF</span>
            ) : null}
          </div>
          <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-loden-700 shadow-soft sm:bottom-4 sm:left-4 md:h-12 md:w-12 md:rounded-2xl">
            <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </span>
        </div>

        {/* Corps */}
        <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
          <h3 className="break-words text-[1.08rem] font-semibold leading-tight text-loden-ink md:text-xl">{formation.title}</h3>
          {formation.subtitle ? (
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-loden-600">{formation.subtitle}</p>
          ) : null}
          <p className="mt-2 line-clamp-2 flex-1 text-[0.84rem] leading-5 text-loden-muted md:mt-3 md:line-clamp-none md:text-sm md:leading-6">{formation.description}</p>

          <div className="mt-5 hidden flex-wrap gap-2 md:flex">
            {formation.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-loden-fog px-3 py-1 text-xs font-medium text-loden-muted">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4 md:mt-6 md:pt-5">
            <div className="min-w-0 text-[0.83rem] md:text-sm">
              <span className="flex items-center gap-2 font-semibold text-loden-ink">
                <Clock3 className="h-4 w-4 text-loden-500" aria-hidden="true" />
                <span className="truncate">{formation.duration}</span>
              </span>
              <span className="mt-1.5 flex items-center gap-2 text-loden-muted">
                <BadgeCheck className="h-4 w-4 text-loden-500" aria-hidden="true" />
                <span className="truncate">{formation.price > 0 ? `Dès ${formatCurrency(formation.price)}` : "Sur devis"}</span>
              </span>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-loden-700 text-white shadow-soft transition group-hover:translate-x-0.5 group-hover:bg-loden-800 sm:h-11 sm:w-11">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
