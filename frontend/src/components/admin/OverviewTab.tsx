'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOverviewStats } from '@/lib/api-admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, BookOpen, FileText, CheckCircle, GraduationCap, School, Award, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OverviewTab() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: fetchOverviewStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 text-center text-sm text-destructive bg-destructive/10 rounded-lg">
        Failed to load overview analytics stats.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Level KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              User Directory
            </CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-3">{stats.users.totalUsers}</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline" className="bg-blue-50/50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                {stats.users.studentCount} Students
              </Badge>
              <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {stats.users.teacherCount} Teachers
              </Badge>
              <Badge variant="outline" className="bg-purple-50/50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                {stats.users.adminCount} Admins
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Academic Structure */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Academic Structure
            </CardTitle>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <School className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-3">{stats.academics.totalClasses} Classes</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline" className="bg-amber-50/50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                {stats.academics.totalSubjects} Subjects
              </Badge>
              <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                {stats.academics.totalAllocations} Teacher Allocations
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Assignments */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assignments
            </CardTitle>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-3">{stats.assignments.totalAssignments} Created</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {stats.assignments.publishedAssignments} Published
              </Badge>
              <Badge variant="outline" className="bg-slate-50/50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                {stats.assignments.draftAssignments} Drafts
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Submission & Grading */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Grading Rate
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-3">{stats.submissions.gradingRate}%</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {stats.submissions.gradedSubmissions} Graded
              </Badge>
              <Badge variant="outline" className="bg-amber-50/50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                {stats.submissions.pendingSubmissions} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Metrics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Submission & Grading Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Graded Submissions Rate ({stats.submissions.gradedSubmissions} / {stats.submissions.totalSubmissions})</span>
                <span className="font-semibold text-foreground">{stats.submissions.gradingRate}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.submissions.gradingRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Grading
                </div>
                <div className="text-lg font-bold text-foreground">{stats.submissions.pendingSubmissions}</div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Award className="w-3.5 h-3.5 text-purple-500" /> Average Marks
                </div>
                <div className="text-lg font-bold text-foreground">
                  {stats.submissions.averageMarks !== null ? `${stats.submissions.averageMarks}` : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Quick System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Active School Classes</span>
                <span className="font-semibold text-foreground">{stats.academics.totalClasses}</span>
              </li>
              <li className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Offered Subjects</span>
                <span className="font-semibold text-foreground">{stats.academics.totalSubjects}</span>
              </li>
              <li className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Teacher Subject Allocations</span>
                <span className="font-semibold text-foreground">{stats.academics.totalAllocations}</span>
              </li>
              <li className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Total Student Submissions Recorded</span>
                <span className="font-semibold text-foreground">{stats.submissions.totalSubmissions}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
