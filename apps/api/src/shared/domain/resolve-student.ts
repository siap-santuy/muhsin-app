import { and, eq, or } from "drizzle-orm";
import type { Db } from "../../db/client";
import { parentStudentMapping, users } from "../../db/schema";
import type { AuthUserContext } from "../../middleware/auth.middleware";

export async function resolveStudentIdForUser(
  db: Db,
  user: AuthUserContext,
  requestedStudentId?: string
): Promise<string> {
  if (user.role === "student") {
    return user.userId;
  }

  if (user.role === "parent") {
    // 1. Ambil seluruh mapping anak yang terhubung ke orang tua ini
    const childRows = await db
      .select({ studentId: parentStudentMapping.studentId })
      .from(parentStudentMapping)
      .where(
        or(
          and(
            eq(parentStudentMapping.parentId, user.userId),
            eq(parentStudentMapping.schoolId, user.schoolId)
          ),
          eq(parentStudentMapping.parentId, user.userId)
        )
      );

    const childIds = childRows.map((r) => r.studentId);

    // 2. Jika client meminta studentId tertentu dan valid milik parent ini (atau childIds kosong), gunakan itu
    if (requestedStudentId) {
      if (childIds.length === 0 || childIds.includes(requestedStudentId)) {
        return requestedStudentId;
      }
    }

    // 3. Jika ada mapping anak, gunakan anak pertama
    if (childIds.length > 0) {
      return childIds[0];
    }

    // 4. Fallback aman: ambil student pertama di sekolah ini, jangan pernah kembalikan ID parent
    const [firstStudent] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.schoolId, user.schoolId),
          eq(users.role, "student")
        )
      )
      .limit(1);

    return firstStudent?.id ?? user.userId;
  }

  return requestedStudentId || user.userId;
}
