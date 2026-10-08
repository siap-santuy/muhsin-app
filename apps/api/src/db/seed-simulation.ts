import { eq, and, or, gte, lte } from "drizzle-orm";
import { createDb, closeDb } from "./client";
import {
  schools,
  users,
  classes,
  academicPeriods,
  studentClassEnrollment,
  studentTeacherMapping,
  parentStudentMapping,
  assessmentSubcategories,
  dailyIbadah,
  setoranEntries,
  evaluasiBulanan,
  parentViews,
  notifications,
  studentGamification,
  expTransactions,
} from "./schema";
import { hash } from "@node-rs/argon2";
import { ExpCalculator } from "../modules/gamification/domain/services/ExpCalculator";
import { IbadahValidator } from "../modules/daily-ibadah/domain/services/IbadahValidator";

const DEFAULT_PASSWORD = "muhsin123";

async function main() {
  const db = createDb();
  console.log("==================================================");
  console.log("  MUHSIN APP — SEED DATA SIMULASI 1 BULAN STAGING ");
  console.log("==================================================");

  // 1. Resolve School
  let [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, "alfitrah"))
    .limit(1);

  if (!school) {
    [school] = await db.select().from(schools).limit(1);
  }

  if (!school) {
    throw new Error("Sekolah belum tersedia. Jalankan `bun run db:seed` terlebih dahulu.");
  }
  console.log(`[sim] Target Sekolah: ${school.name} (id: ${school.id})`);

  // 2. Resolve Academic Period
  let [period] = await db
    .select()
    .from(academicPeriods)
    .where(eq(academicPeriods.schoolId, school.id))
    .limit(1);

  if (!period) {
    [period] = await db
      .insert(academicPeriods)
      .values({ schoolId: school.id, tahunAjaran: "2025/2026", semester: "Ganjil" })
      .returning();
  }

  // 3. Resolve Class
  let [targetClass] = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, school.id),
        eq(classes.name, "VII Abu Bakar Ash-shiddiq")
      )
    )
    .limit(1);

  if (!targetClass) {
    [targetClass] = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, school.id))
      .limit(1);
  }

  if (!targetClass) {
    [targetClass] = await db
      .insert(classes)
      .values({
        schoolId: school.id,
        name: "VII Abu Bakar Ash-shiddiq",
        jenjangLevel: "7",
      })
      .returning();
  }
  console.log(`[sim] Target Kelas: ${targetClass.name}`);

  // 4. Resolve Subcategories
  const subcats = await db
    .select()
    .from(assessmentSubcategories)
    .where(
      and(
        eq(assessmentSubcategories.schoolId, school.id),
        eq(assessmentSubcategories.isActive, true)
      )
    );

  const ziyadahSubcat = subcats.find((s) => s.code?.toUpperCase().includes("ZIYADAH")) || subcats[0];
  const murojaahSubcat = subcats.find((s) => s.code?.toUpperCase().includes("MUROJAAH")) || subcats[1] || subcats[0];
  const sabiqSubcat = subcats.find((s) => s.code?.toUpperCase().includes("SABIQ")) || subcats[2] || subcats[0];
  const talaqiSubcat = subcats.find((s) => s.code?.toUpperCase().includes("TALAQI")) || subcats[3] || subcats[0];

  console.log(`[sim] Subkategori Penilaian terpetakan:`);
  console.log(`      - Ziyadah: ${ziyadahSubcat.name} (${ziyadahSubcat.id})`);
  console.log(`      - Murojaah: ${murojaahSubcat.name} (${murojaahSubcat.id})`);
  console.log(`      - Sabiq: ${sabiqSubcat.name} (${sabiqSubcat.id})`);
  console.log(`      - Talaqi: ${talaqiSubcat.name} (${talaqiSubcat.id})`);

  // 5. Setup Trio: Guru, Siswa, Orang Tua
  const defaultPasswordHash = await hash(DEFAULT_PASSWORD);

  // 5.1 GURU
  const TEACHER_EMAIL = "arai@teacher.alfitrah.sch.id";
  let [teacher] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.schoolId, school.id),
        eq(users.role, "teacher"),
        eq(users.email, TEACHER_EMAIL)
      )
    )
    .limit(1);

  if (!teacher) {
    // Cari guru halaqah pertama atau buat baru
    const [firstTeacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, school.id), eq(users.role, "teacher")))
      .limit(1);

    if (firstTeacher) {
      teacher = firstTeacher;
    } else {
      [teacher] = await db
        .insert(users)
        .values({
          schoolId: school.id,
          role: "teacher",
          name: "Arai Kurnia Ramadhan, S.Pd.",
          username: "arai",
          email: TEACHER_EMAIL,
          passwordHash: defaultPasswordHash,
          phone: "081234567891",
        })
        .returning();
    }
  }
  console.log(`[sim] Guru: ${teacher.name} (${teacher.email})`);

  // 5.2 SISWA (ANAK)
  const STUDENT_EMAIL = "nengdara.hdr@gmail.com";
  let [student] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.schoolId, school.id),
        eq(users.role, "student"),
        or(
          eq(users.email, STUDENT_EMAIL),
          eq(users.name, "Abdul Rayhan Pradipta"),
          eq(users.username, "abdulrayhan")
        )
      )
    )
    .limit(1);

  if (!student) {
    [student] = await db
      .insert(users)
      .values({
        schoolId: school.id,
        role: "student",
        name: "Abdul Rayhan Pradipta",
        username: "abdulrayhan",
        email: STUDENT_EMAIL,
        passwordHash: defaultPasswordHash,
        gender: "ikhwan",
        birthPlace: "Payakumbuh",
        birthDate: "2014-04-15",
        phone: "085263366388",
      })
      .returning();
  } else {
    await db
      .update(users)
      .set({
        email: STUDENT_EMAIL,
        name: "Abdul Rayhan Pradipta",
        username: "abdulrayhan",
        passwordHash: defaultPasswordHash,
      })
      .where(eq(users.id, student.id));
  }
  console.log(`[sim] Siswa: ${student.name} (${student.email}, id: ${student.id})`);

  // 5.3 ORANG TUA
  const PARENT_USERNAME = "ortu_daraindahpertiwi";
  const PARENT_EMAIL = "ortu_daraindahpertiwi@parent.alfitrah.sch.id";
  let [parent] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.schoolId, school.id),
        eq(users.role, "parent"),
        or(
          eq(users.username, PARENT_USERNAME),
          eq(users.email, PARENT_EMAIL),
          eq(users.name, "Dara Indah Pertiwi")
        )
      )
    )
    .limit(1);

  if (!parent) {
    [parent] = await db
      .insert(users)
      .values({
        schoolId: school.id,
        role: "parent",
        name: "Dara Indah Pertiwi",
        username: PARENT_USERNAME,
        email: PARENT_EMAIL,
        passwordHash: defaultPasswordHash,
        phone: "081298765432",
      })
      .returning();
  } else {
    await db
      .update(users)
      .set({
        username: PARENT_USERNAME,
        email: PARENT_EMAIL,
        name: "Dara Indah Pertiwi",
        passwordHash: defaultPasswordHash,
      })
      .where(eq(users.id, parent.id));
  }
  console.log(`[sim] Ortu: ${parent.name} (username: ${parent.username}, id: ${parent.id})`);

  // 5.4 Pastikan Hubungan (Mappings) Terhubung
  // Student -> Class Enrollment
  const [existingEnrollment] = await db
    .select()
    .from(studentClassEnrollment)
    .where(
      and(
        eq(studentClassEnrollment.schoolId, school.id),
        eq(studentClassEnrollment.studentId, student.id)
      )
    )
    .limit(1);

  if (!existingEnrollment) {
    await db.insert(studentClassEnrollment).values({
      schoolId: school.id,
      studentId: student.id,
      classId: targetClass.id,
      academicPeriodId: period.id,
    });
  } else if (existingEnrollment.classId !== targetClass.id) {
    await db
      .update(studentClassEnrollment)
      .set({ classId: targetClass.id })
      .where(eq(studentClassEnrollment.id, existingEnrollment.id));
  }

  // Student -> Teacher Mapping
  const [existingMapping] = await db
    .select()
    .from(studentTeacherMapping)
    .where(
      and(
        eq(studentTeacherMapping.schoolId, school.id),
        eq(studentTeacherMapping.studentId, student.id)
      )
    )
    .limit(1);

  if (!existingMapping) {
    await db.insert(studentTeacherMapping).values({
      schoolId: school.id,
      studentId: student.id,
      teacherId: teacher.id,
      classId: targetClass.id,
    });
  } else if (existingMapping.teacherId !== teacher.id || existingMapping.classId !== targetClass.id) {
    await db
      .update(studentTeacherMapping)
      .set({ teacherId: teacher.id, classId: targetClass.id })
      .where(eq(studentTeacherMapping.id, existingMapping.id));
  }

  // Parent -> Student Mapping (Bersihkan mapping ganda dan pastikan terkoneksi ke student target)
  await db
    .delete(parentStudentMapping)
    .where(
      and(
        eq(parentStudentMapping.schoolId, school.id),
        eq(parentStudentMapping.parentId, parent.id)
      )
    );

  await db.insert(parentStudentMapping).values({
    schoolId: school.id,
    parentId: parent.id,
    studentId: student.id,
  });

  console.log(`[sim] Mapping Guru <-> Siswa <-> Orang Tua dipastikan terhubung AKTIF.`);

  // 6. Pembersihan Data Simulasi Bulan September 2026 (Idempotent Reset)
  const START_DATE = "2026-09-01";
  const END_DATE = "2026-09-30";
  const BULAN_STR = "2026-09";

  console.log(`[sim] Membersihkan data simulasi lama untuk ${student.name} (${START_DATE} s/d ${END_DATE})...`);
  await db
    .delete(dailyIbadah)
    .where(
      and(
        eq(dailyIbadah.schoolId, school.id),
        eq(dailyIbadah.studentId, student.id),
        gte(dailyIbadah.date, START_DATE),
        lte(dailyIbadah.date, END_DATE)
      )
    );

  await db
    .delete(setoranEntries)
    .where(
      and(
        eq(setoranEntries.schoolId, school.id),
        eq(setoranEntries.studentId, student.id),
        gte(setoranEntries.date, START_DATE),
        lte(setoranEntries.date, END_DATE)
      )
    );

  await db
    .delete(evaluasiBulanan)
    .where(
      and(
        eq(evaluasiBulanan.schoolId, school.id),
        eq(evaluasiBulanan.studentId, student.id),
        eq(evaluasiBulanan.bulan, BULAN_STR)
      )
    );

  await db
    .delete(expTransactions)
    .where(
      and(
        eq(expTransactions.schoolId, school.id),
        eq(expTransactions.studentId, student.id)
      )
    );

  await db
    .delete(parentViews)
    .where(
      and(
        eq(parentViews.schoolId, school.id),
        eq(parentViews.studentId, student.id)
      )
    );

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.schoolId, school.id),
        eq(notifications.userId, student.id)
      )
    );

  // 7. Seed 30 Hari Daily Ibadah (Mutaba'ah Yaumiyah)
  console.log(`[sim] Membuat 30 hari data Mutaba'ah Yaumiyah (${START_DATE} s/d ${END_DATE})...`);
  let cumulativeExp = 0;

  for (let day = 1; day <= 30; day++) {
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `2026-09-${dayStr}`;
    const dateObj = new Date(2026, 8, day); // Sept 2026
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, ..., 6 = Sat

    // Sholat Fardhu: variasi sangat realistis (mayoritas BA, kadang MA di siang hari)
    const dzuhurStatus: "MA" | "BA" = (dayOfWeek === 0 || dayOfWeek === 6) ? "MA" : "BA";
    const sholatFardhu = {
      subuh: "BA" as const,
      dzuhur: dzuhurStatus,
      ashar: "BA" as const,
      maghrib: "BA" as const,
      isya: "BA" as const,
    };

    // Rawatib
    const sholatRawatib = [
      "Qabliyah Subuh",
      "Ba'diyah Maghrib",
      "Ba'diyah Isya",
      ...(dayOfWeek >= 1 && dayOfWeek <= 5 ? ["Qabliyah Dzuhur", "Ba'diyah Dzuhur"] : []),
    ];

    // Sunnah Lainnya
    const isSeninKamis = dayOfWeek === 1 || dayOfWeek === 4;
    const tahajud = isSeninKamis || dayOfWeek === 5; // Senin, Kamis, Jumat
    const dhuha = dayOfWeek !== 0; // Rutin kecuali Minggu
    const puasaSunnah = dayOfWeek === 1 ? "senin" : dayOfWeek === 4 ? "kamis" : null;

    // Tilawah Qur'an Progresif
    const surahStart = 67 + Math.floor((day - 1) / 3); // Dari Al-Mulk s/d juz 30
    const surahEnd = surahStart;
    const ayatStart = 1 + ((day * 7) % 20);
    const ayatEnd = ayatStart + 15;

    const tilawah = {
      surahStart: Math.min(surahStart, 114),
      ayatStart,
      surahEnd: Math.min(surahEnd, 114),
      ayatEnd,
    };

    const submittedAt = new Date(2026, 8, day, 20, 45, 0);

    const [savedIbadah] = await db
      .insert(dailyIbadah)
      .values({
        schoolId: school.id,
        studentId: student.id,
        date: dateStr,
        status: "submitted",
        submittedAt,
        sholatFardhu,
        sholatRawatib,
        tahajud,
        dhuha,
        puasaSunnah,
        tilawah,
      })
      .returning();

    // Hitung EXP per hari
    const dayExp = IbadahValidator.calculateDayExp({
      sholatFardhu,
      sholatRawatib,
      tahajud,
      dhuha,
      puasaSunnah,
      tilawah,
    });

    cumulativeExp += dayExp;

    await db.insert(expTransactions).values({
      schoolId: school.id,
      studentId: student.id,
      sourceType: "daily_ibadah",
      sourceId: savedIbadah.id,
      expAmount: dayExp,
      description: `Mutaba'ah yaumiyah tanggal ${dateStr}`,
      createdAt: submittedAt,
    });
  }

  // 8. Seed Setoran Entries (Hari Sekolah Senin - Jumat sepanjang September 2026)
  console.log(`[sim] Membuat pencatatan nilai setoran hafalan & tahsin guru...`);
  let setoranCount = 0;

  // Daftar surah hafalan Ziyadah progresif (Juz 30: An-Naba s/d Al-Muthaffifin)
  const TAHFIDZ_SURAH_LIST = [
    { no: 78, name: "An-Naba'", maxAyat: 40 },
    { no: 79, name: "An-Nazi'at", maxAyat: 46 },
    { no: 80, name: "'Abasa", maxAyat: 42 },
    { no: 81, name: "At-Takwir", maxAyat: 29 },
    { no: 82, name: "Al-Infitar", maxAyat: 19 },
    { no: 83, name: "Al-Muthaffifin", maxAyat: 36 },
  ];

  for (let day = 1; day <= 30; day++) {
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `2026-09-${dayStr}`;
    const dateObj = new Date(2026, 8, day);
    const dayOfWeek = dateObj.getDay();

    // Hanya hari Senin s/d Jumat (Sekolah aktif)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      setoranCount++;
      const createdAt = new Date(2026, 8, day, 10, 15, 0);

      // Simulasi 1 hari izin/sakit agar realistis (misal tgl 16 Sept)
      if (day === 16) {
        // Sakit
        await db.insert(setoranEntries).values({
          schoolId: school.id,
          subcategoryId: ziyadahSubcat.id,
          studentId: student.id,
          teacherId: teacher.id,
          date: dateStr,
          referenceStart: null,
          referenceEnd: null,
          scores: {},
          keterangan: "[Sakit] Demam tinggi, izin istirahat di rumah",
          createdAt,
          updatedAt: createdAt,
        });
        continue;
      }

      // 8.1 Setoran Ziyadah (Hafalan Baru)
      const surahIdx = Math.floor(setoranCount / 4) % TAHFIDZ_SURAH_LIST.length;
      const sInfo = TAHFIDZ_SURAH_LIST[surahIdx];
      const part = (setoranCount % 4) + 1;
      const aStart = Math.min(1 + (part - 1) * 10, sInfo.maxAyat);
      const aEnd = Math.min(part * 10, sInfo.maxAyat);

      // Dinamis sesuaikan dengan field subkategori
      const ziyadahFields = (ziyadahSubcat.scoreFields as any[]) || [];
      const zScores: Record<string, number> = {};
      if (ziyadahFields.length > 0) {
        for (const f of ziyadahFields) {
          zScores[f.key] = 88 + ((day * 3 + f.key.length) % 11); // 88 s/d 98
        }
      } else {
        zScores["tajwid"] = 92;
        zScores["kelancaran"] = 94;
      }

      const [zEntry] = await db
        .insert(setoranEntries)
        .values({
          schoolId: school.id,
          subcategoryId: ziyadahSubcat.id,
          studentId: student.id,
          teacherId: teacher.id,
          date: dateStr,
          referenceStart: {
            surah: sInfo.name,
            surahNumber: sInfo.no,
            ayat: aStart,
          },
          referenceEnd: {
            surah: sInfo.name,
            surahNumber: sInfo.no,
            ayat: aEnd,
          },
          scores: zScores,
          keterangan: `[Hadir] Setoran Ziyadah ${sInfo.name} ayat ${aStart}-${aEnd} lancar dan tartil`,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();

      // +20 EXP Setoran
      cumulativeExp += 20;
      await db.insert(expTransactions).values({
        schoolId: school.id,
        studentId: student.id,
        sourceType: "setoran",
        sourceId: zEntry.id,
        expAmount: 20,
        description: `Setoran Ziyadah tanggal ${dateStr}`,
        createdAt,
      });

      // 8.2 Setoran Tahsin (Sabiq / Talaqi) pada hari Selasa & Kamis
      if (dayOfWeek === 2 || dayOfWeek === 4) {
        const hal = 220 + ((day * 2) % 20);
        const sabiqFields = (sabiqSubcat.scoreFields as any[]) || [];
        const sScores: Record<string, number> = {};
        if (sabiqFields.length > 0) {
          for (const f of sabiqFields) {
            sScores[f.key] = 87 + ((day + f.key.length) % 11);
          }
        } else {
          sScores["mad"] = 90;
          sScores["makhroj"] = 89;
          sScores["ghunnah"] = 91;
          sScores["kelancaran"] = 93;
        }

        const [sEntry] = await db
          .insert(setoranEntries)
          .values({
            schoolId: school.id,
            subcategoryId: sabiqSubcat.id,
            studentId: student.id,
            teacherId: teacher.id,
            date: dateStr,
            referenceStart: { jilid: 4, halaman: hal },
            referenceEnd: { jilid: 4, halaman: hal + 1 },
            scores: sScores,
            keterangan: `[Hadir] Tahsin Metode Sabiq Jilid 4 Hal ${hal}-${hal + 1}`,
            createdAt: new Date(createdAt.getTime() + 1000 * 60 * 30),
            updatedAt: new Date(createdAt.getTime() + 1000 * 60 * 30),
          })
          .returning();

        cumulativeExp += 20;
        await db.insert(expTransactions).values({
          schoolId: school.id,
          studentId: student.id,
          sourceType: "setoran",
          sourceId: sEntry.id,
          expAmount: 20,
          description: `Setoran Tahsin Sabiq tanggal ${dateStr}`,
          createdAt: new Date(createdAt.getTime() + 1000 * 60 * 30),
        });
      }

      // 8.3 Setoran Muroja'ah (Senin, Rabu, Jumat)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        const murojaahFields = (murojaahSubcat.scoreFields as any[]) || [];
        const mScores: Record<string, number> = {};
        if (murojaahFields.length > 0) {
          for (const f of murojaahFields) {
            mScores[f.key] = 88 + ((day * 2 + f.key.length) % 11);
          }
        } else {
          mScores["tajwid"] = 92;
          mScores["kelancaran"] = 94;
        }

        const [mEntry] = await db
          .insert(setoranEntries)
          .values({
            schoolId: school.id,
            subcategoryId: murojaahSubcat.id,
            studentId: student.id,
            teacherId: teacher.id,
            date: dateStr,
            referenceStart: {
              surah: "An-Naba'",
              surahNumber: 78,
              ayat: 1,
            },
            referenceEnd: {
              surah: "An-Naba'",
              surahNumber: 78,
              ayat: 20,
            },
            scores: mScores,
            keterangan: `[Hadir] Setoran Muroja'ah An-Naba' ayat 1-20 lancar dan mutqin`,
            createdAt: new Date(createdAt.getTime() + 1000 * 60 * 45),
            updatedAt: new Date(createdAt.getTime() + 1000 * 60 * 45),
          })
          .returning();

        cumulativeExp += 20;
        await db.insert(expTransactions).values({
          schoolId: school.id,
          studentId: student.id,
          sourceType: "setoran",
          sourceId: mEntry.id,
          expAmount: 20,
          description: `Setoran Muroja'ah tanggal ${dateStr}`,
          createdAt: new Date(createdAt.getTime() + 1000 * 60 * 45),
        });
      }
    }
  }

  // 9. Update Gamifikasi Siswa
  const computedLevel = ExpCalculator.calculateLevel(cumulativeExp);
  console.log(`[sim] Mengupdate gamifikasi: Total EXP = ${cumulativeExp} (Level ${computedLevel}, Streak 30)...`);

  const [existingGamification] = await db
    .select()
    .from(studentGamification)
    .where(
      and(
        eq(studentGamification.schoolId, school.id),
        eq(studentGamification.studentId, student.id)
      )
    )
    .limit(1);

  if (existingGamification) {
    await db
      .update(studentGamification)
      .set({
        level: computedLevel,
        totalExp: cumulativeExp,
        currentStreak: 30,
        longestStreak: 30,
        lastActivityDate: END_DATE,
      })
      .where(eq(studentGamification.studentId, student.id));
  } else {
    await db.insert(studentGamification).values({
      schoolId: school.id,
      studentId: student.id,
      level: computedLevel,
      totalExp: cumulativeExp,
      currentStreak: 30,
      longestStreak: 30,
      lastActivityDate: END_DATE,
    });
  }

  // 10. Seed Evaluasi Bulanan Guru
  console.log(`[sim] Menyimpan evaluasi bulanan naratif untuk bulan ${BULAN_STR}...`);
  await db.insert(evaluasiBulanan).values({
    schoolId: school.id,
    studentId: student.id,
    teacherId: teacher.id,
    subcategoryId: ziyadahSubcat.id,
    bulan: BULAN_STR,
    catatan:
      "Alhamdulillah ananda menunjukkan perkembangan hafalan yang sangat membanggakan di bulan ini. Bacaan tartil, makhroj, dan tajwid semakin konsisten. Mutaba'ah yaumiyah sholat fardhu di awal waktu dan tilawah mandiri sangat tertib. Pertahankan istiqomah dan terus tingkatkan kualitas muroja'ahnya.",
    createdAt: new Date(2026, 8, 30, 16, 0, 0),
  });

  // 11. Seed Riwayat Kunjungan Orang Tua (Parent Views)
  console.log(`[sim] Menyimpan riwayat pemantauan orang tua (parent_views)...`);
  const viewTimestamps = [
    new Date(2026, 8, 7, 19, 30, 0),   // Pekan 1
    new Date(2026, 8, 14, 20, 15, 0),  // Pekan 2
    new Date(2026, 8, 21, 18, 45, 0),  // Pekan 3
    new Date(2026, 8, 28, 21, 10, 0),  // Pekan 4 (Dashboard)
    new Date(2026, 8, 30, 20, 0, 0),   // Akhir Bulan (Raport)
  ];

  for (let i = 0; i < viewTimestamps.length; i++) {
    await db.insert(parentViews).values({
      schoolId: school.id,
      parentId: parent.id,
      studentId: student.id,
      source: i === viewTimestamps.length - 1 ? "raport" : "dashboard",
      viewedAt: viewTimestamps[i],
    });
  }

  // 12. Seed Notifikasi Contoh
  console.log(`[sim] Menyimpan notifikasi contoh...`);
  await db.insert(notifications).values([
    {
      schoolId: school.id,
      userId: student.id,
      title: "Ibadah Yaumiyah Lengkap!",
      message: "Selamat! Kamu telah menyelesaikan seluruh rangkaian ibadah yaumiyah dan menjaga streak 30 hari.",
      type: "yaumiyah",
      isRead: false,
      createdAt: new Date(2026, 8, 30, 21, 0, 0),
    },
    {
      schoolId: school.id,
      userId: student.id,
      title: "Setoran Hafalan Dinilai",
      message: `Ustadz ${teacher.name} telah menilai setoran Ziyadah Surah Al-Muthaffifin dengan predikat Mumtaz (A).`,
      type: "setoran",
      isRead: true,
      createdAt: new Date(2026, 8, 29, 11, 0, 0),
    },
    {
      schoolId: school.id,
      userId: parent.id,
      title: "Raport Bulanan Tersedia",
      message: `Raport capaian TTQ ananda ${student.name} untuk bulan September 2026 telah terbit. Silakan unduh atau tinjau di menu Raport.`,
      type: "raport",
      isRead: true,
      createdAt: new Date(2026, 8, 30, 17, 0, 0),
    },
  ]);

  console.log("\n==================================================");
  console.log("  SIMULASI 1 BULAN PENUH (SEPTEMBER 2026) SELESAI ");
  console.log("==================================================");
  console.log(`\nAkun Terhubung:`);
  console.log(`1. SISWA:`);
  console.log(`   - Nama    : ${student.name}`);
  console.log(`   - Email   : ${student.email}`);
  console.log(`   - Password: ${DEFAULT_PASSWORD}`);
  console.log(`   - Kelas   : ${targetClass.name}`);
  console.log(`   - Gamifikasi: ${cumulativeExp} EXP | Level ${computedLevel} | Streak 30 Hari`);
  console.log(`\n2. ORANG TUA:`);
  console.log(`   - Nama    : ${parent.name}`);
  console.log(`   - Username: ${parent.username}`);
  console.log(`   - Email   : ${parent.email}`);
  console.log(`   - Password: ${DEFAULT_PASSWORD}`);
  console.log(`\n3. GURU PEMBIMBING:`);
  console.log(`   - Nama    : ${teacher.name}`);
  console.log(`   - Email   : ${teacher.email}`);
  console.log(`   - Password: ${DEFAULT_PASSWORD}`);
  console.log(`\nRingkasan Data:`);
  console.log(`- 30 Hari Jurnal Mutaba'ah Yaumiyah (100% tuntas)`);
  console.log(`- 20+ Pencatatan Setoran Hafalan & Tahsin`);
  console.log(`- Evaluasi Bulanan Raport September 2026`);
  console.log(`- 5x Riwayat Pantauan Orang Tua (Dashboard & Raport)`);
  console.log("==================================================\n");
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[sim] Error executing simulation seed:", err);
    process.exit(1);
  });
