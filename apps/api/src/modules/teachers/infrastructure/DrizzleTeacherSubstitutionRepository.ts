import type { Db } from "../../../db/client";
import { teacherSubstitutions } from "../../../db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import type {
  ITeacherSubstitutionRepository,
  TeacherSubstitutionEntity,
} from "../domain/repositories/ITeacherSubstitutionRepository";

export class DrizzleTeacherSubstitutionRepository
  implements ITeacherSubstitutionRepository
{
  constructor(private readonly db: Db) {}

  async create(
    entity: TeacherSubstitutionEntity
  ): Promise<TeacherSubstitutionEntity> {
    const rows = await this.db
      .insert(teacherSubstitutions)
      .values({
        id: entity.id,
        schoolId: entity.schoolId,
        absentTeacherId: entity.absentTeacherId,
        substituteTeacherId: entity.substituteTeacherId,
        classId: entity.classId,
        dateStart: entity.dateStart,
        dateEnd: entity.dateEnd,
        reason: entity.reason ?? null,
      })
      .returning();

    return this.toDomain(rows[0]);
  }

  async findActiveSubstitutionsByTeacher(
    teacherId: string,
    schoolId: string,
    date: Date = new Date()
  ): Promise<TeacherSubstitutionEntity[]> {
    const rows = await this.db
      .select()
      .from(teacherSubstitutions)
      .where(
        and(
          eq(teacherSubstitutions.schoolId, schoolId),
          eq(teacherSubstitutions.substituteTeacherId, teacherId),
          lte(teacherSubstitutions.dateStart, date),
          gte(teacherSubstitutions.dateEnd, date)
        )
      );

    return rows.map((r) => this.toDomain(r));
  }

  async findBySchool(schoolId: string): Promise<TeacherSubstitutionEntity[]> {
    const rows = await this.db
      .select()
      .from(teacherSubstitutions)
      .where(eq(teacherSubstitutions.schoolId, schoolId));

    return rows.map((r) => this.toDomain(r));
  }

  async delete(id: string, schoolId: string): Promise<void> {
    await this.db
      .delete(teacherSubstitutions)
      .where(
        and(
          eq(teacherSubstitutions.id, id),
          eq(teacherSubstitutions.schoolId, schoolId)
        )
      );
  }

  private toDomain(
    row: typeof teacherSubstitutions.$inferSelect
  ): TeacherSubstitutionEntity {
    return {
      id: row.id,
      schoolId: row.schoolId,
      absentTeacherId: row.absentTeacherId,
      substituteTeacherId: row.substituteTeacherId,
      classId: row.classId,
      dateStart: row.dateStart,
      dateEnd: row.dateEnd,
      reason: row.reason,
      createdAt: row.createdAt,
    };
  }
}
