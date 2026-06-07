-- Étend l'enum UserRole avec les rôles CRM.
-- Migration séparée : PostgreSQL n'autorise pas l'utilisation d'une nouvelle
-- valeur d'enum dans la même transaction que son ajout. Les valeurs sont donc
-- ajoutées ici, puis utilisées dans la migration suivante (add_agencies).
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTEUR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RESPONSABLE_AGENCE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RESPONSABLE_PEDAGOGIQUE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SECRETAIRE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPTABLE';
