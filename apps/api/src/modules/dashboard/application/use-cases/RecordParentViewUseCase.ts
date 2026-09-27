import type { IActivityRepository, RecordParentViewInput } from "../../domain/repositories/IActivityRepository";

export class RecordParentViewUseCase {
  constructor(private readonly repo: IActivityRepository) {}

  async execute(input: RecordParentViewInput): Promise<void> {
    const childIds = await this.repo.findChildIdsByParent(input.parentId, input.schoolId);
    if (!childIds.includes(input.studentId)) return;
    await this.repo.recordParentView(input);
  }

  async resolveFirstChild(parentId: string, schoolId: string): Promise<string | undefined> {
    const childIds = await this.repo.findChildIdsByParent(parentId, schoolId);
    return childIds[0];
  }
}
