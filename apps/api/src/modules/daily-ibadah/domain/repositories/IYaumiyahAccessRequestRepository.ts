import type { YaumiyahAccessRequestEntity } from "../entities/YaumiyahAccessRequest";

export interface YaumiyahAccessRequestWithStudent extends YaumiyahAccessRequestEntity {
  studentName: string;
  className?: string | null;
}

export interface IYaumiyahAccessRequestRepository {
  create(entity: YaumiyahAccessRequestEntity): Promise<YaumiyahAccessRequestEntity>;
  findById(id: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null>;
  findActiveApproved(studentId: string, date: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null>;
  findPendingOverlap(studentId: string, startDate: string, endDate: string, schoolId: string): Promise<YaumiyahAccessRequestEntity | null>;
  listByStudent(studentId: string, schoolId: string): Promise<YaumiyahAccessRequestEntity[]>;
  listPendingBySchool(schoolId: string, teacherId?: string): Promise<YaumiyahAccessRequestWithStudent[]>;
  update(entity: YaumiyahAccessRequestEntity): Promise<YaumiyahAccessRequestEntity>;
}
