import { eq, and } from "drizzle-orm";
import { createDb, closeDb } from "./client";
import {
  schools,
  users,
  classes,
  academicPeriods,
  studentClassEnrollment,
  studentTeacherMapping,
  parentStudentMapping,
  teacherClasses,
  assessmentCategories,
  assessmentSubcategories,
} from "./schema";
import { hash } from "@node-rs/argon2";
import ExcelJS from "exceljs";
import * as path from "node:path";
import * as fs from "node:fs";

const SCHOOL_NAME = "SMP IT Al Fitrah - Demo";
const DEFAULT_PASSWORD = "muhsin123";

const DEFAULT_GRADING_SCALE = [
  { min: 91, max: 100, letter: "A", labelLatin: "Mumtaz", labelArab: "ممتاز" },
  { min: 80, max: 90, letter: "B", labelLatin: "Jayyid Jiddan", labelArab: "جيد جدا" },
  { min: 70, max: 79, letter: "C", labelLatin: "Jayyid", labelArab: "جيد" },
  { min: 51, max: 69, letter: "D", labelLatin: "Maqbul", labelArab: "مقبول" },
  { min: 31, max: 50, letter: "E", labelLatin: "Dhaif", labelArab: "ضعيف" },
  { min: 0, max: 30, letter: "F", labelLatin: "Dhaif Jiddan", labelArab: "ضعيف جدا" },
];

const CATEGORY_SEED = [
  {
    code: "TAHFIDZ",
    name: "Tahfidz",
    subcategories: [
      {
        code: "ZIYADAH",
        name: "Ziyadah",
        includeInRanking: true,
        referenceShape: { type: "surah_ayat" },
        scoreFields: [
          { key: "tajwid_per_surah", label: "Tajwid (Per Surah)", min: 0, max: 100 },
          { key: "kelancaran_per_surah", label: "Kelancaran (Per Surah)", min: 0, max: 100 },
          { key: "tajwid_keseluruhan", label: "Tajwid (Keseluruhan)", min: 0, max: 100 },
          { key: "kelancaran_keseluruhan", label: "Kelancaran (Keseluruhan)", min: 0, max: 100 },
        ],
      },
      {
        code: "MUROJAAH",
        name: "Muroja'ah",
        includeInRanking: false,
        referenceShape: { type: "surah_ayat" },
        scoreFields: [
          { key: "tajwid", label: "Tajwid", min: 0, max: 100 },
          { key: "kelancaran", label: "Kelancaran", min: 0, max: 100 },
        ],
      },
    ],
  },
  {
    code: "TAHSIN",
    name: "Tahsin",
    subcategories: [
      {
        code: "SABIQ",
        name: "Sabiq",
        includeInRanking: false,
        referenceShape: { type: "halaman" },
        scoreFields: [
          { key: "mad", label: "Mad", min: 0, max: 100 },
          { key: "makhroj", label: "Makhroj", min: 0, max: 100 },
          { key: "ghunnah", label: "Ghunnah", min: 0, max: 100 },
          { key: "kelancaran", label: "Kelancaran", min: 0, max: 100 },
        ],
      },
      {
        code: "TALAQI",
        name: "Talaqi",
        includeInRanking: false,
        referenceShape: { type: "halaman" },
        scoreFields: [{ key: "kelancaran", label: "Kelancaran", min: 0, max: 100 }],
      },
    ],
  },
];

interface ExcelStudentRow {
  email?: string;
  fullname?: string;
  username?: string;
  password?: string;
  gender?: string;
  birth_place?: string;
  birth_date?: string | number;
  class?: string;
  teacher?: string;
}

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

interface ExcelTeacherRow {
  kode?: string;
  teacher?: string;
}

interface ExcelClassRow {
  class?: string;
}

async function main() {
  const db = createDb();
  console.log("[seed] starting database seeding...");

  // 1. School
  let school = (
    await db.select().from(schools).where(eq(schools.name, SCHOOL_NAME)).limit(1)
  )[0];

  if (!school) {
    school = (
      await db
        .insert(schools)
        .values({
          slug: "alfitrah",
          name: SCHOOL_NAME,
          jenjang: "SMP",
          npsn: "00000001",
          address: "Jl. Demo Al Fitrah No. 1",
          subscriptionTier: "small",
        })
        .returning()
    )[0];
    console.log(`[seed] created school: ${school.name} (slug: alfitrah)`);
  } else {
    // Ensure slug is set
    await db
      .update(schools)
      .set({ slug: "alfitrah" })
      .where(eq(schools.id, school.id));
  }

  // 2. Academic Period
  let period = (
    await db
      .select()
      .from(academicPeriods)
      .where(
        and(
          eq(academicPeriods.schoolId, school.id),
          eq(academicPeriods.tahunAjaran, "2025/2026"),
          eq(academicPeriods.semester, "Ganjil")
        )
      )
      .limit(1)
  )[0];

  if (!period) {
    period = (
      await db
        .insert(academicPeriods)
        .values({ schoolId: school.id, tahunAjaran: "2025/2026", semester: "Ganjil" })
        .returning()
    )[0];
    console.log(`[seed] created academic period: ${period.tahunAjaran} ${period.semester}`);
  }

  if (school.activeAcademicPeriodId !== period.id) {
    await db
      .update(schools)
      .set({ activeAcademicPeriodId: period.id })
      .where(eq(schools.id, school.id));
    console.log("[seed] updated school activeAcademicPeriodId");
  }

  // 3. Koordinator TTQ
  const KOORDINATOR_EMAIL = "koordinator@alfitrah.demo";
  let koordinator = (
    await db
      .select()
      .from(users)
      .where(
        and(eq(users.email, KOORDINATOR_EMAIL), eq(users.schoolId, school.id))
      )
      .limit(1)
  )[0];

  if (!koordinator) {
    koordinator = (
      await db
        .insert(users)
        .values({
          schoolId: school.id,
          role: "koordinator_ttq",
          name: "Koordinator TTQ",
          username: "koordinator",
          email: KOORDINATOR_EMAIL,
          passwordHash: await hash(DEFAULT_PASSWORD),
          phone: "081234567890",
        })
        .returning()
    )[0];
    console.log(`[seed] created koordinator: ${KOORDINATOR_EMAIL} (username: koordinator)`);
  }

  // 4. Assessment Categories & Subcategories
  for (const categorySeed of CATEGORY_SEED) {
    let category = (
      await db
        .select()
        .from(assessmentCategories)
        .where(
          and(
            eq(assessmentCategories.schoolId, school.id),
            eq(assessmentCategories.academicPeriodId, period.id),
            eq(assessmentCategories.code, categorySeed.code)
          )
        )
        .limit(1)
    )[0];

    if (!category) {
      category = (
        await db
          .insert(assessmentCategories)
          .values({
            schoolId: school.id,
            academicPeriodId: period.id,
            code: categorySeed.code,
            name: categorySeed.name,
            order: categorySeed.code === "TAHFIDZ" ? 0 : 1,
          })
          .returning()
      )[0];
      console.log(`[seed] created category: ${category.name}`);
    }

    for (const subSeed of categorySeed.subcategories) {
      const existing = (
        await db
          .select()
          .from(assessmentSubcategories)
          .where(
            and(
              eq(assessmentSubcategories.schoolId, school.id),
              eq(assessmentSubcategories.categoryId, category.id),
              eq(assessmentSubcategories.code, subSeed.code)
            )
          )
          .limit(1)
      )[0];

      if (!existing) {
        await db.insert(assessmentSubcategories).values({
          categoryId: category.id,
          schoolId: school.id,
          code: subSeed.code,
          name: subSeed.name,
          scoreFields: subSeed.scoreFields,
          referenceShape: subSeed.referenceShape,
          gradingScale: DEFAULT_GRADING_SCALE,
          includeInRanking: subSeed.includeInRanking,
        });
        console.log(`[seed] created subcategory: ${subSeed.name}`);
      }
    }
  }

  // 5. Read data-seed.xlsx
  const xlsxPath = path.resolve(process.cwd(), "../../docs/data-seed.xlsx");
  const localXlsxPath = path.resolve(process.cwd(), "docs/data-seed.xlsx");
  const resolvedPath = fs.existsSync(xlsxPath)
    ? xlsxPath
    : fs.existsSync(localXlsxPath)
      ? localXlsxPath
      : path.resolve(__dirname, "../../../../docs/data-seed.xlsx");

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[seed] data-seed.xlsx not found at ${resolvedPath}. Skipping excel seeding.`);
    return;
  }

  console.log(`[seed] reading data from ${resolvedPath}...`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(resolvedPath);

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

  // 5.1 Classes
  const classRows = sheetToJson<ExcelClassRow>(workbook.getWorksheet("class"));
  const classMap = new Map<string, string>(); // className -> classId

  for (const row of classRows) {
    if (!row.class) continue;
    const className = row.class.trim();
    const match = className.match(/^(VII|VIII|IX)\s/);
    const jenjangLevel = match ? match[1] : "SMP";

    let cls = (
      await db
        .select()
        .from(classes)
        .where(and(eq(classes.schoolId, school.id), eq(classes.name, className)))
        .limit(1)
    )[0];

    if (!cls) {
      cls = (
        await db
          .insert(classes)
          .values({
            schoolId: school.id,
            name: className,
            jenjangLevel,
          })
          .returning()
      )[0];
      console.log(`[seed] created class: ${className}`);
    }
    classMap.set(className, cls.id);
  }

  // 5.2 Teachers
  const teacherRows = sheetToJson<ExcelTeacherRow>(workbook.getWorksheet("teacher"));
  const teacherMap = new Map<string, string>(); // teacherName -> teacherUserId
  const defaultPasswordHash = await hash(DEFAULT_PASSWORD);

  for (const row of teacherRows) {
    if (!row.teacher) continue;
    const teacherName = row.teacher.trim();
    const kode = (row.kode || "guru").trim().toLowerCase();
    const email = `${kode}@alfitrah.sch.id`;

    let teacherUser = (
      await db
        .select()
        .from(users)
        .where(and(eq(users.schoolId, school.id), eq(users.name, teacherName)))
        .limit(1)
    )[0];

    if (!teacherUser) {
      teacherUser = (
        await db
          .insert(users)
          .values({
            schoolId: school.id,
            role: "teacher",
            name: teacherName,
            username: kode,
            email,
            passwordHash: defaultPasswordHash,
            phone: null,
          })
          .returning()
      )[0];
      console.log(`[seed] created teacher: ${teacherName} (${email}, username: ${kode})`);
    }
    teacherMap.set(teacherName, teacherUser.id);
  }

  // 5.3 Student password & profile map (derived from birth_date as 8 digits ddmmyyyy)
  const studentRows = sheetToJson<ExcelStudentRow>(workbook.getWorksheet("student"));
  const studentPasswordMap = new Map<string, string>();
  const studentInfoMap = new Map<string, { gender?: string; birthPlace?: string; birthDate?: string }>();

  for (const s of studentRows) {
    if (s.username) {
      const birthDatePwd = parseBirthDateToPassword(s.birth_date);
      const chosenPassword = birthDatePwd || (s.password ? s.password.trim() : DEFAULT_PASSWORD);
      studentPasswordMap.set(s.username.trim(), chosenPassword);
      studentInfoMap.set(s.username.trim(), {
        gender: s.gender ? String(s.gender).trim() : undefined,
        birthPlace: s.birth_place ? String(s.birth_place).trim() : undefined,
        birthDate: s.birth_date ? String(s.birth_date).trim() : undefined,
      });
    }
  }

  // 5.4 Students, Parents, Class Enrollment & Teacher Mappings
  const mappingRows = sheetToJson<any>(workbook.getWorksheet("student-parent-class-teacher"));

  console.log(`[seed] processing ${mappingRows.length} mapping rows from Excel...`);
  const usedEmails = new Set<string>();
  const usedStudentUsernames = new Set<string>();
  const teacherClassPairs = new Set<string>();
  const studentMap = new Map<string, any>(); // username -> student user entity

  let studentCount = 0;
  let parentCount = 0;
  let mappingCount = 0;

  // 5.4.1 Seed Students first
  for (const row of mappingRows) {
    if (!row.username || !row.student_name) continue;

    const fullname = String(row.student_name).trim();
    const username = String(row.username).trim().toLowerCase();
    if (usedStudentUsernames.has(username)) continue;
    usedStudentUsernames.add(username);

    // Determine unique email
    let email = row.email ? String(row.email).trim().toLowerCase() : "";
    if (!email || usedEmails.has(email)) {
      email = `${username}@alfitrah.sch.id`;
    }
    if (usedEmails.has(email)) {
      email = `${username}.${Math.floor(Math.random() * 899 + 100)}@alfitrah.sch.id`;
    }
    usedEmails.add(email);

    // Password & Extra Info
    const rawPassword = studentPasswordMap.get(username) || DEFAULT_PASSWORD;
    const pwdHash = await hash(rawPassword);
    const extraInfo = studentInfoMap.get(username);

    let student = (
      await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.schoolId, school.id),
            eq(users.username, username),
            eq(users.role, "student")
          )
        )
        .limit(1)
    )[0];

    if (!student) {
      student = (
        await db
          .insert(users)
          .values({
            schoolId: school.id,
            role: "student",
            name: fullname,
            username,
            email,
            passwordHash: pwdHash,
            gender: extraInfo?.gender || null,
            birthPlace: extraInfo?.birthPlace || null,
            birthDate: extraInfo?.birthDate || null,
            phone: null,
          })
          .returning()
      )[0];
      studentCount++;
    } else {
      // Keep student passwordHash & profile updated
      await db
        .update(users)
        .set({
          passwordHash: pwdHash,
          gender: extraInfo?.gender || student.gender || null,
          birthPlace: extraInfo?.birthPlace || student.birthPlace || null,
          birthDate: extraInfo?.birthDate || student.birthDate || null,
        })
        .where(eq(users.id, student.id));
    }
    studentMap.set(username, student);

    // Class Enrollment & Teacher Mapping
    const className = row.class ? String(row.class).trim() : "";
    const teacherName = row.teacher ? String(row.teacher).trim() : "";
    const classId = classMap.get(className);
    const teacherId = teacherMap.get(teacherName);

    if (classId) {
      // Enrollment
      const existingEnrollment = (
        await db
          .select()
          .from(studentClassEnrollment)
          .where(
            and(
              eq(studentClassEnrollment.schoolId, school.id),
              eq(studentClassEnrollment.studentId, student.id),
              eq(studentClassEnrollment.classId, classId),
              eq(studentClassEnrollment.academicPeriodId, period.id)
            )
          )
          .limit(1)
      )[0];

      if (!existingEnrollment) {
        await db.insert(studentClassEnrollment).values({
          schoolId: school.id,
          studentId: student.id,
          classId,
          academicPeriodId: period.id,
        });
      }

      // Teacher - Class assignment
      if (teacherId) {
        const pairKey = `${teacherId}:${classId}`;
        if (!teacherClassPairs.has(pairKey)) {
          teacherClassPairs.add(pairKey);
          const existingTeacherClass = (
            await db
              .select()
              .from(teacherClasses)
              .where(
                and(
                  eq(teacherClasses.schoolId, school.id),
                  eq(teacherClasses.teacherId, teacherId),
                  eq(teacherClasses.classId, classId)
                )
              )
              .limit(1)
          )[0];

          if (!existingTeacherClass) {
            await db.insert(teacherClasses).values({
              schoolId: school.id,
              teacherId,
              classId,
            });
          }
        }

        // Student -> Teacher Mapping
        const existingStudentTeacher = (
          await db
            .select()
            .from(studentTeacherMapping)
            .where(
              and(
                eq(studentTeacherMapping.schoolId, school.id),
                eq(studentTeacherMapping.studentId, student.id),
                eq(studentTeacherMapping.teacherId, teacherId),
                eq(studentTeacherMapping.classId, classId)
              )
            )
            .limit(1)
        )[0];

        if (!existingStudentTeacher) {
          await db.insert(studentTeacherMapping).values({
            schoolId: school.id,
            studentId: student.id,
            teacherId,
            classId,
          });
          mappingCount++;
        }
      }
    }
  }

  // 5.4.2 Seed Parents & Parent-Student Mappings (Grouped by Parent Name)
  const parentsGrouped = new Map<string, {
    name: string;
    email: string;
    username: string;
    studentUsernames: string[];
  }>();

  const usedParentUsernames = new Set<string>();

  for (const row of mappingRows) {
    if (!row.username || !row.student_name) continue;
    const studentUsername = String(row.username).trim().toLowerCase();
    const parentName = row.parent_name ? String(row.parent_name).trim() : `Orang Tua ${row.student_name}`;
    const pKey = parentName.toLowerCase();
    const rawEmail = row.email_parent ? String(row.email_parent).trim().toLowerCase() : "";

    if (!parentsGrouped.has(pKey)) {
      let baseUsername = `ortu_${parentName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)}`;
      if (!baseUsername || baseUsername === "ortu_") {
        baseUsername = `ortu_${studentUsername}`;
      }
      let finalUsername = baseUsername;
      let counter = 1;
      while (usedParentUsernames.has(finalUsername)) {
        finalUsername = `${baseUsername}${counter++}`;
      }
      usedParentUsernames.add(finalUsername);

      const email = rawEmail && !usedEmails.has(rawEmail)
        ? rawEmail
        : `${finalUsername}@parent.alfitrah.sch.id`;
      usedEmails.add(email);

      parentsGrouped.set(pKey, {
        name: parentName,
        email,
        username: finalUsername,
        studentUsernames: [studentUsername],
      });
    } else {
      const existing = parentsGrouped.get(pKey)!;
      existing.studentUsernames.push(studentUsername);
      if (rawEmail && !usedEmails.has(rawEmail) && existing.email.endsWith("@parent.alfitrah.sch.id")) {
        existing.email = rawEmail;
        usedEmails.add(rawEmail);
      }
    }
  }

  console.log(`[seed] seeding ${parentsGrouped.size} distinct parents...`);

  for (const pData of parentsGrouped.values()) {
    let parentUser = (
      await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.schoolId, school.id),
            eq(users.username, pData.username),
            eq(users.role, "parent")
          )
        )
        .limit(1)
    )[0];

    if (!parentUser) {
      parentUser = (
        await db
          .insert(users)
          .values({
            schoolId: school.id,
            role: "parent",
            name: pData.name,
            username: pData.username,
            email: pData.email,
            passwordHash: defaultPasswordHash,
            phone: null,
          })
          .returning()
      )[0];
      parentCount++;
    }

    // Map parent to all their children
    for (const sUser of pData.studentUsernames) {
      const studentEntity = studentMap.get(sUser);
      if (!studentEntity) continue;

      const existingParentMapping = (
        await db
          .select()
          .from(parentStudentMapping)
          .where(
            and(
              eq(parentStudentMapping.schoolId, school.id),
              eq(parentStudentMapping.parentId, parentUser.id),
              eq(parentStudentMapping.studentId, studentEntity.id)
            )
          )
          .limit(1)
      )[0];

      if (!existingParentMapping) {
        await db.insert(parentStudentMapping).values({
          schoolId: school.id,
          parentId: parentUser.id,
          studentId: studentEntity.id,
        });
      }
    }
  }

  console.log(`\n[seed] SUCCESS:`);
  console.log(`- Created/verified ${classMap.size} classes`);
  console.log(`- Created/verified ${teacherMap.size} teachers`);
  console.log(`- Created/verified ${studentCount} students`);
  console.log(`- Created/verified ${parentCount} parents`);
  console.log(`- Created/verified ${teacherClassPairs.size} teacher-class assignments`);
  console.log(`- Created/verified ${mappingCount} student-teacher group mappings`);
  console.log(`\nDemo Credentials:`);
  console.log(`- Koordinator: ${KOORDINATOR_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.log(`- Guru (Contoh): asa@teacher.alfitrah.sch.id / ${DEFAULT_PASSWORD}`);
  console.log(`- Siswa (Contoh): nengdara.hdr@gmail.com / 15042014 (DDMMYYYY tgl lahir)`);
  console.log(`- Ortu (Contoh): ortu_daraindahpertiwi / ${DEFAULT_PASSWORD}`);
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
