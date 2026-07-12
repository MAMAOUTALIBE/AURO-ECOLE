"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(10, "10 caractères minimum"),
    confirmPassword: z.string().min(1, "Confirme ton mot de passe")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
  });

type ResetValues = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetValues>({ resolver: zodResolver(schema) });

  // Garde-fou : lien ouvert sans token.
  if (!token) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-2xl md:rounded-3xl md:p-6" role="alert">
        <h2 className="text-xl font-semibold text-loden-ink">Lien invalide</h2>
        <p className="mt-3 text-sm leading-6 text-loden-muted">
          Ce lien de réinitialisation est incomplet ou a expiré. Demande un nouveau lien pour continuer.
        </p>
        <Link
          className="focus-ring mt-6 inline-flex items-center justify-center rounded-full bg-loden-700 px-6 py-3 font-semibold text-white transition hover:bg-loden-800"
          href="/mot-de-passe-oublie"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: ResetValues) => {
    setSubmitError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password })
      });
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!response.ok) {
        setSubmitError(
          payload?.error?.message ?? "Réinitialisation impossible. Le lien a peut-être expiré."
        );
        return;
      }
      setDone(true);
    } catch {
      setSubmitError("Réinitialisation impossible pour le moment. Réessaie dans un instant.");
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-2xl md:rounded-3xl md:p-6" role="status">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-loden-pearl text-loden-700">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-semibold text-loden-ink">Mot de passe réinitialisé</h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-loden-muted">
          Ton mot de passe a été mis à jour. Tu peux maintenant te connecter avec ton nouveau mot de passe.
        </p>
        <Link
          className="focus-ring mt-6 inline-flex items-center justify-center rounded-full bg-loden-700 px-6 py-3 font-semibold text-white transition hover:bg-loden-800"
          href="/connexion"
        >
          Me connecter
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-2xl md:rounded-3xl md:p-6"
      noValidate
    >
      <div className="border-b border-slate-200 pb-4 md:pb-5">
        <h2 className="text-lg font-semibold text-loden-ink md:text-2xl">Nouveau mot de passe</h2>
        <p className="mt-2 hidden text-sm leading-6 text-loden-muted md:block">
          Choisis un mot de passe d&apos;au moins 10 caractères. Ce lien est à usage unique.
        </p>
      </div>

      <Field label="Nouveau mot de passe" error={errors.password?.message} className="mt-5">
        <input
          {...register("password")}
          className="field-input"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? "true" : "false"}
        />
      </Field>
      <Field label="Confirme le mot de passe" error={errors.confirmPassword?.message} className="mt-4">
        <input
          {...register("confirmPassword")}
          className="field-input"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? "true" : "false"}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70 md:mt-6 md:py-4"
      >
        <KeyRound className="h-5 w-5" />
        {isSubmitting ? "Mise à jour…" : "Réinitialiser mon mot de passe"}
      </button>

      {submitError ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">
          {submitError}{" "}
          <Link className="font-semibold underline" href="/mot-de-passe-oublie">
            Demander un nouveau lien
          </Link>
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
      {error ? (
        <span className="text-sm font-medium text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
