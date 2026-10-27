import type { YaumiyahAccessRequestEntity } from "../entities/YaumiyahAccessRequest";

export interface YaumiyahAccessRequestWithStudent extends YaumiyahAccessRequestEntity {
  studentName: string;
  className?: string | null;
}

export interface ListAccessRequestsFilter {
  status?: "pending" | "approved" | "rejected" | "all";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IYaumiyahAccessRequestRepository {
  create(entity: YaumiyahAccessRequestEntity): Promise<YaumiyahAccessRequestEntity>;
  createBulk?(entities: YaumiyahAccessRequestEntity[]): Promise<YaumiyahAccessRequestEntity[]>;
  findById(id: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null>;
  findActiveApproved(studentId: string, date: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null>;
  findPendingOverlap(studentId: string, startDate: string, endDate: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null>;
  listByStudent(studentId: string, schoolId: string): Promise<YaumiyahAccessRequestEntity[]>;
  listPendingBySchool(schoolId: string, teacherId?: string): Promise<YaumiyahAccessRequestWithStudent[]>;
  listPaginated(
    schoolId: string,
    filter: ListAccessRequestsFilter,
    teacherId?: string
  ): Promise<PaginatedResult<YaumiyahAccessRequestWithStudent>>;
  update(entity: YaumiyahAccessRequestEntity): Promise<YaumiyahAccessRequestEntity>;
  isStudentAssignedToTeacher?(studentId: string, teacherId: string, schoolId: string): Promise<boolean>;
  filterStudentsAssignedToTeacher?(studentIds: string[], teacherId: string, schoolId: string): Promise<string[]>;
}
