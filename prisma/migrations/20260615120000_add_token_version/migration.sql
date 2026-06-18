-- Révocation de session stateless : un compteur de version de token par utilisateur.
-- Incrémenté à chaque réinitialisation de mot de passe -> les JWT émis avant deviennent
-- invalides (vérifié côté API à chaque requête authentifiée).
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
