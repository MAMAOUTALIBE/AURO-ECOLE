import type { ApiConfig } from "../config/env";
import type { LodenRepository } from "./loden-repository";
import { MemoryLodenRepository } from "./memory-loden-repository";
import { PrismaLodenRepository } from "./prisma-loden-repository";

export function createRepository(config: ApiConfig): LodenRepository {
  if (config.API_USE_MEMORY || !config.DATABASE_URL) {
    return new MemoryLodenRepository();
  }
  return new PrismaLodenRepository();
}
