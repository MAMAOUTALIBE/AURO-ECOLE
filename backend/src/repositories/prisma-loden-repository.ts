import { PrismaClient } from "@prisma/client";
import type { BookingRecord, FormationRecord, PaymentRecord, SearchResult } from "../domain/types";
import { MemoryLodenRepository } from "./memory-loden-repository";
import type {
  CreateBookingInput,
  CreateContactRequestInput,
  CreateCpfRequestInput,
  CreateFormationInput,
  CreateLeadInput,
  CreatePaymentInput,
  CreateReviewInput,
  CreateInstructorInput,
  CreateStudentInput,
  CreateUserInput,
  ListUsersFilters,
  LodenRepository
} from "./loden-repository";

export class PrismaLodenRepository implements LodenRepository {
  constructor(
    private readonly prisma = new PrismaClient(),
    private readonly fallback = new MemoryLodenRepository()
  ) {}

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async listAgencies() {
    const rows = await this.prisma.agency.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      address: row.address ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      active: row.active
    }));
  }

  async findAgencyById(id: string) {
    const row = await this.prisma.agency.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      address: row.address ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      phone: row.phone ?? undefined,
      email: row.email ?? undefined,
      active: row.active
    };
  }

  async listAgencyMembershipsByUser(userId: string) {
    const rows = await this.prisma.agencyMembership.findMany({ where: { userId } });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      agencyId: row.agencyId,
      role: row.role,
      isPrimary: row.isPrimary
    }));
  }

  async listUsers(filters?: ListUsersFilters) {
    return this.prisma.user.findMany({
      where: filters?.role ? { role: filters.role } : undefined,
      orderBy: { createdAt: "desc" }
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async createUser(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        ...input,
        email: input.email.toLowerCase(),
        status: input.status ?? "PENDING_EMAIL"
      } as never
    }) as Promise<Awaited<ReturnType<LodenRepository["createUser"]>>>;
  }

  async updateUser(id: string, input: Parameters<LodenRepository["updateUser"]>[1]) {
    return this.prisma.user.update({ where: { id }, data: input as never }) as Promise<Awaited<ReturnType<LodenRepository["updateUser"]>>>;
  }

  async listStudents(filters?: { agencyId?: string }) {
    const where = filters?.agencyId
      ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] }
      : {};
    return this.prisma.student.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async findStudentById(id: string) {
    return this.prisma.student.findUnique({ where: { id } });
  }

  async findStudentByUserId(userId: string) {
    return this.prisma.student.findUnique({ where: { userId } });
  }

  async updateStudent(id: string, input: Parameters<LodenRepository["updateStudent"]>[1]) {
    return this.prisma.student.update({ where: { id }, data: input as never }) as Promise<
      Awaited<ReturnType<LodenRepository["updateStudent"]>>
    >;
  }

  async listStudentSkills(studentId: string) {
    return this.prisma.studentSkill.findMany({ where: { studentId } });
  }

  async setStudentSkill(studentId: string, skillCode: string, level: number) {
    return this.prisma.studentSkill.upsert({
      where: { studentId_skillCode: { studentId, skillCode } },
      update: { level },
      create: { studentId, skillCode, level }
    });
  }

  async listStudentDocuments(studentId: string) {
    const rows = await this.prisma.studentDocument.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ ...row, verifiedAt: row.verifiedAt ?? null }));
  }

  async createStudentDocument(input: { studentId: string; type: string; url: string }) {
    const row = await this.prisma.studentDocument.create({ data: input });
    return { ...row, verifiedAt: row.verifiedAt ?? null };
  }

  async setStudentDocumentVerified(id: string, verified: boolean) {
    const row = await this.prisma.studentDocument.update({
      where: { id },
      data: { verifiedAt: verified ? new Date() : null }
    });
    return { ...row, verifiedAt: row.verifiedAt ?? null };
  }

  async deleteStudentDocument(id: string) {
    await this.prisma.studentDocument.delete({ where: { id } });
  }

  async createStudent(input: CreateStudentInput) {
    return this.prisma.student.create({
      data: {
        userId: input.userId,
        formationId: input.formationId,
        purchasedHours: input.purchasedHours ?? 0
      }
    });
  }

  async listInstructors() {
    const instructors = await this.prisma.instructor.findMany({
      where: { active: true },
      include: { user: true },
      orderBy: { ratingAverage: "desc" }
    });
    return instructors.map((instructor) => ({
      id: instructor.id,
      userId: instructor.userId,
      agencyId: instructor.agencyId ?? undefined,
      name: `${instructor.user.firstName} ${instructor.user.lastName}`,
      photoUrl: instructor.photoUrl ?? undefined,
      bio: instructor.bio ?? undefined,
      specialties: instructor.specialties,
      interventionZones: instructor.interventionZones,
      ratingAverage: instructor.ratingAverage,
      ratingCount: instructor.ratingCount,
      active: instructor.active
    }));
  }

  async findInstructorById(id: string) {
    const instructor = await this.prisma.instructor.findUnique({ where: { id }, include: { user: true } });
    if (!instructor) return null;
    return {
      id: instructor.id,
      userId: instructor.userId,
      agencyId: instructor.agencyId ?? undefined,
      name: `${instructor.user.firstName} ${instructor.user.lastName}`,
      photoUrl: instructor.photoUrl ?? undefined,
      bio: instructor.bio ?? undefined,
      specialties: instructor.specialties,
      interventionZones: instructor.interventionZones,
      ratingAverage: instructor.ratingAverage,
      ratingCount: instructor.ratingCount,
      active: instructor.active
    };
  }

  async createInstructor(input: CreateInstructorInput) {
    const row = await this.prisma.instructor.create({
      data: {
        userId: input.userId,
        agencyId: input.agencyId ?? null,
        photoUrl: input.photoUrl ?? null,
        bio: input.bio ?? null,
        specialties: input.specialties ?? [],
        interventionZones: input.interventionZones ?? []
      },
      include: { user: true }
    });
    return this.mapInstructorRow(row);
  }

  async updateInstructor(id: string, input: Partial<import("../domain/types").InstructorRecord>) {
    const { name: _name, id: _id, userId: _userId, ...data } = input;
    void _name;
    void _id;
    void _userId;
    const row = await this.prisma.instructor.update({
      where: { id },
      data: data as never,
      include: { user: true }
    });
    return this.mapInstructorRow(row);
  }

  private mapInstructorRow(instructor: {
    id: string;
    userId: string;
    agencyId: string | null;
    photoUrl: string | null;
    bio: string | null;
    specialties: string[];
    interventionZones: string[];
    ratingAverage: number;
    ratingCount: number;
    active: boolean;
    user: { firstName: string; lastName: string };
  }) {
    return {
      id: instructor.id,
      userId: instructor.userId,
      agencyId: instructor.agencyId ?? undefined,
      name: `${instructor.user.firstName} ${instructor.user.lastName}`,
      photoUrl: instructor.photoUrl ?? undefined,
      bio: instructor.bio ?? undefined,
      specialties: instructor.specialties,
      interventionZones: instructor.interventionZones,
      ratingAverage: instructor.ratingAverage,
      ratingCount: instructor.ratingCount,
      active: instructor.active
    };
  }

  async listFormations(includeInactive = false) {
    const rows = await this.prisma.formation.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { priceCents: "asc" }
    });
    return rows.map((row) => ({ ...row, options: row.options }));
  }

  async findFormationById(id: string) {
    const row = await this.prisma.formation.findUnique({ where: { id } });
    return row ? { ...row, options: row.options } : null;
  }

  async findFormationBySlug(slug: string) {
    const row = await this.prisma.formation.findUnique({ where: { slug } });
    return row ? { ...row, options: row.options } : null;
  }

  async createFormation(input: CreateFormationInput) {
    return this.prisma.formation.create({ data: input as never }) as Promise<FormationRecord>;
  }

  async updateFormation(id: string, input: Partial<FormationRecord>) {
    return this.prisma.formation.update({ where: { id }, data: input as never }) as Promise<FormationRecord>;
  }

  async listPricingPlans(includeInactive = false) {
    const rows = await this.prisma.pricingPlan.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { priceCents: "asc" }
    });
    return rows.map((row) => ({ ...row, formationId: row.formationId ?? undefined, description: row.description ?? undefined, promotionalLabel: row.promotionalLabel ?? undefined }));
  }

  async findPricingPlanById(id: string) {
    const row = await this.prisma.pricingPlan.findUnique({ where: { id } });
    return row ? { ...row, formationId: row.formationId ?? undefined, description: row.description ?? undefined, promotionalLabel: row.promotionalLabel ?? undefined } : null;
  }

  async listMeetingPoints() {
    const rows = await this.prisma.meetingPoint.findMany({ where: { active: true } });
    return rows.map((row) => ({ ...row, latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined }));
  }

  async listFaqEntries(includeInactive = false) {
    const rows = await this.prisma.faqEntry.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { createdAt: "asc" }
    });
    return rows.map((row) => ({ ...row, category: row.category ?? undefined }));
  }

  async createFaqEntry(input: Parameters<LodenRepository["createFaqEntry"]>[0]) {
    const row = await this.prisma.faqEntry.create({ data: input as never });
    return { ...row, category: row.category ?? undefined };
  }

  async updateFaqEntry(id: string, input: Parameters<LodenRepository["updateFaqEntry"]>[1]) {
    const row = await this.prisma.faqEntry.update({ where: { id }, data: input as never });
    return { ...row, category: row.category ?? undefined };
  }

  async deleteFaqEntry(id: string) {
    await this.prisma.faqEntry.delete({ where: { id } });
  }

  async listAvailabilities(instructorId?: string) {
    const rows = await this.prisma.availability.findMany({
      where: { isAvailable: true, instructorId },
      orderBy: { startsAt: "asc" }
    });
    return rows.map((row) => ({ ...row, reason: row.reason ?? undefined }));
  }

  async listBookings(filters?: { studentId?: string; instructorId?: string; status?: BookingRecord["status"]; agencyId?: string }) {
    const where = {
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.instructorId ? { instructorId: filters.instructorId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.booking.findMany({ where, orderBy: { startsAt: "desc" } });
    return rows.map((row) => ({ ...row, meetingPointId: row.meetingPointId ?? undefined, cancellationReason: row.cancellationReason ?? undefined }));
  }

  async findBookingById(id: string) {
    const row = await this.prisma.booking.findUnique({ where: { id } });
    return row ? { ...row, meetingPointId: row.meetingPointId ?? undefined, cancellationReason: row.cancellationReason ?? undefined } : null;
  }

  async createBooking(input: CreateBookingInput) {
    const row = await this.prisma.booking.create({ data: { ...input, status: input.status ?? "EN_ATTENTE" } });
    return { ...row, meetingPointId: row.meetingPointId ?? undefined, cancellationReason: row.cancellationReason ?? undefined };
  }

  async updateBooking(id: string, input: Partial<BookingRecord>) {
    const row = await this.prisma.booking.update({ where: { id }, data: input });
    return { ...row, meetingPointId: row.meetingPointId ?? undefined, cancellationReason: row.cancellationReason ?? undefined };
  }

  async hasInstructorConflict(instructorId: string, startsAt: Date, endsAt: Date, ignoreBookingId?: string) {
    const count = await this.prisma.booking.count({
      where: {
        instructorId,
        id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
        status: { not: "ANNULEE" },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      }
    });
    return count > 0;
  }

  async listPayments(filters?: { userId?: string; status?: PaymentRecord["status"]; agencyId?: string }) {
    const where = {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.payment.findMany({ where, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ ...row, pricingPlanId: row.pricingPlanId ?? undefined, stripePaymentIntentId: row.stripePaymentIntentId ?? undefined, invoiceUrl: row.invoiceUrl ?? undefined }));
  }

  async findPaymentByStripePaymentIntentId(stripePaymentIntentId: string) {
    const row = await this.prisma.payment.findFirst({ where: { stripePaymentIntentId } });
    if (!row) return null;
    return { ...row, pricingPlanId: row.pricingPlanId ?? undefined, stripePaymentIntentId: row.stripePaymentIntentId ?? undefined, invoiceUrl: row.invoiceUrl ?? undefined };
  }

  async createPayment(input: CreatePaymentInput) {
    const row = await this.prisma.payment.create({ data: { ...input, status: input.status ?? "EN_ATTENTE" } });
    return { ...row, pricingPlanId: row.pricingPlanId ?? undefined, stripePaymentIntentId: row.stripePaymentIntentId ?? undefined, invoiceUrl: row.invoiceUrl ?? undefined };
  }

  async updatePayment(id: string, input: Parameters<LodenRepository["updatePayment"]>[1]) {
    const data = { ...input, ...(input.status === "PAYE" ? { paidAt: new Date() } : {}) };
    const row = await this.prisma.payment.update({ where: { id }, data: data as never });
    return { ...row, pricingPlanId: row.pricingPlanId ?? undefined, stripePaymentIntentId: row.stripePaymentIntentId ?? undefined, invoiceUrl: row.invoiceUrl ?? undefined };
  }

  async listCpfRequests() {
    const rows = await this.prisma.cpfRequest.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ ...row, studentId: row.studentId ?? undefined, formationId: row.formationId ?? undefined, phone: row.phone ?? undefined, requestedAmountCents: row.requestedAmountCents ?? undefined, internalNotes: row.internalNotes ?? undefined }));
  }

  async createCpfRequest(input: CreateCpfRequestInput) {
    const row = await this.prisma.cpfRequest.create({
      data: { ...input, status: input.status ?? "NOUVELLE_DEMANDE", missingDocuments: input.missingDocuments ?? [] }
    });
    return { ...row, studentId: row.studentId ?? undefined, formationId: row.formationId ?? undefined, phone: row.phone ?? undefined, requestedAmountCents: row.requestedAmountCents ?? undefined, internalNotes: row.internalNotes ?? undefined };
  }

  async updateCpfRequest(id: string, input: Parameters<LodenRepository["updateCpfRequest"]>[1]) {
    const row = await this.prisma.cpfRequest.update({ where: { id }, data: input });
    return { ...row, studentId: row.studentId ?? undefined, formationId: row.formationId ?? undefined, phone: row.phone ?? undefined, requestedAmountCents: row.requestedAmountCents ?? undefined, internalNotes: row.internalNotes ?? undefined };
  }

  async listContactRequests() {
    const rows = await this.prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ ...row, userId: row.userId ?? undefined, phone: row.phone ?? undefined, source: row.source ?? undefined }));
  }

  async createContactRequest(input: CreateContactRequestInput) {
    const row = await this.prisma.contactRequest.create({ data: { ...input, status: input.status ?? "NOUVELLE" } });
    return { ...row, userId: row.userId ?? undefined, phone: row.phone ?? undefined, source: row.source ?? undefined };
  }

  async updateContactRequest(id: string, input: Parameters<LodenRepository["updateContactRequest"]>[1]) {
    const row = await this.prisma.contactRequest.update({ where: { id }, data: input });
    return { ...row, userId: row.userId ?? undefined, phone: row.phone ?? undefined, source: row.source ?? undefined };
  }

  async listReviews(includeUnpublished = false) {
    const rows = await this.prisma.review.findMany({
      where: includeUnpublished ? undefined : { status: "PUBLIE" },
      orderBy: { createdAt: "desc" }
    });
    return rows.map((row) => ({ ...row, userId: row.userId ?? undefined, instructorId: row.instructorId ?? undefined, publishedAt: row.publishedAt ?? undefined }));
  }

  async createReview(input: CreateReviewInput) {
    const row = await this.prisma.review.create({ data: { ...input, status: input.status ?? "EN_ATTENTE" } });
    return { ...row, userId: row.userId ?? undefined, instructorId: row.instructorId ?? undefined, publishedAt: row.publishedAt ?? undefined };
  }

  async updateReview(id: string, input: Parameters<LodenRepository["updateReview"]>[1]) {
    const row = await this.prisma.review.update({ where: { id }, data: input });
    return { ...row, userId: row.userId ?? undefined, instructorId: row.instructorId ?? undefined, publishedAt: row.publishedAt ?? undefined };
  }

  async listLeads(filters?: Parameters<LodenRepository["listLeads"]>[0]) {
    const where = {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agencyId
        ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] }
        : {})
    };
    const rows = await this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });
    return rows.map((row) => ({
      ...row,
      phone: row.phone ?? undefined,
      source: row.source ?? undefined,
      interest: row.interest ?? undefined,
      notes: row.notes ?? undefined,
      estimatedValueCents: row.estimatedValueCents ?? undefined,
      nextFollowUpAt: row.nextFollowUpAt ?? undefined
    }));
  }

  async createLead(input: CreateLeadInput) {
    const row = await this.prisma.lead.create({ data: { ...input, status: input.status ?? "PROSPECT" } });
    return {
      ...row,
      phone: row.phone ?? undefined,
      source: row.source ?? undefined,
      interest: row.interest ?? undefined,
      notes: row.notes ?? undefined,
      estimatedValueCents: row.estimatedValueCents ?? undefined,
      nextFollowUpAt: row.nextFollowUpAt ?? undefined
    };
  }

  async updateLead(id: string, input: Parameters<LodenRepository["updateLead"]>[1]) {
    const row = await this.prisma.lead.update({ where: { id }, data: input });
    return {
      ...row,
      phone: row.phone ?? undefined,
      source: row.source ?? undefined,
      interest: row.interest ?? undefined,
      notes: row.notes ?? undefined,
      estimatedValueCents: row.estimatedValueCents ?? undefined,
      nextFollowUpAt: row.nextFollowUpAt ?? undefined
    };
  }

  async listExams(filters?: { agencyId?: string; studentId?: string }) {
    const where = {
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.exam.findMany({ where, orderBy: { scheduledAt: "desc" } });
    return rows.map((row) => ({ ...row, agencyId: row.agencyId ?? undefined, center: row.center ?? undefined, score: row.score ?? undefined }));
  }

  async createExam(input: Parameters<LodenRepository["createExam"]>[0]) {
    const row = await this.prisma.exam.create({
      data: { ...input, result: input.result ?? "EN_ATTENTE", attempt: input.attempt ?? 1 } as never
    });
    return { ...row, agencyId: row.agencyId ?? undefined, center: row.center ?? undefined, score: row.score ?? undefined };
  }

  async updateExam(id: string, input: Parameters<LodenRepository["updateExam"]>[1]) {
    const row = await this.prisma.exam.update({ where: { id }, data: input as never });
    return { ...row, agencyId: row.agencyId ?? undefined, center: row.center ?? undefined, score: row.score ?? undefined };
  }

  async listInstallments(filters?: { agencyId?: string; studentId?: string }) {
    const where = {
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.installment.findMany({ where, orderBy: { dueDate: "asc" } });
    return rows.map((row) => ({ ...row, agencyId: row.agencyId ?? undefined, label: row.label ?? undefined, paidAt: row.paidAt ?? undefined }));
  }

  async createInstallment(input: Parameters<LodenRepository["createInstallment"]>[0]) {
    const row = await this.prisma.installment.create({ data: { ...input, status: input.status ?? "EN_ATTENTE" } as never });
    return { ...row, agencyId: row.agencyId ?? undefined, label: row.label ?? undefined, paidAt: row.paidAt ?? undefined };
  }

  async updateInstallment(id: string, input: Parameters<LodenRepository["updateInstallment"]>[1]) {
    const data = { ...input, ...(input.status === "PAYE" ? { paidAt: new Date() } : {}) };
    const row = await this.prisma.installment.update({ where: { id }, data: data as never });
    return { ...row, agencyId: row.agencyId ?? undefined, label: row.label ?? undefined, paidAt: row.paidAt ?? undefined };
  }

  async createAuditLog(input: Parameters<LodenRepository["createAuditLog"]>[0]) {
    const row = await this.prisma.auditLog.create({ data: input as never });
    return { ...row, userId: row.userId ?? undefined, entityId: row.entityId ?? undefined, metadata: row.metadata };
  }

  async listAuditLogs(limit = 100) {
    const rows = await this.prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map((row) => ({ ...row, userId: row.userId ?? undefined, entityId: row.entityId ?? undefined, metadata: row.metadata }));
  }

  async search(query: string): Promise<SearchResult[]> {
    // Keep search behavior consistent with the in-memory adapter until a database
    // full-text index is introduced.
    const memory = new MemoryLodenRepository({
      formations: await this.listFormations(),
      pricingPlans: await this.listPricingPlans(),
      instructors: await this.listInstructors(),
      meetingPoints: await this.listMeetingPoints(),
      faqEntries: await this.listFaqEntries()
    });
    return memory.search(query);
  }
}
