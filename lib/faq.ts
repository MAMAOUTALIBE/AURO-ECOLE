import { faqEntries } from "@/data/site";

export type FaqItem = { question: string; answer: string; category?: string };

/**
 * FAQ pour le site public : lit l'API (gérée depuis le CRM) et retombe sur le
 * contenu mock de data/site.ts si le backend est indisponible (ex. au build).
 */
export async function getFaqEntries(): Promise<FaqItem[]> {
  const baseUrl = process.env.LODEN_API_URL ?? "http://127.0.0.1:4000";
  try {
    const response = await fetch(new URL("/api/faq", baseUrl), { cache: "no-store" });
    if (!response.ok) return faqEntries;
    const payload = (await response.json()) as { data?: { question: string; answer: string; category?: string | null }[] };
    if (!Array.isArray(payload.data) || payload.data.length === 0) return faqEntries;
    return payload.data.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
      category: entry.category ?? ""
    }));
  } catch {
    return faqEntries;
  }
}
