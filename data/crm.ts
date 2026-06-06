export type CrmModuleId =
  | "overview"
  | "sales"
  | "students"
  | "instructors"
  | "bookings"
  | "exams"
  | "payments"
  | "cpf"
  | "content"
  | "media"
  | "communication"
  | "reviews"
  | "support"
  | "settings";

export type CrmModuleStatus = "live" | "foundation" | "planned";

export type CrmModuleDefinition = {
  id: CrmModuleId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  status: CrmModuleStatus;
  primaryRoles: string[];
  workflows: string[];
  apiSurfaces: string[];
};

export const crmModules: CrmModuleDefinition[] = [
  {
    id: "overview",
    label: "Dashboard principal",
    shortLabel: "Dashboard",
    description: "Vue temps reel de l'activite, des alertes et des priorites operationnelles.",
    icon: "LayoutDashboard",
    status: "live",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "RESPONSABLE_PEDAGOGIQUE"],
    workflows: ["Pilotage quotidien", "Alertes importantes", "Statistiques temps reel"],
    apiSurfaces: ["/api/users", "/api/students", "/api/bookings", "/api/payments", "/api/cpf/requests"]
  },
  {
    id: "sales",
    label: "CRM commercial",
    shortLabel: "Pipeline",
    description: "Pipeline prospect, relance, devis, inscription et analyse des conversions.",
    icon: "KanbanSquare",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN"],
    workflows: ["Qualification prospect", "Relance", "Devis envoye", "Inscription"],
    apiSurfaces: ["/api/leads", "/api/contact-requests", "/api/search"]
  },
  {
    id: "students",
    label: "Eleves",
    shortLabel: "Eleves",
    description: "Fiches eleves, progression, documents, commentaires internes et historique.",
    icon: "GraduationCap",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "RESPONSABLE_PEDAGOGIQUE"],
    workflows: ["Inscription", "Suivi pedagogique", "Preparation examen"],
    apiSurfaces: ["/api/users?role=ELEVE", "/api/students", "/api/bookings", "/api/payments"]
  },
  {
    id: "instructors",
    label: "Moniteurs",
    shortLabel: "Moniteurs",
    description: "Profils, disponibilites, planning, zones, notation et historique de cours.",
    icon: "UsersRound",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "RESPONSABLE_PEDAGOGIQUE", "MONITEUR"],
    workflows: ["Planning moniteur", "Validation heures", "Suivi qualite"],
    apiSurfaces: ["/api/instructors", "/api/bookings/slots", "/api/reviews"]
  },
  {
    id: "bookings",
    label: "Reservations",
    shortLabel: "Planning",
    description: "Calendrier jour/semaine/mois, reports, annulations, conflits et affectations.",
    icon: "CalendarDays",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "RESPONSABLE_PEDAGOGIQUE", "MONITEUR"],
    workflows: ["Reservation", "Annulation", "Report", "Conflit planning"],
    apiSurfaces: ["/api/bookings", "/api/bookings/slots"]
  },
  {
    id: "exams",
    label: "Examens",
    shortLabel: "Examens",
    description: "Places disponibles, examens code/conduite, resultats et taux de reussite.",
    icon: "BadgeCheck",
    status: "planned",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "RESPONSABLE_PEDAGOGIQUE"],
    workflows: ["Programmation examen", "Resultat", "Analyse reussite"],
    apiSurfaces: ["/api/exams", "/api/students"]
  },
  {
    id: "payments",
    label: "Paiements",
    shortLabel: "Paiements",
    description: "Paiements, acomptes, echeances, remboursements, factures et impayes.",
    icon: "CreditCard",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN"],
    workflows: ["Paiement formation", "Relance impaye", "Export comptable"],
    apiSurfaces: ["/api/payments", "/api/payments/payment-intents"]
  },
  {
    id: "cpf",
    label: "CPF",
    shortLabel: "CPF",
    description: "Demandes CPF, pieces justificatives, statuts et accompagnement administratif.",
    icon: "FileText",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN"],
    workflows: ["Nouvelle demande", "Documents manquants", "Validation"],
    apiSurfaces: ["/api/cpf/requests"]
  },
  {
    id: "content",
    label: "Contenus",
    shortLabel: "Contenus",
    description: "Blog, actualites, FAQ, SEO, promotions et pages du site.",
    icon: "Newspaper",
    status: "planned",
    primaryRoles: ["SUPER_ADMIN", "ADMIN"],
    workflows: ["Article", "Promotion", "FAQ", "SEO"],
    apiSurfaces: ["/api/content/articles", "/api/content/news", "/api/faq"]
  },
  {
    id: "media",
    label: "Medias",
    shortLabel: "Medias",
    description: "Images, videos, PDF, dossiers, tags, recherche et bibliotheque de documents.",
    icon: "FolderOpen",
    status: "planned",
    primaryRoles: ["SUPER_ADMIN", "ADMIN"],
    workflows: ["Upload", "Classement", "Recherche", "Publication"],
    apiSurfaces: ["/api/media"]
  },
  {
    id: "communication",
    label: "Communication",
    shortLabel: "Comms",
    description: "Emails, SMS, notifications, rappels rendez-vous, campagnes et relances.",
    icon: "Send",
    status: "planned",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "MONITEUR"],
    workflows: ["Rappel RDV", "Relance CPF", "Relance paiement", "Campagne"],
    apiSurfaces: ["/api/messages", "/api/notifications", "/api/campaigns"]
  },
  {
    id: "reviews",
    label: "Avis clients",
    shortLabel: "Avis",
    description: "Avis internes, avis Google, moderation, satisfaction et statistiques qualite.",
    icon: "Star",
    status: "foundation",
    primaryRoles: ["SUPER_ADMIN", "ADMIN", "RESPONSABLE_PEDAGOGIQUE"],
    workflows: ["Moderation", "Publication", "Analyse satisfaction"],
    apiSurfaces: ["/api/reviews?includeUnpublished=true"]
  },
  {
    id: "support",
    label: "Support",
    shortLabel: "Support",
    description: "Tickets, demandes clients, historique, reponses et priorisation.",
    icon: "LifeBuoy",
    status: "planned",
    primaryRoles: ["SUPER_ADMIN", "ADMIN"],
    workflows: ["Ticket", "Assignation", "Reponse", "Resolution"],
    apiSurfaces: ["/api/support/tickets"]
  },
  {
    id: "settings",
    label: "Parametres",
    shortLabel: "Reglages",
    description: "Agences, horaires, roles, permissions, modeles email/SMS et configuration globale.",
    icon: "Settings",
    status: "planned",
    primaryRoles: ["SUPER_ADMIN"],
    workflows: ["Agence", "Roles", "Permissions", "Modeles"],
    apiSurfaces: ["/api/settings", "/api/roles", "/api/permissions"]
  }
];

export const crmRoles = [
  {
    role: "SUPER_ADMIN",
    scope: "Acces complet plateforme, agences, roles, statistiques et parametres globaux."
  },
  {
    role: "ADMIN",
    scope: "Gestion eleves, moniteurs, reservations, paiements, CPF, formations et contenus."
  },
  {
    role: "RESPONSABLE_PEDAGOGIQUE",
    scope: "Suivi pedagogique eleves/moniteurs, examens et performances."
  },
  {
    role: "MONITEUR",
    scope: "Planning personnel, eleves affectes, validation des heures et commentaires."
  }
];

export const salesPipelineStages = [
  { id: "prospect", label: "Prospect", description: "Demande entrante ou recherche detectee.", color: "bg-sky-50 text-sky-700" },
  { id: "contacted", label: "Contacte", description: "Premier contact effectue.", color: "bg-loden-50 text-loden-700" },
  { id: "followup", label: "Relance", description: "Relance commerciale planifiee.", color: "bg-amber-50 text-amber-700" },
  { id: "quote", label: "Devis envoye", description: "Pack ou CPF propose.", color: "bg-indigo-50 text-indigo-700" },
  { id: "won", label: "Inscrit", description: "Compte eleve cree.", color: "bg-emerald-50 text-emerald-700" },
  { id: "lost", label: "Perdu", description: "Prospect archive avec raison.", color: "bg-slate-100 text-slate-700" }
];

export const crmRoadmap = [
  {
    phase: "Phase 1",
    title: "Centre de commande",
    status: "En cours",
    items: ["Dashboard temps reel", "Recherche universelle", "Pipeline commercial", "Vues CRM par module"]
  },
  {
    phase: "Phase 2",
    title: "Operations auto-ecole",
    status: "A construire",
    items: ["Fiches eleves detaillees", "Planning jour/semaine/mois", "Examens", "Validation heures moniteur"]
  },
  {
    phase: "Phase 3",
    title: "Finance et automation",
    status: "A construire",
    items: ["Stripe webhooks", "Factures", "Relances impayes", "Relances CPF et SMS"]
  },
  {
    phase: "Phase 4",
    title: "Multi-agences et contenu",
    status: "A construire",
    items: ["Agences", "Permissions fines", "Blog/FAQ", "Medias et documents"]
  }
];
