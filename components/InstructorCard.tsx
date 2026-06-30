import { Star } from "lucide-react";

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
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1.5 hover:border-loden-200 hover:shadow-premium md:rounded-[1.75rem]">
      <div className="relative h-[4.5rem] sm:h-20 md:h-24" style={{ backgroundImage: gradient }}>
        <div
          className="absolute inset-0 opacity-70"
          style={{ backgroundImage: "radial-gradient(120% 90% at 12% 0%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)" }}
          aria-hidden="true"
        />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/40 backdrop-blur md:right-4 md:top-4 md:px-3 md:text-sm">
          <Star className="h-3.5 w-3.5 fill-white text-white md:h-4 md:w-4" aria-hidden="true" />
          {instructor.rating}
        </span>
      </div>

      <div className="px-4 pb-4 md:px-6 md:pb-6">
        <span
          className="-mt-8 flex h-16 w-16 items-center justify-center rounded-xl text-base font-bold text-white shadow-md ring-4 ring-white transition duration-300 group-hover:scale-105 md:-mt-10 md:h-20 md:w-20 md:rounded-2xl md:text-xl"
          style={{ backgroundImage: gradient }}
        >
          {instructor.initials}
        </span>
        <h3 className="mt-3 text-base font-semibold text-loden-ink md:mt-4 md:text-lg">{instructor.name}</h3>
        <p className="text-sm text-loden-muted">{instructor.role}</p>

        <div className="mt-3 rounded-xl bg-loden-fog px-3 py-2 md:mt-4 md:rounded-2xl md:px-4 md:py-3">
          <span className="text-sm font-medium text-loden-muted">{instructor.experience}</span>
        </div>
      </div>
    </article>
  );
}
