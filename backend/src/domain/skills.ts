// Référentiel REMC (Référentiel pour l'Éducation à une Mobilité Citoyenne) — permis B.
// 4 grandes compétences, niveaux 0 (non abordé) à 4 (acquis).

export const SKILL_CATALOG: { code: string; label: string }[] = [
  { code: "C1", label: "Maîtriser le maniement du véhicule dans un trafic faible ou nul" },
  { code: "C2", label: "Appréhender la route et circuler dans des conditions normales" },
  { code: "C3", label: "Circuler dans des conditions difficiles et partager la route" },
  { code: "C4", label: "Pratiquer une conduite autonome, sûre et économique" }
];

export const SKILL_CODES = SKILL_CATALOG.map((skill) => skill.code);
export const MAX_SKILL_LEVEL = 4;
