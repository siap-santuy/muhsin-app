import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";
import type { AddExpUseCase } from "../../../gamification/application/use-cases/AddExpUseCase";

export class AssignmentForbiddenError extends Error {
  readonly code = "ASSIGNMENT_FORBIDDEN";
  constructor() {
    super("Hanya penguji yang ditugaskan yang boleh mengisi hasil ujian ini");
  }
}

export function scoreToMunaqosahGrade(score: number): { grade: string; arabic: string } {
  if (score >= 90) return { grade: "A", arabic: "ممتاز" };
  if (score >= 80) return { grade: "B", arabic: "جيد جدا" };
  if (score >= 70) return { grade: "C", arabic: "جيد" };
  if (score > 0) return { grade: "D", arabic: "مقبول" };
  return { grade: "-", arabic: "-" };
}

export class SubmitMunaqosahResultUseCase {
  constructor(
    private readonly repo: IMunaqosahRepository,
    private readonly addExpUseCase: AddExpUseCase
  ) {}

  async execute(params: {
    assignmentId: string;
    scores: {
      tajwid: number;
      kelancaran: number;
      [key: string]: any;
    };
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

    const tajwid = Math.max(0, Math.min(100, Number(params.scores.tajwid) || 0));
    const kelancaran = Math.max(0, Math.min(100, Number(params.scores.kelancaran) || 0));
    const nilaiAkhir = Math.round((tajwid + kelancaran) / 2);
    const { grade, arabic } = scoreToMunaqosahGrade(nilaiAkhir);

    const enrichedScores = {
      ...params.scores,
      tajwid,
      kelancaran,
      nilaiAkhir,
      grade,
      predikatArab: arabic,
    };

    const info = await this.repo.submitResult({
      assignmentId: params.assignmentId,
      scores: enrichedScores,
      hasil: params.hasil,
      catatanPenguji: params.catatanPenguji,
    });

    if (params.hasil === "lulus") {
      const juzArray = info.juzList && info.juzList.length > 0 ? info.juzList : [info.juzKe];

      for (const j of juzArray) {
        await this.repo.grantAchievement({
          schoolId: info.schoolId,
          studentId: info.studentId,
          juzKe: j,
          sourceId: params.assignmentId,
        });
      }

      await this.addExpUseCase.execute({
        schoolId: info.schoolId,
        studentId: info.studentId,
        sourceType: "munaqosah",
        sourceId: params.assignmentId,
        expAmount: 100 * juzArray.length,
        description: `Lulus Munaqosah Ujian Juz ${juzArray.join(", ")} (Nilai: ${nilaiAkhir} [${grade}])`,
      });
    }

    return {
      nilaiAkhir,
      grade,
      hasil: params.hasil,
    };
  }
}
