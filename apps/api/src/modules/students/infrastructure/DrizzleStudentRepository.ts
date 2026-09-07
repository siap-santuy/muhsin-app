import type { Db } from "../../../db/client";
import {
  users,
  classes,
  studentClassEnrollment,
  studentTeacherMapping,
  studentGamification,
  setoranEntries,
  assessmentSubcategories,
} from "../../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { IStudentRepository } from "../domain/repositories/IStudentRepository";
import type { StudentListItem } from "../domain/entities/Student";

export class DrizzleStudentRepository implements IStudentRepository {
  constructor(private readonly db: Db) {}

  private formatLastActivity(entry: any) {
    if (!entry) return null;
    const refStart = entry.referenceStart as any;
    const refEnd = entry.referenceEnd as any;
    const name = entry.subcategoryName || "Setoran";

    let label = name;
    if (refStart?.surah) {
      const sStart = refStart.surah;
      const sEnd = refEnd?.surah;
      const aStart = refStart.ayat;
      const aEnd = refEnd?.ayat;

      if (sEnd && sStart !== sEnd) {
        // Lintas surah
        label = `${name} ${sStart}:${aStart ?? 1} s/d ${sEnd}:${aEnd ?? 1}`;
      } else if (aStart && aEnd && aStart !== aEnd) {
        // Surah sama, rentang ayat berbeda
        label = `${name} ${sStart}: ${aStart} - ${aEnd}`;
      } else if (aStart) {
        label = `${name} ${sStart}: ${aStart}`;
      } else {
        label = `${name} ${sStart}`;
      }
    } else if (refStart?.jilid || refStart?.halaman) {
      const jStart = refStart.jilid;
      const jEnd = refEnd?.jilid;
      const hStart = refStart.halaman;
      const hEnd = refEnd?.halaman;

      if (jEnd && jStart !== jEnd) {
        label = `${name} Jilid ${jStart} Hal ${hStart ?? 1} s/d Jilid ${jEnd} Hal ${hEnd ?? 1}`;
      } else if (hStart && hEnd && hStart !== hEnd) {
        label = `${name} Jilid ${jStart ?? 1} Hal: ${hStart} - ${hEnd}`;
      } else {
        label = `${name} Jilid: ${jStart ?? 1}${hStart ? ` Hal: ${hStart}` : ""}`;
      }
    }

    let grade = "A";
    if (entry.scores && typeof entry.scores === "object") {
      const scoresArr = Object.values(entry.scores).filter((v) => typeof v === "number") as number[];
      if (scoresArr.length > 0) {
        const avg = scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length;
        if (avg >= 88) grade = "A";
        else if (avg >= 78) grade = "B";
        else if (avg >= 68) grade = "C";
        else grade = "D";
      }
    }

    let dateFormatted = entry.date;
    if (dateFormatted && dateFormatted.includes("-")) {
      const [y, m, d] = dateFormatted.split("-");
      dateFormatted = `${d}/${m}/${y}`;
    }

    let attendanceStatus = "Hadir";
    if (entry.keterangan && typeof entry.keterangan === "string") {
      const match = entry.keterangan.match(/^\[(.*?)\]/);
      if (match && match[1]) {
        attendanceStatus = match[1];
      }
    }

    return {
      label,
      date: dateFormatted,
      grade,
      subcategoryCode: entry.subcategoryCode,
      setoranId: entry.id,
      attendanceStatus,
    };
  }

  async findBySchool(
    schoolId: string,
    options?: { date?: string; classId?: string }
  ): Promise<StudentListItem[]> {
    const conditions = [
      eq(users.schoolId, schoolId),
      eq(users.role, "student"),
    ];

    if (options?.classId) {
      conditions.push(eq(studentClassEnrollment.classId, options.classId));
    }

    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        className: classes.name,
        classId: classes.id,
        level: studentGamification.level,
        totalExp: studentGamification.totalExp,
        currentStreak: studentGamification.currentStreak,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .leftJoin(
        studentGamification,
        and(
          eq(studentGamification.studentId, users.id),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .where(and(...conditions));

    if (rows.length === 0) return [];

    const studentIds = rows.map((r) => r.id);
    const targetDate = options?.date ?? new Date().toISOString().slice(0, 10);

    const dateSetoranRows = await this.db
      .select({
        id: setoranEntries.id,
        studentId: setoranEntries.studentId,
        date: setoranEntries.date,
        subcategoryId: setoranEntries.subcategoryId,
        subcategoryName: assessmentSubcategories.name,
        subcategoryCode: assessmentSubcategories.code,
        referenceStart: setoranEntries.referenceStart,
        referenceEnd: setoranEntries.referenceEnd,
        scores: setoranEntries.scores,
        keterangan: setoranEntries.keterangan,
      })
      .from(setoranEntries)
      .leftJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .where(
        and(
          eq(setoranEntries.schoolId, schoolId),
          eq(setoranEntries.date, targetDate),
          inArray(setoranEntries.studentId, studentIds)
        )
      )
      .orderBy(desc(setoranEntries.createdAt));

    const dateSetoranMap = new Map<string, any[]>();
    for (const s of dateSetoranRows) {
      const arr = dateSetoranMap.get(s.studentId) || [];
      arr.push(s);
      dateSetoranMap.set(s.studentId, arr);
    }

    return rows.map((r) => {
      const studentSetorans = dateSetoranMap.get(r.id) || [];
      const latestSetoran = studentSetorans[0] || null;

      const ziyadahSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("ziyadah") || s.subcategoryName?.toLowerCase().includes("ziyadah")
      );
      const murojaahSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("murojaah") || s.subcategoryName?.toLowerCase().includes("muroja")
      );
      const sabiqSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("sabiq") || s.subcategoryName?.toLowerCase().includes("sabiq")
      );
      const talaqiSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("talaqi") || s.subcategoryName?.toLowerCase().includes("talaqi")
      );

      const categorySetoranStatus = {
        ziyadah: !!ziyadahSetoran,
        murojaah: !!murojaahSetoran,
        sabiq: !!sabiqSetoran,
        talaqi: !!talaqiSetoran,
      };

      const categoryLastActivity = {
        ziyadah: this.formatLastActivity(ziyadahSetoran),
        murojaah: this.formatLastActivity(murojaahSetoran),
        sabiq: this.formatLastActivity(sabiqSetoran),
        talaqi: this.formatLastActivity(talaqiSetoran),
      };

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        className: r.className ?? null,
        classId: r.classId ?? null,
        teacherName: null,
        teacherId: null,
        level: r.level ?? 1,
        totalExp: r.totalExp ?? 0,
        currentStreak: r.currentStreak ?? 0,
        hasSetoranOnDate: studentSetorans.length > 0,
        categorySetoranStatus,
        categoryLastActivity,
        lastActivity: this.formatLastActivity(latestSetoran),
      };
    });
  }

  async findByTeacher(
    teacherId: string,
    schoolId: string,
    options?: { date?: string; classId?: string }
  ): Promise<StudentListItem[]> {
    const conditions = [
      eq(studentTeacherMapping.teacherId, teacherId),
      eq(studentTeacherMapping.schoolId, schoolId),
    ];

    if (options?.classId) {
      conditions.push(eq(studentTeacherMapping.classId, options.classId));
    }

    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        className: classes.name,
        classId: classes.id,
        level: studentGamification.level,
        totalExp: studentGamification.totalExp,
        currentStreak: studentGamification.currentStreak,
      })
      .from(studentTeacherMapping)
      .innerJoin(users, eq(users.id, studentTeacherMapping.studentId))
      .leftJoin(classes, eq(classes.id, studentTeacherMapping.classId))
      .leftJoin(
        studentGamification,
        and(
          eq(studentGamification.studentId, users.id),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .where(and(...conditions));

    if (rows.length === 0) return [];

    const studentIds = rows.map((r) => r.id);
    const targetDate = options?.date ?? new Date().toISOString().slice(0, 10);

    const dateSetoranRows = await this.db
      .select({
        id: setoranEntries.id,
        studentId: setoranEntries.studentId,
        date: setoranEntries.date,
        subcategoryId: setoranEntries.subcategoryId,
        subcategoryName: assessmentSubcategories.name,
        subcategoryCode: assessmentSubcategories.code,
        referenceStart: setoranEntries.referenceStart,
        referenceEnd: setoranEntries.referenceEnd,
        scores: setoranEntries.scores,
        keterangan: setoranEntries.keterangan,
      })
      .from(setoranEntries)
      .leftJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .where(
        and(
          eq(setoranEntries.schoolId, schoolId),
          eq(setoranEntries.date, targetDate),
          inArray(setoranEntries.studentId, studentIds)
        )
      )
      .orderBy(desc(setoranEntries.createdAt));

    const dateSetoranMap = new Map<string, any[]>();
    for (const s of dateSetoranRows) {
      const arr = dateSetoranMap.get(s.studentId) || [];
      arr.push(s);
      dateSetoranMap.set(s.studentId, arr);
    }

    return rows.map((r) => {
      const studentSetorans = dateSetoranMap.get(r.id) || [];
      const latestSetoran = studentSetorans[0] || null;

      const ziyadahSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("ziyadah") || s.subcategoryName?.toLowerCase().includes("ziyadah")
      );
      const murojaahSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("murojaah") || s.subcategoryName?.toLowerCase().includes("muroja")
      );
      const sabiqSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("sabiq") || s.subcategoryName?.toLowerCase().includes("sabiq")
      );
      const talaqiSetoran = studentSetorans.find(
        (s) => s.subcategoryCode?.includes("talaqi") || s.subcategoryName?.toLowerCase().includes("talaqi")
      );

      const categorySetoranStatus = {
        ziyadah: !!ziyadahSetoran,
        murojaah: !!murojaahSetoran,
        sabiq: !!sabiqSetoran,
        talaqi: !!talaqiSetoran,
      };

      const categoryLastActivity = {
        ziyadah: this.formatLastActivity(ziyadahSetoran),
        murojaah: this.formatLastActivity(murojaahSetoran),
        sabiq: this.formatLastActivity(sabiqSetoran),
        talaqi: this.formatLastActivity(talaqiSetoran),
      };

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        className: r.className ?? null,
        classId: r.classId ?? null,
        teacherName: null,
        teacherId,
        level: r.level ?? 1,
        totalExp: r.totalExp ?? 0,
        currentStreak: r.currentStreak ?? 0,
        hasSetoranOnDate: studentSetorans.length > 0,
        categorySetoranStatus,
        categoryLastActivity,
        lastActivity: this.formatLastActivity(latestSetoran),
      };
    });
  }

  async findById(id: string, schoolId: string): Promise<StudentListItem | null> {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        className: classes.name,
        classId: classes.id,
        level: studentGamification.level,
        totalExp: studentGamification.totalExp,
        currentStreak: studentGamification.currentStreak,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .leftJoin(
        studentGamification,
        and(
          eq(studentGamification.studentId, users.id),
          eq(studentGamification.schoolId, schoolId)
        )
      )
      .where(
        and(
          eq(users.id, id),
          eq(users.schoolId, schoolId),
          eq(users.role, "student")
        )
      )
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    const recentSetoran = await this.db
      .select({
        id: setoranEntries.id,
        studentId: setoranEntries.studentId,
        date: setoranEntries.date,
        subcategoryId: setoranEntries.subcategoryId,
        subcategoryName: assessmentSubcategories.name,
        subcategoryCode: assessmentSubcategories.code,
        referenceStart: setoranEntries.referenceStart,
        referenceEnd: setoranEntries.referenceEnd,
        scores: setoranEntries.scores,
        keterangan: setoranEntries.keterangan,
      })
      .from(setoranEntries)
      .leftJoin(
        assessmentSubcategories,
        eq(assessmentSubcategories.id, setoranEntries.subcategoryId)
      )
      .where(
        and(
          eq(setoranEntries.schoolId, schoolId),
          eq(setoranEntries.studentId, id)
        )
      )
      .orderBy(desc(setoranEntries.date), desc(setoranEntries.createdAt))
      .limit(1);

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      className: r.className ?? null,
      classId: r.classId ?? null,
      teacherName: null,
      teacherId: null,
      level: r.level ?? 1,
      totalExp: r.totalExp ?? 0,
      currentStreak: r.currentStreak ?? 0,
      hasSetoranOnDate: false,
      lastActivity: this.formatLastActivity(recentSetoran[0]),
    };
  }
}
