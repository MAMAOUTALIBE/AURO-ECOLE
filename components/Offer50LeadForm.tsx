"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  formation: string;
  message: string;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  formation: "Permis B",
  message: ""
};

export function Offer50LeadForm({ code }: { code: string }) {
  const [values, setValues] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormState, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const message = [
      `Campagne QR code: ${code}`,
      `Formation souhaitée: ${values.formation}`,
      values.message.trim() ? `Message: ${values.message.trim()}` : "Message: Je souhaite profiter de l'offre -50 euros."
    ].join("\n");

    const response = await fetch("/api/contact-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        type: "INSCRIPTION",
        source: `qr-offre-50-${code.toLowerCase()}`,
        message
      })
    });

    if (!response.ok) {
      setStatus("error");
      setError("La demande n'a pas pu être envoyée. Vérifie les champs puis réessaie.");
      return;
    }

    setStatus("sent");
    setValues(initialState);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-premium sm:p-6" noValidate>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-loden-700">Formulaire prospect</p>
        <h2 className="mt-2 text-2xl font-black text-loden-ink">Recevoir mon bon -50 €</h2>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-loden-ink">Nom complet</span>
        <input
          required
          minLength={2}
          autoComplete="name"
          className="field-input"
          value={values.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="Votre nom"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-loden-ink">Téléphone</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="field-input"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="06 12 34 56 78"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-loden-ink">Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            className="field-input"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="prenom@email.fr"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-loden-ink">Formation souhaitée</span>
        <select className="field-input" value={values.formation} onChange={(event) => updateField("formation", event.target.value)}>
          <option>Permis B</option>
          <option>VTC</option>
          <option>SST</option>
          <option>Logistique / CACES</option>
          <option>Sécurité</option>
          <option>Je ne sais pas encore</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-loden-ink">Message</span>
        <textarea
          className="field-input min-h-28 resize-y"
          value={values.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Votre besoin, vos disponibilités, votre financement..."
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.25)] transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        {status === "sending" ? "Envoi..." : "Envoyer ma demande"}
      </button>

      {status === "sent" ? (
        <p className="flex items-start gap-2 rounded-2xl bg-loden-50 p-4 text-sm font-semibold text-loden-800" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Demande envoyée. Un conseiller LODENE vous recontacte avec le bon de réduction.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </form>
  );
}
