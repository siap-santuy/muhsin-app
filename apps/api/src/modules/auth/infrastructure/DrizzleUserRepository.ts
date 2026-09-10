import type { Db } from "../../../db/client";
import { users } from "../../../db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import type { IUserRepository, UpdateUserData, CreateUserData, UpdateUserAdminData } from "../domain/repositories/IUserRepository";
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

  async findByIdentifier(identifier: string, schoolId: string): Promise<User | null> {
    const trimmed = identifier.trim().toLowerCase();
    const rows = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          or(
            sql`lower(${users.email}) = ${trimmed}`,
            sql`lower(${users.username}) = ${trimmed}`
          )
        )
      )
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

  async createUser(data: CreateUserData): Promise<User> {
    const rows = await this.db
      .insert(users)
      .values({
        schoolId: data.schoolId,
        role: data.role as any,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        phone: data.phone ?? null,
        username: data.username ?? null,
        gender: data.gender ?? null,
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Gagal membuat user");
    return this.toDomain(row);
  }

  async updateUser(id: string, schoolId: string, data: UpdateUserAdminData): Promise<User> {
    const rows = await this.db
      .update(users)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      })
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("User tidak ditemukan");
    return this.toDomain(row);
  }

  async deleteUser(id: string, schoolId: string): Promise<void> {
    await this.db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)));
  }

  private toDomain(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      schoolId: row.schoolId,
      role: row.role,
      name: row.name,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      gender: row.gender,
      birthPlace: row.birthPlace,
      birthDate: row.birthDate,
      createdAt: row.createdAt,
    };
  }
}
