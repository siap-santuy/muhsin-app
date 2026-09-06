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
      if (refStart.ayat && refEnd?.ayat) {
        label = `${name} ${refStart.surah}: ${refStart.ayat} - ${refEnd.ayat}`;
      } else if (refStart.ayat) {
        label = `${name} ${refStart.surah}: ${refStart.ayat}`;
      } else {
        label = `${name} ${refStart.surah}`;
      }
    } else if (refStart?.jilid || refStart?.halaman) {
      label = `${name} Jilid: ${refStart.jilid ?? 1}${refStart.halaman ? ` Hal: ${refStart.halaman}` : ""}`;
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

    return {
      label,
      date: dateFormatted,
      grade,
      subcategoryCode: entry.subcategoryCode,
      setoranId: entry.id,
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

      const categorySetoranStatus = {
        ziyadah: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("ziyadah") || s.subcategoryName?.toLowerCase().includes("ziyadah")
        ),
        murojaah: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("murojaah") || s.subcategoryName?.toLowerCase().includes("muroja")
        ),
        sabiq: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("sabiq") || s.subcategoryName?.toLowerCase().includes("sabiq")
        ),
        talaqi: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("talaqi") || s.subcategoryName?.toLowerCase().includes("talaqi")
        ),
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

      const categorySetoranStatus = {
        ziyadah: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("ziyadah") || s.subcategoryName?.toLowerCase().includes("ziyadah")
        ),
        murojaah: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("murojaah") || s.subcategoryName?.toLowerCase().includes("muroja")
        ),
        sabiq: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("sabiq") || s.subcategoryName?.toLowerCase().includes("sabiq")
        ),
        talaqi: studentSetorans.some(
          (s) => s.subcategoryCode?.includes("talaqi") || s.subcategoryName?.toLowerCase().includes("talaqi")
        ),
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
