import type { Db } from "../../../db/client";
import { users } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import type { IUserRepository, UpdateUserData } from "../domain/repositories/IUserRepository";
import type { User } from "../domain/entities/User";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string, schoolId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.schoolId, schoolId)))
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string, schoolId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)))
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async updateProfile(id: string, schoolId: string, data: UpdateUserData): Promise<User> {
    const rows = await this.db
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)))
      .returning();

    const row = rows[0];
    if (!row) throw new Error("User not found");
    return this.toDomain(row);
  }

  async updatePasswordHash(id: string, schoolId: string, passwordHash: string): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash })
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)));
  }

  private toDomain(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      schoolId: row.schoolId,
      role: row.role,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      phone: row.phone,
      createdAt: row.createdAt,
    };
  }
}
