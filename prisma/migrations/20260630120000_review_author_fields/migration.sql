-- Avis laissés directement sur le site par les clients : prénom + ville affichés.
ALTER TABLE "Review" ADD COLUMN "authorName" TEXT;
ALTER TABLE "Review" ADD COLUMN "authorLocation" TEXT;
