import { eq, and } from "drizzle-orm";
import { createDb } from "./client";
import { schools, users, academicPeriods, assessmentCategories, assessmentSubcategories } from "./schema";
import { hash } from "@node-rs/argon2";

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

async function main() {
  const db = createDb();

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
  } else {
    console.log(`[seed] school exists, skip: ${school.name}`);
  }

  let period = (
    await db
      .select()
      .from(academicPeriods)
      .where(
        and(
          eq(academicPeriods.schoolId, school.id),
          eq(academicPeriods.tahunAjaran, "2025/2026")
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
    console.log("[seed] school activeAcademicPeriodId updated");
  }

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
          email: KOORDINATOR_EMAIL,
          passwordHash: await hash(DEFAULT_PASSWORD),
          phone: null,
        })
        .returning()
    )[0];
    console.log(`[seed] created koordinator: ${KOORDINATOR_EMAIL}`);
  } else {
    console.log("[seed] koordinator exists, skip");
  }

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

  console.log("\n[seed] done.");
  console.log(`[seed] login demo: ${KOORDINATOR_EMAIL} / ${DEFAULT_PASSWORD}`);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
