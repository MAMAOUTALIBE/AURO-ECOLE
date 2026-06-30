"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cloneElement, isValidElement, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formations } from "@/data/site";
import { phoneInputProps, phoneSchema } from "@/lib/validation";

// Rapproche un slug de formation du libellé "Besoin" du diagnostic.
const NEED_BY_FORMATION_SLUG: Record<string, string> = {
  "permis-b-manuel-essentiel": "Permis B manuel",
  "permis-b-manuel-confort": "Permis B manuel",
  "permis-b-auto-declic": "Boîte automatique",
  "permis-b-auto-maitrise": "Boîte automatique",
  "boite-automatique": "Boîte automatique",
  "stage-accelere": "Permis accéléré",
  "passerelle-bva-manuelle": "Permis B manuel",
  "conduite-accompagnee": "Permis B manuel",
  "pack-cpf": "CPF / financement"
};

const schema = z.object({
  name: z.string().min(2, "Indique ton nom"),
  email: z.string().email("Email invalide"),
  phone: phoneSchema,
  company: z.string().optional(),
  need: z.string().min(1, "Choisis un besoin"),
  financing: z.string().min(1, "Choisis une option"),
  availability: z.string().min(1, "Indique tes disponibilités"),
  urgency: z.string().min(1, "Choisis un délai"),
  preferredContact: z.string().min(1, "Choisis un canal"),
  message: z.string().min(10, "Ajoute quelques précisions")
});

const POLE_NEED: Record<string, string> = { VTC: "Formation VTC", CACES: "Formation CACES" };

type ContactFormValues = z.infer<typeof schema>;

export function ContactForm() {
  const searchParams = useSearchParams();
  // Contexte transmis par les pages de formation (?formation=<slug>) ou les pôles pro
  // (?pole=VTC|CACES) : on pré-remplit le besoin et un message pour qualifier la demande.
  const formationSlug = searchParams.get("formation");
  const pole = searchParams.get("pole");
  const formationTitle = formations.find((formation) => formation.slug === formationSlug)?.title;
  const isPro = pole === "VTC" || pole === "CACES";
  const defaultNeed =
    (pole && POLE_NEED[pole]) || (formationSlug && NEED_BY_FORMATION_SLUG[formationSlug]) || "Permis B manuel";
  const defaultMessage = isPro
    ? `Demande de devis — formation ${pole}${formationTitle ? ` (${formationTitle})` : ""}. Merci de me recontacter avec les modalités et le financement.`
    : formationTitle
      ? `Je souhaite un devis pour la formation : ${formationTitle}.`
      : "Je souhaite être rappelé pour choisir une formation LODENE.";

  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      need: defaultNeed,
      financing: "À définir",
      availability: "Soirs en semaine",
      urgency: "Ce mois-ci",
      preferredContact: "Téléphone",
      message: defaultMessage
    }
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSent(false);
    setSubmitError(null);

    const structuredMessage = [
      `Besoin: ${values.need}`,
      values.company ? `Entreprise/financeur: ${values.company}` : null,
      `Financement: ${values.financing}`,
      `Disponibilités: ${values.availability}`,
      `Délai souhaité: ${values.urgency}`,
      `Contact préféré: ${values.preferredContact}`,
      `Message: ${values.message}`
    ]
      .filter(Boolean)
      .join("\n");
    const isCpfRequest = values.need.includes("CPF") || values.financing.includes("CPF");
    // Devis pro (VTC/CACES, ou entreprise renseignée) -> type AUTRE pour le tri CRM.
    const type = isPro || values.company ? "AUTRE" : isCpfRequest ? "CPF" : "INSCRIPTION";

    const response = await fetch("/api/contact-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        type,
        source: isPro ? `devis-pro-${pole?.toLowerCase()}` : "frontend-diagnostic-form",
        message: structuredMessage
      })
    });

    if (!response.ok) {
      setSubmitError("La demande n'a pas pu être envoyée. Réessaie dans quelques instants.");
      return;
    }

    setSent(true);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-2xl md:rounded-[1.75rem] md:p-6" noValidate>
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4 md:pb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-loden-50 text-loden-700 md:h-11 md:w-11 md:rounded-2xl">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-loden-ink md:text-2xl">Diagnostic & devis</h2>
          <p className="mt-1 hidden text-sm leading-6 text-loden-muted md:mt-2 md:block">
            Les réponses permettent à LODENE de te rappeler avec le bon parcours, le bon financement et un planning réaliste.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-5 md:gap-4">
        <Field label="Nom" error={errors.name?.message}>
          <input {...register("name")} className="field-input" placeholder="Ton nom" autoComplete="name" />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register("phone")} {...phoneInputProps} className="field-input" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} className="field-input" placeholder="prenom@email.fr" autoComplete="email" />
        </Field>
        <Field label="Besoin" error={errors.need?.message}>
          <select {...register("need")} className="field-input">
            <option>Permis B manuel</option>
            <option>Boîte automatique</option>
            <option>Permis accéléré</option>
            <option>Formation VTC</option>
            <option>Formation CACES</option>
            <option>CPF / financement</option>
            <option>Remise à niveau</option>
          </select>
        </Field>
        <Field label="Entreprise / financeur (optionnel)" error={errors.company?.message} className="hidden md:grid">
          <input {...register("company")} className="field-input" placeholder="Société, OPCO, Pôle emploi…" autoComplete="organization" />
        </Field>
      </div>

      <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2">
        <Field label="Financement" error={errors.financing?.message}>
          <select {...register("financing")} className="field-input">
            <option>À définir</option>
            <option>CPF</option>
            <option>Paiement comptant</option>
            <option>Paiement 3x / 4x</option>
            <option>Aide régionale</option>
          </select>
        </Field>
        <Field label="Délai souhaité" error={errors.urgency?.message}>
          <select {...register("urgency")} className="field-input">
            <option>Ce mois-ci</option>
            <option>Dans 2 à 3 mois</option>
            <option>Permis accéléré</option>
            <option>Je compare les options</option>
          </select>
        </Field>
        <Field label="Disponibilités" error={errors.availability?.message}>
          <select {...register("availability")} className="field-input">
            <option>Soirs en semaine</option>
            <option>Matins en semaine</option>
            <option>Mercredi / samedi</option>
            <option>Planning flexible</option>
            <option>À préciser au téléphone</option>
          </select>
        </Field>
        <Field label="Contact préféré" error={errors.preferredContact?.message}>
          <select {...register("preferredContact")} className="field-input">
            <option>Téléphone</option>
            <option>WhatsApp</option>
            <option>Email</option>
          </select>
        </Field>
      </div>

      <Field label="Message" error={errors.message?.message} className="mt-4 hidden md:grid">
        <textarea {...register("message")} className="field-input min-h-32 resize-y" placeholder="Objectif, contraintes, date d'examen visée, solde CPF approximatif..." />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70 md:mt-6 md:py-4"
      >
        <Send className="h-5 w-5" />
        {isSubmitting ? "Envoi..." : (
          <>
            <span className="sm:hidden">Être rappelé</span>
            <span className="hidden sm:inline">Envoyer ma demande</span>
          </>
        )}
      </button>
      {sent ? (
        <p className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-medium text-loden-800" role="status">
          Diagnostic envoyé. Un conseiller LODENE te répondra avec un parcours et un devis adaptés.
        </p>
      ) : null}
      {submitError ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className = ""
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Marque le champ invalide pour les lecteurs d'écran quand une erreur est présente.
  const field =
    error && isValidElement(children)
      ? cloneElement(children as React.ReactElement<{ "aria-invalid"?: boolean }>, { "aria-invalid": true })
      : children;
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {field}
      {error ? (
        <span className="text-sm font-medium text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
