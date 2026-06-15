import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isAdminRole, verifyJwt } from "@/lib/auth-session";

// Secret partagé avec l'API (même valeur que backend JWT_SECRET). En dev, défaut
// aligné sur le backend ; en PROD on N'UTILISE PAS le défaut dev (évite le « split-brain »
// où le web vérifierait avec un secret différent de l'API). Un secret absent en prod ->
// vérification qui échoue -> redirection /connexion (fail-closed). La vraie sécurité
// des données reste l'API (RBAC). Voir ecosystem.config.cjs pour l'injection en prod.
const JWT_SECRET =
  process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-secret-change-me");

// Protège les zones authentifiées : la signature ET l'expiration du JWT sont
// vérifiées côté serveur (un cookie au rôle forgé ou expiré -> redirection).
// - /espace-eleve et /espace-formateur exigent une session valide.
// - /admin (CRM) exige en plus un rôle admin.
// La sécurité des données reste assurée par le RBAC de l'API ; ce middleware
// évite surtout d'afficher la coquille d'une zone protégée à un visiteur anonyme.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifyJwt(token, JWT_SECRET);
  const { pathname } = request.nextUrl;

  const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const hasValidSession = Boolean(payload);
  const authorized = needsAdmin ? hasValidSession && isAdminRole(payload!.role) : hasValidSession;

  if (!authorized) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/espace-eleve",
    "/espace-eleve/:path*",
    "/espace-formateur",
    "/espace-formateur/:path*"
  ]
};
