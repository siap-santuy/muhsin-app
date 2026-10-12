import type { Db } from "../../../db/client";
import {
  users,
  classes,
  teacherClasses,
  studentClassEnrollment,
  studentTeacherMapping,
  parentStudentMapping,
  studentGamification,
  hafalanTargets,
  setoranEntries,
  assessmentSubcategories,
  dailyIbadah,
} from "../../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { IDashboardRepository } from "../domain/repositories/IDashboardRepository";
import type {
  StudentDashboardSummary,
  TeacherDashboardSummary,
  ParentDashboardSummary,
  KoordinatorDashboardSummary,
} from "../domain/entities/Dashboard";

export class DrizzleDashboardRepository implements IDashboardRepository {
  constructor(private readonly db: Db) {}

  async getStudentDashboard(
    studentId: string,
    schoolId: string
  ): Promise<StudentDashboardSummary> {
    const studentRows = await this.db
      .select({ name: users.name })
      .from(users)
      .where(and(eq(users.id, studentId), eq(users.schoolId, schoolId)))
      .limit(1);

    const gamificationRows = await this.db
      .select()
      .from(studentGamification)
      .where(
        and(
          eq(studentGamification.studentId, studentId),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .limit(1);

    const gam = gamificationRows[0];

    // Current month setoran counts (murni bulan berjalan kalender)
    const activeMonth = new Date().toISOString().slice(0, 7);

    // Target hafalan bulan aktif
    const targetRows = await this.db
      .select()
      .from(hafalanTargets)
      .where(
        and(
          eq(hafalanTargets.studentId, studentId),
          eq(hafalanTargets.schoolId, schoolId),
          eq(hafalanTargets.bulan, activeMonth)
        )
      )
      .limit(1);

    const target = targetRows[0];

    const setoranRows = await this.db
      .select({
        id: setoranEntries.id,
        subcatCode: assessmentSubcategories.code,
        referenceStart: setoranEntries.referenceStart,
      })
      .from(setoranEntries)
      .leftJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .where(
        and(
          eq(setoranEntries.studentId, studentId),
          eq(setoranEntries.schoolId, schoolId),
          sql`to_char(${setoranEntries.date}, 'YYYY-MM') = ${activeMonth}`
        )
      );

    let ziyadahCount = 0;
    let murojaahCount = 0;
    let tahsinCount = 0;

    for (const s of setoranRows) {
      const subCode = (s.subcatCode || "").toUpperCase();
      if (subCode.includes("MUROJAAH")) {
        murojaahCount++;
      } else if (subCode.includes("ZIYADAH") || (s.referenceStart && (s.referenceStart as any).surah)) {
        ziyadahCount++;
      } else {
        tahsinCount++;
      }
    }

    const ibadahRows = await this.db
      .select()
      .from(dailyIbadah)
      .where(
        and(
          eq(dailyIbadah.studentId, studentId),
          eq(dailyIbadah.schoolId, schoolId),
          sql`to_char(${dailyIbadah.date}, 'YYYY-MM') = ${activeMonth}`
        )
      );

    // Hitung dinamis total hari kalender di bulan aktif (28, 29, 30, atau 31 hari)
    const [yearNum, monthNum] = activeMonth.split("-").map(Number);
    const daysInCurrentMonth = new Date(yearNum, monthNum, 0).getDate();
    const yaumiyahDaysCount = ibadahRows.length;

    const TARGET_ZIYADAH = 20;
    const TARGET_TAHSIN = 20;
    const TARGET_MUROJAAH = 20;
    const TARGET_YAUMIYAH = daysInCurrentMonth;

    const progresZiyadah = {
      count: ziyadahCount,
      target: TARGET_ZIYADAH,
      percentage: Math.min(100, Math.round((ziyadahCount / TARGET_ZIYADAH) * 100)),
      caption: `Target ${TARGET_ZIYADAH} halaman`,
    };

    const progresTahsin = {
      count: tahsinCount,
      target: TARGET_TAHSIN,
      percentage: Math.min(100, Math.round((tahsinCount / TARGET_TAHSIN) * 100)),
      caption: `Target ${TARGET_TAHSIN} pertemuan`,
    };

    const progresMurojaah = {
      count: murojaahCount,
      target: TARGET_MUROJAAH,
      percentage: Math.min(100, Math.round((murojaahCount / TARGET_MUROJAAH) * 100)),
      caption: `${murojaahCount} sesi hafalan terjaga`,
    };

    const progresYaumiyah = {
      count: yaumiyahDaysCount,
      target: TARGET_YAUMIYAH,
      percentage: Math.min(100, Math.round((yaumiyahDaysCount / TARGET_YAUMIYAH) * 100)),
      caption: `${yaumiyahDaysCount} dari ${TARGET_YAUMIYAH} hari`,
    };

    return {
      studentName: studentRows[0]?.name ?? "Siswa",
      level: gam?.level ?? 1,
      totalExp: gam?.totalExp ?? 0,
      currentStreak: gam?.currentStreak ?? 0,
      longestStreak: gam?.longestStreak ?? 0,
      targetHafalan: target
        ? {
            surahStart: target.targetSurahStart ?? "Al-Baqarah",
            ayatStart: Number(target.targetAyatStart ?? 1),
            surahEnd: target.targetSurahEnd ?? "Al-Baqarah",
            ayatEnd: Number(target.targetAyatEnd ?? 75),
            progressAyat: "Ayat Aktif",
          }
        : {
            surahStart: "Al-Baqarah",
            ayatStart: 1,
            surahEnd: "Al-Baqarah",
            ayatEnd: 75,
            progressAyat: "Ayat 1-5",
          },
      progresBulanIni: {
        ziyadahCount,
        murojaahCount,
        tahsinCount,
        yaumiyahDays: yaumiyahDaysCount,
        ziyadah: progresZiyadah,
        murojaah: progresMurojaah,
        tahsin: progresTahsin,
        yaumiyah: progresYaumiyah,
      },
    };
  }

  async getTeacherDashboard(
    teacherId: string,
    schoolId: string
  ): Promise<TeacherDashboardSummary> {
    const teacherRows = await this.db
      .select({ name: users.name, gender: users.gender })
      .from(users)
      .where(and(eq(users.id, teacherId), eq(users.schoolId, schoolId)))
      .limit(1);

    // Mapped classes
    const assignedClasses = await this.db
      .select({
        id: classes.id,
        name: classes.name,
      })
      .from(teacherClasses)
      .innerJoin(classes, eq(classes.id, teacherClasses.classId))
      .where(
        and(
          eq(teacherClasses.teacherId, teacherId),
          eq(teacherClasses.schoolId, schoolId)
        )
      );

    let teacherClassList = assignedClasses;
    if (teacherClassList.length === 0) {
      const fallbackClasses = await this.db
        .selectDistinct({
          id: classes.id,
          name: classes.name,
        })
        .from(studentTeacherMapping)
        .innerJoin(classes, eq(classes.id, studentTeacherMapping.classId))
        .where(
          and(
            eq(studentTeacherMapping.teacherId, teacherId),
            eq(studentTeacherMapping.schoolId, schoolId)
          )
        );
      teacherClassList = fallbackClasses;
    }

    const studentMappings = await this.db
      .select({
        studentId: studentTeacherMapping.studentId,
        studentName: users.name,
        classId: studentTeacherMapping.classId,
        className: classes.name,
      })
      .from(studentTeacherMapping)
      .innerJoin(users, eq(users.id, studentTeacherMapping.studentId))
      .leftJoin(classes, eq(classes.id, studentTeacherMapping.classId))
      .where(
        and(
          eq(studentTeacherMapping.teacherId, teacherId),
          eq(studentTeacherMapping.schoolId, schoolId)
        )
      );

    const totalStudents = studentMappings.length;
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);

    const todaySetoran = await this.db
      .select({
        studentId: setoranEntries.studentId,
        referenceStart: setoranEntries.referenceStart,
      })
      .from(setoranEntries)
      .where(
        and(
          eq(setoranEntries.teacherId, teacherId),
          eq(setoranEntries.schoolId, schoolId),
          eq(setoranEntries.date, today)
        )
      );

    let ziyadahCount = 0;
    let murojaahCount = 0;
    let tahsinCount = 0;

    for (const s of todaySetoran) {
      if (s.referenceStart && (s.referenceStart as any).surah) {
        ziyadahCount++;
      } else {
        tahsinCount++;
      }
    }

    const studentsWhoSetorToday = new Set(todaySetoran.map((s) => s.studentId));
    const uniqueSetorHariIni = studentsWhoSetorToday.size;
    const belumSetorCount = Math.max(0, totalStudents - uniqueSetorHariIni);

    const completedClassIds = new Set<string>();
    for (const sm of studentMappings) {
      if (sm.classId && studentsWhoSetorToday.has(sm.studentId)) {
        completedClassIds.add(sm.classId);
      }
    }

    const totalClassesToday = teacherClassList.length;
    const completedClassesToday = completedClassIds.size;

    // Monthly setoran entries for teacher's school and current month
    const monthlySetoran = await this.db
      .select({
        studentId: setoranEntries.studentId,
        date: setoranEntries.date,
        scores: setoranEntries.scores,
        keterangan: setoranEntries.keterangan,
      })
      .from(setoranEntries)
      .where(
        and(
          eq(setoranEntries.teacherId, teacherId),
          eq(setoranEntries.schoolId, schoolId),
          sql`to_char(${setoranEntries.date}, 'YYYY-MM') = ${currentMonth}`
        )
      );

    // Hitung total hari kerja (Senin-Jumat, Sabtu & Minggu libur) dalam bulan ini
    const [yearNum, monthNum] = currentMonth.split("-").map(Number);
    const dateCursor = new Date(yearNum, monthNum - 1, 1);
    let totalWorkingDays = 0;
    while (dateCursor.getMonth() === monthNum - 1) {
      const dayOfWeek = dateCursor.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingDays++;
      }
      dateCursor.setDate(dateCursor.getDate() + 1);
    }
    const safeWorkingDays = Math.max(1, totalWorkingDays);

    // Map studentId -> classId
    const studentToClassMap = new Map<string, string>();
    for (const sm of studentMappings) {
      if (sm.classId) {
        studentToClassMap.set(sm.studentId, sm.classId);
      }
    }

    // Map classId -> Set tanggal input
    const classInputDatesMap = new Map<string, Set<string>>();
    for (const s of monthlySetoran) {
      const cId = studentToClassMap.get(s.studentId);
      if (cId) {
        const dateSet = classInputDatesMap.get(cId) || new Set<string>();
        dateSet.add(s.date);
        classInputDatesMap.set(cId, dateSet);
      }
    }

    const badgeThemes = [
      { bg: "bg-brand-cyan/10", text: "text-brand-cyan-dark", progress: "bg-brand-cyan" },
      { bg: "bg-purple-50", text: "text-purple-600", progress: "bg-purple-600" },
      { bg: "bg-amber-50", text: "text-amber-600", progress: "bg-amber-500" },
      { bg: "bg-emerald-50", text: "text-emerald-600", progress: "bg-emerald-500" },
    ];

    const classProgress = teacherClassList.map((cls, idx) => {
      const inputDatesCount = classInputDatesMap.get(cls.id)?.size ?? 0;
      const percentage = Math.min(100, Math.round((inputDatesCount / safeWorkingDays) * 100));
      const theme = badgeThemes[idx % badgeThemes.length];
      const badge = cls.name.split(" ")[0] || cls.name.slice(0, 4);

      return {
        badge,
        badgeBg: theme.bg,
        badgeText: theme.text,
        name: cls.name,
        percentage,
        progressColor: theme.progress,
        targetLabel: `${inputDatesCount}/${safeWorkingDays} Hari Input`,
      };
    });

    // Perhitungan Siswa Perlu Perhatian:
    // 1. Paling banyak alpa (> 3 alpa dalam sebulan)
    // 2. Nilai paling rendah (Grade D / rata-rata skor < 68)
    const studentStatsMap = new Map<
      string,
      { alpaCount: number; scoresList: number[] }
    >();

    for (const s of monthlySetoran) {
      const stats = studentStatsMap.get(s.studentId) || {
        alpaCount: 0,
        scoresList: [],
      };

      if (s.keterangan && s.keterangan.includes("[Alpa]")) {
        stats.alpaCount++;
      }

      if (s.scores && typeof s.scores === "object") {
        const nums = Object.values(s.scores).filter(
          (v) => typeof v === "number"
        ) as number[];
        if (nums.length > 0) {
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
          stats.scoresList.push(avg);
        }
      }

      studentStatsMap.set(s.studentId, stats);
    }

    const attentionStudents: Array<{
      name: string;
      className: string;
      grade: string;
      severity: number;
    }> = [];

    for (const s of studentMappings) {
      const stats = studentStatsMap.get(s.studentId);
      const alpaCount = stats?.alpaCount ?? 0;
      const scores = stats?.scoresList ?? [];
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;

      const isHighAlpa = alpaCount > 3;
      const isGradeD = avgScore !== null && avgScore < 68;

      if (isHighAlpa || isGradeD) {
        let label = "";
        let severity = 0;

        if (isHighAlpa && isGradeD) {
          label = `${alpaCount}x Alpa • Grade D (${Math.round(avgScore!)})`;
          severity = 100 + alpaCount;
        } else if (isHighAlpa) {
          label = `${alpaCount}x Alpa`;
          severity = 50 + alpaCount;
        } else {
          label = `Grade D (${Math.round(avgScore!)})`;
          severity = 30 + (68 - avgScore!);
        }

        attentionStudents.push({
          name: s.studentName ?? "Siswa",
          className: s.className ?? "Kelas TTQ",
          grade: label,
          severity,
        });
      }
    }

    // Urutkan berdasarkan tingkat urgensi tertinggi
    attentionStudents.sort((a, b) => b.severity - a.severity);

    return {
      teacherName: teacherRows[0]?.name ?? "Guru",
      gender: teacherRows[0]?.gender ?? null,
      totalStudents,
      totalClassesToday,
      completedClassesToday,
      pendingClassesToday: Math.max(0, totalClassesToday - completedClassesToday),
      setorHariIniCount: uniqueSetorHariIni,
      belumSetorCount,
      className: teacherClassList[0]?.name ?? studentMappings[0]?.className ?? "-",
      konsistensiIbadahPercent: totalStudents > 0 ? Math.round((uniqueSetorHariIni / totalStudents) * 100) : 0,
      classProgress,
      attentionStudents: attentionStudents.slice(0, 5),
      todayBreakdown: {
        ziyadahCount,
        murojaahCount,
        tahsinCount,
        totalTarget: totalStudents,
      },
    };
  }

  async getParentDashboard(
    parentId: string,
    schoolId: string
  ): Promise<ParentDashboardSummary> {
    const parentRows = await this.db
      .select({ name: users.name })
      .from(users)
      .where(and(eq(users.id, parentId), eq(users.schoolId, schoolId)))
      .limit(1);

    const childMapping = await this.db
      .select({
        studentId: parentStudentMapping.studentId,
        studentName: users.name,
        className: classes.name,
      })
      .from(parentStudentMapping)
      .innerJoin(users, eq(users.id, parentStudentMapping.studentId))
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .where(
        and(
          eq(parentStudentMapping.parentId, parentId),
          eq(parentStudentMapping.schoolId, schoolId)
        )
      )
      .limit(1);

    const child = childMapping[0];
    const childId = child?.studentId;

    let gam: any = null;
    let isTodayFilled = false;
    let childZiyadah = 0;
    let childMurojaah = 0;
    let childTahsin = 0;
    let childYaumiyahDays = 0;

    if (childId) {
      const gRows = await this.db
        .select()
        .from(studentGamification)
        .where(
          and(
            eq(studentGamification.studentId, childId),
            eq(studentGamification.schoolId, schoolId)
          )
        )
        .limit(1);
      gam = gRows[0];

      const today = new Date().toISOString().slice(0, 10);
      const ibadahToday = await this.db
        .select()
        .from(dailyIbadah)
        .where(
          and(
            eq(dailyIbadah.studentId, childId),
            eq(dailyIbadah.schoolId, schoolId),
            eq(dailyIbadah.date, today)
          )
        )
        .limit(1);
      isTodayFilled = !!ibadahToday[0];

      const activeMonth = new Date().toISOString().slice(0, 7);

      const childSetoran = await this.db
        .select({
          id: setoranEntries.id,
          subcatCode: assessmentSubcategories.code,
          referenceStart: setoranEntries.referenceStart,
        })
        .from(setoranEntries)
        .leftJoin(
          assessmentSubcategories,
          eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
        )
        .where(
          and(
            eq(setoranEntries.studentId, childId),
            eq(setoranEntries.schoolId, schoolId),
            sql`to_char(${setoranEntries.date}, 'YYYY-MM') = ${activeMonth}`
          )
        );

      for (const s of childSetoran) {
        const subCode = (s.subcatCode || "").toUpperCase();
        if (subCode.includes("MUROJAAH")) {
          childMurojaah++;
        } else if (subCode.includes("ZIYADAH") || (s.referenceStart && (s.referenceStart as any).surah)) {
          childZiyadah++;
        } else {
          childTahsin++;
        }
      }

      const childIbadah = await this.db
        .select()
        .from(dailyIbadah)
        .where(
          and(
            eq(dailyIbadah.studentId, childId),
            eq(dailyIbadah.schoolId, schoolId),
            sql`to_char(${dailyIbadah.date}, 'YYYY-MM') = ${activeMonth}`
          )
        );
      childYaumiyahDays = childIbadah.length;

      // Ambil entri setoran terbaru ananda untuk ditampilkan di dashboard orang tua
      let lastSetoranInfo: ParentDashboardSummary["lastSetoran"] = null;
      const [latestEntry] = await this.db
        .select({
          date: setoranEntries.date,
          referenceStart: setoranEntries.referenceStart,
          referenceEnd: setoranEntries.referenceEnd,
          scores: setoranEntries.scores,
          keterangan: setoranEntries.keterangan,
          subcatCode: assessmentSubcategories.code,
          subcatName: assessmentSubcategories.name,
        })
        .from(setoranEntries)
        .leftJoin(
          assessmentSubcategories,
          eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
        )
        .where(
          and(
            eq(setoranEntries.studentId, childId),
            eq(setoranEntries.schoolId, schoolId)
          )
        )
        .orderBy(desc(setoranEntries.date), desc(setoranEntries.createdAt))
        .limit(1);

      if (latestEntry) {
        let reference = "Setoran";
        const refStart = latestEntry.referenceStart as any;
        const refEnd = latestEntry.referenceEnd as any;
        if (refStart?.surah) {
          reference = `${refStart.surah}: ${refStart.ayat ?? 1}${refEnd?.ayat && refEnd.ayat !== refStart.ayat ? `-${refEnd.ayat}` : ""}`;
        } else if (refStart?.jilid || refStart?.halaman) {
          reference = `Jilid ${refStart.jilid ?? "-"} Hal ${refStart.halaman ?? 1}`;
        }

        const scoresObj = (latestEntry.scores as Record<string, number>) || {};
        const scoreVals = Object.values(scoresObj).filter((v) => typeof v === "number");
        const scoreAvg = scoreVals.length > 0 ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : 0;

        const codeLower = (latestEntry.subcatCode || "").toLowerCase();
        const tab: "ziyadah" | "murojaah" | "tahsin" = codeLower.includes("murojaah")
          ? "murojaah"
          : codeLower.includes("tahsin") || codeLower.includes("sabiq") || codeLower.includes("talaqi")
          ? "tahsin"
          : "ziyadah";

        lastSetoranInfo = {
          tab,
          categoryName: latestEntry.subcatName ?? "Setoran TTQ",
          reference,
          date: latestEntry.date,
          scoreAvg,
          keterangan: latestEntry.keterangan ?? undefined,
        };
      }

      // Hitung dinamis total hari kalender di bulan aktif (28, 29, 30, atau 31 hari)
      const [yearNumParent, monthNumParent] = activeMonth.split("-").map(Number);
      const daysInCurrentMonthParent = new Date(yearNumParent, monthNumParent, 0).getDate();

      const TARGET_ZIYADAH = 20;
      const TARGET_TAHSIN = 20;
      const TARGET_MUROJAAH = 20;
      const TARGET_YAUMIYAH = daysInCurrentMonthParent;

      const progresZiyadah = {
        count: childZiyadah,
        target: TARGET_ZIYADAH,
        percentage: Math.min(100, Math.round((childZiyadah / TARGET_ZIYADAH) * 100)),
        caption: `Target ${TARGET_ZIYADAH} halaman`,
      };

      const progresTahsin = {
        count: childTahsin,
        target: TARGET_TAHSIN,
        percentage: Math.min(100, Math.round((childTahsin / TARGET_TAHSIN) * 100)),
        caption: `Target ${TARGET_TAHSIN} pertemuan`,
      };

      const progresMurojaah = {
        count: childMurojaah,
        target: TARGET_MUROJAAH,
        percentage: Math.min(100, Math.round((childMurojaah / TARGET_MUROJAAH) * 100)),
        caption: `${childMurojaah} sesi hafalan terjaga`,
      };

      const progresYaumiyah = {
        count: childYaumiyahDays,
        target: TARGET_YAUMIYAH,
        percentage: Math.min(100, Math.round((childYaumiyahDays / TARGET_YAUMIYAH) * 100)),
        caption: `${childYaumiyahDays} dari ${TARGET_YAUMIYAH} hari`,
      };

      return {
        parentName: parentRows[0]?.name ?? "Orang Tua",
        childId: childId ?? undefined,
        childName: child?.studentName ?? "Ananda",
        childClassName: child?.className ?? "Kelas VII",
        childLevel: gam?.level ?? 1,
        childStreak: gam?.currentStreak ?? 0,
        lastSetoran: lastSetoranInfo,
        progres: {
          ziyadahCount: childZiyadah,
          murojaahCount: childMurojaah,
          tahsinCount: childTahsin,
          yaumiyahDays: childYaumiyahDays,
          ziyadah: progresZiyadah,
          murojaah: progresMurojaah,
          tahsin: progresTahsin,
          yaumiyah: progresYaumiyah,
        },
        isYaumiyahTodayFilled: isTodayFilled,
      };
    }

    const [yearNumEmpty, monthNumEmpty] = new Date().toISOString().slice(0, 7).split("-").map(Number);
    const daysInEmptyMonth = new Date(yearNumEmpty, monthNumEmpty, 0).getDate();

    return {
      parentName: parentRows[0]?.name ?? "Orang Tua",
      childId: childId ?? undefined,
      childName: child?.studentName ?? "Ananda",
      childClassName: child?.className ?? "Kelas VII",
      childLevel: gam?.level ?? 1,
      childStreak: gam?.currentStreak ?? 0,
      lastSetoran: null,
      progres: {
        ziyadahCount: childZiyadah,
        murojaahCount: childMurojaah,
        tahsinCount: childTahsin,
        yaumiyahDays: childYaumiyahDays,
        ziyadah: { count: 0, target: 20, percentage: 0, caption: "Target 20 halaman" },
        murojaah: { count: 0, target: 20, percentage: 0, caption: "0 sesi hafalan terjaga" },
        tahsin: { count: 0, target: 20, percentage: 0, caption: "Target 20 pertemuan" },
        yaumiyah: { count: 0, target: daysInEmptyMonth, percentage: 0, caption: `0 dari ${daysInEmptyMonth} hari` },
      },
      isYaumiyahTodayFilled: isTodayFilled,
    };
  }

  async getKoordinatorDashboard(schoolId: string): Promise<KoordinatorDashboardSummary> {
    const studentCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "student")));

    const teacherCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")));

    const classCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.schoolId, schoolId));

    const totalStudents = Number(studentCount[0]?.count ?? 0);
    const totalTeachers = Number(teacherCount[0]?.count ?? 0);
    const totalClasses = Number(classCount[0]?.count ?? 0);

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const weekRows = await this.db
      .select({
        date: setoranEntries.date,
        subcategoryId: setoranEntries.subcategoryId,
      })
      .from(setoranEntries)
      .where(
        and(
          eq(setoranEntries.schoolId, schoolId),
          sql`${setoranEntries.date} >= ${weekAgo.toISOString().slice(0, 10)}`,
          sql`${setoranEntries.date} <= ${today.toISOString().slice(0, 10)}`
        )
      );

    const subMeta = await this.db
      .select({
        id: assessmentSubcategories.id,
        code: assessmentSubcategories.code,
        name: assessmentSubcategories.name,
      })
      .from(assessmentSubcategories)
      .where(eq(assessmentSubcategories.schoolId, schoolId));

    const subMap = new Map(subMeta.map((s) => [s.id, `${s.code} ${s.name}`.toLowerCase()]));

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const chartData: Array<{ day: string; Ziyadah: number; Murojaah: number; Tahsin: number }> = [];
    const dateKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dateKeys.push(key);
      chartData.push({ day: dayNames[d.getDay()], Ziyadah: 0, Murojaah: 0, Tahsin: 0 });
    }

    let setoranMingguIniCount = 0;
    for (const row of weekRows) {
      const idx = dateKeys.indexOf(row.date as string);
      if (idx < 0) continue;
      setoranMingguIniCount++;
      const meta = (subMap.get(row.subcategoryId) ?? "").toLowerCase();
      if (meta.includes("ziyadah")) chartData[idx].Ziyadah++;
      else if (meta.includes("muroja")) chartData[idx].Murojaah++;
      else chartData[idx].Tahsin++;
    }

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      setoranMingguIniCount,
      chartData,
    };
  }
}
