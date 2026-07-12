"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { contactInfo } from "@/data/site";
import { trackConversion } from "@/lib/analytics";

type DeliveryValue = "EMAIL" | "WHATSAPP" | "BOTH";
const OFFER_50_FORMATION = "PERMIS_B";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  delivery: DeliveryValue;
  consent: boolean;
};

type OfferResponse = {
  data?: {
    voucherUrl?: string;
    whatsappUrl?: string;
    emailStatus?: "sent" | "skipped" | "failed";
    whatsappStatus?: "sent" | "skipped" | "failed";
  };
  error?: { message?: string };
};

const initialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  delivery: "BOTH",
  consent: false
};

const deliveries: { value: DeliveryValue; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "BOTH", label: "Les deux" }
];

function buildFallbackWhatsAppUrl() {
  const message = "Bonjour LODENE, je viens de m'inscrire via l'offre QR code et je souhaite recevoir mon bon de réduction de 50 €.";
  return `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function Offer50LeadForm({ code, validCode }: { code: string; validCode: boolean }) {
  const [values, setValues] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OfferResponse["data"] | null>(null);
  const whatsappUrl = useMemo(() => result?.whatsappUrl || buildFallbackWhatsAppUrl(), [result?.whatsappUrl]);

  const updateField = <Key extends keyof FormState>(field: Key, value: FormState[Key]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const response = await fetch("/api/offers/qr-50", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        formation: OFFER_50_FORMATION,
        delivery: values.delivery,
        consent: values.consent
      })
    });
    const payload = (await response.json().catch(() => null)) as OfferResponse | null;

    if (!response.ok) {
      setStatus("error");
      setError(payload?.error?.message ?? "La demande n'a pas pu être envoyée. Vérifiez les champs puis réessayez.");
      return;
    }

    trackConversion("offre50_submit", OFFER_50_FORMATION);
    setResult(payload?.data ?? null);
    setStatus("sent");
    setValues(initialState);
  };

  if (status === "sent") {
    return (
      <section id="recuperer-bon" className="scroll-mt-36 rounded-[1.25rem] border border-loden-100 bg-white p-5 shadow-premium sm:p-6 md:scroll-mt-44">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-loden-50 text-loden-700">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-loden-700">Confirmation</p>
            <h2 className="mt-2 text-[1.35rem] font-black leading-tight text-loden-ink sm:text-2xl">
              Merci, votre bon de réduction de 50 € vous a été envoyé.
            </h2>
            <p className="mt-3 leading-7 text-loden-muted">
              Présentez le bon avec le code <strong className="text-loden-ink">LODENE50</strong> lors de votre inscription chez LODENE Formation.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {result?.voucherUrl ? (
            <a
              href={result.voucherUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-loden-200 bg-white px-5 py-3 text-sm font-black text-loden-900 shadow-soft transition hover:bg-loden-50"
            >
              Voir le bon
            </a>
          ) : null}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-soft transition hover:brightness-95"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            WhatsApp LODENE
          </a>
        </div>

        <p className="mt-4 rounded-2xl bg-loden-50 p-4 text-sm font-semibold leading-6 text-loden-800">
          Envoi email : {result?.emailStatus ?? "skipped"} · Envoi WhatsApp automatique : {result?.whatsappStatus ?? "skipped"}
        </p>
      </section>
    );
  }

  return (
    <form
      id="recuperer-bon"
      onSubmit={submit}
      className="scroll-mt-36 grid gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-premium sm:p-6 md:scroll-mt-44"
      noValidate
    >
      <div>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-loden-700">Formulaire prospect</p>
        <h2 className="mt-2 text-[1.35rem] font-black leading-tight text-loden-ink sm:text-2xl">Je récupère mon bon -50 €</h2>
        <p className="mt-2 text-sm leading-6 text-loden-muted">
          Offre réservée au Permis B. Une demande par personne. Le bon est envoyé après validation du formulaire.
        </p>
      </div>

      {!validCode ? (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Le lien ne contient pas le code promo valide. Utilisez le QR code ou le lien /offre-50?code=LODENE50.
        </p>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-loden-ink">Nom complet</span>
        <input
          required
          minLength={2}
          autoComplete="name"
          className="field-input"
          value={values.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="Prénom Nom"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-loden-ink">Téléphone</span>
          <input
            required
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

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-loden-ink">Choix d&apos;envoi</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {deliveries.map((delivery) => (
            <label
              key={delivery.value}
              className="focus-within:ring-2 focus-within:ring-loden-300 flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-loden-fog px-3.5 py-3 text-sm font-black text-loden-ink transition hover:border-loden-200"
            >
              <input
                type="radio"
                name="delivery"
                value={delivery.value}
                checked={values.delivery === delivery.value}
                onChange={() => updateField("delivery", delivery.value)}
                className="h-4 w-4 accent-loden-700"
              />
              {delivery.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-loden-100 bg-loden-50 p-4">
        <input
          required
          type="checkbox"
          checked={values.consent}
          onChange={(event) => updateField("consent", event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-loden-700"
        />
        <span className="text-sm font-semibold leading-6 text-loden-800">
          J&apos;accepte de recevoir mon bon de réduction et d&apos;être recontacté par LODENE Formation.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending" || !validCode}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-black text-white shadow-[0_18px_45px_rgba(0,134,148,0.25)] transition hover:bg-loden-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        {status === "sending" ? "Envoi…" : "Je récupère mon bon"}
      </button>

      {status === "error" ? (
        <p className="flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-loden-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-loden-700" aria-hidden="true" />
        Vos informations sont enregistrées dans le CRM LODENE uniquement pour le suivi de cette offre.
      </p>
    </form>
  );
}
