import type { Metadata } from "next";
import { VehiclesManager } from "@/components/crm/VehiclesManager";
import { CrmPageHeader } from "@/components/crm/ui";

export const metadata: Metadata = {
  title: "Véhicules",
  robots: { index: false, follow: false }
};

export default function AdminVehiclesPage() {
  return (
    <>
      <CrmPageHeader
        eyebrow="Pédagogie"
        title="Parc automobile"
        subtitle="Gérez les véhicules de l'auto-école : transmission, immatriculation, moniteur affecté, mise en service."
      />
      <VehiclesManager />
    </>
  );
}
