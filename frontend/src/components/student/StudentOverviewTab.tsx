'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentOverviewStats, StudentOverviewStats } from '@/lib/api-student';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  School,
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Loader2,
  FileText,
  User,
  Sparkles,
} from 'lucide-react';

interface StudentOverviewTabProps {
  onNavigateTab: (tab: string) => void;
}

export default function StudentOverviewTab({ onNavigateTab }: StudentOverviewTabProps) {
  const { data: stats, isLoading, isError } = useQuery<StudentOverviewStats>({
    queryKey: ['student-overview-stats'],
    queryFn: fetchStudentOverviewStats,
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span>Loading your academic overview...</span>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
        Failed to load academic overview. Please try refreshing the page.
      </Card>
    );
  }

  const upcomingDeadlines = stats.upcomingDeadlines || [];
  const recentGraded = stats.recentGradedSubmissions || [];

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Enrolled Classes */}
        <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Enrolled Classes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.enrolledClassesCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active Academic Roster</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Subjects */}
        <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Enrolled Subjects</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.enrolledSubjectsCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Courses & Curriculum</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Submissions */}
        <Card className={`border shadow-sm transition-colors ${
          stats.pendingAssignmentsCount > 0
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-border/80'
        }`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending Tasks</p>
              <p className={`text-2xl font-bold mt-1 ${stats.pendingAssignmentsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                {stats.pendingAssignmentsCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting Submission</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Graded Submissions */}
        <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Graded Submissions</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.gradedSubmissionsCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Evaluated by Teachers</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Average Score % */}
        <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-colors sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.averagePercentage !== null && stats.averagePercentage !== undefined
                  ? `${stats.averagePercentage}%`
                  : 'N/A'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Overall Grade Mark</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Upcoming Deadlines & Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="border border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Upcoming Deadlines
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('assignments')}
              className="text-xs text-primary hover:text-primary h-7 px-2"
            >
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                No active upcoming deadlines right now. You're all caught up!
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((item) => {
                  const deadlineDate = new Date(item.deadline);
                  const isSubmitted = item.isSubmitted;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border border-border/60 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                            {item.subjectName}
                          </Badge>
                          <h4 className="text-xs font-semibold text-foreground truncate" title={item.title}>
                            {item.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{item.className}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isSubmitted ? (
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                            Submitted
                          </Badge>
                        ) : (
                          <Button asChild size="sm" className="h-7 text-xs px-2.5">
                            <Link href={`/student/assignments/${item.id}`}>
                              Submit
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Graded Feedback & Activity */}
        <Card className="border border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Recent Graded Feedback
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('grades')}
              className="text-xs text-primary hover:text-primary h-7 px-2"
            >
              Gradebook <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            {recentGraded.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                No graded assignments yet. Your grades will appear here once reviewed by instructors.
              </div>
            ) : (
              <div className="space-y-3">
                {recentGraded.map((item) => (
                  <div
                    key={item.submissionId}
                    className="p-3.5 rounded-lg border border-border/60 hover:border-emerald-500/40 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-semibold text-foreground truncate" title={item.assignmentTitle}>
                          {item.assignmentTitle}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {item.className} • {item.subjectName} • {item.teacherName}
                        </p>
                      </div>

                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shrink-0">
                        {item.marks} / {item.maxMarks} ({item.percentage}%)
                      </Badge>
                    </div>

                    {item.feedback && (
                      <p className="text-xs text-foreground/80 bg-background/80 p-2 rounded border border-border/50 italic line-clamp-2">
                        "{item.feedback}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <span>Evaluated {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : ''}</span>
                      <Link
                        href={`/student/assignments/${item.assignmentId}`}
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        View Full Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
