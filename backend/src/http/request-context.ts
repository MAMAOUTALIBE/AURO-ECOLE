import type { Request } from "express";
import type { UserRecord } from "../domain/types";

export type AuthenticatedRequest = Request & {
  user?: Omit<UserRecord, "passwordHash">;
  token?: string;
};

export function publicUser(user: UserRecord): Omit<UserRecord, "passwordHash"> {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}
