import { describe, it, expect } from "vitest";
import { GetStudentsUseCase } from "../modules/students/application/use-cases/GetStudentsUseCase";
import { GetStudentByIdUseCase } from "../modules/students/application/use-cases/GetStudentByIdUseCase";
import { GetTeachersUseCase } from "../modules/teachers/application/use-cases/GetTeachersUseCase";
import type { IStudentRepository } from "../modules/students/domain/repositories/IStudentRepository";
import type { ITeacherRepository } from "../modules/teachers/domain/repositories/ITeacherRepository";
import type { StudentListItem } from "../modules/students/domain/entities/Student";
import type { TeacherListItem } from "../modules/teachers/domain/entities/Teacher";

describe("Students & Teachers UseCases", () => {
  const mockStudents: StudentListItem[] = [
    {
      id: "student-1",
      name: "Siswa Satu",
      email: "siswa1@demo.sch.id",
      phone: null,
      className: "VII Abu Bakar",
      classId: "class-1",
      teacherName: null,
      teacherId: "teacher-1",
      level: 2,
      totalExp: 250,
      currentStreak: 5,
    },
    {
      id: "student-2",
      name: "Siswa Dua",
      email: "siswa2@demo.sch.id",
      phone: null,
      className: "VII Umar",
      classId: "class-2",
      teacherName: null,
      teacherId: "teacher-2",
      level: 1,
      totalExp: 80,
      currentStreak: 2,
    },
  ];

  const studentRepo: IStudentRepository = {
    findBySchool: async () => mockStudents,
    findByTeacher: async (teacherId) =>
      mockStudents.filter((s) => s.teacherId === teacherId),
    findById: async (id) => mockStudents.find((s) => s.id === id) ?? null,
  };

  const mockTeachers: TeacherListItem[] = [
    {
      id: "teacher-1",
      name: "Ustadz Arai",
      email: "arai@demo.sch.id",
      phone: "08123",
      classes: [{ id: "class-1", name: "VII Abu Bakar" }],
      studentCount: 15,
    },
  ];

  const teacherRepo: ITeacherRepository = {
    findBySchool: async () => mockTeachers,
    findById: async (id) => mockTeachers.find((t) => t.id === id) ?? null,
  };

  it("GetStudentsUseCase filters by teacher if caller is teacher", async () => {
    const useCase = new GetStudentsUseCase(studentRepo);
    const result = await useCase.execute({
      schoolId: "school-1",
      role: "teacher",
      userId: "teacher-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("student-1");
  });

  it("GetStudentsUseCase returns all students for koordinator", async () => {
    const useCase = new GetStudentsUseCase(studentRepo);
    const result = await useCase.execute({
      schoolId: "school-1",
      role: "koordinator_ttq",
      userId: "koor-1",
    });

    expect(result).toHaveLength(2);
  });

  it("GetStudentByIdUseCase returns student detail", async () => {
    const useCase = new GetStudentByIdUseCase(studentRepo);
    const result = await useCase.execute("student-1", "school-1");

    expect(result.name).toBe("Siswa Satu");
    expect(result.level).toBe(2);
  });

  it("GetStudentByIdUseCase throws on not found", async () => {
    const useCase = new GetStudentByIdUseCase(studentRepo);
    await expect(useCase.execute("nonexistent", "school-1")).rejects.toThrow();
  });

  it("GetTeachersUseCase returns teacher list", async () => {
    const useCase = new GetTeachersUseCase(teacherRepo);
    const result = await useCase.execute("school-1");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ustadz Arai");
    expect(result[0].classes[0].name).toBe("VII Abu Bakar");
  });
});
