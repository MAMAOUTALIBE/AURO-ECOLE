import type { MutableStore } from "../repositories/memory-loden-repository";
import type {
  BookingRecord,
  ChatAppointmentRecord,
  ChatConversationRecord,
  ChatTaskRecord,
  CpfRequestRecord,
  ExamRecord,
  InstructorRecord,
  InvoiceRecord,
  LeadRecord,
  PaymentRecord,
  QuoteRecord,
  ContractRecord,
  ContentEntryRecord,
  ReviewRecord,
  StudentRecord,
  UserRecord,
  VehicleRecord,
  AgencyRecord,
  AutomationRuleRecord
} from "../domain/types";
import { computeInvoiceTotals } from "../domain/invoice-totals";
import {
  initialAgencies,
  initialAgencyMemberships,
  initialCompanyInfo,
  initialFormations,
  initialUsers
} from "./initial-data";

/**
 * Jeu de données de DÉMONSTRATION (toggle `API_DEMO_SEED=true`).
 *
 * Règles : tout est clairement marqué — ids préfixés `demo-`, emails `@demo.lodene.fr`,
 * notes "Donnée de démonstration". Rien n'est persisté (repo mémoire) : désactiver le
 * flag (ou redémarrer) supprime tout. N'altère jamais le jeu réel (vide par défaut) :
 * on ré-inclut les enregistrements officiels (admin, agence, formations) là où le seed
 * remplace un tableau, et on n'ajoute que par-dessus.
 */

const DAY = 86_400_000;
const AGENCY = initialAgencies[0]?.id ?? "agency-republique";
const DEMO_AGENCY = "demo-agency-cergy";
const FORM = (i: number) => initialFormations[i % initialFormations.length]?.id ?? "formation-permis-b-manuel";

function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY);
}
function inDays(n: number) {
  return new Date(Date.now() + n * DAY);
}
function at(daysOffset: number, hour: number) {
  const d = new Date(Date.now() + daysOffset * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
}
const DEMO_NOTE = "Donnée de démonstration";

// --- Agence de démo (en plus de l'agence officielle) ---
const demoAgency: AgencyRecord = {
  id: DEMO_AGENCY,
  name: "LODENE Cergy (démo)",
  slug: "cergy-demo",
  address: "12 avenue des Tilleuls, 95000 Cergy",
  latitude: null,
  longitude: null,
  phone: "01 30 00 00 00",
  email: "cergy@demo.lodene.fr",
  active: true
};

// --- Utilisateurs (moniteurs + élèves) ---
type DemoUser = { id: string; firstName: string; lastName: string; role: UserRecord["role"] };
const monitorUsers: DemoUser[] = [
  { id: "demo-u-mon1", firstName: "Karim", lastName: "Haddad", role: "MONITEUR" },
  { id: "demo-u-mon2", firstName: "Sophie", lastName: "Bernard", role: "MONITEUR" },
  { id: "demo-u-mon3", firstName: "Thomas", lastName: "Leroy", role: "MONITEUR" }
];
const studentUsers: DemoUser[] = [
  { id: "demo-u-stu1", firstName: "Léa", lastName: "Dubois", role: "ELEVE" },
  { id: "demo-u-stu2", firstName: "Lucas", lastName: "Martin", role: "ELEVE" },
  { id: "demo-u-stu3", firstName: "Inès", lastName: "Moreau", role: "ELEVE" },
  { id: "demo-u-stu4", firstName: "Hugo", lastName: "Garcia", role: "ELEVE" },
  { id: "demo-u-stu5", firstName: "Camille", lastName: "Petit", role: "ELEVE" },
  { id: "demo-u-stu6", firstName: "Nadia", lastName: "Khelifi", role: "ELEVE" }
];
const secretaryUser: DemoUser = { id: "demo-u-sec1", firstName: "Julie", lastName: "Rousseau", role: "SECRETAIRE" };

const allDemoUsers = [...monitorUsers, ...studentUsers, secretaryUser];
const demoUsers: UserRecord[] = allDemoUsers.map((u, i) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: `${u.firstName}.${u.lastName}@demo.lodene.fr`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
  phone: `06 12 34 ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")}`,
  address: `${i + 3} rue de la Démo, 78700 Conflans-Sainte-Honorine`,
  role: u.role,
  status: "ACTIVE",
  passwordHash: null,
  createdAt: daysAgo(60 - i * 5),
  updatedAt: daysAgo(2)
}));

// --- Moniteurs ---
const demoInstructors: InstructorRecord[] = [
  { id: "demo-ins1", userId: "demo-u-mon1", agencyId: AGENCY, name: "Karim Haddad", photoUrl: null, bio: null, specialties: ["Boîte manuelle", "Conduite accompagnée"], interventionZones: ["Conflans", "Andrésy"], ratingAverage: 4.8, ratingCount: 32, active: true },
  { id: "demo-ins2", userId: "demo-u-mon2", agencyId: AGENCY, name: "Sophie Bernard", photoUrl: null, bio: null, specialties: ["Boîte automatique", "Perfectionnement"], interventionZones: ["Conflans", "Maurecourt"], ratingAverage: 4.6, ratingCount: 21, active: true },
  { id: "demo-ins3", userId: "demo-u-mon3", agencyId: AGENCY, name: "Thomas Leroy", photoUrl: null, bio: null, specialties: ["Code", "Permis accéléré"], interventionZones: ["Conflans"], ratingAverage: 4.9, ratingCount: 14, active: false }
];

// --- Véhicules ---
const demoVehicles: VehicleRecord[] = [
  { id: "demo-veh1", instructorId: "demo-ins1", label: "Clio IV — Manuelle", transmission: "MANUEL", registration: "AB-123-CD", active: true, agencyId: AGENCY },
  { id: "demo-veh2", instructorId: "demo-ins2", label: "Peugeot 208 — Automatique", transmission: "AUTOMATIQUE", registration: "EF-456-GH", active: true, agencyId: AGENCY },
  { id: "demo-veh3", instructorId: null, label: "Yaris — Manuelle", transmission: "MANUEL", registration: "IJ-789-KL", active: false, agencyId: AGENCY }
];

// --- Élèves ---
const FILE_STATUSES = ["EN_COURS", "INCOMPLET", "PRET_EXAMEN", "EXAMEN_PLANIFIE", "TERMINE", "NOUVEAU"];
const demoStudents: StudentRecord[] = studentUsers.map((u, i) => ({
  id: `demo-stu${i + 1}`,
  userId: u.id,
  agencyId: i === 5 ? DEMO_AGENCY : AGENCY,
  formationId: FORM(i),
  progressPercent: [55, 20, 85, 70, 100, 0][i],
  purchasedHours: [30, 20, 30, 20, 30, 20][i],
  consumedHours: [16, 4, 25, 14, 30, 0][i],
  examDate: i === 3 ? inDays(12) : null,
  fileStatus: FILE_STATUSES[i],
  internalNotes: DEMO_NOTE,
  createdAt: daysAgo(55 - i * 6),
  updatedAt: daysAgo(1)
}));

// --- Leçons (bookings) : passées + à venir ---
const demoBookings: BookingRecord[] = [
  { id: "demo-bk1", studentId: "demo-stu1", instructorId: "demo-ins1", formationId: FORM(0), agencyId: AGENCY, meetingPointId: null, startsAt: at(-7, 10), endsAt: at(-7, 12), status: "TERMINEE", cancellationReason: null, createdAt: daysAgo(10), updatedAt: daysAgo(7) },
  { id: "demo-bk2", studentId: "demo-stu2", instructorId: "demo-ins2", formationId: FORM(1), agencyId: AGENCY, meetingPointId: null, startsAt: at(-2, 14), endsAt: at(-2, 16), status: "ABSENT", cancellationReason: null, createdAt: daysAgo(6), updatedAt: daysAgo(2) },
  { id: "demo-bk3", studentId: "demo-stu1", instructorId: "demo-ins1", formationId: FORM(0), agencyId: AGENCY, meetingPointId: null, startsAt: at(1, 9), endsAt: at(1, 11), status: "CONFIRMEE", cancellationReason: null, createdAt: daysAgo(3), updatedAt: daysAgo(1) },
  { id: "demo-bk4", studentId: "demo-stu3", instructorId: "demo-ins2", formationId: FORM(2), agencyId: AGENCY, meetingPointId: null, startsAt: at(2, 11), endsAt: at(2, 13), status: "CONFIRMEE", cancellationReason: null, createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: "demo-bk5", studentId: "demo-stu4", instructorId: "demo-ins1", formationId: FORM(0), agencyId: AGENCY, meetingPointId: null, startsAt: at(3, 15), endsAt: at(3, 17), status: "EN_ATTENTE", cancellationReason: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) }
];

// --- Paiements ---
const demoPayments: PaymentRecord[] = [
  { id: "demo-pay1", userId: "demo-u-stu1", agencyId: AGENCY, pricingPlanId: null, kind: "FORMATION", status: "PAYE", amountCents: 119000, currency: "EUR", stripePaymentIntentId: null, invoiceUrl: null, paidAt: daysAgo(40), createdAt: daysAgo(40), updatedAt: daysAgo(40) },
  { id: "demo-pay2", userId: "demo-u-stu2", agencyId: AGENCY, pricingPlanId: null, kind: "ACOMPTE", status: "PAYE", amountCents: 50000, currency: "EUR", stripePaymentIntentId: null, invoiceUrl: null, paidAt: daysAgo(20), createdAt: daysAgo(20), updatedAt: daysAgo(20) },
  { id: "demo-pay3", userId: "demo-u-stu3", agencyId: AGENCY, pricingPlanId: null, kind: "FORMATION", status: "PAYE", amountCents: 139000, currency: "EUR", stripePaymentIntentId: null, invoiceUrl: null, paidAt: daysAgo(12), createdAt: daysAgo(12), updatedAt: daysAgo(12) },
  { id: "demo-pay4", userId: "demo-u-stu4", agencyId: AGENCY, pricingPlanId: null, kind: "ECHEANCE", status: "EN_ATTENTE", amountCents: 30000, currency: "EUR", stripePaymentIntentId: null, invoiceUrl: null, paidAt: null, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: "demo-pay5", userId: "demo-u-stu5", agencyId: AGENCY, pricingPlanId: null, kind: "FORMATION", status: "PAYE", amountCents: 119000, currency: "EUR", stripePaymentIntentId: null, invoiceUrl: null, paidAt: daysAgo(2), createdAt: daysAgo(2), updatedAt: daysAgo(2) }
];

// --- Factures (brouillon / émises / payée) ---
const issuer = {
  legalName: initialCompanyInfo.legalName,
  legalForm: initialCompanyInfo.legalForm,
  capital: initialCompanyInfo.capital,
  address: initialCompanyInfo.address,
  postalCode: initialCompanyInfo.postalCode,
  city: initialCompanyInfo.city,
  country: initialCompanyInfo.country,
  siret: initialCompanyInfo.siret,
  approvalNumber: initialCompanyInfo.approvalNumber,
  phone: initialCompanyInfo.phone,
  email: initialCompanyInfo.email
};
const year = new Date().getFullYear();
function invoice(
  idx: number,
  clientUserId: string,
  clientName: string,
  lines: { label: string; quantity: number; unitAmountCents: number; vatRate: number }[],
  status: InvoiceRecord["status"],
  paymentId: string | null
): InvoiceRecord {
  const totals = computeInvoiceTotals(lines);
  const issued = status !== "BROUILLON";
  return {
    id: `demo-inv${idx}`,
    number: issued ? `FAC-${year}-${String(idx).padStart(6, "0")}` : null,
    status,
    clientUserId,
    studentId: null,
    agencyId: AGENCY,
    paymentId,
    lines,
    ...totals,
    currency: "EUR",
    issuerSnapshot: issued ? issuer : null,
    clientSnapshot: issued ? { name: clientName, email: `${clientName.split(" ").join(".")}@demo.lodene.fr`.toLowerCase(), address: "" } : null,
    issuedAt: issued ? daysAgo(30 - idx) : null,
    dueDate: issued ? inDays(idx * 5) : null,
    paidAt: status === "PAYEE" ? daysAgo(10) : null,
    notes: "TVA non applicable, art. 293 B du CGI.",
    createdAt: daysAgo(35 - idx),
    updatedAt: daysAgo(idx)
  };
}
const demoInvoices: InvoiceRecord[] = [
  invoice(1, "demo-u-stu1", "Léa Dubois", [{ label: "Forfait Permis B — 30h", quantity: 1, unitAmountCents: 119000, vatRate: 0 }], "PAYEE", "demo-pay1"),
  invoice(2, "demo-u-stu3", "Inès Moreau", [{ label: "Forfait Permis B accéléré", quantity: 1, unitAmountCents: 139000, vatRate: 0 }], "EMISE", "demo-pay3"),
  invoice(3, "demo-u-stu2", "Lucas Martin", [{ label: "Acompte formation", quantity: 1, unitAmountCents: 50000, vatRate: 0 }, { label: "Frais de dossier", quantity: 1, unitAmountCents: 5000, vatRate: 20 }], "BROUILLON", null)
];

// --- Devis (brouillon / envoyé / accepté) ---
function quote(
  idx: number,
  clientUserId: string,
  clientName: string,
  lines: { label: string; quantity: number; unitAmountCents: number; vatRate: number }[],
  status: QuoteRecord["status"]
): QuoteRecord {
  const totals = computeInvoiceTotals(lines);
  const sent = status !== "BROUILLON";
  return {
    id: `demo-quote${idx}`,
    number: sent ? `DEV-${year}-${String(idx).padStart(6, "0")}` : null,
    status,
    clientUserId,
    studentId: null,
    agencyId: AGENCY,
    lines,
    ...totals,
    currency: "EUR",
    issuerSnapshot: sent ? issuer : null,
    clientSnapshot: sent ? { name: clientName, email: `${clientName.split(" ").join(".")}@demo.lodene.fr`.toLowerCase(), address: "" } : null,
    sentAt: sent ? daysAgo(15 - idx) : null,
    validUntil: inDays(30 - idx * 5),
    decidedAt: status === "ACCEPTE" ? daysAgo(3) : null,
    notes: "Offre valable 30 jours.",
    createdAt: daysAgo(18 - idx),
    updatedAt: daysAgo(idx)
  };
}
const demoQuotes: QuoteRecord[] = [
  quote(1, "demo-u-stu4", "Hugo Garcia", [{ label: "Forfait Permis B — 30h", quantity: 1, unitAmountCents: 119000, vatRate: 0 }], "ACCEPTE"),
  quote(2, "demo-u-stu6", "Nadia Khelifi", [{ label: "Pack Permis B automatique", quantity: 1, unitAmountCents: 129000, vatRate: 0 }, { label: "Frais de dossier", quantity: 1, unitAmountCents: 5000, vatRate: 20 }], "ENVOYE"),
  quote(3, "demo-u-stu2", "Lucas Martin", [{ label: "Conduite accompagnée", quantity: 1, unitAmountCents: 99000, vatRate: 0 }], "BROUILLON")
];

// --- Contrats ---
const CONTRACT_BODY =
  "Le présent contrat de formation est conclu entre l'auto-école LODENE et l'élève désigné.\n\n1. Objet : formation à la conduite et préparation à l'examen du permis B.\n2. Durée : selon le forfait souscrit.\n3. Prix et règlement : montant indiqué, payable selon l'échéancier convenu.\n4. Conditions : conformément au règlement intérieur.";
function contract(idx: number, clientUserId: string, clientName: string, status: ContractRecord["status"], totalCents: number): ContractRecord {
  const active = status !== "BROUILLON";
  return {
    id: `demo-ctr${idx}`,
    number: active ? `CTR-${year}-${String(idx).padStart(6, "0")}` : null,
    status,
    clientUserId,
    studentId: null,
    formationId: FORM(0),
    agencyId: AGENCY,
    title: "Contrat de formation au permis B",
    body: CONTRACT_BODY,
    totalCents,
    currency: "EUR",
    issuerSnapshot: active ? issuer : null,
    clientSnapshot: active ? { name: clientName, email: `${clientName.split(" ").join(".")}@demo.lodene.fr`.toLowerCase(), address: "" } : null,
    signedAt: active ? daysAgo(25 - idx) : null,
    startsAt: active ? daysAgo(24 - idx) : null,
    endsAt: null,
    notes: null,
    createdAt: daysAgo(28 - idx),
    updatedAt: daysAgo(idx)
  };
}
const demoContracts: ContractRecord[] = [
  contract(1, "demo-u-stu1", "Léa Dubois", "ACTIF", 119000),
  contract(2, "demo-u-stu5", "Camille Petit", "TERMINE", 119000),
  contract(3, "demo-u-stu4", "Hugo Garcia", "BROUILLON", 119000)
];

// --- CPF ---
const demoCpf: CpfRequestRecord[] = [
  { id: "demo-cpf1", studentId: "demo-stu1", formationId: FORM(0), agencyId: AGENCY, fullName: "Léa Dubois", email: "lea.dubois@demo.lodene.fr", phone: "0612340001", status: "VALIDEE", requestedAmountCents: 119000, missingDocuments: [], internalNotes: DEMO_NOTE, createdAt: daysAgo(45), updatedAt: daysAgo(30) },
  { id: "demo-cpf2", studentId: "demo-stu4", formationId: FORM(0), agencyId: AGENCY, fullName: "Hugo Garcia", email: "hugo.garcia@demo.lodene.fr", phone: "0612340002", status: "DOCUMENTS_MANQUANTS", requestedAmountCents: 119000, missingDocuments: ["Pièce d'identité", "Attestation CPF"], internalNotes: DEMO_NOTE, createdAt: daysAgo(15), updatedAt: daysAgo(8) },
  { id: "demo-cpf3", studentId: null, formationId: FORM(2), agencyId: AGENCY, fullName: "Marc Antoine", email: "marc.antoine@demo.lodene.fr", phone: "0612340003", status: "NOUVELLE_DEMANDE", requestedAmountCents: 90000, missingDocuments: [], internalNotes: DEMO_NOTE, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "demo-cpf4", studentId: null, formationId: FORM(1), agencyId: AGENCY, fullName: "Sarah Benali", email: "sarah.benali@demo.lodene.fr", phone: "0612340004", status: "EN_COURS", requestedAmountCents: 119000, missingDocuments: [], internalNotes: DEMO_NOTE, createdAt: daysAgo(9), updatedAt: daysAgo(5) }
];

// --- Avis (à modérer + publiés) ---
const demoReviews: ReviewRecord[] = [
  { id: "demo-rev1", userId: "demo-u-stu1", instructorId: "demo-ins1", agencyId: AGENCY, rating: 5, comment: "Excellent moniteur, très pédagogue. Permis du premier coup !", status: "PUBLIE", publishedAt: daysAgo(20), createdAt: daysAgo(22), updatedAt: daysAgo(20) },
  { id: "demo-rev2", userId: "demo-u-stu5", instructorId: "demo-ins2", agencyId: AGENCY, rating: 4, comment: "Très bonne auto-école, planning flexible.", status: "PUBLIE", publishedAt: daysAgo(10), createdAt: daysAgo(12), updatedAt: daysAgo(10) },
  { id: "demo-rev3", userId: "demo-u-stu3", instructorId: "demo-ins1", agencyId: AGENCY, rating: 5, comment: "Je recommande vivement, équipe au top.", status: "PUBLIE", publishedAt: daysAgo(5), createdAt: daysAgo(6), updatedAt: daysAgo(5) },
  { id: "demo-rev4", userId: "demo-u-stu2", instructorId: "demo-ins2", agencyId: AGENCY, rating: 3, comment: "Correct mais délais de réponse parfois longs.", status: "EN_ATTENTE", publishedAt: null, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: "demo-rev5", userId: "demo-u-stu4", instructorId: "demo-ins3", agencyId: AGENCY, rating: 5, comment: "Super expérience, merci à toute l'équipe !", status: "EN_ATTENTE", publishedAt: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) }
];

// --- Leads / prospects (pipeline complet) ---
const demoLeads: LeadRecord[] = [
  { id: "demo-lead1", agencyId: AGENCY, fullName: "Émile Faure", email: "emile.faure@demo.lodene.fr", phone: "0612350001", status: "PROSPECT", source: "Site web", interest: "Permis B", notes: DEMO_NOTE, estimatedValueCents: 119000, nextFollowUpAt: daysAgo(1), temperature: "chaud", score: 82, createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: "demo-lead2", agencyId: AGENCY, fullName: "Chloé Mercier", email: "chloe.mercier@demo.lodene.fr", phone: "0612350002", status: "CONTACTE", source: "Google Ads", interest: "Conduite accompagnée", notes: DEMO_NOTE, estimatedValueCents: 99000, nextFollowUpAt: inDays(2), temperature: "tiede", score: 60, createdAt: daysAgo(5), updatedAt: daysAgo(3) },
  { id: "demo-lead3", agencyId: AGENCY, fullName: "Yanis Benkhel", email: "yanis.benkhel@demo.lodene.fr", phone: "0612350003", status: "RELANCE", source: "Réseaux sociaux", interest: "Permis accéléré", notes: DEMO_NOTE, estimatedValueCents: 139000, nextFollowUpAt: daysAgo(2), temperature: "chaud", score: 75, createdAt: daysAgo(9), updatedAt: daysAgo(4) },
  { id: "demo-lead4", agencyId: AGENCY, fullName: "Manon Girard", email: "manon.girard@demo.lodene.fr", phone: "0612350004", status: "DEVIS_ENVOYE", source: "Recommandation", interest: "Permis B", notes: DEMO_NOTE, estimatedValueCents: 119000, nextFollowUpAt: inDays(1), temperature: "chaud", score: 88, createdAt: daysAgo(7), updatedAt: daysAgo(2) },
  { id: "demo-lead5", agencyId: AGENCY, fullName: "Adam Cohen", email: "adam.cohen@demo.lodene.fr", phone: "0612350005", status: "INSCRIT", source: "Site web", interest: "Permis B", notes: DEMO_NOTE, estimatedValueCents: 119000, nextFollowUpAt: null, temperature: "chaud", score: 95, createdAt: daysAgo(20), updatedAt: daysAgo(15) },
  { id: "demo-lead6", agencyId: AGENCY, fullName: "Sofia Rossi", email: "sofia.rossi@demo.lodene.fr", phone: "0612350006", status: "PERDU", source: "Google Ads", interest: "Code seul", notes: DEMO_NOTE, estimatedValueCents: 30000, nextFollowUpAt: null, temperature: "froid", score: 25, createdAt: daysAgo(30), updatedAt: daysAgo(18) },
  { id: "demo-lead7", agencyId: AGENCY, fullName: "Paul Lemoine", email: "paul.lemoine@demo.lodene.fr", phone: "0612350007", status: "PROSPECT", source: "Flyer", interest: "Permis B automatique", notes: DEMO_NOTE, estimatedValueCents: 129000, nextFollowUpAt: inDays(3), temperature: "tiede", score: 55, createdAt: daysAgo(1), updatedAt: daysAgo(1) }
];

// --- Rendez-vous de démonstration (Centre RDV unifié, tous canaux) ---
// Couvre les 6 scénarios attendus, clairement marqués `demo-`.
function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const demoAppointmentLeads: LeadRecord[] = [
  { id: "demo-alead1", agencyId: AGENCY, fullName: "Inès Boucher", firstName: "Inès", lastName: "Boucher", email: "ines.boucher@demo.lodene.fr", phone: "0612360001", status: "PROSPECT", source: "chatbot", interest: "SST", financingType: "ENTREPRISE", consentEmail: true, consentWhatsapp: false, notes: `${DEMO_NOTE}\nNombre de salariés : 8`, estimatedValueCents: 25000, nextFollowUpAt: inDays(1), temperature: "chaud", score: 80, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: "demo-alead2", agencyId: AGENCY, fullName: "Marc Dubois", firstName: "Marc", lastName: "Dubois", email: "marc.dubois@demo.lodene.fr", phone: "0612360002", status: "CONTACTE", source: "phone", interest: "Permis B manuel", financingType: "PERSONNEL", consentEmail: true, consentWhatsapp: false, notes: DEMO_NOTE, estimatedValueCents: 119000, nextFollowUpAt: inDays(1), temperature: "chaud", score: 85, createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: "demo-alead4", agencyId: AGENCY, fullName: "Karim Saidi", firstName: "Karim", lastName: "Saidi", email: "karim.saidi@demo.lodene.fr", phone: "0612360004", status: "RELANCE", source: "chatbot", interest: "VTC", financingType: "CPF", consentEmail: true, consentWhatsapp: true, notes: DEMO_NOTE, estimatedValueCents: 180000, nextFollowUpAt: daysAgo(1), temperature: "tiede", score: 65, createdAt: daysAgo(5), updatedAt: daysAgo(2) },
  { id: "demo-alead5", agencyId: AGENCY, fullName: "Nadia Lopez", firstName: "Nadia", lastName: "Lopez", email: "nadia.lopez@demo.lodene.fr", phone: "0612360005", status: "PERDU", source: "manual", interest: "Permis B automatique", financingType: "PERSONNEL", consentEmail: false, consentWhatsapp: false, notes: DEMO_NOTE, estimatedValueCents: 129000, nextFollowUpAt: null, temperature: "froid", score: 30, createdAt: daysAgo(6), updatedAt: daysAgo(3) },
  { id: "demo-alead6", agencyId: AGENCY, fullName: "Hugo Faure", firstName: "Hugo", lastName: "Faure", email: "hugo.faure@demo.lodene.fr", phone: "0612360006", status: "PROSPECT", source: "whatsapp", interest: "Permis B manuel", financingType: "PERSONNEL", consentEmail: true, consentWhatsapp: true, notes: DEMO_NOTE, estimatedValueCents: 119000, nextFollowUpAt: inDays(1), temperature: "chaud", score: 78, createdAt: daysAgo(0), updatedAt: daysAgo(0) }
];

const ADVISOR = "demo-u-sec1";
function demoAppt(p: Partial<ChatAppointmentRecord> & Pick<ChatAppointmentRecord, "id" | "fullName" | "firstName" | "lastName" | "phone" | "formation" | "type" | "status" | "source" | "startsAt" | "endsAt">): ChatAppointmentRecord {
  return {
    leadId: "",
    email: null,
    objective: "Être rappelé",
    message: null,
    notes: DEMO_NOTE,
    requestedAt: p.startsAt,
    priority: "normal",
    assignedToId: ADVISOR,
    studentId: null,
    formationId: null,
    instructorId: null,
    vehicleId: null,
    agencyId: AGENCY,
    createdById: null,
    updatedById: null,
    consentContact: true,
    consentWhatsApp: false,
    whatsappMessage: null,
    adminEmailStatus: "skipped",
    clientEmailStatus: "skipped",
    whatsappStatus: "skipped",
    date: fmtDate(p.startsAt),
    time: fmtTime(p.startsAt),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    ...p
  };
}

const demoAppointments: ChatAppointmentRecord[] = [
  demoAppt({
    id: "demo-appt1", leadId: "demo-alead1", fullName: "Inès Boucher", firstName: "Inès", lastName: "Boucher",
    phone: "0612360001", email: "ines.boucher@demo.lodene.fr", formation: "SST", objective: "M'inscrire",
    type: "registration", status: "pending_confirmation", priority: "high", source: "chatbot",
    startsAt: at(2, 9), endsAt: at(2, 10), adminEmailStatus: "sent", clientEmailStatus: "sent",
    message: "Bonjour, je voudrais m'inscrire à la formation SST pour mon entreprise."
  }),
  demoAppt({
    id: "demo-appt2", leadId: "demo-alead2", fullName: "Marc Dubois", firstName: "Marc", lastName: "Dubois",
    phone: "0612360002", email: "marc.dubois@demo.lodene.fr", formation: "Permis B manuel", objective: "M'inscrire",
    type: "agency", status: "confirmed", priority: "normal", source: "phone",
    startsAt: at(1, 14), endsAt: at(1, 15), adminEmailStatus: "sent", clientEmailStatus: "sent"
  }),
  demoAppt({
    id: "demo-appt3", fullName: "Lucas Martin", firstName: "Lucas", lastName: "Martin",
    phone: "0612350202", formation: "Permis B automatique", objective: "Leçon de conduite",
    type: "lesson", status: "scheduled", priority: "normal", source: "crm",
    startsAt: at(3, 9), endsAt: at(3, 11), studentId: "demo-stu2", instructorId: "demo-ins2", vehicleId: "demo-veh2",
    formationId: FORM(1)
  }),
  demoAppt({
    id: "demo-appt4", leadId: "demo-alead4", fullName: "Karim Saidi", firstName: "Karim", lastName: "Saidi",
    phone: "0612360004", email: "karim.saidi@demo.lodene.fr", formation: "VTC", objective: "Obtenir un devis",
    type: "call", status: "to_follow_up", priority: "normal", source: "chatbot",
    startsAt: at(-1, 11), endsAt: at(-1, 12), adminEmailStatus: "sent", clientEmailStatus: "skipped"
  }),
  demoAppt({
    id: "demo-appt5", leadId: "demo-alead5", fullName: "Nadia Lopez", firstName: "Nadia", lastName: "Lopez",
    phone: "0612360005", email: "nadia.lopez@demo.lodene.fr", formation: "Permis B automatique", objective: "M'inscrire",
    type: "agency", status: "cancelled", priority: "low", source: "manual",
    startsAt: at(-3, 16), endsAt: at(-3, 17), notes: "Donnée de démonstration — annulé par le client."
  }),
  demoAppt({
    id: "demo-appt6", leadId: "demo-alead6", fullName: "Hugo Faure", firstName: "Hugo", lastName: "Faure",
    phone: "0612360006", email: "hugo.faure@demo.lodene.fr", formation: "Permis B manuel", objective: "Être rappelé",
    type: "call", status: "pending_confirmation", priority: "urgent", source: "whatsapp",
    startsAt: at(4, 10), endsAt: at(4, 11), consentWhatsApp: true, whatsappStatus: "sent",
    whatsappMessage: "Bonjour LODENE, je confirme mon intérêt pour le permis B manuel."
  })
];

const demoAppointmentTasks: ChatTaskRecord[] = [
  { id: "demo-atask1", leadId: "demo-alead1", appointmentId: "demo-appt1", type: "CONFIRMATION", priority: "HAUTE", assignedToId: ADVISOR, deadline: at(1, 18), note: "Confirmer le RDV SST chatbot avec Inès Boucher.", status: "A_FAIRE", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: "demo-atask2", leadId: "demo-alead4", appointmentId: "demo-appt4", type: "RELANCE", priority: "NORMALE", assignedToId: ADVISOR, deadline: inDays(1), note: "Relancer Karim Saidi (VTC) — sans réponse.", status: "A_FAIRE", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: "demo-atask3", leadId: "demo-alead4", appointmentId: "demo-appt4", type: "RELANCE", priority: "HAUTE", assignedToId: ADVISOR, deadline: inDays(2), note: "Vérifier l'éligibilité CPF — VTC (Karim Saidi). Ne pas promettre de validation avant vérification.", status: "A_FAIRE", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: "demo-atask4", leadId: "demo-alead1", appointmentId: "demo-appt1", type: "RELANCE", priority: "HAUTE", assignedToId: ADVISOR, deadline: inDays(2), note: "Demande entreprise — 8 salariés — préparer un devis (Inès Boucher).", status: "A_FAIRE", createdAt: daysAgo(1), updatedAt: daysAgo(1) }
];

const demoAppointmentConversations: ChatConversationRecord[] = [
  {
    id: "demo-aconv1",
    leadId: "demo-alead1",
    appointmentId: "demo-appt1",
    visitorName: "Inès Boucher",
    messages: [
      { role: "user", content: "Bonjour, proposez-vous la formation SST ?", createdAt: daysAgo(1).toISOString() },
      { role: "assistant", content: "Oui, LODENE propose la formation SST. Souhaitez-vous prendre rendez-vous ?", createdAt: daysAgo(1).toISOString() },
      { role: "user", content: "Oui, pour mon entreprise, nous sommes 8 salariés.", createdAt: daysAgo(1).toISOString() }
    ],
    summary: "- Demande de formation SST en intra-entreprise\n- 8 salariés à former\nCatégorie : INSCRIPTION",
    intent: "sst",
    aiConfidence: 70,
    lastMessage: "Oui, pour mon entreprise, nous sommes 8 salariés.",
    status: "OUVERTE",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    id: "demo-aconv2",
    leadId: "demo-alead4",
    appointmentId: "demo-appt4",
    visitorName: "Karim Saidi",
    messages: [
      { role: "user", content: "Je veux devenir chauffeur VTC, vous préparez l'examen ?", createdAt: daysAgo(5).toISOString() },
      { role: "assistant", content: "Oui, LODENE prépare aux épreuves de l'examen VTC (CMA). Plusieurs formules existent.", createdAt: daysAgo(5).toISOString() },
      { role: "user", content: "Est-ce que je peux utiliser mon CPF ?", createdAt: daysAgo(5).toISOString() },
      { role: "assistant", content: "Le CPF peut être possible selon votre éligibilité. Un conseiller LODENE pourra le confirmer.", createdAt: daysAgo(5).toISOString() }
    ],
    summary: "- Intérêt formation VTC (examen CMA)\n- Souhaite mobiliser son CPF (à vérifier)\nCatégorie : CPF",
    intent: "vtc",
    aiConfidence: 85,
    lastMessage: "Est-ce que je peux utiliser mon CPF ?",
    status: "OUVERTE",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5)
  },
  {
    id: "demo-aconv3",
    leadId: null,
    appointmentId: null,
    visitorName: "Visiteur anonyme",
    messages: [
      { role: "user", content: "Le permis B est-il finançable avec le CPF ?", createdAt: daysAgo(0).toISOString() },
      { role: "assistant", content: "Le financement CPF peut être possible selon votre situation et l'éligibilité de votre dossier. Un conseiller LODENE peut vérifier avec vous.", createdAt: daysAgo(0).toISOString() }
    ],
    summary: "- Question sur le financement CPF du permis B\nCatégorie : CPF",
    intent: "cpf_financement",
    aiConfidence: 85,
    lastMessage: "Le permis B est-il finançable avec le CPF ?",
    status: "OUVERTE",
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0)
  }
];

// --- CMS : pages + articles de blog ---
const demoContentEntries: ContentEntryRecord[] = [
  { id: "demo-page1", type: "PAGE", title: "À propos de LODENE", slug: "a-propos", excerpt: null, body: "LODENE est une auto-école moderne à Conflans-Sainte-Honorine. Notre équipe vous accompagne du code à la conduite avec un suivi personnalisé.", published: true, publishedAt: daysAgo(30), agencyId: null, createdAt: daysAgo(35), updatedAt: daysAgo(30) },
  { id: "demo-page2", type: "PAGE", title: "Nos tarifs", slug: "tarifs", excerpt: null, body: "Découvrez nos forfaits permis B, conduite accompagnée et stages de code. Tarifs détaillés sur devis personnalisé.", published: false, publishedAt: null, agencyId: null, createdAt: daysAgo(10), updatedAt: daysAgo(4) },
  { id: "demo-art1", type: "ARTICLE", title: "5 conseils pour réussir le code du premier coup", slug: "reussir-le-code", excerpt: "Nos meilleures astuces pour aborder l'examen du code sereinement.", body: "1. Réviser régulièrement par petites sessions.\n2. Faire des séries blanches en conditions réelles.\n3. Comprendre plutôt qu'apprendre par cœur.\n4. Analyser ses erreurs.\n5. Dormir avant l'examen.", published: true, publishedAt: daysAgo(12), agencyId: null, createdAt: daysAgo(14), updatedAt: daysAgo(12) },
  { id: "demo-art2", type: "ARTICLE", title: "Conduite accompagnée : tout ce qu'il faut savoir", slug: "conduite-accompagnee-guide", excerpt: "Le guide complet de l'AAC pour les jeunes conducteurs et leurs parents.", body: "La conduite accompagnée (AAC) permet de démarrer la conduite dès 15 ans et d'acquérir de l'expérience avant le permis. Voici comment ça marche.", published: false, publishedAt: null, agencyId: null, createdAt: daysAgo(3), updatedAt: daysAgo(1) }
];

// --- Examens ---
const demoExams: ExamRecord[] = [
  { id: "demo-ex1", studentId: "demo-stu5", agencyId: AGENCY, type: "CODE", scheduledAt: daysAgo(40), center: "Conflans", result: "REUSSI", score: 38, attempt: 1, createdAt: daysAgo(45), updatedAt: daysAgo(40) },
  { id: "demo-ex2", studentId: "demo-stu5", agencyId: AGENCY, type: "CONDUITE", scheduledAt: daysAgo(12), center: "Conflans", result: "REUSSI", score: 28, attempt: 1, createdAt: daysAgo(20), updatedAt: daysAgo(12) },
  { id: "demo-ex3", studentId: "demo-stu1", agencyId: AGENCY, type: "CODE", scheduledAt: daysAgo(8), center: "Conflans", result: "ECHOUE", score: 30, attempt: 1, createdAt: daysAgo(15), updatedAt: daysAgo(8) },
  { id: "demo-ex4", studentId: "demo-stu3", agencyId: AGENCY, type: "CONDUITE", scheduledAt: inDays(6), center: "Conflans", result: "EN_ATTENTE", score: null, attempt: 1, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  { id: "demo-ex5", studentId: "demo-stu4", agencyId: AGENCY, type: "CODE", scheduledAt: inDays(12), center: "Conflans", result: "EN_ATTENTE", score: null, attempt: 1, createdAt: daysAgo(2), updatedAt: daysAgo(2) }
];

// --- Automatisations (Workflows) ---
const demoAutomationRules: AutomationRuleRecord[] = [
  { id: "demo-auto1", name: "Accueil nouveaux prospects", trigger: "LEAD_CREATED", action: "SEND_WELCOME_EMAIL", active: true, agencyId: AGENCY, runCount: 14, lastRunAt: daysAgo(1), createdAt: daysAgo(30), updatedAt: daysAgo(1) },
  { id: "demo-auto2", name: "Alerte équipe nouvel élève", trigger: "STUDENT_CREATED", action: "NOTIFY_TEAM", active: false, agencyId: AGENCY, runCount: 0, lastRunAt: null, createdAt: daysAgo(20), updatedAt: daysAgo(20) }
];

/**
 * Construit le seed de démonstration (override partiel du store mémoire).
 * Les tableaux fournis REMPLACENT ceux par défaut : on ré-inclut donc les
 * enregistrements officiels (admin, agence, formations restent via leurs clés non fournies).
 */
export function buildDemoSeed(): Partial<MutableStore> {
  return {
    users: [...initialUsers, ...demoUsers],
    agencies: [...initialAgencies, demoAgency],
    agencyMemberships: [...initialAgencyMemberships],
    instructors: demoInstructors,
    vehicles: demoVehicles,
    students: demoStudents,
    bookings: demoBookings,
    payments: demoPayments,
    invoices: demoInvoices,
    quotes: demoQuotes,
    contracts: demoContracts,
    contentEntries: demoContentEntries,
    cpfRequests: demoCpf,
    reviews: demoReviews,
    leads: [...demoLeads, ...demoAppointmentLeads],
    chatAppointments: demoAppointments,
    chatTasks: demoAppointmentTasks,
    chatConversations: demoAppointmentConversations,
    exams: demoExams,
    automationRules: demoAutomationRules
  };
}
