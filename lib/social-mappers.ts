import type { Instructor, Testimonial } from "@/data/site";

type ApiReview = {
  rating: number;
  comment: string;
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

export function mapApiReview(review: ApiReview, index: number): Testimonial {
  return {
    name: `Élève LODEN ${index + 1}`,
    location: "Avis vérifié",
    rating: review.rating,
    text: review.comment
  };
}

export function mapApiInstructor(instructor: ApiInstructor): Instructor {
  return {
    name: instructor.name,
    role: instructor.bio ?? instructor.specialties[0] ?? "Moniteur LODEN",
    experience: instructor.specialties.slice(0, 2).join(" · ") || "Moniteur certifié",
    rating: instructor.ratingAverage.toLocaleString("fr-FR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }),
    initials: initialsFromName(instructor.name)
  };
}
