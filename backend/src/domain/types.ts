export type UserRole =
  | "SUPER_ADMIN"
  | "DIRECTEUR"
  | "RESPONSABLE_AGENCE"
  | "RESPONSABLE_PEDAGOGIQUE"
  | "ADMIN"
  | "SECRETAIRE"
  | "COMPTABLE"
  | "MONITEUR"
  | "ELEVE"
  | "VISITEUR";

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

export type FormationRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  mode: "MANUEL" | "AUTOMATIQUE" | "MIXTE" | "CODE";
  priceCents: number;
  durationLabel: string;
  defaultHours?: number | null;
  imageUrl?: string | null;
  options?: unknown;
  cpfEligible: boolean;
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
