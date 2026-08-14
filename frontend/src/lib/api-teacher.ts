import { apiClient } from './api-client';

export interface TeacherAssignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  classId: string;
  className: string;
  classGradeLevel?: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  status: 'Draft' | 'Published';
  submissionsCount: number;
  gradedSubmissionsCount: number;
  pendingGradingCount?: number;
  enrolledStudentsCount: number;
  averageMarks?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle?: string;
  assignmentMaxMarks: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileUrl: string;
  fileKey?: string;
  fileName: string;
  fileSize: number;
  submittedAt: string;
  status: 'Submitted' | 'Graded' | 'Returned';
  marks?: number | null;
  feedback?: string | null;
  className?: string;
  subjectName?: string;
}

export interface TeacherClassAllocation {
  allocationId: string;
  classId: string;
  className: string;
  classGradeLevel: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  enrolledStudentsCount: number;
  assignmentsCount: number;
  activeAssignmentsCount: number;
}

export interface TeacherClassDetail {
  id: string;
  name: string;
  gradeLevel: string;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
  }>;
  enrolledStudentsCount: number;
  assignmentsCount: number;
  totalSubmissionsCount: number;
  totalGradedCount: number;
  averageScore?: number | null;
  students: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    joinedDate: string;
    totalSubmissions: number;
    gradedSubmissions: number;
    averageMarks?: number | null;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    deadline: string;
    maxMarks: number;
    subjectId: string;
    subjectName: string;
    status: string;
    submissionsCount: number;
    gradedSubmissionsCount: number;
    createdAt: string;
  }>;
}

export interface StudentClassHistory {
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  classGradeLevel: string;
  totalAssignedTasks: number;
  submittedTasksCount: number;
  gradedTasksCount: number;
  averageMark?: number | null;
  submissions: Array<{
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    assignmentMaxMarks: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    submittedAt: string;
    status: string;
    marks?: number | null;
    feedback?: string | null;
  }>;
}

export interface TeacherOverviewStats {
  classesCount: number;
  allocationsCount: number;
  studentsCount: number;
  assignmentsCount: number;
  publishedAssignmentsCount: number;
  draftAssignmentsCount: number;
  activeAssignmentsCount: number;
  totalSubmissionsCount: number;
  gradedSubmissionsCount: number;
  pendingSubmissionsCount: number;
  gradingRate: number;
  averageMarks?: number | null;
  recentSubmissions: TeacherSubmission[];
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  classId: string;
  subjectId: string;
  status: 'Draft' | 'Published';
}

export interface UpdateAssignmentPayload {
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  status: 'Draft' | 'Published';
}

export interface GradeSubmissionPayload {
  marks: number;
  feedback: string;
}

// API Functions
export const fetchTeacherOverviewStats = async (): Promise<TeacherOverviewStats> => {
  const res = await apiClient.get('/teacher/overview/stats');
  return res.data;
};

export const fetchTeacherAssignments = async (): Promise<TeacherAssignment[]> => {
  const res = await apiClient.get('/teacher/assignments');
  return res.data;
};

export const fetchTeacherAssignmentDetail = async (id: string): Promise<TeacherAssignment> => {
  const res = await apiClient.get(`/teacher/assignments/${id}`);
  return res.data;
};

export const fetchTeacherAllocations = async (): Promise<Array<{ classId: string; className: string; subjectId: string; subjectName: string }>> => {
  const res = await apiClient.get('/teacher/assignments/my-allocations');
  return res.data;
};

export const createTeacherAssignment = async (payload: CreateAssignmentPayload): Promise<any> => {
  const res = await apiClient.post('/teacher/assignments', payload);
  return res.data;
};

export const updateTeacherAssignment = async (id: string, payload: UpdateAssignmentPayload): Promise<any> => {
  const res = await apiClient.put(`/teacher/assignments/${id}`, payload);
  return res.data;
};

export const toggleAssignmentStatus = async (id: string, newStatus: 'Draft' | 'Published'): Promise<any> => {
  const res = await apiClient.patch(`/teacher/assignments/${id}/status?status=${newStatus}`);
  return res.data;
};

export const deleteTeacherAssignment = async (id: string): Promise<void> => {
  await apiClient.delete(`/teacher/assignments/${id}`);
};

export const fetchTeacherSubmissions = async (assignmentId: string): Promise<TeacherSubmission[]> => {
  const res = await apiClient.get(`/teacher/submissions/assignment/${assignmentId}`);
  return res.data;
};

export const fetchTeacherSubmissionDetail = async (submissionId: string): Promise<TeacherSubmission> => {
  const res = await apiClient.get(`/teacher/submissions/${submissionId}`);
  return res.data;
};

export const gradeTeacherSubmission = async (submissionId: string, payload: GradeSubmissionPayload): Promise<any> => {
  const res = await apiClient.post(`/teacher/submissions/${submissionId}/grade`, payload);
  return res.data;
};

export const fetchTeacherClasses = async (): Promise<TeacherClassAllocation[]> => {
  const res = await apiClient.get('/teacher/classes');
  return res.data;
};

export const fetchTeacherClassDetail = async (classId: string): Promise<TeacherClassDetail> => {
  const res = await apiClient.get(`/teacher/classes/${classId}`);
  return res.data;
};

export const fetchStudentClassHistory = async (classId: string, studentId: string): Promise<StudentClassHistory> => {
  const res = await apiClient.get(`/teacher/classes/${classId}/students/${studentId}`);
  return res.data;
};
