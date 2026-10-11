import { and, eq, or, sql } from "drizzle-orm";
import { createDb, closeDb } from "./client";
import { schools, users, parentStudentMapping } from "./schema";
import { hash } from "@node-rs/argon2";
import ExcelJS from "exceljs";
import path from "node:path";
import fs from "node:fs";

const DEFAULT_PASSWORD = "muhsin123";

function parseBirthDateToPassword(birthDate: unknown): string | null {
  if (!birthDate) return null;
  const str = String(birthDate).trim();
  const matchIso = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (matchIso) {
    const yyyy = matchIso[1];
    const mm = matchIso[2].padStart(2, "0");
    const dd = matchIso[3].padStart(2, "0");
    return `${dd}${mm}${yyyy}`;
  }
  const matchId = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (matchId) {
    const dd = matchId[1].padStart(2, "0");
    const mm = matchId[2].padStart(2, "0");
    const yyyy = matchId[3];
    return `${dd}${mm}${yyyy}`;
  }
  if (/^\d{8}$/.test(str)) {
    return str;
  }
  return null;
}

function sheetToJson<T>(sheet: ExcelJS.Worksheet | undefined): T[] {
  if (!sheet) return [];
  const rows: T[] = [];
  const headers: Record<number, string> = {};
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || "").trim();
      });
    } else {
      const obj: any = {};
      let hasData = false;
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          let val = cell.value;
          if (val && typeof val === "object" && "text" in val) {
            val = (val as any).text;
          }
          obj[header] = val;
          hasData = true;
        }
      });
      if (hasData) rows.push(obj);
    }
  });
  return rows;
}

async function main() {
  const db = createDb();
  console.log("==================================================");
  console.log("  MUHSIN APP — SYNC KHUSUS AKUN ORANG TUA (PROD) ");
  console.log("==================================================");

  // 1. Resolve Target Sekolah
  let [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, "alfitrah"))
    .limit(1);

  if (!school) {
    [school] = await db.select().from(schools).limit(1);
  }

  if (!school) {
    throw new Error("Sekolah belum tersedia di database.");
  }
  console.log(`[sync] Sekolah: ${school.name} (id: ${school.id})`);

  // 2. Baca Excel data-seed.xlsx
  const xlsxPath = path.resolve(process.cwd(), "../../docs/data-seed.xlsx");
  const localXlsxPath = path.resolve(process.cwd(), "docs/data-seed.xlsx");
  const resolvedPath = fs.existsSync(xlsxPath)
    ? xlsxPath
    : fs.existsSync(localXlsxPath)
      ? localXlsxPath
      : path.resolve(__dirname, "../../../../docs/data-seed.xlsx");

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File data-seed.xlsx tidak ditemukan di ${resolvedPath}`);
  }

  console.log(`[sync] Membaca data excel dari: ${resolvedPath}...`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(resolvedPath);

  // 3. Map Password Santri dari Tanggal Lahir (Sheet: student)
  const studentRows = sheetToJson<any>(workbook.getWorksheet("student"));
  const studentPasswordMap = new Map<string, string>(); // username -> rawPassword

  for (const s of studentRows) {
    if (s.username) {
      const birthDatePwd = parseBirthDateToPassword(s.birth_date);
      const chosenPassword =
        birthDatePwd ||
        (s.password !== undefined && s.password !== null
          ? String(s.password).trim()
          : DEFAULT_PASSWORD);
      studentPasswordMap.set(String(s.username).trim().toLowerCase(), chosenPassword);
    }
  }

  // 4. Proses Mapping Santri <-> Orang Tua (Sheet: student-parent-class-teacher)
  const mappingRows = sheetToJson<any>(
    workbook.getWorksheet("student-parent-class-teacher")
  );

  console.log(`[sync] Menemukan ${mappingRows.length} baris data santri & orang tua...`);

  let updatedCount = 0;
  let createdCount = 0;
  let skippedCount = 0;

  for (const row of mappingRows) {
    if (!row.username || !row.student_name) continue;
    const studentUsername = String(row.username).trim().toLowerCase();
    const studentName = String(row.student_name).trim();
    // Nama orang tua seragam: Ortu [Nama Anak]
    const parentName = `Ortu ${studentName}`;
    const targetParentUsername = `ortu_${studentUsername}`;
    const rawEmail = row.email_parent ? String(row.email_parent).trim().toLowerCase() : "";
    const parentEmail = rawEmail || `${targetParentUsername}@parent.alfitrah.sch.id`;

    // Password ortu = tanggal lahir anak (DDMMYYYY)
    const childPassword = studentPasswordMap.get(studentUsername) || DEFAULT_PASSWORD;
    const parentPasswordHash = await hash(childPassword);

    // Cari santri di database
    const [studentEntity] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.schoolId, school.id),
          eq(users.role, "student"),
          or(
            eq(users.username, studentUsername),
            sql`lower(${users.name}) = ${studentName.toLowerCase()}`
          )
        )
      )
      .limit(1);

    if (!studentEntity) {
      console.warn(`[sync] Lewati: Santri ${studentName} (${studentUsername}) belum ada di database.`);
      skippedCount++;
      continue;
    }

    // Cari apakah orang tua sudah ada (via mapping ke santri ini atau via username)
    const existingMapping = (
      await db
        .select({ parentId: parentStudentMapping.parentId })
        .from(parentStudentMapping)
        .where(
          and(
            eq(parentStudentMapping.schoolId, school.id),
            eq(parentStudentMapping.studentId, studentEntity.id)
          )
        )
        .limit(1)
    )[0];

    let parentUser = existingMapping
      ? (
          await db
            .select()
            .from(users)
            .where(and(eq(users.id, existingMapping.parentId), eq(users.schoolId, school.id)))
            .limit(1)
        )[0]
      : (
          await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.schoolId, school.id),
                eq(users.role, "parent"),
                or(
                  eq(users.username, targetParentUsername),
                  sql`lower(${users.name}) = ${parentName.toLowerCase()}`
                )
              )
            )
            .limit(1)
        )[0];

    if (parentUser) {
      // UPDATE ONLY: Hanya update username, nama, dan passwordHash akun orang tua
      await db
        .update(users)
        .set({
          username: targetParentUsername,
          name: parentName,
          email: parentEmail,
          passwordHash: parentPasswordHash,
        })
        .where(eq(users.id, parentUser.id));
      updatedCount++;
    } else {
      // INSERT: Jika akun ortu belum pernah dibuat
      [parentUser] = await db
        .insert(users)
        .values({
          schoolId: school.id,
          role: "parent",
          name: parentName,
          username: targetParentUsername,
          email: parentEmail,
          passwordHash: parentPasswordHash,
          phone: null,
        })
        .returning();
      createdCount++;
    }

    // Pastikan relasi di parent_student_mapping terhubung
    const [hasMapping] = await db
      .select()
      .from(parentStudentMapping)
      .where(
        and(
          eq(parentStudentMapping.schoolId, school.id),
          eq(parentStudentMapping.parentId, parentUser.id),
          eq(parentStudentMapping.studentId, studentEntity.id)
        )
      )
      .limit(1);

    if (!hasMapping) {
      await db.insert(parentStudentMapping).values({
        schoolId: school.id,
        parentId: parentUser.id,
        studentId: studentEntity.id,
      });
    }
  }

  console.log("\n==================================================");
  console.log("  HASIL SINKRONISASI AKUN ORANG TUA SELESAI      ");
  console.log("==================================================");
  console.log(`- Akun Orang Tua Diperbarui: ${updatedCount}`);
  console.log(`- Akun Orang Tua Baru Dibuat: ${createdCount}`);
  console.log(`- Dilewati (Santri Belum Ada): ${skippedCount}`);
  console.log(`\nFormat Login Semua Orang Tua:`);
  console.log(`- Username: ortu_[username_anak]`);
  console.log(`- Password: [tanggal lahir anak DDMMYYYY]`);
  console.log("==================================================\n");
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[sync-parents] Gagal:", err);
    process.exit(1);
  });
