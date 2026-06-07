import { ShieldCheck, Star } from "lucide-react";

// Palette cohérente LODENE — chaque moniteur garde une teinte stable (dérivée de ses initiales).
const PALETTE = [
  "linear-gradient(135deg,#0e7490,#08AEB8 55%,#22d3ee)",
  "linear-gradient(135deg,#b45309,#f59e0b 55%,#fbbf24)",
  "linear-gradient(135deg,#0f766e,#10b981 55%,#34d399)",
  "linear-gradient(135deg,#155e75,#0e7490 55%,#14b8a6)"
];

function pickGradient(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function InstructorCard({
  instructor
}: {
  instructor: { name: string; role: string; experience: string; rating: string; initials: string };
}) {
  const gradient = pickGradient(instructor.initials);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1.5 hover:border-loden-200 hover:shadow-premium">
      <div className="relative h-24" style={{ backgroundImage: gradient }}>
        <div
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: "radial-gradient(120% 90% at 12% 0%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)" }}
          aria-hidden="true"
        />
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur">
          <Star className="h-4 w-4 fill-white text-white" aria-hidden="true" />
          {instructor.rating}
        </span>
      </div>

      <div className="px-6 pb-6">
        <span
          className="-mt-10 flex h-20 w-20 items-center justify-center rounded-3xl text-xl font-bold text-white shadow-md ring-4 ring-white transition duration-300 group-hover:scale-105"
          style={{ backgroundImage: gradient }}
        >
          {instructor.initials}
        </span>
        <h3 className="mt-4 text-lg font-semibold text-loden-ink">{instructor.name}</h3>
        <p className="text-sm text-loden-muted">{instructor.role}</p>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-loden-fog px-4 py-3">
          <span className="text-sm font-medium text-loden-muted">{instructor.experience}</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-loden-700">
            <ShieldCheck className="h-4 w-4 text-loden-500" aria-hidden="true" />
            Certifié
          </span>
        </div>
      </div>
    </article>
  );
}
