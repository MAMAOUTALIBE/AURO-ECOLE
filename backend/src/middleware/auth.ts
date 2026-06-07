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
