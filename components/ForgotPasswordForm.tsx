"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Email invalide")
});

type ForgotValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: ForgotValues) => {
    setSubmitError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!response.ok) {
        setSubmitError(payload?.error?.message ?? "Demande impossible pour le moment. Réessaie dans un instant.");
        return;
      }
      // Réponse volontairement identique que le compte existe ou non.
      setSent(true);
    } catch {
      setSubmitError("Demande impossible pour le moment. Réessaie dans un instant.");
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6" role="status">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-loden-pearl text-loden-700">
            <MailCheck className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-semibold text-loden-ink">Vérifie ta boîte mail</h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-loden-muted">
          Si un compte existe pour cette adresse, un lien de réinitialisation vient d&apos;être envoyé. Il est
          valable <strong>1 heure</strong>. Pense à regarder tes spams.
        </p>
        <Link
          className="focus-ring mt-6 inline-flex items-center justify-center rounded-full bg-loden-700 px-6 py-3 font-semibold text-white transition hover:bg-loden-800"
          href="/connexion"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6"
      noValidate
    >
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-semibold text-loden-ink sm:text-2xl">Mot de passe oublié</h2>
        <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">
          Saisis l&apos;email de ton compte : on t&apos;envoie un lien sécurisé pour en choisir un nouveau.
        </p>
      </div>

      <Field label="Email" error={errors.email?.message} className="mt-5">
        <input
          {...register("email")}
          className="field-input"
          placeholder="prenom@email.fr"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : "false"}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-5 w-5" />
        {isSubmitting ? "Envoi..." : "Envoyer le lien de réinitialisation"}
      </button>

      {submitError ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <p className="mt-5 text-center text-sm text-loden-muted">
        Tu te souviens de ton mot de passe ?{" "}
        <Link className="font-semibold text-loden-700 hover:text-loden-800" href="/connexion">
          Revenir à la connexion
        </Link>
      </p>
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
