import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isAdminRole, verifyJwt } from "@/lib/auth-session";

// Secret partagé avec l'API (même valeur que backend JWT_SECRET). En dev, défaut
// aligné sur le backend ; en prod, fourni via l'environnement du process loden-web
// (voir ecosystem.config.cjs). La vraie sécurité des données reste l'API (RBAC).
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

// Protège le CRM /admin : la signature ET l'expiration du JWT sont vérifiées ;
// un cookie au rôle forgé ou expiré -> redirection /connexion.
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifyJwt(token, JWT_SECRET);

  if (!payload || !isAdminRole(payload.role)) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"]
};
