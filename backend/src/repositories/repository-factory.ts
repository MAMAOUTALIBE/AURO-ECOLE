import type { ApiConfig } from "../config/env";
import { buildDemoSeed } from "../data/demo-data";
import type { LodenRepository } from "./loden-repository";
import { MemoryLodenRepository } from "./memory-loden-repository";
import { PrismaLodenRepository } from "./prisma-loden-repository";

export function createRepository(config: ApiConfig): LodenRepository {
  if (config.API_USE_MEMORY || !config.DATABASE_URL) {
    // Mode démo (toggle) : seed mémoire réaliste et clairement marqué. Off par défaut.
    return new MemoryLodenRepository(config.API_DEMO_SEED ? buildDemoSeed() : undefined);
  }
  return new PrismaLodenRepository();
}
