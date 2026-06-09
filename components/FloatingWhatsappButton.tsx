import { MessageCircle } from "lucide-react";
import { contactInfo } from "@/data/site";

export function FloatingWhatsappButton() {
  // Aucun numéro WhatsApp confirmé -> ne rien afficher (pas de lien wa.me cassé/trompeur).
  if (!contactInfo.whatsapp) return null;

  return (
    <a
      href={`https://wa.me/${contactInfo.whatsapp}`}
      className="focus-ring fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-loden-700 text-white shadow-premium transition hover:bg-loden-800"
      aria-label="Contacter LODENE sur WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
