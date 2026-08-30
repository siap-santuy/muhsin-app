import type { Db } from "../../../db/client";
import { expTransactions } from "../../../db/schema";
import type {
  IExpTransactionRepository,
  CreateExpTransactionDTO,
} from "../domain/repositories/IExpTransactionRepository";

export class DrizzleExpTransactionRepository
  implements IExpTransactionRepository
{
  constructor(private readonly db: Db) {}

  async create(tx: CreateExpTransactionDTO): Promise<void> {
    await this.db.insert(expTransactions).values({
      schoolId: tx.schoolId,
      studentId: tx.studentId,
      sourceType: tx.sourceType,
      sourceId: tx.sourceId ?? null,
      expAmount: tx.expAmount,
      description: tx.description ?? null,
    });
  }
}
