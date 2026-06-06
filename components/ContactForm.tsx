"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Indique ton nom"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Téléphone invalide"),
  need: z.string().min(1, "Choisis un besoin"),
  message: z.string().min(10, "Ajoute quelques précisions")
});

type ContactFormValues = z.infer<typeof schema>;

export function ContactForm() {
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
      need: "Permis B manuel"
    }
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSent(false);
    setSubmitError(null);

    const response = await fetch("/api/contact-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        type: values.need.includes("CPF") ? "CPF" : "INSCRIPTION",
        source: "frontend-contact-form",
        message: `${values.need} - ${values.message}`
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
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-premium" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" error={errors.name?.message}>
          <input {...register("name")} className="field-input" placeholder="Ton nom" autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} className="field-input" placeholder="prenom@email.fr" autoComplete="email" />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register("phone")} className="field-input" placeholder="06 12 34 56 78" autoComplete="tel" />
        </Field>
        <Field label="Besoin" error={errors.need?.message}>
          <select {...register("need")} className="field-input">
            <option>Permis B manuel</option>
            <option>Boîte automatique</option>
            <option>Permis accéléré</option>
            <option>CPF / financement</option>
            <option>Remise à niveau</option>
          </select>
        </Field>
      </div>
      <Field label="Message" error={errors.message?.message} className="mt-4">
        <textarea {...register("message")} className="field-input min-h-32 resize-y" placeholder="Explique ton objectif, tes disponibilités ou ton financement." />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-4 font-semibold text-white transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-5 w-5" />
        {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
      </button>
      {sent ? (
        <p className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-medium text-loden-800">
          Demande envoyée. Un conseiller LODEN te répondra rapidement.
        </p>
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
