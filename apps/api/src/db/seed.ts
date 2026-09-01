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
import * as xlsx from "xlsx";
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
  class?: string;
  teacher?: string;
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
          name: SCHOOL_NAME,
          jenjang: "SMP",
          npsn: "00000001",
          address: "Jl. Demo Al Fitrah No. 1",
          subscriptionTier: "small",
        })
        .returning()
    )[0];
    console.log(`[seed] created school: ${school.name}`);
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
  const fileBuffer = fs.readFileSync(resolvedPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });

  // 5.1 Classes
  const classSheet = workbook.Sheets["class"];
  const classRows: ExcelClassRow[] = xlsx.utils.sheet_to_json(classSheet);
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
  const teacherSheet = workbook.Sheets["teacher"];
  const teacherRows: ExcelTeacherRow[] = xlsx.utils.sheet_to_json(teacherSheet);
  const teacherMap = new Map<string, string>(); // teacherName -> teacherUserId
  const defaultPasswordHash = await hash(DEFAULT_PASSWORD);

  for (const row of teacherRows) {
    if (!row.teacher) continue;
    const teacherName = row.teacher.trim();
    const kode = (row.kode || "guru").trim().toLowerCase();
    const email = `${kode}@teacher.alfitrah.sch.id`;

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

  // 5.3 Student password map
  const studentSheet = workbook.Sheets["student"];
  const studentRows: ExcelStudentRow[] = xlsx.utils.sheet_to_json(studentSheet);
  const studentPasswordMap = new Map<string, string>();
  for (const s of studentRows) {
    if (s.username && s.password) {
      studentPasswordMap.set(s.username.trim(), s.password.trim());
    }
  }

  // 5.4 Students, Mappings, and Parents
  const sctSheet = workbook.Sheets["student-class-teacher"];
  const sctRows: ExcelStudentRow[] = xlsx.utils.sheet_to_json(sctSheet);

  console.log(`[seed] processing ${sctRows.length} student rows from Excel...`);
  const usedEmails = new Set<string>();
  const teacherClassPairs = new Set<string>();

  let studentCount = 0;
  let mappingCount = 0;

  for (const row of sctRows) {
    if (!row.fullname || !row.username) continue; // Skip empty rows

    const fullname = row.fullname.trim();
    const username = row.username.trim();
    const className = row.class ? row.class.trim() : "";
    const teacherName = row.teacher ? row.teacher.trim() : "";

    // Determine unique email
    let email = row.email ? row.email.trim().toLowerCase() : "";
    if (!email || usedEmails.has(email)) {
      email = `${username}@student.alfitrah.sch.id`;
    }
    // If still duplicate, add random suffix
    if (usedEmails.has(email)) {
      email = `${username}.${Math.floor(Math.random() * 899 + 100)}@student.alfitrah.sch.id`;
    }
    usedEmails.add(email);

    // Password
    const rawPassword = studentPasswordMap.get(username) || DEFAULT_PASSWORD;
    const pwdHash = await hash(rawPassword);

    // Find or create Student user
    let student = (
      await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.schoolId, school.id),
            eq(users.name, fullname),
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
            phone: null,
          })
          .returning()
      )[0];
      studentCount++;
    }

    // Find or create Parent user
    const parentUsername = `ortu_${username}`;
    const parentEmail = `ortu.${username}@parent.alfitrah.sch.id`;
    let parent = (
      await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.schoolId, school.id),
            eq(users.email, parentEmail),
            eq(users.role, "parent")
          )
        )
        .limit(1)
    )[0];

    if (!parent) {
      parent = (
        await db
          .insert(users)
          .values({
            schoolId: school.id,
            role: "parent",
            name: `Orang Tua dari ${fullname}`,
            username: parentUsername,
            email: parentEmail,
            passwordHash: defaultPasswordHash,
            phone: null,
          })
          .returning()
      )[0];
    }

    // Map Parent -> Student
    const existingParentMapping = (
      await db
        .select()
        .from(parentStudentMapping)
        .where(
          and(
            eq(parentStudentMapping.schoolId, school.id),
            eq(parentStudentMapping.parentId, parent.id),
            eq(parentStudentMapping.studentId, student.id)
          )
        )
        .limit(1)
    )[0];

    if (!existingParentMapping) {
      await db.insert(parentStudentMapping).values({
        schoolId: school.id,
        parentId: parent.id,
        studentId: student.id,
      });
    }

    // Class Enrollment & Teacher Mapping
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

  console.log(`\n[seed] SUCCESS:`);
  console.log(`- Created/verified ${classMap.size} classes`);
  console.log(`- Created/verified ${teacherMap.size} teachers`);
  console.log(`- Created/verified ${studentCount} students`);
  console.log(`- Created/verified ${teacherClassPairs.size} teacher-class assignments`);
  console.log(`- Created/verified ${mappingCount} student-teacher group mappings`);
  console.log(`\nDemo Credentials:`);
  console.log(`- Koordinator: ${KOORDINATOR_EMAIL} / ${DEFAULT_PASSWORD}`);
  console.log(`- Guru (Contoh): asa@teacher.alfitrah.sch.id / ${DEFAULT_PASSWORD}`);
  console.log(`- Siswa (Contoh): abdulpradipta@student.alfitrah.sch.id / abdulpradipta2026`);
  console.log(`- Ortu (Contoh): ortu.abdulpradipta@parent.alfitrah.sch.id / ${DEFAULT_PASSWORD}`);
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
