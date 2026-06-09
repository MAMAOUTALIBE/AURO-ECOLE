import { PrismaClient } from "@prisma/client";
import type {
  BookingRecord,
  CompanyInfoRecord,
  FormationRecord,
  InvoiceRecord,
  InvoiceLineItem,
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
  PaymentRecord,
  QuoteRecord,
  ContractRecord,
  ContentEntryRecord,
  AutomationRuleRecord,
  SearchResult
} from "../domain/types";
import { computeInvoiceTotals } from "../domain/invoice-totals";
import { conflict } from "../shared/http-error";
import { initialCompanyInfo } from "../data/initial-data";
import { MemoryLodenRepository } from "./memory-loden-repository";
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
  CreateAutomationRuleInput,
  CreateStudentInput,
  CreateUserInput,
  CreateVehicleInput,
  ListUsersFilters,
  LodenRepository,
  UpdateInvoiceInput,
  UpdateQuoteInput,
  UpdateContractInput,
  UpdateContentEntryInput,
  UpdateAutomationRuleInput
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

  async createAgency(input: CreateAgencyInput) {
    const row = await this.prisma.agency.create({ data: { ...input, active: input.active ?? true } as never });
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

  async updateAgency(id: string, input: Parameters<LodenRepository["updateAgency"]>[1]) {
    const row = await this.prisma.agency.update({ where: { id }, data: input as never });
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

  async listVehicles(filters?: { agencyId?: string }) {
    return this.prisma.vehicle.findMany({
      where: filters?.agencyId ? { agencyId: filters.agencyId } : undefined,
      orderBy: { label: "asc" }
    }) as Promise<Awaited<ReturnType<LodenRepository["listVehicles"]>>>;
  }

  async findVehicleById(id: string) {
    return this.prisma.vehicle.findUnique({ where: { id } }) as Promise<Awaited<ReturnType<LodenRepository["findVehicleById"]>>>;
  }

  async createVehicle(input: CreateVehicleInput) {
    return this.prisma.vehicle.create({ data: { ...input, active: input.active ?? true } as never }) as Promise<
      Awaited<ReturnType<LodenRepository["createVehicle"]>>
    >;
  }

  async updateVehicle(id: string, input: Parameters<LodenRepository["updateVehicle"]>[1]) {
    return this.prisma.vehicle.update({ where: { id }, data: input as never }) as Promise<
      Awaited<ReturnType<LodenRepository["updateVehicle"]>>
    >;
  }

  private mapInvoice(row: {
    id: string;
    number: string | null;
    status: string;
    clientUserId: string;
    studentId: string | null;
    agencyId: string | null;
    paymentId: string | null;
    lines: unknown;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    currency: string;
    issuerSnapshot: unknown;
    clientSnapshot: unknown;
    issuedAt: Date | null;
    dueDate: Date | null;
    paidAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvoiceRecord {
    return {
      id: row.id,
      number: row.number,
      status: row.status as InvoiceRecord["status"],
      clientUserId: row.clientUserId,
      studentId: row.studentId,
      agencyId: row.agencyId,
      paymentId: row.paymentId,
      lines: (row.lines as InvoiceLineItem[]) ?? [],
      subtotalCents: row.subtotalCents,
      vatCents: row.vatCents,
      totalCents: row.totalCents,
      currency: row.currency,
      issuerSnapshot: (row.issuerSnapshot as InvoiceIssuerSnapshot | null) ?? null,
      clientSnapshot: (row.clientSnapshot as InvoiceClientSnapshot | null) ?? null,
      issuedAt: row.issuedAt,
      dueDate: row.dueDate,
      paidAt: row.paidAt,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async listInvoices(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: InvoiceRecord["status"] }) {
    const where = {
      ...(filters?.clientUserId ? { clientUserId: filters.clientUserId } : {}),
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.invoice.findMany({ where: where as never, orderBy: { createdAt: "desc" } });
    return rows.map((row) => this.mapInvoice(row));
  }

  async findInvoiceById(id: string) {
    const row = await this.prisma.invoice.findUnique({ where: { id } });
    return row ? this.mapInvoice(row) : null;
  }

  async findInvoiceByPaymentId(paymentId: string) {
    const row = await this.prisma.invoice.findUnique({ where: { paymentId } });
    return row ? this.mapInvoice(row) : null;
  }

  async createInvoice(input: CreateInvoiceInput) {
    if (input.paymentId) {
      const existing = await this.prisma.invoice.findUnique({ where: { paymentId: input.paymentId } });
      if (existing) throw conflict("Un paiement ne peut porter qu'une facture");
    }
    const lines = input.lines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
    const totals = computeInvoiceTotals(lines);
    const row = await this.prisma.invoice.create({
      data: {
        status: "BROUILLON",
        clientUserId: input.clientUserId,
        studentId: input.studentId ?? null,
        agencyId: input.agencyId ?? null,
        paymentId: input.paymentId ?? null,
        lines: lines as never,
        ...totals,
        currency: input.currency ?? "EUR",
        dueDate: input.dueDate ?? null,
        notes: input.notes ?? null
      } as never
    });
    return this.mapInvoice(row);
  }

  async updateInvoice(id: string, input: UpdateInvoiceInput) {
    const data: Record<string, unknown> = { ...input };
    if (input.lines) {
      const lines = input.lines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
      data.lines = lines;
      Object.assign(data, computeInvoiceTotals(lines));
    }
    if (input.status === "PAYEE") data.paidAt = new Date();
    const row = await this.prisma.invoice.update({ where: { id }, data: data as never });
    return this.mapInvoice(row);
  }

  async issueInvoice(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }) {
    const issuedAt = new Date();
    const year = issuedAt.getFullYear();
    const row = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.invoiceCounter.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } }
      });
      const number = `FAC-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
      return tx.invoice.update({
        where: { id },
        data: { number, status: "EMISE", issuedAt, issuerSnapshot: snapshots.issuer as never, clientSnapshot: snapshots.client as never }
      });
    });
    return this.mapInvoice(row);
  }

  async deleteInvoice(id: string) {
    await this.prisma.invoice.delete({ where: { id } });
  }

  private mapQuote(row: {
    id: string;
    number: string | null;
    status: string;
    clientUserId: string;
    studentId: string | null;
    agencyId: string | null;
    lines: unknown;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    currency: string;
    issuerSnapshot: unknown;
    clientSnapshot: unknown;
    sentAt: Date | null;
    validUntil: Date | null;
    decidedAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): QuoteRecord {
    return {
      id: row.id,
      number: row.number,
      status: row.status as QuoteRecord["status"],
      clientUserId: row.clientUserId,
      studentId: row.studentId,
      agencyId: row.agencyId,
      lines: (row.lines as InvoiceLineItem[]) ?? [],
      subtotalCents: row.subtotalCents,
      vatCents: row.vatCents,
      totalCents: row.totalCents,
      currency: row.currency,
      issuerSnapshot: (row.issuerSnapshot as InvoiceIssuerSnapshot | null) ?? null,
      clientSnapshot: (row.clientSnapshot as InvoiceClientSnapshot | null) ?? null,
      sentAt: row.sentAt,
      validUntil: row.validUntil,
      decidedAt: row.decidedAt,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async listQuotes(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: QuoteRecord["status"] }) {
    const where = {
      ...(filters?.clientUserId ? { clientUserId: filters.clientUserId } : {}),
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.quote.findMany({ where: where as never, orderBy: { createdAt: "desc" } });
    return rows.map((row) => this.mapQuote(row));
  }

  async findQuoteById(id: string) {
    const row = await this.prisma.quote.findUnique({ where: { id } });
    return row ? this.mapQuote(row) : null;
  }

  async createQuote(input: CreateQuoteInput) {
    const lines = input.lines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
    const totals = computeInvoiceTotals(lines);
    const row = await this.prisma.quote.create({
      data: {
        status: "BROUILLON",
        clientUserId: input.clientUserId,
        studentId: input.studentId ?? null,
        agencyId: input.agencyId ?? null,
        lines: lines as never,
        ...totals,
        currency: "EUR",
        validUntil: input.validUntil ?? null,
        notes: input.notes ?? null
      } as never
    });
    return this.mapQuote(row);
  }

  async updateQuote(id: string, input: UpdateQuoteInput) {
    const data: Record<string, unknown> = { ...input };
    if (input.lines) {
      const lines = input.lines.map((line) => ({ ...line, vatRate: line.vatRate ?? 0 }));
      data.lines = lines;
      Object.assign(data, computeInvoiceTotals(lines));
    }
    if (input.status === "ACCEPTE" || input.status === "REFUSE") data.decidedAt = new Date();
    const row = await this.prisma.quote.update({ where: { id }, data: data as never });
    return this.mapQuote(row);
  }

  async sendQuote(id: string, snapshots: { issuer: InvoiceIssuerSnapshot; client: InvoiceClientSnapshot }) {
    const sentAt = new Date();
    const year = sentAt.getFullYear();
    const row = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.quoteCounter.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } }
      });
      const number = `DEV-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
      return tx.quote.update({
        where: { id },
        data: { number, status: "ENVOYE", sentAt, issuerSnapshot: snapshots.issuer as never, clientSnapshot: snapshots.client as never }
      });
    });
    return this.mapQuote(row);
  }

  async deleteQuote(id: string) {
    await this.prisma.quote.delete({ where: { id } });
  }

  private mapContract(row: {
    id: string;
    number: string | null;
    status: string;
    clientUserId: string;
    studentId: string | null;
    formationId: string | null;
    agencyId: string | null;
    title: string;
    body: string;
    totalCents: number;
    currency: string;
    issuerSnapshot: unknown;
    clientSnapshot: unknown;
    signedAt: Date | null;
    startsAt: Date | null;
    endsAt: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ContractRecord {
    return {
      id: row.id,
      number: row.number,
      status: row.status as ContractRecord["status"],
      clientUserId: row.clientUserId,
      studentId: row.studentId,
      formationId: row.formationId,
      agencyId: row.agencyId,
      title: row.title,
      body: row.body,
      totalCents: row.totalCents,
      currency: row.currency,
      issuerSnapshot: (row.issuerSnapshot as ContractRecord["issuerSnapshot"]) ?? null,
      clientSnapshot: (row.clientSnapshot as ContractRecord["clientSnapshot"]) ?? null,
      signedAt: row.signedAt,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async listContracts(filters?: { agencyId?: string; clientUserId?: string; studentId?: string; status?: ContractRecord["status"] }) {
    const where = {
      ...(filters?.clientUserId ? { clientUserId: filters.clientUserId } : {}),
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agencyId ? { OR: [{ agencyId: filters.agencyId }, { agencyId: null }] } : {})
    };
    const rows = await this.prisma.contract.findMany({ where: where as never, orderBy: { createdAt: "desc" } });
    return rows.map((row) => this.mapContract(row));
  }

  async findContractById(id: string) {
    const row = await this.prisma.contract.findUnique({ where: { id } });
    return row ? this.mapContract(row) : null;
  }

  async createContract(input: CreateContractInput) {
    const row = await this.prisma.contract.create({
      data: {
        status: "BROUILLON",
        clientUserId: input.clientUserId,
        studentId: input.studentId ?? null,
        formationId: input.formationId ?? null,
        agencyId: input.agencyId ?? null,
        title: input.title,
        body: input.body,
        totalCents: input.totalCents ?? 0,
        currency: "EUR",
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        notes: input.notes ?? null
      } as never
    });
    return this.mapContract(row);
  }

  async updateContract(id: string, input: UpdateContractInput) {
    const row = await this.prisma.contract.update({ where: { id }, data: { ...input } as never });
    return this.mapContract(row);
  }

  async activateContract(id: string, snapshots: { issuer: ContractRecord["issuerSnapshot"]; client: ContractRecord["clientSnapshot"] }) {
    const signedAt = new Date();
    const year = signedAt.getFullYear();
    const row = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.contractCounter.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } }
      });
      const number = `CTR-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
      return tx.contract.update({
        where: { id },
        data: { number, status: "ACTIF", signedAt, issuerSnapshot: snapshots.issuer as never, clientSnapshot: snapshots.client as never }
      });
    });
    return this.mapContract(row);
  }

  async deleteContract(id: string) {
    await this.prisma.contract.delete({ where: { id } });
  }

  async listContentEntries(filters?: { type?: ContentEntryRecord["type"]; published?: boolean }) {
    const where = {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.published === undefined ? {} : { published: filters.published })
    };
    return this.prisma.contentEntry.findMany({ where: where as never, orderBy: { updatedAt: "desc" } }) as Promise<
      Awaited<ReturnType<LodenRepository["listContentEntries"]>>
    >;
  }

  async findContentEntryById(id: string) {
    return this.prisma.contentEntry.findUnique({ where: { id } }) as Promise<
      Awaited<ReturnType<LodenRepository["findContentEntryById"]>>
    >;
  }

  async createContentEntry(input: CreateContentEntryInput) {
    const published = input.published ?? false;
    return this.prisma.contentEntry.create({
      data: {
        type: input.type,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        body: input.body,
        published,
        publishedAt: published ? new Date() : null,
        agencyId: input.agencyId ?? null
      } as never
    }) as Promise<Awaited<ReturnType<LodenRepository["createContentEntry"]>>>;
  }

  async updateContentEntry(id: string, input: UpdateContentEntryInput) {
    const data: Record<string, unknown> = { ...input };
    if (input.published === true) {
      const existing = await this.prisma.contentEntry.findUnique({ where: { id } });
      if (existing && !existing.publishedAt) data.publishedAt = new Date();
    }
    return this.prisma.contentEntry.update({ where: { id }, data: data as never }) as Promise<
      Awaited<ReturnType<LodenRepository["updateContentEntry"]>>
    >;
  }

  async deleteContentEntry(id: string) {
    await this.prisma.contentEntry.delete({ where: { id } });
  }

  async listAutomationRules(filters?: { trigger?: AutomationRuleRecord["trigger"]; active?: boolean }) {
    const where = {
      ...(filters?.trigger ? { trigger: filters.trigger } : {}),
      ...(filters?.active === undefined ? {} : { active: filters.active })
    };
    return this.prisma.automationRule.findMany({ where: where as never, orderBy: { createdAt: "desc" } }) as Promise<
      Awaited<ReturnType<LodenRepository["listAutomationRules"]>>
    >;
  }

  async findAutomationRuleById(id: string) {
    return this.prisma.automationRule.findUnique({ where: { id } }) as Promise<
      Awaited<ReturnType<LodenRepository["findAutomationRuleById"]>>
    >;
  }

  async createAutomationRule(input: CreateAutomationRuleInput) {
    return this.prisma.automationRule.create({
      data: { name: input.name, trigger: input.trigger, action: input.action, active: input.active ?? true, agencyId: input.agencyId ?? null } as never
    }) as Promise<Awaited<ReturnType<LodenRepository["createAutomationRule"]>>>;
  }

  async updateAutomationRule(id: string, input: UpdateAutomationRuleInput) {
    return this.prisma.automationRule.update({ where: { id }, data: input as never }) as Promise<
      Awaited<ReturnType<LodenRepository["updateAutomationRule"]>>
    >;
  }

  async deleteAutomationRule(id: string) {
    await this.prisma.automationRule.delete({ where: { id } });
  }

  async recordAutomationRun(id: string) {
    await this.prisma.automationRule.update({ where: { id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } });
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

  async getCompanyInfo(): Promise<CompanyInfoRecord> {
    const existing = await this.prisma.companyInfo.findUnique({ where: { id: "company" } });
    if (existing) return existing;
    const { id: _id, updatedAt: _updatedAt, ...defaults } = initialCompanyInfo;
    void _id;
    void _updatedAt;
    return this.prisma.companyInfo.create({ data: { id: "company", ...defaults } });
  }

  async updateCompanyInfo(input: Partial<CompanyInfoRecord>): Promise<CompanyInfoRecord> {
    const { id: _id, updatedAt: _updatedAt, ...data } = input;
    void _id;
    void _updatedAt;
    const { id: _i2, updatedAt: _u2, ...defaults } = initialCompanyInfo;
    void _i2;
    void _u2;
    return this.prisma.companyInfo.upsert({
      where: { id: "company" },
      update: data,
      create: { id: "company", ...defaults, ...data }
    });
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
