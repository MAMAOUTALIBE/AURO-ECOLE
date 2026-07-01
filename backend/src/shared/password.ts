import { randomBytes } from "node:crypto";

// Mot de passe temporaire lisible (10 caractères, sans caractères ambigus 0/O/1/l/I),
// généré côté serveur et affiché UNE fois dans le CRM pour être transmis à l'élève.
export function generateTempPassword() {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set: string, count: number) => {
    const bytes = randomBytes(count);
    let out = "";
    for (let i = 0; i < count; i += 1) out += set[bytes[i] % set.length];
    return out;
  };
  return `${pick(upper, 3)}${pick(digits, 4)}${pick(lower, 3)}`;
}
