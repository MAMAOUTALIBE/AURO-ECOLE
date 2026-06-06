"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, LockKeyhole, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formationOptions = [
  { label: "Permis B manuel", value: "formation-permis-b-manuel" },
  { label: "Permis B automatique", value: "formation-permis-b-automatique" },
  { label: "Conduite accompagnée", value: "formation-conduite-accompagnee" },
  { label: "Permis accéléré", value: "formation-permis-accelere" },
  { label: "Code en ligne", value: "formation-code-en-ligne" },
  { label: "Stage de code", value: "formation-stage-code" },
  { label: "Annulation permis", value: "formation-annulation-permis" },
  { label: "Perfectionnement", value: "formation-perfectionnement" }
];

const schema = z
  .object({
    firstName: z.string().trim().min(2, "Indique ton prénom"),
    lastName: z.string().trim().min(2, "Indique ton nom"),
    email: z.string().trim().email("Email invalide"),
    phone: z.string().trim().min(8, "Téléphone invalide"),
    formationId: z.string().min(1, "Choisis une formation"),
    password: z.string().min(10, "10 caractères minimum"),
    confirmPassword: z.string().min(10, "Confirme ton mot de passe")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
  });

type RegistrationValues = z.infer<typeof schema>;

type RegistrationSuccess = {
  firstName: string;
  formation: string;
};

export function StudentRegistrationForm() {
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RegistrationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      formationId: formationOptions[0].value
    }
  });

  const selectedFormation = watch("formationId");
  const selectedFormationLabel = useMemo(
    () => formationOptions.find((formation) => formation.value === selectedFormation)?.label ?? formationOptions[0].label,
    [selectedFormation]
  );

  const onSubmit = async (values: RegistrationValues) => {
    setSuccess(null);
    setSubmitError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        formationId: values.formationId
      })
    });

    const payload = await response.json().catch(() => null) as { error?: { message?: string }; token?: string } | null;

    if (!response.ok) {
      setSubmitError(payload?.error?.message ?? "L'inscription n'a pas pu être créée. Réessaie dans quelques instants.");
      return;
    }

    if (payload?.token) {
      window.localStorage.setItem("loden_student_token", payload.token);
    }

    setSuccess({ firstName: values.firstName, formation: selectedFormationLabel });
    reset({ formationId: formationOptions[0].value });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium" noValidate>
      <div className="flex items-start gap-3 border-b border-slate-200 pb-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-loden-50 text-loden-700">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-loden-ink">Créer mon espace élève</h2>
          <p className="mt-2 text-sm leading-6 text-loden-muted">
            L&apos;inscription crée ton profil élève et prépare ton futur suivi de progression.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" error={errors.firstName?.message}>
          <input {...register("firstName")} className="field-input" placeholder="Prénom" autoComplete="given-name" />
        </Field>
        <Field label="Nom" error={errors.lastName?.message}>
          <input {...register("lastName")} className="field-input" placeholder="Nom" autoComplete="family-name" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} className="field-input" placeholder="prenom@email.fr" autoComplete="email" />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register("phone")} className="field-input" placeholder="06 12 34 56 78" autoComplete="tel" />
        </Field>
      </div>

      <Field label="Formation souhaitée" error={errors.formationId?.message} className="mt-4">
        <select {...register("formationId")} className="field-input">
          {formationOptions.map((formation) => (
            <option key={formation.value} value={formation.value}>
              {formation.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Mot de passe" error={errors.password?.message}>
          <input {...register("password")} className="field-input" type="password" autoComplete="new-password" />
        </Field>
        <Field label="Confirmation" error={errors.confirmPassword?.message}>
          <input {...register("confirmPassword")} className="field-input" type="password" autoComplete="new-password" />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-5 w-5" />
        {isSubmitting ? "Création..." : "Créer mon compte élève"}
      </button>

      {success ? (
        <div className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-medium text-loden-800">
          <span className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            Compte créé pour {success.firstName}. Formation choisie : {success.formation}.
          </span>
        </div>
      ) : null}
      {submitError ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
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
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-loden-ink">{label}</span>
      {children}
      {error ? <span className="text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
