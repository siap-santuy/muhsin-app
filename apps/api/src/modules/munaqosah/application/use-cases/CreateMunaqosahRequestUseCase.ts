import type { IMunaqosahRepository } from "../../domain/repositories/IMunaqosahRepository";

export class CreateMunaqosahRequestUseCase {
  constructor(private readonly repo: IMunaqosahRepository) {}

  async execute(params: {
    schoolId: string;
    studentId: string;
    teacherId: string;
    juzKe: number;
  }) {
    if (params.juzKe < 1 || params.juzKe > 30) {
      throw new Error("Juz harus antara 1 sampai 30");
    }
    return this.repo.createRequest(params);
  }
}
