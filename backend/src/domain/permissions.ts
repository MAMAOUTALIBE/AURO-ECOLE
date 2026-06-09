import type { UserRole } from "./types";

/**
 * Permissions fines `module.action`. Sert de socle au RBAC serveur.
 * Le scope par agence (own/agency/all) sera ajouté au Sprint 0.D.
 */
export type Permission =
  | "dashboard.read"
  | "catalog.manage"
  | "students.read"
  | "students.manage"
  | "instructors.read"
  | "instructors.manage"
  | "bookings.read"
  | "bookings.manage"
  | "payments.read"
  | "payments.manage"
  | "payments.refund"
  | "invoices.read"
  | "invoices.manage"
  | "quotes.read"
  | "quotes.manage"
  | "contracts.read"
  | "contracts.manage"
  | "cpf.read"
  | "cpf.manage"
  | "exams.read"
  | "exams.manage"
  | "contacts.read"
  | "contacts.manage"
  | "leads.read"
  | "leads.manage"
  | "reviews.read"
  | "reviews.moderate"
  | "users.read"
  | "users.manage"
  | "content.manage"
  | "agency.manage"
  | "roles.manage"
  | "audit.read";

// Ensemble opérationnel courant (hors plateforme : agency/roles).
const OPERATIONS: Permission[] = [
  "dashboard.read",
  "catalog.manage",
  "students.read",
  "students.manage",
  "instructors.read",
  "instructors.manage",
  "bookings.read",
  "bookings.manage",
  "payments.read",
  "payments.manage",
  "payments.refund",
  "invoices.read",
  "invoices.manage",
  "quotes.read",
  "quotes.manage",
  "contracts.read",
  "contracts.manage",
  "cpf.read",
  "cpf.manage",
  "exams.read",
  "exams.manage",
  "contacts.read",
  "contacts.manage",
  "leads.read",
  "leads.manage",
  "reviews.read",
  "reviews.moderate",
  "users.read",
  "content.manage",
  "audit.read"
];

/**
 * Presets par rôle. SUPER_ADMIN et DIRECTEUR ont tout (géré dans hasPermission).
 */
export const ROLE_PERMISSIONS: Partial<Record<UserRole, Permission[]>> = {
  RESPONSABLE_AGENCE: [...OPERATIONS, "agency.manage"],
  ADMIN: [...OPERATIONS],
  RESPONSABLE_PEDAGOGIQUE: [
    "dashboard.read",
    "students.read",
    "students.manage",
    "instructors.read",
    "instructors.manage",
    "bookings.read",
    "bookings.manage",
    "cpf.read",
    "exams.read",
    "exams.manage",
    "contacts.read",
    "leads.read",
    "reviews.read",
    "reviews.moderate",
    "users.read",
    "audit.read"
  ],
  SECRETAIRE: [
    "dashboard.read",
    "students.read",
    "students.manage",
    "bookings.read",
    "bookings.manage",
    "cpf.read",
    "cpf.manage",
    "exams.read",
    "contacts.read",
    "contacts.manage",
    "leads.read",
    "leads.manage",
    "reviews.read",
    "payments.read",
    "invoices.read",
    "quotes.read",
    "quotes.manage",
    "contracts.read",
    "contracts.manage"
  ],
  COMPTABLE: [
    "dashboard.read",
    "payments.read",
    "payments.manage",
    "payments.refund",
    "invoices.read",
    "invoices.manage",
    "quotes.read",
    "quotes.manage",
    "contracts.read",
    "cpf.read",
    "cpf.manage",
    "students.read",
    "leads.read",
    "contacts.read"
  ],
  MONITEUR: ["dashboard.read", "bookings.read", "bookings.manage", "students.read", "exams.read", "reviews.read"]
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === "SUPER_ADMIN" || role === "DIRECTEUR") return true;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

// Référentiel complet (lecture seule) — sert à exposer la matrice RBAC dans le CRM.
export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.read",
  "catalog.manage",
  "students.read",
  "students.manage",
  "instructors.read",
  "instructors.manage",
  "bookings.read",
  "bookings.manage",
  "payments.read",
  "payments.manage",
  "payments.refund",
  "invoices.read",
  "invoices.manage",
  "quotes.read",
  "quotes.manage",
  "contracts.read",
  "contracts.manage",
  "cpf.read",
  "cpf.manage",
  "exams.read",
  "exams.manage",
  "contacts.read",
  "contacts.manage",
  "leads.read",
  "leads.manage",
  "reviews.read",
  "reviews.moderate",
  "users.read",
  "users.manage",
  "content.manage",
  "agency.manage",
  "roles.manage",
  "audit.read"
];

export const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "DIRECTEUR",
  "RESPONSABLE_AGENCE",
  "RESPONSABLE_PEDAGOGIQUE",
  "ADMIN",
  "SECRETAIRE",
  "COMPTABLE",
  "MONITEUR",
  "ELEVE",
  "VISITEUR"
];
