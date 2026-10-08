import { and, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { parentStudentMapping } from "../../db/schema";
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
    const childRows = await db
      .select({ studentId: parentStudentMapping.studentId })
      .from(parentStudentMapping)
      .where(
        and(
          eq(parentStudentMapping.parentId, user.userId),
          eq(parentStudentMapping.schoolId, user.schoolId)
        )
      );

    const childIds = childRows.map((r) => r.studentId);

    if (requestedStudentId && childIds.includes(requestedStudentId)) {
      return requestedStudentId;
    }

    return childIds[0] ?? user.userId;
  }

  return requestedStudentId || user.userId;
}
