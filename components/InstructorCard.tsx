import { Star } from "lucide-react";

export function InstructorCard({
  instructor
}: {
  instructor: {
    name: string;
    role: string;
    experience: string;
    rating: string;
    initials: string;
  };
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-loden-100 via-white to-loden-300 text-xl font-semibold text-loden-800 shadow-soft">
          {instructor.initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-loden-ink">{instructor.name}</h3>
          <p className="text-sm text-loden-muted">{instructor.role}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-loden-fog p-4">
        <span className="text-sm font-medium text-loden-muted">{instructor.experience}</span>
        <span className="flex items-center gap-1 font-semibold text-loden-ink">
          <Star className="h-4 w-4 fill-loden-500 text-loden-500" />
          {instructor.rating}
        </span>
      </div>
    </article>
  );
}
