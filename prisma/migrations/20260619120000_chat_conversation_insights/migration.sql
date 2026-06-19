-- Persistance enrichie des conversations chatbot : résumé, intention détectée,
-- confiance et dernier message (pour le suivi CRM des conversations publiques).
ALTER TABLE "ChatConversation" ADD COLUMN "summary" TEXT;
ALTER TABLE "ChatConversation" ADD COLUMN "intent" TEXT;
ALTER TABLE "ChatConversation" ADD COLUMN "aiConfidence" INTEGER;
ALTER TABLE "ChatConversation" ADD COLUMN "lastMessage" TEXT;
