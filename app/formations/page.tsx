import type { Metadata } from "next";
import { FormationExplorer } from "@/components/FormationExplorer";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Formations",
  description: "Permis B manuel, automatique, accéléré, conduite accompagnée, code en ligne et perfectionnement avec LODENE."
};

export default function FormationsPage() {
  return (
    <main>
      <PageHero
        eyebrow="Formations LODENE"
        title="Choisis la formation qui correspond à ton rythme"
        text="Recherche avancée, filtres par financement et parcours clair pour trouver le permis adapté."
        cta="Être rappelé"
      />
      <FormationExplorer />
    </main>
  );
}
