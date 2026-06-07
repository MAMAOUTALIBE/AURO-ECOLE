import type {
  AgencyMembershipRecord,
  AgencyRecord,
  AuditLogRecord,
  AvailabilityRecord,
  BookingRecord,
  BookingStatus,
  ExamRecord,
  InstallmentRecord,
  ContactRequestRecord,
  ContactRequestStatus,
  CpfRequestRecord,
  CpfRequestStatus,
  FaqEntryRecord,
  FormationRecord,
  InstructorRecord,
  LeadRecord,
  LeadStatus,
  MeetingPointRecord,
  PaymentRecord,
  PaymentStatus,
  PricingPlanRecord,
  ReviewRecord,
  ReviewStatus,
  SearchResult,
  StudentRecord,
  StudentSkillRecord,
  UserRecord,
  UserRole
} from "../domain/types";

export type CreateUserInput = Omit<UserRecord, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: UserRecord["status"];
};

export type CreateStudentInput = {
  userId: string;
  formationId?: string | null;
  purchasedHours?: number;
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
  listAgencyMembershipsByUser(userId: string): Promise<AgencyMembershipRecord[]>;

  listUsers(filters?: ListUsersFilters): Promise<UserRecord[]>;
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
  updateUser(id: string, input: Partial<UserRecord>): Promise<UserRecord>;

  listStudents(filters?: { agencyId?: string }): Promise<StudentRecord[]>;
  findStudentById(id: string): Promise<StudentRecord | null>;
  findStudentByUserId(userId: string): Promise<StudentRecord | null>;
  createStudent(input: CreateStudentInput): Promise<StudentRecord>;
  updateStudent(id: string, input: Partial<StudentRecord>): Promise<StudentRecord>;
  listStudentSkills(studentId: string): Promise<StudentSkillRecord[]>;
  setStudentSkill(studentId: string, skillCode: string, level: number): Promise<StudentSkillRecord>;

  listInstructors(): Promise<InstructorRecord[]>;
  findInstructorById(id: string): Promise<InstructorRecord | null>;

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
