import type { Db } from "../../../db/client";
import {
  users,
  classes,
  academicPeriods,
  schools,
  studentClassEnrollment,
  teacherClasses,
  munaqosahPeriods,
} from "../../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type {
  ISchoolAdminRepository,
  CreateSchoolUserParams,
  SchoolClassItem,
  AcademicPeriodItem,
  MunaqosahPeriodItem,
} from "../domain/repositories/ISchoolAdminRepository";

export class DrizzleSchoolAdminRepository implements ISchoolAdminRepository {
  constructor(private readonly db: Db) {}

  async emailExists(email: string, schoolId: string, excludeUserId?: string): Promise<boolean> {
    const conditions = [
      sql`lower(${users.email}) = ${email.trim().toLowerCase()}`,
      eq(users.schoolId, schoolId),
    ];
    if (excludeUserId) {
      conditions.push(sql`${users.id} != ${excludeUserId}`);
    }
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  }

  async createUser(data: CreateSchoolUserParams): Promise<{ id: string }> {
    const rows = await this.db
      .insert(users)
      .values({
        schoolId: data.schoolId,
        role: data.role as any,
        name: data.name,
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        phone: data.phone ?? null,
        username: data.username ?? null,
        gender: data.gender ?? null,
      })
      .returning({ id: users.id });
    if (!rows[0]) throw new Error("Gagal membuat user");
    return { id: rows[0].id };
  }

  async updateUser(
    id: string,
    schoolId: string,
    data: { name?: string; email?: string; phone?: string | null }
  ): Promise<void> {
    await this.db
      .update(users)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      })
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)));
  }

  async deleteUser(id: string, schoolId: string): Promise<void> {
    await this.db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)));
  }

  async getClasses(schoolId: string): Promise<SchoolClassItem[]> {
    const rows = await this.db
      .select({ id: classes.id, name: classes.name, jenjangLevel: classes.jenjangLevel })
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(classes.name);
    return rows.map((r) => ({ id: r.id, name: r.name, jenjangLevel: r.jenjangLevel }));
  }

  async getActivePeriod(schoolId: string): Promise<AcademicPeriodItem | null> {
    const schoolRows = await this.db
      .select({ activeAcademicPeriodId: schools.activeAcademicPeriodId })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);

    const activeId = schoolRows[0]?.activeAcademicPeriodId;
    if (activeId) {
      const rows = await this.db
        .select()
        .from(academicPeriods)
        .where(and(eq(academicPeriods.id, activeId), eq(academicPeriods.schoolId, schoolId)))
        .limit(1);
      if (rows[0]) {
        return {
          id: rows[0].id,
          tahunAjaran: rows[0].tahunAjaran,
          semester: rows[0].semester,
          isLocked: rows[0].isLocked,
        };
      }
    }

    const fallback = await this.db
      .select()
      .from(academicPeriods)
      .where(eq(academicPeriods.schoolId, schoolId))
      .orderBy(academicPeriods.createdAt)
      .limit(1);
    if (!fallback[0]) return null;
    return {
      id: fallback[0].id,
      tahunAjaran: fallback[0].tahunAjaran,
      semester: fallback[0].semester,
      isLocked: fallback[0].isLocked,
    };
  }

  async getMunaqosahPeriods(schoolId: string): Promise<MunaqosahPeriodItem[]> {
    const rows = await this.db
      .select()
      .from(munaqosahPeriods)
      .where(eq(munaqosahPeriods.schoolId, schoolId))
      .orderBy(munaqosahPeriods.tanggalMulai);
    return rows.map((r) => ({
      id: r.id,
      nama: r.nama,
      tanggalMulai: r.tanggalMulai,
      tanggalSelesai: r.tanggalSelesai,
      status: r.status,
    }));
  }

  async enrollStudent(
    studentId: string,
    classId: string,
    schoolId: string,
    academicPeriodId: string
  ): Promise<void> {
    const existing = await this.db
      .select({ id: studentClassEnrollment.id })
      .from(studentClassEnrollment)
      .where(
        and(
          eq(studentClassEnrollment.studentId, studentId),
          eq(studentClassEnrollment.classId, classId),
          eq(studentClassEnrollment.academicPeriodId, academicPeriodId),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .limit(1);
    if (existing.length > 0) return;
    await this.db.insert(studentClassEnrollment).values({
      studentId,
      classId,
      schoolId,
      academicPeriodId,
    });
  }

  async assignTeacherClass(teacherId: string, classId: string, schoolId: string): Promise<void> {
    const existing = await this.db
      .select({ id: teacherClasses.id })
      .from(teacherClasses)
      .where(
        and(
          eq(teacherClasses.teacherId, teacherId),
          eq(teacherClasses.classId, classId),
          eq(teacherClasses.schoolId, schoolId)
        )
      )
      .limit(1);
    if (existing.length > 0) return;
    await this.db.insert(teacherClasses).values({
      teacherId,
      classId,
      schoolId,
    });
  }
}
