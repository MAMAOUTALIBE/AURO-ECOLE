import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../domain/types";
import { hasPermission, type Permission } from "../domain/permissions";
import type { LodenRepository } from "../repositories/loden-repository";
import { forbidden, unauthorized } from "../shared/http-error";
import type { AuthenticatedRequest } from "../http/request-context";
import { publicUser } from "../http/request-context";

type JwtPayload = {
  sub: string;
  role: UserRole;
};

export function authenticate(repository: LodenRepository, jwtSecret: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      const header = req.header("authorization");
      if (!header?.startsWith("Bearer ")) throw unauthorized();
      const token = header.slice("Bearer ".length);
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;
      const user = await repository.findUserById(payload.sub);
      if (!user || user.status !== "ACTIVE") throw unauthorized("Session invalide");
      req.user = publicUser(user);
      req.token = token;
      next();
    } catch (error) {
      next(error instanceof Error && error.name === "JsonWebTokenError" ? unauthorized("Token invalide") : error);
    }
  };
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

/**
 * Garde par permission fine. L'utilisateur passe s'il détient AU MOINS une des
 * permissions listées (sémantique OR). Le scope par agence viendra au Sprint 0.D.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    const granted = permissions.some((permission) => hasPermission(req.user!.role, permission));
    if (!granted) return next(forbidden());
    next();
  };
}

/**
 * Cloisonnement multi-agences. Résout l'agence effective d'une requête de liste/stats :
 * - SUPER_ADMIN / DIRECTEUR : toute agence (retourne l'agence demandée, ou undefined = toutes).
 * - Autres rôles : limités à leurs `AgencyMembership`. Demander une agence hors de leur
 *   périmètre -> 403 (corrige l'IDOR inter-agences). Sans agence explicite, on épingle sur
 *   leur agence d'affiliation. Aucun rattachement -> 403 (pas d'accès aux données d'agence).
 */
export async function resolveScopedAgencyId(
  repository: LodenRepository,
  req: AuthenticatedRequest,
  requestedAgencyId?: string
): Promise<string | undefined> {
  const user = req.user;
  if (!user) throw unauthorized();
  if (user.role === "SUPER_ADMIN" || user.role === "DIRECTEUR") return requestedAgencyId;
  const memberships = await repository.listAgencyMembershipsByUser(user.id);
  const ids = memberships.map((membership) => membership.agencyId);
  if (requestedAgencyId) {
    if (!ids.includes(requestedAgencyId)) throw forbidden();
    return requestedAgencyId;
  }
  if (ids.length === 0) throw forbidden();
  return ids[0];
}

/**
 * Vérifie qu'un utilisateur a le droit d'accéder à une ressource rattachée à `agencyId`
 * (lecture/écriture d'un enregistrement précis : fiche élève, etc.). Corrige l'IDOR unitaire.
 * SUPER_ADMIN/DIRECTEUR : tout. Ressource non rattachée (null) : autorisée (transition).
 */
export async function assertAgencyAccess(
  repository: LodenRepository,
  req: AuthenticatedRequest,
  agencyId?: string | null
): Promise<void> {
  const user = req.user;
  if (!user) throw unauthorized();
  if (user.role === "SUPER_ADMIN" || user.role === "DIRECTEUR") return;
  if (agencyId == null) return;
  const memberships = await repository.listAgencyMembershipsByUser(user.id);
  if (!memberships.some((membership) => membership.agencyId === agencyId)) throw forbidden();
}
