import type { InputHTMLAttributes } from "react";

// Nom du champ « pot de miel » — doit correspondre à HONEYPOT_FIELD côté backend
// (backend/src/shared/anti-spam.ts).
export const HONEYPOT_NAME = "website";

/**
 * Champ anti-spam invisible : positionné hors écran, hors tabulation et masqué à
 * l'AT. Un humain ne le remplit jamais ; les bots qui remplissent tous les champs
 * oui — le backend rejette alors la requête. `field` reçoit le retour de
 * `register(HONEYPOT_NAME)` de react-hook-form.
 */
export function HoneypotField({ field }: { field: InputHTMLAttributes<HTMLInputElement> }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "-9999px", width: 1, height: 1, overflow: "hidden" }}
    >
      <label>
        Ne pas remplir ce champ
        <input type="text" tabIndex={-1} autoComplete="off" {...field} />
      </label>
    </div>
  );
}
