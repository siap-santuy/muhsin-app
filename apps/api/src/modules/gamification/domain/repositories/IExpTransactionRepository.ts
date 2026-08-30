export type ExpSourceType =
  | "daily_ibadah"
  | "setoran"
  | "streak_bonus"
  | "munaqosah";

export interface CreateExpTransactionDTO {
  schoolId: string;
  studentId: string;
  sourceType: ExpSourceType;
  sourceId?: string | null;
  expAmount: number;
  description?: string | null;
}

export interface IExpTransactionRepository {
  create(tx: CreateExpTransactionDTO): Promise<void>;
}
