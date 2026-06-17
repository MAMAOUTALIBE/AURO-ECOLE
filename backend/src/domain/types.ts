export type UserRole =
  | "SUPER_ADMIN"
  | "DIRECTEUR"
  | "RESPONSABLE_AGENCE"
  | "RESPONSABLE_PEDAGOGIQUE"
  | "ADMIN"
  | "SECRETAIRE"
  | "COMPTABLE"
  | "MONITEUR"
  | "EDITEUR"
  | "ELEVE"
  | "VISITEUR";

// Réglage dynamique du site public (clé/valeur JSON), piloté depuis le CMS.
export type SiteSettingRecord = {
  key: string;
  value: unknown;
  updatedAt: Date;
};

// Média uploadé depuis le CMS (image, PDF…), réutilisable (formations, hero, blocs…).
export type MediaRecord = {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  category?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AgencyRecord = {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
};

export type AgencyMembershipRecord = {
  id: string;
  userId: string;
  agencyId: string;
  role: UserRole;
  isPrimary: boolean;
};

export type VehicleRecord = {
  id: string;
  instructorId?: string | null;
  label: string;
  transmission: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  registration?: string | null;
  active: boolean;
  agencyId?: string | null;
};
export type UserStatus = "PENDING_EMAIL" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type BookingStatus = "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "TERMINEE" | "ABSENT";
export type PaymentStatus = "EN_ATTENTE" | "PAYE" | "ECHOUE" | "REMBOURSE" | "PARTIEL";
export type CpfRequestStatus =
  | "NOUVELLE_DEMANDE"
  | "EN_COURS"
  | "DOCUMENTS_MANQUANTS"
  | "VALIDEE"
  | "REFUSEE";
export type ContactRequestStatus = "NOUVELLE" | "EN_COURS" | "TRAITEE" | "ARCHIVEE";
export type ReviewStatus = "EN_ATTENTE" | "PUBLIE" | "REJETE";
export type LeadStatus = "PROSPECT" | "CONTACTE" | "RELANCE" | "DEVIS_ENVOYE" | "INSCRIT" | "PERDU";
export type StudentSkillRecord = {
  id: string;
  studentId: string;
  skillCode: string;
  level: number;
  updatedAt: Date;
};

export type StudentDocumentRecord = {
  id: string;
  studentId: string;
  type: string;
  url: string;
  verifiedAt?: Date | null;
  createdAt: Date;
};

export type InstallmentStatus = "EN_ATTENTE" | "PAYE" | "EN_RETARD";

export type InstallmentRecord = {
  id: string;
  studentId: string;
  agencyId?: string | null;
  label?: string | null;
  dueDate: Date;
  amountCents: number;
  status: InstallmentStatus;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExamType = "CODE" | "CONDUITE";
export type ExamResult = "EN_ATTENTE" | "REUSSI" | "ECHOUE" | "ABSENT";

export type ExamRecord = {
  id: string;
  studentId: string;
  agencyId?: string | null;
  type: ExamType;
  scheduledAt: Date;
  center?: string | null;
  result: ExamResult;
  score?: number | null;
  attempt: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string | null;
  preferences?: unknown;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Date | null;
  // Version de session : incrémentée au reset de mot de passe pour invalider les JWT antérieurs.
  tokenVersion?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentRecord = {
  id: string;
  userId: string;
  agencyId?: string | null;
  formationId?: string | null;
  progressPercent: number;
  purchasedHours: number;
  consumedHours: number;
  examDate?: Date | null;
  fileStatus: string;
  internalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InstructorRecord = {
  id: string;
  userId: string;
  agencyId?: string | null;
  name: string;
  photoUrl?: string | null;
  bio?: string | null;
  specialties: string[];
  interventionZones: string[];
  ratingAverage: number;
  ratingCount: number;
  active: boolean;
};

export type ProductLine = "AUTO_ECOLE" | "VTC" | "CACES" | "SST" | "LOGISTIQUE_SECURITE";
export type TaxMode = "TTC" | "HT";
export type CpfStatus = "NON_RENSEIGNE" | "NON_ELIGIBLE" | "POSSIBLE" | "A_CONFIRMER" | "ELIGIBLE";

// Informations administratives de l'entreprise (singleton, éditable via le CMS).
// Seuls les champs officiellement vérifiés sont renseignés ; le reste reste vide.
export type CompanyInfoRecord = {
  id: string;
  brandName: string;
  legalName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  siret: string;
  approvalNumber: string;
  phone: string;
  email: string;
  hours: string;
  legalForm: string;
  capital: string;
  publicationDirector: string;
  hostingProvider: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  updatedAt: Date;
};

export type FormationRecord = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  mode: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  productLine?: ProductLine;
  priceCents: number;
  taxMode?: TaxMode;
  quoteOnly?: boolean;
  // Prix interne (base de calcul de devis) — JAMAIS exposé côté public ni agent IA public.
  internalPriceCents?: number | null;
  durationLabel: string;
  defaultHours?: number | null;
  imageUrl?: string | null;
  options?: unknown;
  tags?: string[];
  cpfEligible: boolean;
  cpfStatus?: CpfStatus;
  active: boolean;
};

export type PricingPlanRecord = {
  id: string;
  formationId?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  priceCents: number;
  features: string[];
  allowOneShotPayment: boolean;
  allowThreeTimes: boolean;
  allowFourTimes: boolean;
  discountCents: number;
  promotionalLabel?: string | null;
  active: boolean;
};

export type MeetingPointRecord = {
  id: string;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  agencyId?: string | null;
  active: boolean;
};

export type AvailabilityRecord = {
  id: string;
  instructorId: string;
  agencyId?: string | null;
  startsAt: Date;
  endsAt: Date;
  isAvailable: boolean;
  reason?: string | null;
};

export type BookingRecord = {
  id: string;
  studentId: string;
  instructorId: string;
  formationId: string;
  agencyId?: string | null;
  meetingPointId?: string | null;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  agencyId?: string | null;
  pricingPlanId?: string | null;
  kind: "FORMATION" | "ACOMPTE" | "ECHEANCE" | "REMBOURSEMENT";
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  stripePaymentIntentId?: string | null;
  invoiceUrl?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceStatus = "BROUILLON" | "EMISE" | "PAYEE" | "ANNULEE";

// Ligne de facture. Montant unitaire HT en centimes ; TVA en points de % (0, 5.5, 10, 20).
export type InvoiceLineItem = {
  label: string;
  quantity: number;
  unitAmountCents: number;
  vatRate: number;
};

// Copie figée de l'émetteur (depuis CompanyInfoRecord) au moment de l'émission.
// Champs non renseignés -> vides (jamais inventés).
export type InvoiceIssuerSnapshot = {
  legalName: string;
  legalForm: string;
  capital: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  siret: string;
  approvalNumber: string;
  phone: string;
  email: string;
};

// Copie figée du client (particulier) au moment de l'émission.
export type InvoiceClientSnapshot = {
  name: string;
  email: string;
  address: string;
};

// Facture CRM. CE N'EST PAS un logiciel fiscal certifié (assumé dans l'UI).
export type InvoiceRecord = {
  id: string;
  number: string | null; // null en BROUILLON ; FAC-AAAA-NNNNNN à l'émission, immuable
  status: InvoiceStatus;
  clientUserId: string;
  studentId?: string | null;
  agencyId?: string | null;
  paymentId?: string | null;
  lines: InvoiceLineItem[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  currency: string;
  issuerSnapshot?: InvoiceIssuerSnapshot | null;
  clientSnapshot?: InvoiceClientSnapshot | null;
  issuedAt?: Date | null;
  dueDate?: Date | null;
  paidAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type QuoteStatus = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE";

// Devis. Réutilise les lignes et snapshots de la facture (mêmes formes).
// Le numéro DEV-AAAA-NNNNNN est attribué à l'envoi (BROUILLON -> ENVOYE).
export type QuoteRecord = {
  id: string;
  number: string | null;
  status: QuoteStatus;
  clientUserId: string;
  studentId?: string | null;
  agencyId?: string | null;
  lines: InvoiceLineItem[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  currency: string;
  issuerSnapshot?: InvoiceIssuerSnapshot | null;
  clientSnapshot?: InvoiceClientSnapshot | null;
  sentAt?: Date | null;
  validUntil?: Date | null;
  decidedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// CMS — pages de contenu et articles de blog (même modèle, discriminé par `type`).
export type ContentType = "PAGE" | "ARTICLE";
export type ContentEntryRecord = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  category?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  publishedAt?: Date | null;
  agencyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Automatisations : règle « déclencheur -> action », activable/désactivable.
export type AutomationTrigger = "LEAD_CREATED" | "STUDENT_CREATED";
export type AutomationAction = "SEND_WELCOME_EMAIL" | "NOTIFY_TEAM" | "LOG";
export type AutomationRuleRecord = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  active: boolean;
  agencyId?: string | null;
  runCount: number;
  lastRunAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContractStatus = "BROUILLON" | "ACTIF" | "RESILIE" | "TERMINE";

// Contrat de formation. Document texte + prix, signable (numéro attribué à l'activation).
export type ContractRecord = {
  id: string;
  number: string | null;
  status: ContractStatus;
  clientUserId: string;
  studentId?: string | null;
  formationId?: string | null;
  agencyId?: string | null;
  title: string;
  body: string;
  totalCents: number;
  currency: string;
  issuerSnapshot?: InvoiceIssuerSnapshot | null;
  clientSnapshot?: InvoiceClientSnapshot | null;
  signedAt?: Date | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CpfRequestRecord = {
  id: string;
  studentId?: string | null;
  formationId?: string | null;
  agencyId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  status: CpfRequestStatus;
  requestedAmountCents?: number | null;
  missingDocuments: string[];
  internalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactRequestRecord = {
  id: string;
  userId?: string | null;
  agencyId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  type: "INFORMATION" | "RAPPEL" | "INSCRIPTION" | "CPF" | "AUTRE";
  source?: string | null;
  message: string;
  status: ContactRequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewRecord = {
  id: string;
  userId?: string | null;
  instructorId?: string | null;
  agencyId?: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadRecord = {
  id: string;
  agencyId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  status: LeadStatus;
  source?: string | null;
  interest?: string | null;
  notes?: string | null;
  estimatedValueCents?: number | null;
  nextFollowUpAt?: Date | null;
  temperature?: string | null;
  score?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FaqEntryRecord = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  active: boolean;
};

export type AuditLogRecord = {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
  createdAt: Date;
};

export type SearchResult = {
  category: "formation" | "tarif" | "moniteur" | "faq" | "point_rdv" | "page";
  title: string;
  description: string;
  href: string;
  score: number;
};
