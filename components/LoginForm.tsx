"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isAdminRole } from "@/lib/auth-session";

const schema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis")
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = await response.json().catch(() => null) as { error?: { message?: string }; user?: { role?: string } } | null;

    if (!response.ok || !payload?.user) {
      setSubmitError(payload?.error?.message ?? "Connexion impossible. Vérifie tes identifiants.");
      return;
    }

    // La session est dans le cookie httpOnly (posé par /api/auth/login).
    // Le rôle vient de la réponse `user` (le token n'est plus exposé au navigateur).
    const role = payload.user.role;
    const destination = role === "MONITEUR" ? "/espace-formateur" : isAdminRole(role) ? "/admin" : "/espace-eleve";
    router.push(destination);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6" noValidate>
      <div className="border-b border-slate-200 pb-4 sm:pb-5">
        <h2 className="text-xl font-semibold text-loden-ink sm:text-2xl">Connexion élève</h2>
        <p className="mt-2 hidden text-sm leading-6 text-loden-muted sm:block">
          Accède à ton profil, ta formation et ton futur planning LODENE.
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
      <Field label="Mot de passe" error={errors.password?.message} className="mt-4">
        <input
          {...register("password")}
          className="field-input"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? "true" : "false"}
        />
      </Field>
      <div className="mt-2 text-right">
        <Link className="text-sm font-semibold text-loden-700 hover:text-loden-800" href="/mot-de-passe-oublie">
          Mot de passe oublié ?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3.5 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6 sm:py-4"
      >
        <LogIn className="h-5 w-5" />
        {isSubmitting ? "Connexion..." : "Accéder à mon espace"}
      </button>

      {submitError ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <p className="mt-5 text-center text-sm text-loden-muted">
        Pas encore de compte ?{" "}
        <Link className="font-semibold text-loden-700 hover:text-loden-800" href="/inscription">
          Créer mon compte élève
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
      {error ? <span className="text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
