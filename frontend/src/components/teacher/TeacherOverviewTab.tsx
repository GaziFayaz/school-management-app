'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherOverviewStats, TeacherSubmission } from '@/lib/api-teacher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable, { ColumnDef } from '@/components/ui/data-table';
import PdfPreviewGradingModal from '@/components/pdf/PdfPreviewGradingModal';
import {
  School,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Plus,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface TeacherOverviewTabProps {
  onCreateAssignment: () => void;
  onNavigateTab: (tab: string) => void;
}

export default function TeacherOverviewTab({
  onCreateAssignment,
  onNavigateTab,
}: TeacherOverviewTabProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<TeacherSubmission | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-overview-stats'],
    queryFn: fetchTeacherOverviewStats,
  });

  const recentColumns: ColumnDef<TeacherSubmission>[] = [
    {
      header: 'Student',
      accessorKey: 'studentName',
      cell: (sub) => (
        <div>
          <div className="font-semibold text-foreground">{sub.studentName}</div>
          <div className="text-[11px] text-muted-foreground">{sub.studentEmail}</div>
        </div>
      ),
    },
    {
      header: 'Assignment & Class',
      cell: (sub) => (
        <div>
          <div className="font-medium text-foreground text-xs">{sub.assignmentTitle}</div>
          <div className="text-[11px] text-muted-foreground">
            {sub.className} • {sub.subjectName}
          </div>
        </div>
      ),
    },
    {
      header: 'Submitted At',
      accessorKey: 'submittedAt',
      cell: (sub) => (
        <span className="text-muted-foreground text-[11px] flex items-center gap-1">
          <Clock className="w-3 h-3 text-muted-foreground" />
          {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (sub) => (
        <Badge variant={sub.status === 'Graded' ? 'default' : 'secondary'} className="text-[10px]">
          {sub.status}
        </Badge>
      ),
    },
    {
      header: 'Marks',
      cell: (sub) => (
        <span className="text-xs font-semibold">
          {sub.status === 'Graded' && sub.marks !== null && sub.marks !== undefined ? (
            <span className="text-primary font-bold">{sub.marks} / {sub.assignmentMaxMarks}</span>
          ) : (
            <span className="text-muted-foreground italic font-normal">Pending</span>
          )}
        </span>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (sub) => (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedSubmission(sub)}
            className="h-7 text-[11px] px-2.5 flex items-center gap-1 font-medium"
          >
            <Eye className="w-3 h-3" /> Preview & Grade
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border/80 space-y-1.5 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Assigned Classes</span>
            <div className="p-2 bg-primary/10 rounded-lg">
              <School className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? '-' : stats?.classesCount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Across {stats?.allocationsCount || 0} subject allocations
          </p>
        </Card>

        <Card className="p-4 bg-card border-border/80 space-y-1.5 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Students Taught</span>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? '-' : stats?.studentsCount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Enrolled active students</p>
        </Card>

        <Card className="p-4 bg-card border-border/80 space-y-1.5 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Assignments</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <BookOpen className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? '-' : stats?.activeAssignmentsCount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {stats?.publishedAssignmentsCount || 0} published • {stats?.draftAssignmentsCount || 0} drafts
          </p>
        </Card>

        <Card
          className={`p-4 bg-card border-border/80 space-y-1.5 transition-all shadow-sm ${
            (stats?.pendingSubmissionsCount || 0) > 0 ? 'border-amber-500/40 bg-amber-500/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Pending Grading</span>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {isLoading ? '-' : stats?.pendingSubmissionsCount || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {stats?.gradingRate || 0}% grading completed
          </p>
        </Card>
      </div>

      {/* Quick Action Shortcuts Banner */}
      <Card className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Educator Quick Actions
          </h3>
          <p className="text-xs text-muted-foreground">
            Create new coursework assignments or jump directly into class rosters
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button onClick={onCreateAssignment} size="sm" className="text-xs flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Create New Assignment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('classes')}
            className="text-xs flex items-center gap-1.5"
          >
            <School className="w-3.5 h-3.5" /> View My Classes
          </Button>
        </div>
      </Card>

      {/* Recent Submissions Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" /> Recent Student Submissions
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('assignments')}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            View All Assignments <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <DataTable<TeacherSubmission>
          columns={recentColumns}
          data={stats?.recentSubmissions || []}
          isLoading={isLoading}
          emptyMessage="No recent submissions received yet."
          pageSize={6}
        />
      </div>

      {/* PDF Preview & Interactive Grading Modal */}
      <PdfPreviewGradingModal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
      />
    </div>
  );
}
