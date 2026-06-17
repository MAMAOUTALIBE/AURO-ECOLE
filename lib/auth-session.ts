// Session partagée frontend (middleware edge + route handlers + client).
// Ne rien importer de spécifique à Node ici : ce module tourne aussi sur l'edge.

export const SESSION_COOKIE = "loden_session";

// Rôles autorisés à accéder au CRM /admin (tout sauf élève / visiteur public).
export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "DIRECTEUR",
  "RESPONSABLE_AGENCE",
  "RESPONSABLE_PEDAGOGIQUE",
  "ADMIN",
  "SECRETAIRE",
  "COMPTABLE",
  "MONITEUR",
  "EDITEUR"
] as const;

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Décode le claim `role` d'un JWT SANS vérifier la signature.
 * Sert uniquement de garde UX (redirection) côté middleware/client.
 * La vraie sécurité reste l'API (signature vérifiée + RBAC).
 */
export function decodeJwtRole(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export type JwtPayload = { sub?: string; role?: string; exp?: number; iat?: number };

// Vues adossées à un ArrayBuffer dédié (jamais SharedArrayBuffer) pour satisfaire
// les types stricts de crypto.subtle.
function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function utf8Bytes(value: string): Uint8Array<ArrayBuffer> {
  const source = new TextEncoder().encode(value);
  const bytes = new Uint8Array(new ArrayBuffer(source.byteLength));
  bytes.set(source);
  return bytes;
}

/**
 * Vérifie un JWT HS256 (signature + expiration) avec la Web Crypto API.
 * Edge-compatible (aucune dépendance Node). Renvoie le payload si valide, sinon null.
 * Utilisé par le middleware /admin pour ne plus faire confiance à un cookie au rôle forgé.
 */
export async function verifyJwt(token: string | undefined | null, secret: string): Promise<JwtPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      utf8Bytes(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureB64),
      utf8Bytes(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64))) as JwtPayload;
    if (typeof payload.exp === "number" && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
