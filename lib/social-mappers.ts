import type { Instructor, Testimonial } from "@/data/site";

type ApiReview = {
  rating: number;
  comment: string;
  authorName?: string | null;
  authorLocation?: string | null;
};

type ApiInstructor = {
  name: string;
  bio?: string | null;
  specialties: string[];
  ratingAverage: number;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function mapApiReview(review: ApiReview): Testimonial {
  // Le prénom saisi par le client est affiché tel quel ; à défaut, libellé neutre.
  return {
    name: review.authorName?.trim() || "Client",
    location: review.authorLocation?.trim() || "",
    rating: review.rating,
    text: review.comment
  };
}

export function mapApiInstructor(instructor: ApiInstructor): Instructor {
  return {
    name: instructor.name,
    role: instructor.bio ?? instructor.specialties[0] ?? "Moniteur LODENE",
    experience: instructor.specialties.slice(0, 2).join(" · ") || "Moniteur",
    rating: instructor.ratingAverage.toLocaleString("fr-FR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }),
    initials: initialsFromName(instructor.name)
  };
}
