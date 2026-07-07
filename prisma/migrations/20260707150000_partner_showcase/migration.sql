-- Vitrine publique des partenaires : opt-in (« Ils nous font confiance » sur le site).
-- publicVisible = affiché sur le site public ; logoUrl / websiteUrl pour le mur de logos.
-- Colonnes optionnelles, sans impact sur les partenaires existants (masqués par défaut).

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "publicVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Partner" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Partner" ADD COLUMN "websiteUrl" TEXT;
