import { apiClient } from './api-client';

export interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  className: string;
  classGradeLevel?: string;
  subjectName: string;
  subjectCode?: string;
  teacherName: string;
  teacherEmail?: string;
  isSubmitted: boolean;
  submissionId?: string;
  submissionStatus?: 'Submitted' | 'Graded' | 'Returned';
  submittedAt?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  marks?: number | null;
  feedback?: string | null;
  createdAt?: string;
}

export interface StudentAssignmentDetail {
  id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  status: string;
  classId: string;
  className: string;
  classGradeLevel: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  isSubmitted: boolean;
  submissionId?: string;
  submissionStatus?: 'Submitted' | 'Graded' | 'Returned';
  submittedAt?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  marks?: number | null;
  feedback?: string | null;
  createdAt: string;
}

export interface StudentClassSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
}

export interface StudentClass {
  classId: string;
  className: string;
  gradeLevel: string;
  createdAt?: string;
  subjects: StudentClassSubject[];
  totalAssignmentsCount: number;
  completedAssignmentsCount: number;
  pendingAssignmentsCount: number;
}

export interface StudentClassDetailSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teachers: Array<{
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
  }>;
}

export interface StudentClassDetail {
  classId: string;
  className: string;
  gradeLevel: string;
  createdAt?: string;
  subjects: StudentClassDetailSubject[];
  assignments: StudentAssignment[];
}

export interface StudentGradeItem {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  maxMarks: number;
  className: string;
  classGradeLevel?: string;
  subjectName: string;
  subjectCode?: string;
  teacherName: string;
  teacherEmail?: string;
  submittedAt: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  status: string;
  marks?: number | null;
  percentage?: number | null;
  feedback?: string | null;
}

export interface StudentOverviewUpcomingDeadline {
  id: string;
  title: string;
  deadline: string;
  maxMarks: number;
  className: string;
  subjectName: string;
  teacherName: string;
  isSubmitted: boolean;
  submissionStatus?: string;
  marks?: number | null;
}

export interface StudentOverviewStats {
  enrolledClassesCount: number;
  enrolledSubjectsCount: number;
  totalAssignmentsCount: number;
  submittedCount: number;
  pendingAssignmentsCount: number;
  overdueCount: number;
  gradedSubmissionsCount: number;
  averagePercentage?: number | null;
  averageMarks?: number | null;
  upcomingDeadlines: StudentOverviewUpcomingDeadline[];
  recentGradedSubmissions: StudentGradeItem[];
}

// API Functions
export const fetchStudentOverviewStats = async (): Promise<StudentOverviewStats> => {
  const res = await apiClient.get('/student/overview/stats');
  return res.data;
};

export const fetchStudentAssignments = async (): Promise<StudentAssignment[]> => {
  const res = await apiClient.get('/student/submissions/my-assignments');
  return res.data;
};

export const fetchStudentAssignmentDetail = async (id: string): Promise<StudentAssignmentDetail> => {
  const res = await apiClient.get(`/student/submissions/assignment/${id}`);
  return res.data;
};

export const fetchStudentClasses = async (): Promise<StudentClass[]> => {
  const res = await apiClient.get('/student/classes');
  return res.data;
};

export const fetchStudentClassDetail = async (classId: string): Promise<StudentClassDetail> => {
  const res = await apiClient.get(`/student/classes/${classId}`);
  return res.data;
};

export const fetchStudentGrades = async (): Promise<StudentGradeItem[]> => {
  const res = await apiClient.get('/student/submissions/grades');
  return res.data;
};

export const submitStudentAssignment = async (assignmentId: string, file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('assignmentId', assignmentId);
  formData.append('file', file);

  const res = await apiClient.post('/student/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
