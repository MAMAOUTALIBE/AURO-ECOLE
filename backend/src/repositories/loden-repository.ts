import type {
  AgencyMembershipRecord,
  AgencyRecord,
  AuditLogRecord,
  AvailabilityRecord,
  BookingRecord,
  BookingStatus,
  CompanyInfoRecord,
  ExamRecord,
  InstallmentRecord,
  InvoiceRecord,
  InvoiceStatus,
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
  QuoteRecord,
  QuoteStatus,
  ContractRecord,
  ContractStatus,
  ContentEntryRecord,
  ContentType,
  AutomationRuleRecord,
  AutomationTrigger,
  AutomationAction,
  ChatAppointmentRecord,
  ChatAppointmentStatus,
  ChatAvailabilitySlotRecord,
  ChatConversationRecord,
  ChatTaskRecord,
  ChatTaskStatus,
  ContactRequestRecord,
  ContactRequestStatus,
  CpfRequestRecord,
  CpfRequestStatus,
  FaqEntryRecord,
  FormationRecord,
  InstructorRecord,
  LeadRecord,
  LeadStatus,
  MediaRecord,
  MeetingPointRecord,
  PaymentRecord,
  PaymentStatus,
  PricingPlanRecord,
  ReviewRecord,
  ReviewStatus,
  SearchResult,
  SiteSettingRecord,
  StudentRecord,
  StudentSkillRecord,
  StudentDocumentRecord,
  UserRecord,
  UserRole,
  VehicleRecord
} from "../domain/types";

export type CreateUserInput = Omit<UserRecord, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: UserRecord["status"];
};

export type CreateAgencyInput = Omit<AgencyRecord, "id" | "active"> & { active?: boolean };

export type CreateVehicleInput = Omit<VehicleRecord, "id" | "active"> & { active?: boolean };

export type CreateInvoiceInput = {
  clientUserId: string;
  studentId?: string | null;
  agencyId?: string | null;
  paymentId?: string | null;
  lines: { label: string; quantity: number; unitAmountCents: number; vatRate?: number }[];
  currency?: string;
  dueDate?: Date | null;
  notes?: string | null;
};

export type UpdateInvoiceInput = {
  status?: InvoiceStatus;
  notes?: string | null;
  dueDate?: Date | null;
  studentId?: string | null;
  agencyId?: string | null;
  lines?: { label: string; quantity: number; unitAmountCents: number; vatRate?: number }[];
};

export type CreateQuoteInput = {
  clientUserId: string;
  studentId?: string | null;
  agencyId?: string | null;
  lines: { label: string; quantity: number; unitAmountCents: number; vatRate?: number }[];
  validUntil?: Date | null;
  notes?: string | null;
};

export type UpdateQuoteInput = {
  status?: QuoteStatus;
  notes?: string | null;
  validUntil?: Date | null;
  studentId?: string | null;
  agencyId?: string | null;
  lines?: { label: string; quantity: number; unitAmountCents: number; vatRate?: number }[];
};

export type CreateContractInput = {
  clientUserId: string;
  studentId?: string | null;
  formationId?: string | null;
  agencyId?: string | null;
  title: string;
  body: string;
  totalCents?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  notes?: string | null;
};

export type UpdateContractInput = {
  status?: ContractStatus;
  title?: string;
  body?: string;
  totalCents?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  notes?: string | null;
  studentId?: string | null;
  agencyId?: string | null;
};

export type CreateContentEntryInput = {
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  category?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published?: boolean;
  agencyId?: string | null;
};

export type UpdateContentEntryInput = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  body?: string;
  coverImageUrl?: string | null;
  category?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published?: boolean;
};

export type CreateMediaInput = {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  category?: string | null;
  createdById?: string | null;
};

export type CreateAutomationRuleInput = {
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  active?: boolean;
  agencyId?: string | null;
};

export type UpdateAutomationRuleInput = {
  name?: string;
  trigger?: AutomationTrigger;
  action?: AutomationAction;
  active?: boolean;
};

export type CreateStudentInput = {
  userId: string;
  formationId?: string | null;
  purchasedHours?: number;
};

export type CreateInstructorInput = {
  userId: string;
  agencyId?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  specialties?: string[];
  interventionZones?: string[];
};

export type CreateBookingInput = Omit<BookingRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: BookingStatus;
};

export type CreateFormationInput = Omit<FormationRecord, "id">;

export type CreatePaymentInput = Omit<PaymentRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: PaymentRecord["status"];
};

export type CreateCpfRequestInput = Omit<CpfRequestRecord, "id" | "status" | "missingDocuments" | "createdAt" | "updatedAt"> & {
  status?: CpfRequestStatus;
  missingDocuments?: string[];
};

export type CreateContactRequestInput = Omit<ContactRequestRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: ContactRequestStatus;
};

export type CreateReviewInput = Omit<ReviewRecord, "id" | "status" | "publishedAt" | "createdAt" | "updatedAt"> & {
  status?: ReviewStatus;
};

export type CreateLeadInput = Omit<LeadRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: LeadStatus;
};

export type CreateChatAppointmentInput = Omit<
  ChatAppointmentRecord,
  | "id"
  | "source"
  | "adminEmailStatus"
  | "clientEmailStatus"
  | "whatsappStatus"
  | "createdAt"
  | "updatedAt"
> & {
  source?: "chatbot";
  adminEmailStatus?: ChatAppointmentRecord["adminEmailStatus"];
  clientEmailStatus?: ChatAppointmentRecord["clientEmailStatus"];
  whatsappStatus?: ChatAppointmentRecord["whatsappStatus"];
};

export type CreateChatTaskInput = Omit<ChatTaskRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: ChatTaskStatus;
};

export type CreateChatConversationInput = Omit<ChatConversationRecord, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: ChatConversationRecord["status"];
};

export type CreateChatAvailabilitySlotInput = Omit<
  ChatAvailabilitySlotRecord,
  "id" | "bookedCount" | "createdAt" | "updatedAt"
> & {
  bookedCount?: number;
};

export type UpdateChatAppointmentInput = Partial<
  Pick<
    ChatAppointmentRecord,
    | "status"
    | "assignedToId"
    | "message"
    | "adminEmailStatus"
    | "clientEmailStatus"
    | "whatsappStatus"
    | "whatsappMessage"
  >
>;

export type UpdateChatTaskInput = Partial<Pick<ChatTaskRecord, "status" | "assignedToId" | "deadline" | "note" | "priority">>;

export type UpdateChatAvailabilitySlotInput = Partial<
  Pick<ChatAvailabilitySlotRecord, "label" | "startsAt" | "endsAt" | "type" | "agencyId" | "assignedToId" | "active" | "capacity">
>;

export type CreateExamInput = Omit<ExamRecord, "id" | "result" | "attempt" | "createdAt" | "updatedAt"> & {
  result?: ExamRecord["result"];
  attempt?: number;
};

export type CreateInstallmentInput = Omit<InstallmentRecord, "id" | "status" | "paidAt" | "createdAt" | "updatedAt"> & {
  status?: InstallmentRecord["status"];
};

export type ListUsersFilters = {
  role?: UserRole;
};

export interface LodenRepository {
  listAgencies(): Promise<AgencyRecord[]>;
  findAgencyById(id: string): Promise<AgencyRecord | null>;
  createAgency(input: CreateAgencyInput): Promise<AgencyRecord>;
  updateAgency(id: string, input: Partial<AgencyRecord>): Promise<AgencyRecord>;
  listAgencyMembershipsByUser(userId: string): Promise<AgencyMembershipRecord[]>;

  listVehicles(filters?: { agencyId?: string }): Promise<VehicleRecord[]>;
  findVehicleById(id: string): Promise<VehicleRecord | null>;
  createVehicle(input: CreateVehicleInput): Promise<VehicleRecord>;
  updateVehicle(id: string, input: Partial<VehicleRecord>): Promise<VehicleRecord>;

  listInvoices(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: InvoiceStatus }): Promise<InvoiceRecord[]>;
  findInvoiceById(id: string): Promise<InvoiceRecord | null>;
  findInvoiceByPaymentId(paymentId: string): Promise<InvoiceRecord | null>;
  createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord>;
  updateInvoice(id: string, input: UpdateInvoiceInput): Promise<InvoiceRecord>;
  issueInvoice(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }): Promise<InvoiceRecord>;
  deleteInvoice(id: string): Promise<void>;

  listQuotes(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: QuoteStatus }): Promise<QuoteRecord[]>;
  findQuoteById(id: string): Promise<QuoteRecord | null>;
  createQuote(input: CreateQuoteInput): Promise<QuoteRecord>;
  updateQuote(id: string, input: UpdateQuoteInput): Promise<QuoteRecord>;
  sendQuote(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }): Promise<QuoteRecord>;
  deleteQuote(id: string): Promise<void>;

  listContracts(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: ContractStatus }): Promise<ContractRecord[]>;
  findContractById(id: string): Promise<ContractRecord | null>;
  createContract(input: CreateContractInput): Promise<ContractRecord>;
  updateContract(id: string, input: UpdateContractInput): Promise<ContractRecord>;
  activateContract(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }): Promise<ContractRecord>;
  deleteContract(id: string): Promise<void>;

  listContentEntries(filters?: { type?: ContentType; published?: boolean }): Promise<ContentEntryRecord[]>;
  findContentEntryById(id: string): Promise<ContentEntryRecord | null>;
  findContentEntryBySlug(slug: string): Promise<ContentEntryRecord | null>;
  createContentEntry(input: CreateContentEntryInput): Promise<ContentEntryRecord>;
  updateContentEntry(id: string, input: UpdateContentEntryInput): Promise<ContentEntryRecord>;
  deleteContentEntry(id: string): Promise<void>;

  listAutomationRules(filters?: { trigger?: AutomationTrigger; active?: boolean }): Promise<AutomationRuleRecord[]>;
  findAutomationRuleById(id: string): Promise<AutomationRuleRecord | null>;
  createAutomationRule(input: CreateAutomationRuleInput): Promise<AutomationRuleRecord>;
  updateAutomationRule(id: string, input: UpdateAutomationRuleInput): Promise<AutomationRuleRecord>;
  deleteAutomationRule(id: string): Promise<void>;
  recordAutomationRun(id: string): Promise<void>;

  listUsers(filters?: ListUsersFilters): Promise<UserRecord[]>;
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserByResetTokenHash(hash: string): Promise<UserRecord | null>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
  updateUser(id: string, input: Partial<UserRecord>): Promise<UserRecord>;

  listStudents(filters?: { agencyId?: string }): Promise<StudentRecord[]>;
  findStudentById(id: string): Promise<StudentRecord | null>;
  findStudentByUserId(userId: string): Promise<StudentRecord | null>;
  createStudent(input: CreateStudentInput): Promise<StudentRecord>;
  updateStudent(id: string, input: Partial<StudentRecord>): Promise<StudentRecord>;
  getCompanyInfo(): Promise<CompanyInfoRecord>;
  updateCompanyInfo(input: Partial<CompanyInfoRecord>): Promise<CompanyInfoRecord>;

  listSiteSettings(): Promise<SiteSettingRecord[]>;
  getSiteSetting(key: string): Promise<SiteSettingRecord | null>;
  upsertSiteSetting(key: string, value: unknown): Promise<SiteSettingRecord>;
  deleteSiteSetting(key: string): Promise<void>;

  listMedia(filters?: { category?: string }): Promise<MediaRecord[]>;
  findMediaById(id: string): Promise<MediaRecord | null>;
  createMedia(input: CreateMediaInput): Promise<MediaRecord>;
  updateMedia(id: string, input: { altText?: string; category?: string | null }): Promise<MediaRecord>;
  deleteMedia(id: string): Promise<MediaRecord | null>;

  listStudentSkills(studentId: string): Promise<StudentSkillRecord[]>;
  setStudentSkill(studentId: string, skillCode: string, level: number): Promise<StudentSkillRecord>;
  listStudentDocuments(studentId: string): Promise<StudentDocumentRecord[]>;
  createStudentDocument(input: { studentId: string; type: string; url: string }): Promise<StudentDocumentRecord>;
  setStudentDocumentVerified(id: string, verified: boolean): Promise<StudentDocumentRecord>;
  deleteStudentDocument(id: string): Promise<void>;

  listInstructors(): Promise<InstructorRecord[]>;
  findInstructorById(id: string): Promise<InstructorRecord | null>;
  createInstructor(input: CreateInstructorInput): Promise<InstructorRecord>;
  updateInstructor(id: string, input: Partial<InstructorRecord>): Promise<InstructorRecord>;

  listFormations(includeInactive?: boolean): Promise<FormationRecord[]>;
  findFormationById(id: string): Promise<FormationRecord | null>;
  findFormationBySlug(slug: string): Promise<FormationRecord | null>;
  createFormation(input: CreateFormationInput): Promise<FormationRecord>;
  updateFormation(id: string, input: Partial<FormationRecord>): Promise<FormationRecord>;

  listPricingPlans(includeInactive?: boolean): Promise<PricingPlanRecord[]>;
  findPricingPlanById(id: string): Promise<PricingPlanRecord | null>;

  listMeetingPoints(): Promise<MeetingPointRecord[]>;
  listFaqEntries(includeInactive?: boolean): Promise<FaqEntryRecord[]>;
  createFaqEntry(input: Omit<FaqEntryRecord, "id">): Promise<FaqEntryRecord>;
  updateFaqEntry(id: string, input: Partial<FaqEntryRecord>): Promise<FaqEntryRecord>;
  deleteFaqEntry(id: string): Promise<void>;
  listAvailabilities(instructorId?: string): Promise<AvailabilityRecord[]>;

  listBookings(filters?: { studentId?: string; instructorId?: string; status?: BookingStatus; agencyId?: string }): Promise<BookingRecord[]>;
  findBookingById(id: string): Promise<BookingRecord | null>;
  createBooking(input: CreateBookingInput): Promise<BookingRecord>;
  updateBooking(id: string, input: Partial<BookingRecord>): Promise<BookingRecord>;
  hasInstructorConflict(instructorId: string, startsAt: Date, endsAt: Date, ignoreBookingId?: string): Promise<boolean>;

  listPayments(filters?: { userId?: string; status?: PaymentStatus; agencyId?: string }): Promise<PaymentRecord[]>;
  findPaymentByStripePaymentIntentId(stripePaymentIntentId: string): Promise<PaymentRecord | null>;
  createPayment(input: CreatePaymentInput): Promise<PaymentRecord>;
  updatePayment(id: string, input: Partial<PaymentRecord>): Promise<PaymentRecord>;

  listCpfRequests(): Promise<CpfRequestRecord[]>;
  createCpfRequest(input: CreateCpfRequestInput): Promise<CpfRequestRecord>;
  updateCpfRequest(id: string, input: Partial<CpfRequestRecord>): Promise<CpfRequestRecord>;

  listContactRequests(): Promise<ContactRequestRecord[]>;
  createContactRequest(input: CreateContactRequestInput): Promise<ContactRequestRecord>;
  updateContactRequest(id: string, input: Partial<ContactRequestRecord>): Promise<ContactRequestRecord>;

  listReviews(includeUnpublished?: boolean): Promise<ReviewRecord[]>;
  createReview(input: CreateReviewInput): Promise<ReviewRecord>;
  updateReview(id: string, input: Partial<ReviewRecord>): Promise<ReviewRecord>;

  listLeads(filters?: { status?: LeadStatus; agencyId?: string }): Promise<LeadRecord[]>;
  createLead(input: CreateLeadInput): Promise<LeadRecord>;
  updateLead(id: string, input: Partial<LeadRecord>): Promise<LeadRecord>;

  listChatAppointments(filters?: { status?: ChatAppointmentStatus; agencyId?: string }): Promise<ChatAppointmentRecord[]>;
  findChatAppointmentById(id: string): Promise<ChatAppointmentRecord | null>;
  createChatAppointment(input: CreateChatAppointmentInput): Promise<ChatAppointmentRecord>;
  updateChatAppointment(id: string, input: UpdateChatAppointmentInput): Promise<ChatAppointmentRecord>;

  listChatTasks(filters?: { status?: ChatTaskStatus; leadId?: string; appointmentId?: string }): Promise<ChatTaskRecord[]>;
  createChatTask(input: CreateChatTaskInput): Promise<ChatTaskRecord>;
  updateChatTask(id: string, input: UpdateChatTaskInput): Promise<ChatTaskRecord>;

  listChatConversations(filters?: { leadId?: string; appointmentId?: string }): Promise<ChatConversationRecord[]>;
  createChatConversation(input: CreateChatConversationInput): Promise<ChatConversationRecord>;

  listChatAvailabilitySlots(filters?: { from?: Date; to?: Date; active?: boolean; agencyId?: string }): Promise<ChatAvailabilitySlotRecord[]>;
  createChatAvailabilitySlot(input: CreateChatAvailabilitySlotInput): Promise<ChatAvailabilitySlotRecord>;
  updateChatAvailabilitySlot(id: string, input: UpdateChatAvailabilitySlotInput): Promise<ChatAvailabilitySlotRecord>;

  listExams(filters?: { agencyId?: string; studentId?: string }): Promise<ExamRecord[]>;
  createExam(input: CreateExamInput): Promise<ExamRecord>;
  updateExam(id: string, input: Partial<ExamRecord>): Promise<ExamRecord>;

  listInstallments(filters?: { agencyId?: string; studentId?: string }): Promise<InstallmentRecord[]>;
  createInstallment(input: CreateInstallmentInput): Promise<InstallmentRecord>;
  updateInstallment(id: string, input: Partial<InstallmentRecord>): Promise<InstallmentRecord>;

  search(query: string): Promise<SearchResult[]>;

  createAuditLog(input: Omit<AuditLogRecord, "id" | "createdAt">): Promise<AuditLogRecord>;
  listAuditLogs(limit?: number): Promise<AuditLogRecord[]>;
}
