"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileCheck2, Send } from "lucide-react";
import { cloneElement, isValidElement, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { HoneypotField, HONEYPOT_NAME } from "@/components/HoneypotField";
import { phoneInputProps, phoneSchema } from "@/lib/validation";
import { trackConversion } from "@/lib/analytics";

// Les `value` doivent correspondre aux IDs réels des formations (backend/src/data/initial-data.ts).
const formationOptions = [
  { label: "Permis B automatique — Déclic Auto", value: "formation-permis-b-auto-declic" },
  { label: "Permis B automatique — Maîtrise Auto", value: "formation-permis-b-auto-maitrise" },
  { label: "Permis B manuel — Essentiel", value: "formation-permis-b-manuel-essentiel" },
  { label: "Permis B manuel — Confort", value: "formation-permis-b-manuel-confort" },
  { label: "Stage accéléré code et conduite", value: "formation-stage-accelere" },
  { label: "Formation VTC", value: "formation-vtc-excellence" }
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Indique ton nom complet"),
  email: z.string().trim().email("Email invalide"),
  phone: phoneSchema,
  formationId: z.string().min(1, "Choisis une formation"),
  requestedAmount: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number(value) >= 0, "Montant invalide"),
  note: z.string().trim().max(400, "Message trop long").optional(),
  [HONEYPOT_NAME]: z.string().optional()
});

type CpfFormValues = z.infer<typeof schema>;

export function CpfRequestForm() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CpfFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      formationId: formationOptions[0].value
    }
  });

  const onSubmit = async (values: CpfFormValues) => {
    setSent(false);
    setSubmitError(null);

    const requestedAmountCents = values.requestedAmount
      ? Math.round(Number(values.requestedAmount) * 100)
      : undefined;

    const response = await fetch("/api/cpf/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        formationId: values.formationId,
        requestedAmountCents,
        internalNotes: values.note || undefined,
        [HONEYPOT_NAME]: values[HONEYPOT_NAME]
      })
    });

    if (!response.ok) {
      setSubmitError("La demande CPF n'a pas pu être envoyée. Réessaie dans quelques instants.");
      return;
    }

    trackConversion("cpf_submit", values.formationId);
    setSent(true);
    reset({ formationId: formationOptions[0].value });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-2xl md:rounded-3xl md:p-6" noValidate>
      <HoneypotField field={register(HONEYPOT_NAME)} />
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4 md:pb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-loden-50 text-loden-700 md:h-11 md:w-11 md:rounded-2xl">
          <FileCheck2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-loden-ink md:text-2xl">Vérifier mon financement</h2>
          <p className="mt-1 hidden text-sm leading-6 text-loden-muted md:mt-2 md:block">
            Un conseiller analyse ton solde CPF et prépare le meilleur parcours possible.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-5 md:gap-4">
        <Field label="Nom complet" error={errors.fullName?.message}>
          <input {...register("fullName")} className="field-input" placeholder="Prénom Nom" autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} className="field-input" placeholder="prenom@email.fr" autoComplete="email" />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register("phone")} {...phoneInputProps} className="field-input" />
        </Field>
        <Field label="Formation" error={errors.formationId?.message}>
          <select {...register("formationId")} className="field-input">
            {formationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Montant CPF estimé en euros" error={errors.requestedAmount?.message} className="mt-4 hidden md:grid">
        <input {...register("requestedAmount")} className="field-input" inputMode="numeric" placeholder="Ex. 1200" />
      </Field>

      <Field label="Précisions" error={errors.note?.message} className="mt-4 hidden md:grid">
        <textarea
          {...register("note")}
          className="field-input min-h-28 resize-y"
          placeholder="Disponibilités, date souhaitée, situation administrative…"
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70 md:mt-6 md:py-4"
      >
        <Send className="h-5 w-5" />
        {isSubmitting ? "Analyse en cours…" : "Envoyer ma demande CPF"}
      </button>

      {sent ? (
        <p className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-medium text-loden-800" role="status">
          Demande CPF envoyée. LODENE revient vers toi avec une estimation claire.
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
  const errorId = useId();
  const field =
    error && isValidElement(children)
      ? cloneElement(children as React.ReactElement<{ "aria-invalid"?: boolean; "aria-describedby"?: string }>, {
          "aria-invalid": true,
          "aria-describedby": errorId
        })
      : children;
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {field}
      {error ? (
        <span id={errorId} className="text-sm font-medium text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
