import { Router } from "express";
import { z } from "zod";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { validateQuery } from "../../shared/validation";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120)
});

export function createSearchRouter(repository: LodenRepository) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const query = validateQuery(searchQuerySchema, req);
      res.json({ data: await repository.search(query.q) });
    })
  );

  return router;
}
