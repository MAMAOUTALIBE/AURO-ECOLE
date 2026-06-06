import { Router } from "express";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { notFound } from "../../shared/http-error";

export function createInstructorsRouter(repository: LodenRepository) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      res.json({ data: await repository.listInstructors() });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const instructor = await repository.findInstructorById(String(req.params.id));
      if (!instructor) throw notFound("Moniteur introuvable");
      res.json({ data: instructor });
    })
  );

  return router;
}
