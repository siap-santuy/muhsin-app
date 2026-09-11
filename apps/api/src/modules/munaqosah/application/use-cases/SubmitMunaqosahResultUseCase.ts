import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";
import type { AddExpUseCase } from "../../../gamification/application/use-cases/AddExpUseCase";

export class AssignmentForbiddenError extends Error {
  readonly code = "ASSIGNMENT_FORBIDDEN";
  constructor() {
    super("Hanya penguji yang ditugaskan yang boleh mengisi hasil ujian ini");
  }
}

export class SubmitMunaqosahResultUseCase {
  constructor(
    private readonly repo: IMunaqosahRepository,
    private readonly addExpUseCase: AddExpUseCase
  ) {}

  async execute(params: {
    assignmentId: string;
    scores: Record<string, number>;
    hasil: "lulus" | "tidak_lulus";
    catatanPenguji?: string;
    actorUserId?: string;
    actorRole?: string;
    schoolId?: string;
  }) {
    if (params.actorRole === "teacher" && params.actorUserId && params.schoolId) {
      const owner = await this.repo.getAssignmentOwner(params.assignmentId, params.schoolId);
      if (!owner) {
        throw new AssignmentForbiddenError();
      }
      if (owner.examinerTeacherId !== params.actorUserId) {
        throw new AssignmentForbiddenError();
      }
    }

    const info = await this.repo.submitResult(params);

    if (params.hasil === "lulus") {
      await this.repo.grantAchievement({
        schoolId: info.schoolId,
        studentId: info.studentId,
        juzKe: info.juzKe,
        sourceId: params.assignmentId,
      });

      await this.addExpUseCase.execute({
        schoolId: info.schoolId,
        studentId: info.studentId,
        sourceType: "munaqosah",
        sourceId: params.assignmentId,
        expAmount: 100,
        description: `Lulus Munaqosah Ujian Juz ${info.juzKe}`,
      });
    }
  }
}
