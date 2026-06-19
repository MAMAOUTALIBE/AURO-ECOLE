/**
 * Importe les apprenants depuis un export CSV (délimiteur ';', UTF-8) dans PostgreSQL.
 *
 * - Nature « Élève »  -> compte User (rôle ELEVE) + fiche Student
 * - Nature « Prospect » -> Lead (prospect CRM)
 * Déduplication par email. Idempotent : un email déjà présent (User ou Lead) est ignoré.
 * Mot de passe : un hash temporaire commun (inconnu) est posé pour permettre la
 * réinitialisation via « mot de passe oublié » ; aucun élève ne connaît ce mot de passe.
 *
 * Usage : npm run db:import-students -- /chemin/vers/export.csv   (nécessite DATABASE_URL)
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseCsv(content: string): Record<string, string>[] {
  const text = content.replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else inQ = false;
        } else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ";") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };

  const header = splitLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function parseFrDate(value?: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((value ?? "").trim());
  if (!m) return null;
  // Minuit UTC pour éviter tout décalage de fuseau (date de naissance/inscription fixe).
  const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildAddress(r: Record<string, string>): string | null {
  const street = [r["Numéro de voie"], r["Type de voie"], r["Nom de voie"], r["Complément"]].filter(Boolean).join(" ").trim();
  const city = [r["Code postal"], r["Ville"]].filter(Boolean).join(" ").trim();
  const full = [street, city, r["Pays"]].filter(Boolean).join(", ");
  return full || null;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) throw new Error("Chemin du CSV manquant. Usage: npm run db:import-students -- <fichier.csv>");
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  console.log(`[import] ${rows.length} lignes lues depuis ${csvPath}`);

  // Déduplication par email : on préfère une ligne « Élève » avec une formation mappable.
  const formations = await prisma.formation.findMany();
  const bySlug = new Map(formations.map((f) => [f.slug, f]));
  const permisB = bySlug.get("permis-b-manuel-essentiel") ?? formations.find((f) => f.productLine === "AUTO_ECOLE");
  const passerelle = bySlug.get("passerelle-bva-manuelle");
  const mapFormationId = (label: string): string | null => {
    if (label === "B") return permisB?.id ?? null;
    if (label === "B78 vers B") return passerelle?.id ?? permisB?.id ?? null;
    return null; // A2, Autre formation, vide -> non mappé (label conservé en notes)
  };

  const groups = new Map<string, Record<string, string>[]>();
  for (const r of rows) {
    const email = (r["Email"] || "").toLowerCase().trim();
    if (!email) continue;
    if (!groups.has(email)) groups.set(email, []);
    groups.get(email)!.push(r);
  }

  const chosen = new Map<string, Record<string, string>>();
  for (const [email, grp] of groups) {
    const eleves = grp.filter((r) => r["Nature"] === "Élève");
    const pool = eleves.length ? eleves : grp;
    const best = pool.find((r) => mapFormationId(r["Formation"]) !== null) ?? pool[0];
    chosen.set(email, best);
  }

  const agency = await prisma.agency.findFirst();
  const sharedHash = await bcrypt.hash(randomBytes(24).toString("hex"), 12);

  const existingUserEmails = new Set((await prisma.user.findMany({ select: { email: true } })).map((u) => u.email.toLowerCase()));
  const existingLeadEmails = new Set((await prisma.lead.findMany({ select: { email: true } })).map((l) => l.email.toLowerCase()));

  let students = 0;
  let leads = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [email, r] of chosen) {
    const firstName = r["Prénom"] || "(Prénom)";
    const lastName = r["Nom"] || "(Nom)";
    const phone = r["Téléphone"] || null;
    const isProspect = r["Nature"] === "Prospect";

    try {
      if (isProspect) {
        if (existingLeadEmails.has(email) || existingUserEmails.has(email)) {
          skipped += 1;
          continue;
        }
        await prisma.lead.create({
          data: {
            fullName: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            email,
            phone,
            status: "PROSPECT",
            source: "import-csv",
            interest: r["Formation"] || null,
            agencyId: agency?.id ?? null,
            notes: `Importé (CSV). Formation déclarée : ${r["Formation"] || "—"}. NEPH : ${r["Numéro NEPH"] || "—"}.`
          }
        });
        existingLeadEmails.add(email);
        leads += 1;
        continue;
      }

      if (existingUserEmails.has(email)) {
        // Backfill : l'élève existe déjà → on complète les champs structurés manquants depuis le CSV.
        const existingUser = await prisma.user.findUnique({ where: { email } });
        const existingStudent = existingUser ? await prisma.student.findUnique({ where: { userId: existingUser.id } }) : null;
        if (existingStudent) {
          const patch: Record<string, unknown> = {};
          if (!existingStudent.birthName && r["Nom"]) patch.birthName = r["Nom"];
          if (!existingStudent.birthDate && parseFrDate(r["Date de naissance"])) patch.birthDate = parseFrDate(r["Date de naissance"]);
          if (!existingStudent.birthPlace && r["Lieu de naissance"]) patch.birthPlace = r["Lieu de naissance"];
          if (!existingStudent.neph && r["Numéro NEPH"]) patch.neph = r["Numéro NEPH"];
          if (!existingStudent.filiere && r["Filière"]) patch.filiere = r["Filière"];
          if (!existingStudent.registeredAt && parseFrDate(r["Date d'inscription apprenant"])) patch.registeredAt = parseFrDate(r["Date d'inscription apprenant"]);
          if (!existingStudent.formationId) {
            const fid = mapFormationId(r["Formation"]);
            if (fid) patch.formationId = fid;
          }
          if (!existingUser?.address) {
            const addr = buildAddress(r);
            if (addr) await prisma.user.update({ where: { id: existingUser!.id }, data: { address: addr } });
          }
          if (Object.keys(patch).length) {
            await prisma.student.update({ where: { id: existingStudent.id }, data: patch });
            updated += 1;
          } else skipped += 1;
        } else skipped += 1;
        continue;
      }
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          address: buildAddress(r),
          role: "ELEVE",
          status: "ACTIVE",
          passwordHash: sharedHash
        }
      });
      await prisma.student.create({
        data: {
          userId: user.id,
          formationId: mapFormationId(r["Formation"]),
          fileStatus: "EN_COURS",
          agencyId: agency?.id ?? null,
          // État civil structuré (style Kréno2)
          birthName: r["Nom"] || null,
          birthDate: parseFrDate(r["Date de naissance"]),
          birthPlace: r["Lieu de naissance"] || null,
          neph: r["Numéro NEPH"] || null,
          filiere: r["Filière"] || null,
          registeredAt: parseFrDate(r["Date d'inscription apprenant"]),
          internalNotes: `Importé depuis l'export apprenants. Formation déclarée : ${r["Formation"] || "—"}.`
        }
      });
      existingUserEmails.add(email);
      students += 1;
    } catch (error) {
      errors += 1;
      console.error(`[import] échec ${email}: ${(error as Error).message.split("\n")[0]}`);
    }
  }

  console.log(`[import] Terminé — élèves créés: ${students}, complétés (backfill): ${updated}, prospects/leads: ${leads}, ignorés: ${skipped}, erreurs: ${errors}`);
}

main()
  .catch((error) => {
    console.error("[import] échec global:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
