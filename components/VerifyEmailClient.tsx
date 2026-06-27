"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Status = "loading" | "success" | "error";

export function VerifyEmailClient({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState<string>(
    token ? "Vérification en cours..." : "Lien de vérification incomplet."
  );
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; message?: string; error?: { message?: string } }
          | null;
        if (response.ok) {
          setStatus("success");
          setMessage(payload?.message ?? "Votre adresse email a bien été vérifiée.");
        } else {
          setStatus("error");
          setMessage(payload?.error?.message ?? "Lien de vérification invalide ou expiré.");
        }
      } catch {
        setStatus("error");
        setMessage("Vérification impossible pour le moment. Réessaie dans un instant.");
      }
    })();
  }, [token]);

  const icon =
    status === "loading" ? (
      <Loader2 className="h-6 w-6 animate-spin" />
    ) : status === "success" ? (
      <CheckCircle2 className="h-6 w-6" />
    ) : (
      <XCircle className="h-6 w-6" />
    );

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium sm:rounded-3xl sm:p-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-loden-pearl text-loden-700">
          {icon}
        </span>
        <h2 className="text-xl font-semibold text-loden-ink">
          {status === "success"
            ? "Email vérifié"
            : status === "error"
              ? "Vérification impossible"
              : "Vérification de l'email"}
        </h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-loden-muted">{message}</p>
      <Link
        className="focus-ring mt-6 inline-flex items-center justify-center rounded-full bg-loden-700 px-6 py-3 font-semibold text-white transition hover:bg-loden-800"
        href="/connexion"
      >
        Aller à la connexion
      </Link>
    </div>
  );
}
