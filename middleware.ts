import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, decodeJwtRole, isAdminRole } from "@/lib/auth-session";

// Protège le CRM /admin : sans session valide ou rôle non autorisé -> /connexion.
// La sécurité réelle des données reste assurée par l'API (RBAC + signature JWT).
export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const role = decodeJwtRole(token);

  if (!isAdminRole(role)) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"]
};
