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
  "MONITEUR"
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
