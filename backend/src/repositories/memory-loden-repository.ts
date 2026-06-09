import { randomUUID } from "node:crypto";
import {
  initialAgencies,
  initialAgencyMemberships,
  initialAvailabilities,
  initialCompanyInfo,
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
  CompanyInfoRecord,
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
  InvoiceRecord,
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
  QuoteRecord,
  ContractRecord,
  ContentEntryRecord,
  StudentRecord,
  StudentSkillRecord,
  StudentDocumentRecord,
  UserRecord,
  VehicleRecord
} from "../domain/types";
import { computeInvoiceTotals, nextInvoiceNumber, nextSequentialNumber } from "../domain/invoice-totals";
import { conflict, notFound } from "../shared/http-error";
import type {
  CreateBookingInput,
  CreateContactRequestInput,
  CreateCpfRequestInput,
  CreateFormationInput,
  CreateLeadInput,
  CreatePaymentInput,
  CreateReviewInput,
  CreateAgencyInput,
  CreateInstructorInput,
  CreateInvoiceInput,
  CreateQuoteInput,
  CreateContractInput,
  CreateContentEntryInput,
  CreateStudentInput,
  CreateUserInput,
  CreateVehicleInput,
  ListUsersFilters,
  LodenRepository,
  UpdateInvoiceInput,
  UpdateQuoteInput,
  UpdateContractInput,
  UpdateContentEntryInput
} from "./loden-repository";

export type MutableStore = {
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
  studentDocuments: StudentDocumentRecord[];
  auditLogs: AuditLogRecord[];
  vehicles: VehicleRecord[];
  invoices: InvoiceRecord[];
  quotes: QuoteRecord[];
  contracts: ContractRecord[];
  contentEntries: ContentEntryRecord[];
  companyInfo: CompanyInfoRecord;
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
      studentDocuments: [],
      auditLogs: [],
      vehicles: [],
      invoices: [],
      quotes: [],
      contracts: [],
      contentEntries: [],
      companyInfo: { ...initialCompanyInfo },
      ...seed
    };
  }

  async getCompanyInfo() {
    return this.store.companyInfo;
  }

  async updateCompanyInfo(input: Partial<CompanyInfoRecord>) {
    Object.assign(this.store.companyInfo, input, { id: "company", updatedAt: new Date() });
    return this.store.companyInfo;
  }

  async listAgencies() {
    return this.store.agencies.filter((agency) => agency.active);
  }

  async findAgencyById(id: string) {
    return this.store.agencies.find((agency) => agency.id === id) ?? null;
  }

  async createAgency(input: CreateAgencyInput) {
    const agency: AgencyRecord = {
      ...input,
      id: randomUUID(),
      active: input.active ?? true
    };
    this.store.agencies.push(agency);
    return agency;
  }

  async updateAgency(id: string, input: Partial<AgencyRecord>) {
    const agency = this.store.agencies.find((item) => item.id === id);
    if (!agency) throw notFound("Agence introuvable");
    Object.assign(agency, input);
    return agency;
  }

  async listVehicles(filters?: { agencyId?: string }) {
    return this.store.vehicles.filter(
      (vehicle) => !filters?.agencyId || vehicle.agencyId === filters.agencyId || vehicle.agencyId == null
    );
  }

  async findVehicleById(id: string) {
    return this.store.vehicles.find((vehicle) => vehicle.id === id) ?? null;
  }

  async createVehicle(input: CreateVehicleInput) {
    const vehicle: VehicleRecord = { ...input, id: randomUUID(), active: input.active ?? true };
    this.store.vehicles.push(vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, input: Partial<VehicleRecord>) {
    const vehicle = this.store.vehicles.find((item) => item.id === id);
    if (!vehicle) throw notFound("Véhicule introuvable");
    Object.assign(vehicle, input);
    return vehicle;
  }

  async listInvoices(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: InvoiceRecord["status"] }) {
    return this.store.invoices
      .filter(
        (invoice) =>
          (!filters?.clientUserId || invoice.clientUserId === filters.clientUserId) &&
          (!filters?.studentId || invoice.studentId === filters.studentId) &&
          (!filters?.status || invoice.status === filters.status) &&
          (!filters?.agencyId || invoice.agencyId === filters.agencyId || invoice.agencyId == null)
      )
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findInvoiceById(id: string) {
    return this.store.invoices.find((invoice) => invoice.id === id) ?? null;
  }

  async findInvoiceByPaymentId(paymentId: string) {
    return this.store.invoices.find((invoice) => invoice.paymentId === paymentId) ?? null;
  }

  async createInvoice(input: CreateInvoiceInput) {
    if (input.paymentId && this.store.invoices.some((invoice) => invoice.paymentId === input.paymentId)) {
      throw conflict("Un paiement ne peut porter qu'une facture");
    }
    const now = new Date();
    const lines = input.lines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
    const totals = computeInvoiceTotals(lines);
    const invoice: InvoiceRecord = {
      id: randomUUID(),
      number: null,
      status: "BROUILLON",
      clientUserId: input.clientUserId,
      studentId: input.studentId ?? null,
      agencyId: input.agencyId ?? null,
      paymentId: input.paymentId ?? null,
      lines,
      ...totals,
      currency: input.currency ?? "EUR",
      issuerSnapshot: null,
      clientSnapshot: null,
      issuedAt: null,
      dueDate: input.dueDate ?? null,
      paidAt: null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.store.invoices.push(invoice);
    return invoice;
  }

  async updateInvoice(id: string, input: UpdateInvoiceInput) {
    const invoice = this.store.invoices.find((item) => item.id === id);
    if (!invoice) throw notFound("Facture introuvable");
    const { lines: inputLines, ...rest } = input;
    const next: Partial<InvoiceRecord> = { ...rest };
    if (inputLines) {
      const lines = inputLines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
      next.lines = lines;
      Object.assign(next, computeInvoiceTotals(lines));
    }
    if (input.status === "PAYEE" && !invoice.paidAt) next.paidAt = new Date();
    Object.assign(invoice, next, { updatedAt: new Date() });
    return invoice;
  }

  async issueInvoice(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }) {
    const invoice = this.store.invoices.find((item) => item.id === id);
    if (!invoice) throw notFound("Facture introuvable");
    const issuedAt = new Date();
    invoice.number = nextInvoiceNumber(this.store.invoices.map((item) => item.number), issuedAt.getFullYear());
    invoice.status = "EMISE";
    invoice.issuedAt = issuedAt;
    invoice.issuerSnapshot = snapshots.issuer;
    invoice.clientSnapshot = snapshots.client;
    invoice.updatedAt = issuedAt;
    return invoice;
  }

  async deleteInvoice(id: string) {
    this.store.invoices = this.store.invoices.filter((invoice) => invoice.id !== id);
  }

  async listQuotes(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: QuoteRecord["status"] }) {
    return this.store.quotes
      .filter(
        (quote) =>
          (!filters?.clientUserId || quote.clientUserId === filters.clientUserId) &&
          (!filters?.studentId || quote.studentId === filters.studentId) &&
          (!filters?.status || quote.status === filters.status) &&
          (!filters?.agencyId || quote.agencyId === filters.agencyId || quote.agencyId == null)
      )
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findQuoteById(id: string) {
    return this.store.quotes.find((quote) => quote.id === id) ?? null;
  }

  async createQuote(input: CreateQuoteInput) {
    const now = new Date();
    const lines = input.lines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
    const totals = computeInvoiceTotals(lines);
    const quote: QuoteRecord = {
      id: randomUUID(),
      number: null,
      status: "BROUILLON",
      clientUserId: input.clientUserId,
      studentId: input.studentId ?? null,
      agencyId: input.agencyId ?? null,
      lines,
      ...totals,
      currency: "EUR",
      issuerSnapshot: null,
      clientSnapshot: null,
      sentAt: null,
      validUntil: input.validUntil ?? null,
      decidedAt: null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.store.quotes.push(quote);
    return quote;
  }

  async updateQuote(id: string, input: UpdateQuoteInput) {
    const quote = this.store.quotes.find((item) => item.id === id);
    if (!quote) throw notFound("Devis introuvable");
    const { lines: inputLines, ...rest } = input;
    const next: Partial<QuoteRecord> = { ...rest };
    if (inputLines) {
      const lines = inputLines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
      next.lines = lines;
      Object.assign(next, computeInvoiceTotals(lines));
    }
    if ((input.status === "ACCEPTE" || input.status === "REFUSE") && !quote.decidedAt) next.decidedAt = new Date();
    Object.assign(quote, next, { updatedAt: new Date() });
    return quote;
  }

  async sendQuote(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }) {
    const quote = this.store.quotes.find((item) => item.id === id);
    if (!quote) throw notFound("Devis introuvable");
    const sentAt = new Date();
    quote.number = nextSequentialNumber(this.store.quotes.map((item) => item.number), sentAt.getFullYear(), "DEV");
    quote.status = "ENVOYE";
    quote.sentAt = sentAt;
    quote.issuerSnapshot = snapshots.issuer;
    quote.clientSnapshot = snapshots.client;
    quote.updatedAt = sentAt;
    return quote;
  }

  async deleteQuote(id: string) {
    this.store.quotes = this.store.quotes.filter((quote) => quote.id !== id);
  }

  async listContracts(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: ContractRecord["status"] }) {
    return this.store.contracts
      .filter(
        (contract) =>
          (!filters?.clientUserId || contract.clientUserId === filters.clientUserId) &&
          (!filters?.studentId || contract.studentId === filters.studentId) &&
          (!filters?.status || contract.status === filters.status) &&
          (!filters?.agencyId || contract.agencyId === filters.agencyId || contract.agencyId == null)
      )
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findContractById(id: string) {
    return this.store.contracts.find((contract) => contract.id === id) ?? null;
  }

  async createContract(input: CreateContractInput) {
    const now = new Date();
    const contract: ContractRecord = {
      id: randomUUID(),
      number: null,
      status: "BROUILLON",
      clientUserId: input.clientUserId,
      studentId: input.studentId ?? null,
      formationId: input.formationId ?? null,
      agencyId: input.agencyId ?? null,
      title: input.title,
      body: input.body,
      totalCents: input.totalCents ?? 0,
      currency: "EUR",
      issuerSnapshot: null,
      clientSnapshot: null,
      signedAt: null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.store.contracts.push(contract);
    return contract;
  }

  async updateContract(id: string, input: UpdateContractInput) {
    const contract = this.store.contracts.find((item) => item.id === id);
    if (!contract) throw notFound("Contrat introuvable");
    Object.assign(contract, input, { updatedAt: new Date() });
    return contract;
  }

  async activateContract(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }) {
    const contract = this.store.contracts.find((item) => item.id === id);
    if (!contract) throw notFound("Contrat introuvable");
    const signedAt = new Date();
    contract.number = nextSequentialNumber(this.store.contracts.map((item) => item.number), signedAt.getFullYear(), "CTR");
    contract.status = "ACTIF";
    contract.signedAt = signedAt;
    contract.issuerSnapshot = snapshots.issuer;
    contract.clientSnapshot = snapshots.client;
    contract.updatedAt = signedAt;
    return contract;
  }

  async deleteContract(id: string) {
    this.store.contracts = this.store.contracts.filter((contract) => contract.id !== id);
  }

  async listContentEntries(filters?: { type?: ContentEntryRecord["type"]; published?: boolean }) {
    return this.store.contentEntries
      .filter(
        (entry) =>
          (!filters?.type || entry.type === filters.type) &&
          (filters?.published === undefined || entry.published === filters.published)
      )
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async findContentEntryById(id: string) {
    return this.store.contentEntries.find((entry) => entry.id === id) ?? null;
  }

  async createContentEntry(input: CreateContentEntryInput) {
    const now = new Date();
    const published = input.published ?? false;
    const entry: ContentEntryRecord = {
      id: randomUUID(),
      type: input.type,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      body: input.body,
      published,
      publishedAt: published ? now : null,
      agencyId: input.agencyId ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.store.contentEntries.push(entry);
    return entry;
  }

  async updateContentEntry(id: string, input: UpdateContentEntryInput) {
    const entry = this.store.contentEntries.find((item) => item.id === id);
    if (!entry) throw notFound("Contenu introuvable");
    if (input.published === true && !entry.publishedAt) entry.publishedAt = new Date();
    Object.assign(entry, input, { updatedAt: new Date() });
    return entry;
  }

  async deleteContentEntry(id: string) {
    this.store.contentEntries = this.store.contentEntries.filter((entry) => entry.id !== id);
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

  async listStudentDocuments(studentId: string) {
    return this.store.studentDocuments
      .filter((document) => document.studentId === studentId)
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async createStudentDocument(input: { studentId: string; type: string; url: string }) {
    const document: StudentDocumentRecord = {
      id: randomUUID(),
      studentId: input.studentId,
      type: input.type,
      url: input.url,
      verifiedAt: null,
      createdAt: new Date()
    };
    this.store.studentDocuments.push(document);
    return document;
  }

  async setStudentDocumentVerified(id: string, verified: boolean) {
    const document = this.store.studentDocuments.find((item) => item.id === id);
    if (!document) throw notFound("Document introuvable");
    document.verifiedAt = verified ? new Date() : null;
    return document;
  }

  async deleteStudentDocument(id: string) {
    this.store.studentDocuments = this.store.studentDocuments.filter((item) => item.id !== id);
  }

  async listInstructors() {
    return this.store.instructors.filter((instructor) => instructor.active);
  }

  async findInstructorById(id: string) {
    return this.store.instructors.find((instructor) => instructor.id === id) ?? null;
  }

  async createInstructor(input: CreateInstructorInput) {
    const user = await this.findUserById(input.userId);
    const instructor: InstructorRecord = {
      id: randomUUID(),
      userId: input.userId,
      agencyId: input.agencyId ?? undefined,
      name: user ? `${user.firstName} ${user.lastName}` : "",
      photoUrl: input.photoUrl ?? undefined,
      bio: input.bio ?? undefined,
      specialties: input.specialties ?? [],
      interventionZones: input.interventionZones ?? [],
      ratingAverage: 0,
      ratingCount: 0,
      active: true
    };
    this.store.instructors.push(instructor);
    return instructor;
  }

  async updateInstructor(id: string, input: Partial<InstructorRecord>) {
    const instructor = this.store.instructors.find((item) => item.id === id);
    if (!instructor) throw notFound("Moniteur introuvable");
    Object.assign(instructor, input);
    return instructor;
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
      if (value) results.push({ category: "moniteur", title: instructor.name, description: instructor.bio ?? "Moniteur LODENE", href: "/a-propos", score: value });
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
      { title: "Contact LODENE", description: "Formulaire de contact, inscription et rappel", href: "/contact" },
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
