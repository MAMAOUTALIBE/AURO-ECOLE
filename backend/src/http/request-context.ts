import type { Request } from "express";
import type { UserRecord } from "../domain/types";

// Champs sensibles jamais exposés dans une réponse : hash de mot de passe et jetons de reset,
// plus le compteur de version de jeton (détail interne d'invalidation de session).
export type PublicUser = Omit<
  UserRecord,
  "passwordHash" | "resetTokenHash" | "resetTokenExpiresAt" | "tokenVersion"
>;

export type AuthenticatedRequest = Request & {
  user?: PublicUser;
  token?: string;
};

export function publicUser(user: UserRecord): PublicUser {
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, tokenVersion, ...safe } = user;
  void passwordHash;
  void resetTokenHash;
  void resetTokenExpiresAt;
  void tokenVersion;
  return safe;
}
