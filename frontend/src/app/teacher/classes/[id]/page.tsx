'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherClassDetail } from '@/lib/api-teacher';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import DataTable, { ColumnDef } from '@/components/ui/data-table';
import StudentDetailModal from '@/components/teacher/StudentDetailModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  School,
  BookOpen,
  Users,
  FileText,
  Award,
  CheckCircle,
  Clock,
  Eye,
  Calendar,
  Loader2,
  GraduationCap,
} from 'lucide-react';

export default function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['teacher-class-detail', classId],
    queryFn: () => fetchTeacherClassDetail(classId),
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['Teacher']}>
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Loading class details...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (!classDetail) {
    return (
      <ProtectedRoute allowedRoles={['Teacher']}>
        <div className="py-20 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Class not found or unauthorized.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/teacher/dashboard?tab=classes">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Classes
            </Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  // Student Roster DataTable Columns
  const studentColumns: ColumnDef<any>[] = [
    {
      header: 'Student Name & Email',
      accessorKey: 'studentName',
      sortable: true,
      cell: (student) => (
        <div>
          <div className="font-semibold text-foreground">{student.studentName}</div>
          <div className="text-[11px] text-muted-foreground">{student.studentEmail}</div>
        </div>
      ),
    },
    {
      header: 'Enrolled Date',
      accessorKey: 'joinedDate',
      sortable: true,
      cell: (student) => (
        <span className="text-muted-foreground text-[11px]">
          {student.joinedDate ? new Date(student.joinedDate).toLocaleDateString() : 'Active'}
        </span>
      ),
    },
    {
      header: 'Submissions',
      accessorKey: 'totalSubmissions',
      sortable: true,
      cell: (student) => (
        <div className="text-xs text-foreground font-medium">
          {student.totalSubmissions} / {classDetail.assignmentsCount}{' '}
          <span className="text-[11px] text-muted-foreground">
            ({classDetail.assignmentsCount > 0 ? Math.round((student.totalSubmissions / classDetail.assignmentsCount) * 100) : 0}%)
          </span>
        </div>
      ),
    },
    {
      header: 'Graded',
      accessorKey: 'gradedSubmissions',
      sortable: true,
      cell: (student) => (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {student.gradedSubmissions} Graded
        </span>
      ),
    },
    {
      header: 'Average Mark',
      accessorKey: 'averageMarks',
      sortable: true,
      cell: (student) => (
        <div>
          {student.averageMarks !== null && student.averageMarks !== undefined ? (
            <span className="font-bold text-primary text-xs">
              {Number(student.averageMarks).toFixed(1)}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs italic">N/A</span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (student) => (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedStudentId(student.studentId)}
            className="h-7 text-[11px] px-2.5 flex items-center gap-1 font-medium"
          >
            <Eye className="w-3 h-3" /> View Student Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div>
          <Button variant="ghost" size="sm" asChild className="text-xs -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/teacher/dashboard?tab=classes">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Classes
            </Link>
          </Button>
        </div>

        {/* Hero Header Card */}
        <Card className="p-6 space-y-4 border-border/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <School className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{classDetail.name}</h1>
                  <Badge variant="outline" className="text-xs font-semibold">
                    Grade {classDetail.gradeLevel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Class roster, enrolled student performance, and assigned curriculum
                </p>
              </div>
            </div>

            {/* Subjects Taught Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Assigned Subjects:</span>
              {classDetail.subjects.map((sub) => (
                <Badge key={sub.subjectId} variant="secondary" className="text-xs font-semibold">
                  {sub.subjectName} ({sub.subjectCode})
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Class Analytics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> Enrolled Students
            </span>
            <div className="text-xl font-bold text-foreground">{classDetail.enrolledStudentsCount}</div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Class Assignments
            </span>
            <div className="text-xl font-bold text-foreground">{classDetail.assignmentsCount}</div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Total Submissions
            </span>
            <div className="text-xl font-bold text-foreground">
              {classDetail.totalSubmissionsCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({classDetail.totalGradedCount} graded)
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" /> Class Average Score
            </span>
            <div className="text-xl font-bold text-primary">
              {classDetail.averageScore !== null && classDetail.averageScore !== undefined
                ? `${Number(classDetail.averageScore).toFixed(1)}`
                : 'N/A'}
            </div>
          </Card>
        </div>

        {/* Enrolled Students Roster Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Enrolled Student Roster ({classDetail.students.length})
            </h2>
          </div>

          <DataTable
            columns={studentColumns}
            data={classDetail.students}
            searchKey="studentName"
            searchPlaceholder="Search student name or email..."
            emptyMessage="No students are currently enrolled in this class."
          />
        </div>

        {/* Class Assignments Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Assignments for {classDetail.name} ({classDetail.assignments.length})
            </h2>
            <Button size="sm" asChild className="text-xs">
              <Link href="/teacher/dashboard?tab=assignments">
                Manage All Assignments
              </Link>
            </Button>
          </div>

          {classDetail.assignments.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              No assignments created for this class yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classDetail.assignments.map((a) => (
                <Card key={a.id} className="p-5 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all border-border/80">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {a.subjectName}
                      </Badge>
                      <Badge variant={a.status === 'Published' ? 'default' : 'secondary'} className="text-[10px]">
                        {a.status}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">{a.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  </div>

                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due: {new Date(a.deadline).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-foreground">Max: {a.maxMarks}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        {a.submissionsCount} Submissions ({a.gradedSubmissionsCount} graded)
                      </span>
                      <Button variant="outline" size="sm" asChild className="h-7 text-[11px]">
                        <Link href={`/teacher/assignments/${a.id}`}>
                          View Details <ChevronLeft className="w-3 h-3 rotate-180 ml-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Student Details & History Modal */}
        <StudentDetailModal
          isOpen={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          classId={classId}
          studentId={selectedStudentId}
        />
      </div>
    </ProtectedRoute>
  );
}
