import { randomUUID } from "node:crypto";
import {
  initialAgencies,
  initialAgencyMemberships,
  initialAvailabilities,
  initialFaqEntries,
  initialFormations,
  initialInstructors,
  initialMeetingPoints,
  initialPricingPlans,
  initialReviews,
  initialUsers
} from "../data/initial-data";
import type {
  AgencyMembershipRecord,
  AgencyRecord,
  AuditLogRecord,
  AvailabilityRecord,
  BookingRecord,
  ContactRequestRecord,
  CpfRequestRecord,
  ExamRecord,
  InstallmentRecord,
  FaqEntryRecord,
  FormationRecord,
  InstructorRecord,
  LeadRecord,
  MeetingPointRecord,
  PaymentRecord,
  PricingPlanRecord,
  ReviewRecord,
  SearchResult,
  StudentRecord,
  StudentSkillRecord,
  UserRecord
} from "../domain/types";
import { notFound } from "../shared/http-error";
import type {
  CreateBookingInput,
  CreateContactRequestInput,
  CreateCpfRequestInput,
  CreateFormationInput,
  CreateLeadInput,
  CreatePaymentInput,
  CreateReviewInput,
  CreateStudentInput,
  CreateUserInput,
  ListUsersFilters,
  LodenRepository
} from "./loden-repository";

type MutableStore = {
  agencies: AgencyRecord[];
  agencyMemberships: AgencyMembershipRecord[];
  users: UserRecord[];
  students: StudentRecord[];
  instructors: InstructorRecord[];
  formations: FormationRecord[];
  pricingPlans: PricingPlanRecord[];
  meetingPoints: MeetingPointRecord[];
  availabilities: AvailabilityRecord[];
  faqEntries: FaqEntryRecord[];
  bookings: BookingRecord[];
  payments: PaymentRecord[];
  cpfRequests: CpfRequestRecord[];
  contactRequests: ContactRequestRecord[];
  reviews: ReviewRecord[];
  leads: LeadRecord[];
  exams: ExamRecord[];
  installments: InstallmentRecord[];
  studentSkills: StudentSkillRecord[];
  auditLogs: AuditLogRecord[];
};

export class MemoryLodenRepository implements LodenRepository {
  private readonly store: MutableStore;

  constructor(seed?: Partial<MutableStore>) {
    this.store = {
      agencies: [...initialAgencies],
      agencyMemberships: [...initialAgencyMemberships],
      users: [...initialUsers],
      students: [],
      instructors: [...initialInstructors],
      formations: [...initialFormations],
      pricingPlans: [...initialPricingPlans],
      meetingPoints: [...initialMeetingPoints],
      availabilities: [...initialAvailabilities],
      faqEntries: [...initialFaqEntries],
      bookings: [],
      payments: [],
      cpfRequests: [],
      contactRequests: [],
      reviews: [...initialReviews],
      leads: [],
      exams: [],
      installments: [],
      studentSkills: [],
      auditLogs: [],
      ...seed
    };
  }

  async listAgencies() {
    return this.store.agencies.filter((agency) => agency.active);
  }

  async findAgencyById(id: string) {
    return this.store.agencies.find((agency) => agency.id === id) ?? null;
  }

  async listAgencyMembershipsByUser(userId: string) {
    return this.store.agencyMemberships.filter((membership) => membership.userId === userId);
  }

  async listUsers(filters?: ListUsersFilters) {
    return this.store.users.filter((user) => !filters?.role || user.role === filters.role);
  }

  async findUserById(id: string) {
    return this.store.users.find((user) => user.id === id) ?? null;
  }

  async findUserByEmail(email: string) {
    return this.store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async createUser(input: CreateUserInput) {
    const now = new Date();
    const user: UserRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "PENDING_EMAIL",
      createdAt: now,
      updatedAt: now
    };
    this.store.users.push(user);
    return user;
  }

  async updateUser(id: string, input: Partial<UserRecord>) {
    const user = await this.findUserById(id);
    if (!user) throw notFound("Utilisateur introuvable");
    Object.assign(user, input, { updatedAt: new Date() });
    return user;
  }

  async listStudents(filters?: { agencyId?: string }) {
    return this.store.students.filter(
      (student) =>
        !filters?.agencyId || student.agencyId === filters.agencyId || student.agencyId == null
    );
  }

  async findStudentById(id: string) {
    return this.store.students.find((student) => student.id === id) ?? null;
  }

  async findStudentByUserId(userId: string) {
    return this.store.students.find((student) => student.userId === userId) ?? null;
  }

  async createStudent(input: CreateStudentInput) {
    const now = new Date();
    const student: StudentRecord = {
      id: randomUUID(),
      userId: input.userId,
      formationId: input.formationId,
      progressPercent: 0,
      purchasedHours: input.purchasedHours ?? 0,
      consumedHours: 0,
      fileStatus: "NOUVEAU",
      createdAt: now,
      updatedAt: now
    };
    this.store.students.push(student);
    return student;
  }

  async updateStudent(id: string, input: Partial<StudentRecord>) {
    const student = await this.findStudentById(id);
    if (!student) throw notFound("Élève introuvable");
    Object.assign(student, input, { updatedAt: new Date() });
    return student;
  }

  async listStudentSkills(studentId: string) {
    return this.store.studentSkills.filter((skill) => skill.studentId === studentId);
  }

  async setStudentSkill(studentId: string, skillCode: string, level: number) {
    const existing = this.store.studentSkills.find(
      (skill) => skill.studentId === studentId && skill.skillCode === skillCode
    );
    if (existing) {
      existing.level = level;
      existing.updatedAt = new Date();
      return existing;
    }
    const skill: StudentSkillRecord = {
      id: randomUUID(),
      studentId,
      skillCode,
      level,
      updatedAt: new Date()
    };
    this.store.studentSkills.push(skill);
    return skill;
  }

  async listInstructors() {
    return this.store.instructors.filter((instructor) => instructor.active);
  }

  async findInstructorById(id: string) {
    return this.store.instructors.find((instructor) => instructor.id === id) ?? null;
  }

  async listFormations(includeInactive = false) {
    return this.store.formations.filter((formation) => includeInactive || formation.active);
  }

  async findFormationById(id: string) {
    return this.store.formations.find((formation) => formation.id === id) ?? null;
  }

  async findFormationBySlug(slug: string) {
    return this.store.formations.find((formation) => formation.slug === slug) ?? null;
  }

  async createFormation(input: CreateFormationInput) {
    const formation = { ...input, id: randomUUID() };
    this.store.formations.push(formation);
    return formation;
  }

  async updateFormation(id: string, input: Partial<FormationRecord>) {
    const formation = await this.findFormationById(id);
    if (!formation) throw notFound("Formation introuvable");
    Object.assign(formation, input);
    return formation;
  }

  async listPricingPlans(includeInactive = false) {
    return this.store.pricingPlans.filter((plan) => includeInactive || plan.active);
  }

  async findPricingPlanById(id: string) {
    return this.store.pricingPlans.find((plan) => plan.id === id) ?? null;
  }

  async listMeetingPoints() {
    return this.store.meetingPoints.filter((point) => point.active);
  }

  async listFaqEntries(includeInactive = false) {
    return this.store.faqEntries.filter((entry) => includeInactive || entry.active);
  }

  async createFaqEntry(input: Omit<FaqEntryRecord, "id">) {
    const entry: FaqEntryRecord = { ...input, id: randomUUID() };
    this.store.faqEntries.push(entry);
    return entry;
  }

  async updateFaqEntry(id: string, input: Partial<FaqEntryRecord>) {
    const entry = this.store.faqEntries.find((item) => item.id === id);
    if (!entry) throw notFound("Question introuvable");
    Object.assign(entry, input);
    return entry;
  }

  async deleteFaqEntry(id: string) {
    this.store.faqEntries = this.store.faqEntries.filter((item) => item.id !== id);
  }

  async listAvailabilities(instructorId?: string) {
    return this.store.availabilities.filter(
      (availability) => availability.isAvailable && (!instructorId || availability.instructorId === instructorId)
    );
  }

  async listBookings(filters?: { studentId?: string; instructorId?: string; status?: BookingRecord["status"]; agencyId?: string }) {
    return this.store.bookings.filter(
      (booking) =>
        (!filters?.studentId || booking.studentId === filters.studentId) &&
        (!filters?.instructorId || booking.instructorId === filters.instructorId) &&
        (!filters?.status || booking.status === filters.status) &&
        (!filters?.agencyId || booking.agencyId === filters.agencyId || booking.agencyId == null)
    );
  }

  async findBookingById(id: string) {
    return this.store.bookings.find((booking) => booking.id === id) ?? null;
  }

  async createBooking(input: CreateBookingInput) {
    const now = new Date();
    const booking: BookingRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "EN_ATTENTE",
      createdAt: now,
      updatedAt: now
    };
    this.store.bookings.push(booking);
    return booking;
  }

  async updateBooking(id: string, input: Partial<BookingRecord>) {
    const booking = await this.findBookingById(id);
    if (!booking) throw notFound("Réservation introuvable");
    Object.assign(booking, input, { updatedAt: new Date() });
    return booking;
  }

  async hasInstructorConflict(instructorId: string, startsAt: Date, endsAt: Date, ignoreBookingId?: string) {
    return this.store.bookings.some(
      (booking) =>
        booking.instructorId === instructorId &&
        booking.id !== ignoreBookingId &&
        booking.status !== "ANNULEE" &&
        startsAt < booking.endsAt &&
        endsAt > booking.startsAt
    );
  }

  async listPayments(filters?: { userId?: string; status?: PaymentRecord["status"]; agencyId?: string }) {
    return this.store.payments
      .filter(
        (payment) =>
          (!filters?.userId || payment.userId === filters.userId) &&
          (!filters?.status || payment.status === filters.status) &&
          (!filters?.agencyId || payment.agencyId === filters.agencyId || payment.agencyId == null)
      )
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async findPaymentByStripePaymentIntentId(stripePaymentIntentId: string) {
    return this.store.payments.find((payment) => payment.stripePaymentIntentId === stripePaymentIntentId) ?? null;
  }

  async createPayment(input: CreatePaymentInput) {
    const now = new Date();
    const payment: PaymentRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "EN_ATTENTE",
      createdAt: now,
      updatedAt: now
    };
    this.store.payments.push(payment);
    return payment;
  }

  async updatePayment(id: string, input: Partial<PaymentRecord>) {
    const payment = this.store.payments.find((item) => item.id === id);
    if (!payment) throw notFound("Paiement introuvable");
    Object.assign(payment, input, { updatedAt: new Date() });
    if (input.status === "PAYE" && !payment.paidAt) payment.paidAt = new Date();
    return payment;
  }

  async listCpfRequests() {
    return this.store.cpfRequests;
  }

  async createCpfRequest(input: CreateCpfRequestInput) {
    const now = new Date();
    const request: CpfRequestRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "NOUVELLE_DEMANDE",
      missingDocuments: input.missingDocuments ?? [],
      createdAt: now,
      updatedAt: now
    };
    this.store.cpfRequests.push(request);
    return request;
  }

  async updateCpfRequest(id: string, input: Partial<CpfRequestRecord>) {
    const request = this.store.cpfRequests.find((item) => item.id === id);
    if (!request) throw notFound("Demande CPF introuvable");
    Object.assign(request, input, { updatedAt: new Date() });
    return request;
  }

  async listContactRequests() {
    return this.store.contactRequests;
  }

  async createContactRequest(input: CreateContactRequestInput) {
    const now = new Date();
    const request: ContactRequestRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "NOUVELLE",
      createdAt: now,
      updatedAt: now
    };
    this.store.contactRequests.push(request);
    return request;
  }

  async updateContactRequest(id: string, input: Partial<ContactRequestRecord>) {
    const request = this.store.contactRequests.find((item) => item.id === id);
    if (!request) throw notFound("Demande contact introuvable");
    Object.assign(request, input, { updatedAt: new Date() });
    return request;
  }

  async listReviews(includeUnpublished = false) {
    return this.store.reviews.filter((review) => includeUnpublished || review.status === "PUBLIE");
  }

  async createReview(input: CreateReviewInput) {
    const now = new Date();
    const review: ReviewRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "EN_ATTENTE",
      createdAt: now,
      updatedAt: now
    };
    this.store.reviews.push(review);
    return review;
  }

  async updateReview(id: string, input: Partial<ReviewRecord>) {
    const review = this.store.reviews.find((item) => item.id === id);
    if (!review) throw notFound("Avis introuvable");
    Object.assign(review, input, { updatedAt: new Date() });
    if (input.status === "PUBLIE" && !review.publishedAt) review.publishedAt = new Date();
    return review;
  }

  async listLeads(filters?: { status?: LeadRecord["status"]; agencyId?: string }) {
    return this.store.leads
      .filter(
        (lead) =>
          (!filters?.status || lead.status === filters.status) &&
          // Inclut les leads non encore rattachés à une agence (transition).
          (!filters?.agencyId || lead.agencyId === filters.agencyId || lead.agencyId == null)
      )
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async createLead(input: CreateLeadInput) {
    const now = new Date();
    const lead: LeadRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "PROSPECT",
      createdAt: now,
      updatedAt: now
    };
    this.store.leads.push(lead);
    return lead;
  }

  async updateLead(id: string, input: Partial<LeadRecord>) {
    const lead = this.store.leads.find((item) => item.id === id);
    if (!lead) throw notFound("Lead introuvable");
    Object.assign(lead, input, { updatedAt: new Date() });
    return lead;
  }

  async listExams(filters?: { agencyId?: string; studentId?: string }) {
    return this.store.exams
      .filter(
        (exam) =>
          (!filters?.studentId || exam.studentId === filters.studentId) &&
          (!filters?.agencyId || exam.agencyId === filters.agencyId || exam.agencyId == null)
      )
      .slice()
      .sort((left, right) => right.scheduledAt.getTime() - left.scheduledAt.getTime());
  }

  async createExam(input: Parameters<LodenRepository["createExam"]>[0]) {
    const now = new Date();
    const exam: ExamRecord = {
      ...input,
      id: randomUUID(),
      result: input.result ?? "EN_ATTENTE",
      attempt: input.attempt ?? 1,
      createdAt: now,
      updatedAt: now
    };
    this.store.exams.push(exam);
    return exam;
  }

  async updateExam(id: string, input: Partial<ExamRecord>) {
    const exam = this.store.exams.find((item) => item.id === id);
    if (!exam) throw notFound("Examen introuvable");
    Object.assign(exam, input, { updatedAt: new Date() });
    return exam;
  }

  async listInstallments(filters?: { agencyId?: string; studentId?: string }) {
    return this.store.installments
      .filter(
        (installment) =>
          (!filters?.studentId || installment.studentId === filters.studentId) &&
          (!filters?.agencyId || installment.agencyId === filters.agencyId || installment.agencyId == null)
      )
      .slice()
      .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime());
  }

  async createInstallment(input: Parameters<LodenRepository["createInstallment"]>[0]) {
    const now = new Date();
    const installment: InstallmentRecord = {
      ...input,
      id: randomUUID(),
      status: input.status ?? "EN_ATTENTE",
      createdAt: now,
      updatedAt: now
    };
    this.store.installments.push(installment);
    return installment;
  }

  async updateInstallment(id: string, input: Partial<InstallmentRecord>) {
    const installment = this.store.installments.find((item) => item.id === id);
    if (!installment) throw notFound("Échéance introuvable");
    Object.assign(installment, input, { updatedAt: new Date() });
    if (input.status === "PAYE" && !installment.paidAt) installment.paidAt = new Date();
    return installment;
  }

  async search(query: string): Promise<SearchResult[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const score = (haystack: string) => {
      const text = haystack.toLowerCase();
      if (text === normalized) return 100;
      if (text.startsWith(normalized)) return 80;
      if (text.includes(normalized)) return 60;
      return 0;
    };

    const results: SearchResult[] = [];

    for (const formation of await this.listFormations()) {
      const value = score(`${formation.title} ${formation.description} ${formation.slug}`);
      if (value)
        results.push({
          category: "formation",
          title: formation.title,
          description: formation.description,
          href: `/formations/${formation.slug}`,
          score: value
        });
    }

    for (const plan of await this.listPricingPlans()) {
      const value = score(`${plan.title} ${plan.description ?? ""} ${plan.features.join(" ")}`);
      if (value) results.push({ category: "tarif", title: plan.title, description: plan.description ?? plan.features.join(", "), href: "/tarifs", score: value });
    }

    for (const instructor of await this.listInstructors()) {
      const value = score(`${instructor.name} ${instructor.bio ?? ""} ${instructor.specialties.join(" ")}`);
      if (value) results.push({ category: "moniteur", title: instructor.name, description: instructor.bio ?? "Moniteur LODEN", href: "/a-propos", score: value });
    }

    for (const faq of await this.listFaqEntries()) {
      const value = score(`${faq.question} ${faq.answer} ${faq.category ?? ""}`);
      if (value) results.push({ category: "faq", title: faq.question, description: faq.answer, href: "/contact", score: value });
    }

    for (const point of await this.listMeetingPoints()) {
      const value = score(`${point.name} ${point.address}`);
      if (value) results.push({ category: "point_rdv", title: point.name, description: point.address, href: "/contact", score: value });
    }

    const pages = [
      { title: "CPF et financement", description: "Financement CPF, paiement 3x / 4x, aides régionales", href: "/cpf" },
      { title: "Contact LODEN", description: "Formulaire de contact, inscription et rappel", href: "/contact" },
      { title: "Avis clients", description: "Avis Google et témoignages élèves", href: "/avis" }
    ];

    for (const page of pages) {
      const value = score(`${page.title} ${page.description}`);
      if (value) results.push({ category: "page", ...page, score: value });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async createAuditLog(input: Omit<AuditLogRecord, "id" | "createdAt">) {
    const entry: AuditLogRecord = { ...input, id: randomUUID(), createdAt: new Date() };
    this.store.auditLogs.push(entry);
    return entry;
  }

  async listAuditLogs(limit = 100) {
    return this.store.auditLogs
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }
}
