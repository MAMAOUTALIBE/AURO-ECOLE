"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { phoneInputProps } from "@/lib/validation";

type FormationOption = { slug: string; title: string; subtitle?: string };

// Formulaire d'inscription SIMPLE : coordonnées + formation souhaitée, SANS mot de passe
// et SANS création de compte. La demande part dans le CRM (pipeline) et l'équipe rappelle
// la personne pour finaliser et créer l'accès élève.
export function InscriptionForm({ formations }: { formations: FormationOption[] }) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("formation") ?? "";
  const initialSlug = useMemo(
    () => (formations.some((f) => f.slug === requested) ? requested : formations[0]?.slug ?? ""),
    [formations, requested]
  );

  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    formationSlug: initialSlug
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (key: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (values.firstName.trim().length < 2 || values.lastName.trim().length < 2) {
      setError("Indique ton prénom et ton nom.");
      return;
    }
    if (!values.phone.trim() || !values.email.trim()) {
      setError("Téléphone et email sont requis pour te recontacter.");
      return;
    }
    const formation = formations.find((f) => f.slug === values.formationSlug);
    if (!formation) {
      setError("Choisis une formation.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          formationTitle: formation.title,
          formationSlug: formation.slug
        })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? "Envoi impossible.");
      }
      setSent(true);
      setValues({ firstName: "", lastName: "", phone: "", email: "", formationSlug: initialSlug });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-2xl md:rounded-3xl md:p-6"
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
        <Field label="Prénom">
          <input className="field-input" value={values.firstName} onChange={set("firstName")} placeholder="Prénom" autoComplete="given-name" />
        </Field>
        <Field label="Nom">
          <input className="field-input" value={values.lastName} onChange={set("lastName")} placeholder="Nom" autoComplete="family-name" />
        </Field>
        <Field label="Téléphone">
          <input {...phoneInputProps} className="field-input" value={values.phone} onChange={set("phone")} />
        </Field>
        <Field label="Email">
          <input className="field-input" type="email" value={values.email} onChange={set("email")} placeholder="prenom@email.fr" autoComplete="email" />
        </Field>
      </div>

      <Field label="Formation souhaitée" className="mt-3 md:mt-4">
        <select className="field-input" value={values.formationSlug} onChange={set("formationSlug")}>
          {formations.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.title}
              {f.subtitle ? ` — ${f.subtitle}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70 md:mt-6 md:py-4"
      >
        <Send className="h-5 w-5" />
        {submitting ? "Envoi…" : "Envoyer ma demande d'inscription"}
      </button>

      {sent ? (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-loden-50 p-3 text-sm font-medium text-loden-800" role="status">
          <CheckCircle2 className="h-5 w-5" />
          Demande envoyée — nous vous rappelons pour finaliser l&apos;inscription.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {children}
    </label>
  );
}
