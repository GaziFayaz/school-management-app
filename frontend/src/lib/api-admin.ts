import { apiClient } from './api-client';

export interface OverviewStats {
  users: {
    totalUsers: number;
    adminCount: number;
    teacherCount: number;
    studentCount: number;
  };
  academics: {
    totalClasses: number;
    totalSubjects: number;
    totalAllocations: number;
  };
  assignments: {
    totalAssignments: number;
    draftAssignments: number;
    publishedAssignments: number;
  };
  submissions: {
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingSubmissions: number;
    gradingRate: number;
    averageMarks: number | null;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  createdAt: string;
}

export interface TeacherAssignedClass {
  classId: string;
  className: string;
  gradeLevel: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
}

export interface StudentRoleDetails {
  enrolledClass?: {
    classId: string;
    className: string;
    gradeLevel: string;
  } | null;
  enrolledClasses?: {
    classId: string;
    className: string;
    gradeLevel: string;
  }[];
  totalSubmissions: number;
  gradedSubmissions: number;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  createdAt: string;
  roleDetails?: {
    assignedClasses?: TeacherAssignedClass[];
    enrolledClass?: {
      classId: string;
      className: string;
      gradeLevel: string;
    } | null;
    enrolledClasses?: {
      classId: string;
      className: string;
      gradeLevel: string;
    }[];
    totalSubmissions?: number;
    gradedSubmissions?: number;
  } | null;
}

export interface AdminClass {
  id: string;
  name: string;
  gradeLevel: string;
}

export interface ClassTeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
}

export interface ClassStudentEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export interface AdminClassDetail {
  id: string;
  name: string;
  gradeLevel: string;
  teacherAssignments: ClassTeacherAssignment[];
  studentEnrollments: ClassStudentEnrollment[];
}

export interface AdminSubject {
  id: string;
  name: string;
  code: string;
}

export interface AdminTeacherAllocation {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export interface AdminStudentEnrollment {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export interface AdminAssignmentItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  status: 'Draft' | 'Published';
  submissionCount: number;
  gradedCount: number;
  createdAt: string;
}

export interface AdminAssignmentDetail extends AdminAssignmentItem {
  gradeLevel: string;
  subjectCode: string;
  updatedAt: string;
}

export interface AdminSubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  status: 'Submitted' | 'Graded' | 'Returned';
  marks: number | null;
  feedback: string | null;
  updatedAt: string;
}

// Service Functions
export async function fetchOverviewStats(): Promise<OverviewStats> {
  const response = await apiClient.get<OverviewStats>('/admin/overview/stats');
  return response.data;
}

export async function fetchUsers(role?: string): Promise<AdminUser[]> {
  const response = await apiClient.get<AdminUser[]>('/admin/users', {
    params: role && role !== 'all' ? { role } : {},
  });
  return response.data;
}

export async function fetchUserDetail(id: string): Promise<AdminUserDetail> {
  const response = await apiClient.get<AdminUserDetail>(`/admin/users/${id}`);
  return response.data;
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  const response = await apiClient.post('/admin/users', data);
  return response.data;
}

export async function updateUser(id: string, data: { name: string; email: string; role: string }) {
  const response = await apiClient.put(`/admin/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: string) {
  const response = await apiClient.delete(`/admin/users/${id}`);
  return response.data;
}

export async function fetchClasses(): Promise<AdminClass[]> {
  const response = await apiClient.get<AdminClass[]>('/admin/classes');
  return response.data;
}

export async function fetchClassDetail(id: string): Promise<AdminClassDetail> {
  const response = await apiClient.get<AdminClassDetail>(`/admin/classes/${id}`);
  return response.data;
}

export async function createClass(data: { name: string; gradeLevel: string }) {
  const response = await apiClient.post('/admin/classes', data);
  return response.data;
}

export async function updateClass(id: string, data: { name: string; gradeLevel: string }) {
  const response = await apiClient.put(`/admin/classes/${id}`, data);
  return response.data;
}

export async function deleteClass(id: string) {
  const response = await apiClient.delete(`/admin/classes/${id}`);
  return response.data;
}

export async function fetchSubjects(): Promise<AdminSubject[]> {
  const response = await apiClient.get<AdminSubject[]>('/admin/subjects');
  return response.data;
}

export async function createSubject(data: { name: string; code: string }) {
  const response = await apiClient.post('/admin/subjects', data);
  return response.data;
}

export async function updateSubject(id: string, data: { name: string; code: string }) {
  const response = await apiClient.put(`/admin/subjects/${id}`, data);
  return response.data;
}

export async function deleteSubject(id: string) {
  const response = await apiClient.delete(`/admin/subjects/${id}`);
  return response.data;
}

export async function fetchTeacherAllocations(): Promise<AdminTeacherAllocation[]> {
  const response = await apiClient.get<AdminTeacherAllocation[]>('/admin/allocations/teacher-assignments');
  return response.data;
}

export async function assignTeacher(data: { classId: string; subjectId: string; teacherId: string }) {
  const response = await apiClient.post('/admin/allocations/assign-teacher', data);
  return response.data;
}

export async function unassignTeacher(id: string) {
  const response = await apiClient.delete(`/admin/allocations/teacher-assignments/${id}`);
  return response.data;
}

export async function fetchStudentEnrollments(): Promise<AdminStudentEnrollment[]> {
  const response = await apiClient.get<AdminStudentEnrollment[]>('/admin/allocations/student-enrollments');
  return response.data;
}

export async function enrollStudent(data: { classId: string; studentId: string }) {
  const response = await apiClient.post('/admin/allocations/enroll-student', data);
  return response.data;
}

export async function unenrollStudent(id: string) {
  const response = await apiClient.delete(`/admin/allocations/student-enrollments/${id}`);
  return response.data;
}

export async function fetchAdminAssignments(filters?: {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  studentId?: string;
  status?: string;
}): Promise<AdminAssignmentItem[]> {
  const params: Record<string, string> = {};
  if (filters?.classId && filters.classId !== 'all') params.classId = filters.classId;
  if (filters?.subjectId && filters.subjectId !== 'all') params.subjectId = filters.subjectId;
  if (filters?.teacherId && filters.teacherId !== 'all') params.teacherId = filters.teacherId;
  if (filters?.studentId && filters.studentId !== 'all') params.studentId = filters.studentId;
  if (filters?.status && filters.status !== 'all') params.status = filters.status;

  const response = await apiClient.get<AdminAssignmentItem[]>('/admin/assignments', { params });
  return response.data;
}

export async function fetchAdminAssignmentDetail(id: string): Promise<AdminAssignmentDetail> {
  const response = await apiClient.get<AdminAssignmentDetail>(`/admin/assignments/${id}`);
  return response.data;
}

export async function fetchAdminAssignmentSubmissions(id: string): Promise<AdminSubmissionItem[]> {
  const response = await apiClient.get<AdminSubmissionItem[]>(`/admin/assignments/${id}/submissions`);
  return response.data;
}

export async function deleteAdminAssignment(id: string) {
  const response = await apiClient.delete(`/admin/assignments/${id}`);
  return response.data;
}
