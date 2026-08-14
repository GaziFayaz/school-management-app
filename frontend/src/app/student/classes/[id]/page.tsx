'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentClassDetail } from '@/lib/api-student';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ChevronLeft,
  School,
  BookOpen,
  User,
  Mail,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  FileText,
  GraduationCap,
} from 'lucide-react';

export default function StudentClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const { data: classDetail, isLoading, isError } = useQuery({
    queryKey: ['student-class-detail', classId],
    queryFn: () => fetchStudentClassDetail(classId),
  });

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['Student']}>
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Loading class curriculum & subjects...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (isError || !classDetail) {
    return (
      <ProtectedRoute allowedRoles={['Student']}>
        <div className="max-w-5xl mx-auto py-12 px-4 space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/dashboard?tab=classes" className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back to Classes
            </Link>
          </Button>
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Class Not Found</AlertTitle>
            <AlertDescription>
              This class does not exist or you are not currently enrolled in it.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  const subjects = classDetail.subjects || [];
  const assignments = classDetail.assignments || [];

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/dashboard?tab=classes" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> Back to Classes & Subjects
            </Link>
          </Button>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Enrolled Student
          </Badge>
        </div>

        {/* Hero Header */}
        <Card className="border border-border/80 shadow-sm bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    Grade {classDetail.gradeLevel}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {subjects.length} Subjects
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <School className="w-7 h-7 text-primary" /> {classDetail.className}
                </h1>
              </div>

              <div className="flex items-center gap-3 bg-muted/60 px-4 py-2.5 rounded-lg border border-border/60">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Class Coursework</div>
                  <div className="text-lg font-bold text-foreground">{assignments.length} Tasks</div>
                </div>
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Section 1: Assigned Subjects & Instructors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Assigned Subjects & Instructors
            </h2>
            <span className="text-xs text-muted-foreground">
              {subjects.length} enrolled {subjects.length === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          {subjects.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm border-dashed">
              No subjects currently allocated to this class.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subj) => (
                <Card key={subj.subjectId} className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-foreground">
                        {subj.subjectName}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">
                        {subj.subjectCode}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Subject Instructors:
                    </span>
                    {subj.teachers && subj.teachers.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {subj.teachers.map((t) => (
                          <div key={t.teacherId} className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-border/40 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {t.teacherName ? t.teacherName.charAt(0).toUpperCase() : 'T'}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{t.teacherName}</p>
                                <p className="text-[11px] text-muted-foreground">{t.teacherEmail}</p>
                              </div>
                            </div>
                            {t.teacherEmail && (
                              <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-primary hover:text-primary">
                                <a href={`mailto:${t.teacherEmail}`} title={`Email ${t.teacherName}`}>
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-1">No teacher currently assigned.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Class Coursework & Assignments */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Class Coursework & Assignments
            </h2>
            <span className="text-xs text-muted-foreground">
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>

          {assignments.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
              No assignments published for this class yet. Check back soon!
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const deadlineDate = new Date(assignment.deadline);
                const isOverdue = new Date() > deadlineDate;
                const isSubmitted = assignment.isSubmitted;
                const isGraded = assignment.submissionStatus === 'Graded';

                return (
                  <Card key={assignment.id} className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {assignment.subjectName}
                          </Badge>
                          {isGraded ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs">
                              <Award className="w-3 h-3 mr-1" /> Graded: {assignment.marks} / {assignment.maxMarks}
                            </Badge>
                          ) : isSubmitted ? (
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive" className="font-medium text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium text-xs">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-foreground">
                          {assignment.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Teacher: {assignment.teacherName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Due: {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> Max: {assignment.maxMarks} pts
                          </span>
                        </div>
                      </div>

                      <Button asChild size="sm" className="shrink-0 self-start sm:self-center">
                        <Link href={`/student/assignments/${assignment.id}`} className="flex items-center gap-1">
                          {isSubmitted ? 'View Submission' : 'Submit Work'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
