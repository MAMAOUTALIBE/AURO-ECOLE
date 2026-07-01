"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { cloneElement, isValidElement, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { phoneInputProps, phoneSchema } from "@/lib/validation";

const OFFER_CODE = "LODENE50";

const schema = z.object({
  fullName: z.string().trim().min(2, "Indique ton nom complet"),
  phone: phoneSchema,
  email: z.string().trim().email("Email invalide"),
  formation: z.string().trim().min(2, "Choisis une formation"),
  preferredContact: z.enum(["Téléphone", "WhatsApp", "Email"]),
  message: z.string().trim().max(800, "Message trop long").optional(),
  consentContact: z.boolean().refine(Boolean, "Le consentement est requis"),
  consentWhatsapp: z.boolean()
});

type Offer50LeadFormValues = z.infer<typeof schema>;

const formationOptions = [
  "Permis B automatique",
  "Permis B boîte manuelle",
  "Formation VTC",
  "SST",
  "Logistique / sécurité",
  "Je veux être conseillé"
];

export function Offer50LeadForm() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<Offer50LeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      formation: "Permis B automatique",
      preferredContact: "Téléphone",
      consentContact: false,
      consentWhatsapp: false
    }
  });

  const onSubmit = async (values: Offer50LeadFormValues) => {
    setSent(false);
    setSubmitError(null);

    const response = await fetch("/api/offre-50/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        code: OFFER_CODE,
        message: values.message?.trim() || undefined
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setSubmitError(payload?.error?.message ?? "La demande n'a pas pu être envoyée. Réessaie dans quelques instants.");
      return;
    }

    setSent(true);
    reset({
      formation: "Permis B automatique",
      preferredContact: "Téléphone",
      consentContact: false,
      consentWhatsapp: false
    });
  };

  return (
    <form id="formulaire-offre" onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium md:rounded-2xl md:p-6" noValidate>
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-loden-50 text-loden-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold leading-tight text-loden-ink">Recevoir mon bon -50€</h2>
          <p className="mt-1 text-sm leading-6 text-loden-muted">Un conseiller LODENE te rappelle avec le code promo LODENE50 attaché à ta demande.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" error={errors.fullName?.message}>
          <input {...register("fullName")} className="field-input" placeholder="Votre nom" autoComplete="name" />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register("phone")} {...phoneInputProps} className="field-input" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} className="field-input" placeholder="votre@email.fr" autoComplete="email" />
        </Field>
        <Field label="Formation souhaitée" error={errors.formation?.message}>
          <select {...register("formation")} className="field-input">
            {formationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Canal préféré" error={errors.preferredContact?.message}>
          <select {...register("preferredContact")} className="field-input">
            <option>Téléphone</option>
            <option>WhatsApp</option>
            <option>Email</option>
          </select>
        </Field>
        <Field label="Message optionnel" error={errors.message?.message}>
          <input {...register("message")} className="field-input" placeholder="Disponibilités, formation, question..." />
        </Field>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="flex items-start gap-3 rounded-xl bg-loden-fog p-3 text-sm font-medium leading-6 text-loden-ink">
          <input {...register("consentContact")} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-loden-700" />
          <span>J’accepte d’être recontacté par LODENE Formation au sujet de cette offre.</span>
        </label>
        {errors.consentContact?.message ? <span className="text-sm font-medium text-red-600">{errors.consentContact.message}</span> : null}
        <label className="flex items-start gap-3 rounded-xl bg-loden-fog p-3 text-sm font-medium leading-6 text-loden-ink">
          <input {...register("consentWhatsapp")} type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-loden-700" />
          <span>J’autorise aussi un rappel par WhatsApp.</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
      </button>

      {sent ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800" role="status">
          Demande envoyée. Votre bon -50€ est rattaché au code LODENE50.
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
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const field =
    error && isValidElement(children)
      ? cloneElement(children as React.ReactElement<{ "aria-invalid"?: boolean }>, { "aria-invalid": true })
      : children;
  return (
    <label className="grid gap-2">
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
