'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentClasses, StudentClass } from '@/lib/api-student';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  School,
  BookOpen,
  User,
  Mail,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  GraduationCap,
} from 'lucide-react';

export default function StudentClassesTab() {
  const { data: classes = [], isLoading, isError } = useQuery<StudentClass[]>({
    queryKey: ['student-classes'],
    queryFn: fetchStudentClasses,
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span>Loading your enrolled classes and subjects...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
        Failed to load classes. Please try refreshing.
      </Card>
    );
  }

  if (classes.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-xs border-dashed space-y-3">
        <School className="w-10 h-10 mx-auto text-muted-foreground/40" />
        <h3 className="text-sm font-semibold text-foreground">No Enrolled Classes Found</h3>
        <p className="max-w-sm mx-auto">
          You are not currently enrolled in any academic classes. Please contact your school administrator.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <School className="w-5 h-5 text-primary" /> Enrolled Classes & Academic Roster
          </h2>
          <p className="text-xs text-muted-foreground">
            Explore your assigned classes, subject curriculum, and instructor contact profiles.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {classes.length} {classes.length === 1 ? 'Class' : 'Classes'} Enrolled
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls) => {
          const subjects = cls.subjects || [];
          const progressPercent = cls.totalAssignmentsCount > 0
            ? Math.round((cls.completedAssignmentsCount / cls.totalAssignmentsCount) * 100)
            : 0;

          return (
            <Card
              key={cls.classId}
              className="border border-border/80 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {cls.className}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Grade Level: {cls.gradeLevel}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {subjects.length} Subjects
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Coursework Summary Progress */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground">Coursework Progress</span>
                    <span className="font-semibold text-foreground">
                      {cls.completedAssignmentsCount} / {cls.totalAssignmentsCount} Completed ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Subjects & Teachers */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Subjects & Instructors:
                  </span>
                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">No subjects assigned yet.</p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {subjects.map((sub) => (
                        <div
                          key={sub.subjectId + sub.teacherId}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/40 text-xs"
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-4 shrink-0">
                                {sub.subjectCode}
                              </Badge>
                              <span className="font-medium text-foreground truncate">{sub.subjectName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{sub.teacherName}</span>
                            </div>
                          </div>

                          {sub.teacherEmail && (
                            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-primary hover:text-primary shrink-0">
                              <a href={`mailto:${sub.teacherEmail}`} title={`Email ${sub.teacherName}`}>
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-border/60">
                  <Button asChild size="sm" className="w-full flex items-center justify-center gap-1.5">
                    <Link href={`/student/classes/${cls.classId}`}>
                      View Class Curriculum & Tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
