import { Router } from "express";
import type { ApiConfig } from "../../config/env";
import type { AuthenticatedRequest } from "../../http/request-context";
import { authenticate } from "../../middleware/auth";
import type { LodenRepository } from "../../repositories/loden-repository";
import { asyncHandler } from "../../shared/async-handler";
import { unauthorized } from "../../shared/http-error";

export function createAgenciesRouter(repository: LodenRepository, config: ApiConfig) {
  const router = Router();
  router.use(authenticate(repository, config.JWT_SECRET));

  // Agences accessibles à l'utilisateur : tout pour SUPER_ADMIN/DIRECTEUR,
  // sinon celles de ses affiliations (AgencyMembership).
  router.get(
    "/",
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = req.user;
      if (!user) throw unauthorized();

      const agencies = await repository.listAgencies();

      if (user.role === "SUPER_ADMIN" || user.role === "DIRECTEUR") {
        res.json({ data: agencies });
        return;
      }

      const memberships = await repository.listAgencyMembershipsByUser(user.id);
      const agencyIds = new Set(memberships.map((membership) => membership.agencyId));
      res.json({ data: agencies.filter((agency) => agencyIds.has(agency.id)) });
    })
  );

  return router;
}
