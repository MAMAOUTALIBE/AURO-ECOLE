"use client";

import { useEffect, useState } from "react";
import { instructors, type Instructor } from "@/data/site";
import { mapApiInstructor } from "@/lib/social-mappers";
import { InstructorCard } from "@/components/InstructorCard";

export function InstructorsGrid() {
  const [remoteInstructors, setRemoteInstructors] = useState<Instructor[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInstructors() {
      try {
        const response = await fetch("/api/instructors", { signal: controller.signal });
        if (!response.ok) return;

        const payload = (await response.json()) as { data?: Parameters<typeof mapApiInstructor>[0][] };
        const nextInstructors = (payload.data ?? []).map(mapApiInstructor);
        if (nextInstructors.length > 0) setRemoteInstructors(nextInstructors);
      } catch {
        if (!controller.signal.aborted) setRemoteInstructors(null);
      }
    }

    loadInstructors();

    return () => controller.abort();
  }, []);

  const visibleInstructors = remoteInstructors ?? instructors;

  if (visibleInstructors.length === 0) {
    return (
      <p className="mt-9 rounded-3xl border border-slate-200 bg-loden-pearl p-6 text-center text-sm text-loden-muted">
        L&apos;équipe pédagogique sera présentée prochainement.
      </p>
    );
  }

  return (
    <div className="mt-9 grid gap-5 md:grid-cols-3">
      {visibleInstructors.map((instructor) => (
        <InstructorCard key={instructor.name} instructor={instructor} />
      ))}
    </div>
  );
}
