'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTeacherAssignmentDetail,
  fetchTeacherSubmissions,
  toggleAssignmentStatus,
  deleteTeacherAssignment,
  TeacherSubmission,
} from '@/lib/api-teacher';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import DataTable, { ColumnDef, FilterTabOption } from '@/components/ui/data-table';
import PdfPreviewGradingModal from '@/components/pdf/PdfPreviewGradingModal';
import AssignmentEditModal from '@/components/teacher/AssignmentEditModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getFileUrl } from '@/lib/utils';
import {
  ChevronLeft,
  Calendar,
  Award,
  Users,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  FileText,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  BookOpen,
} from 'lucide-react';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<TeacherSubmission | null>(null);

  // Filter state for submissions table
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Queries
  const { data: assignment, isLoading: isAssignmentLoading } = useQuery({
    queryKey: ['teacher-assignment-detail', assignmentId],
    queryFn: () => fetchTeacherAssignmentDetail(assignmentId),
  });

  const { data: submissions = [], isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['teacher-submissions', assignmentId],
    queryFn: () => fetchTeacherSubmissions(assignmentId),
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      toggleAssignmentStatus(
        assignmentId,
        assignment?.status === 'Published' ? 'Draft' : 'Published'
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignment-detail', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteTeacherAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      router.push('/teacher/dashboard?tab=assignments');
    },
  });

  if (isAssignmentLoading) {
    return (
      <ProtectedRoute allowedRoles={['Teacher']}>
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Loading assignment details...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (!assignment) {
    return (
      <ProtectedRoute allowedRoles={['Teacher']}>
        <div className="py-20 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Assignment not found or unauthorized.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/teacher/dashboard?tab=assignments">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const isPastDeadline = new Date() > new Date(assignment.deadline);
  const pendingCount = submissions.filter((s) => s.status === 'Submitted').length;
  const gradedCount = submissions.filter((s) => s.status === 'Graded').length;

  // Filter submissions by status tab
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter === 'pending') return sub.status === 'Submitted';
    if (statusFilter === 'graded') return sub.status === 'Graded';
    return true;
  });

  // Filter tab options for DataTable
  const filterOptions: FilterTabOption[] = [
    { label: 'All Submissions', value: 'all', count: submissions.length },
    { label: 'Pending Grading', value: 'pending', count: pendingCount },
    { label: 'Graded', value: 'graded', count: gradedCount },
  ];

  // Reusable columns definition for Submissions DataTable
  const columns: ColumnDef<TeacherSubmission>[] = [
    {
      header: 'Student',
      accessorKey: 'studentName',
      sortable: true,
      cell: (sub) => (
        <div>
          <div className="font-semibold text-foreground">{sub.studentName}</div>
          <div className="text-[11px] text-muted-foreground">{sub.studentEmail}</div>
        </div>
      ),
    },
    {
      header: 'Submitted Date',
      accessorKey: 'submittedAt',
      sortable: true,
      cell: (sub) => (
        <span className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (sub) => (
        <Badge
          variant={sub.status === 'Graded' ? 'default' : 'secondary'}
          className="text-[11px] font-medium"
        >
          {sub.status}
        </Badge>
      ),
    },
    {
      header: 'Marks',
      accessorKey: 'marks',
      sortable: true,
      cell: (sub) => (
        <div>
          {sub.status === 'Graded' && sub.marks !== null && sub.marks !== undefined ? (
            <span className="font-bold text-primary text-xs">
              {sub.marks} / {assignment.maxMarks}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs italic">Ungraded</span>
          )}
        </div>
      ),
    },
    {
      header: 'Feedback',
      accessorKey: 'feedback',
      cell: (sub) => (
        <span className="text-muted-foreground text-xs line-clamp-1 max-w-[200px]" title={sub.feedback || ''}>
          {sub.feedback || <span className="italic text-[11px] opacity-60">None provided</span>}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (sub) => (
        <div className="flex items-center justify-end space-x-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedSubmission(sub)}
            className="h-7 text-[11px] px-2.5 flex items-center gap-1 font-medium"
          >
            <Eye className="w-3 h-3" /> Preview & Grade
          </Button>
          <Button variant="outline" size="sm" asChild className="h-7 w-7 p-0" title="Download PDF">
            <a href={getFileUrl(sub.fileUrl)} download={sub.fileName} target="_blank" rel="noopener noreferrer">
              <Download className="w-3 h-3" />
            </a>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumbs & Back link */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="text-xs -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/teacher/dashboard?tab=assignments">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Assignments
            </Link>
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="h-8 text-xs flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Assignment
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="h-8 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>

        {/* Hero Header Card */}
        <Card className="p-6 space-y-4 border-border/80 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
                  {assignment.className} {assignment.classGradeLevel ? `• Grade ${assignment.classGradeLevel}` : ''}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  {assignment.subjectName} {assignment.subjectCode ? `(${assignment.subjectCode})` : ''}
                </Badge>
                <Badge variant={assignment.status === 'Published' ? 'default' : 'secondary'} className="text-xs font-semibold">
                  {assignment.status}
                </Badge>
                {isPastDeadline && (
                  <Badge variant="destructive" className="text-xs font-semibold">
                    Overdue
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-foreground tracking-tight">{assignment.title}</h1>
            </div>

            <Button
              variant={assignment.status === 'Published' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => toggleStatusMutation.mutate()}
              disabled={toggleStatusMutation.isPending}
              className="h-8 text-xs self-start lg:self-auto"
            >
              {assignment.status === 'Published' ? 'Published (Click to Unpublish)' : 'Draft (Click to Publish)'}
            </Button>
          </div>

          {/* Metadata Bar */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Due: {new Date(assignment.deadline).toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <Award className="w-3.5 h-3.5 text-primary" /> Maximum Marks: {assignment.maxMarks}
              </span>
            </div>

            <span className="text-[11px]">
              Created: {new Date(assignment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Description / Instructions */}
          <div className="pt-3 border-t border-border/60">
            <h3 className="text-xs font-semibold text-foreground mb-1">Instructions & Guidelines:</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/30 p-3.5 rounded-lg border border-border/50">
              {assignment.description}
            </p>
          </div>
        </Card>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> Enrolled Students
            </span>
            <div className="text-xl font-bold text-foreground">{assignment.enrolledStudentsCount}</div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" /> Submissions
            </span>
            <div className="text-xl font-bold text-foreground">
              {assignment.submissionsCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({assignment.enrolledStudentsCount > 0 ? Math.round((assignment.submissionsCount / assignment.enrolledStudentsCount) * 100) : 0}%)
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Graded
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {assignment.gradedSubmissionsCount}
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Grading
            </span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {assignment.pendingGradingCount || pendingCount}
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/70 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" /> Class Average
            </span>
            <div className="text-xl font-bold text-primary">
              {assignment.averageMarks !== null && assignment.averageMarks !== undefined
                ? `${assignment.averageMarks.toFixed(1)} / ${assignment.maxMarks}`
                : 'N/A'}
            </div>
          </Card>
        </div>

        {/* Submissions Section with Reusable DataTable */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" /> Student PDF Submissions ({submissions.length})
            </h2>
          </div>

          <DataTable<TeacherSubmission>
            columns={columns}
            data={filteredSubmissions}
            searchKey="studentName"
            searchPlaceholder="Filter by student name or email..."
            filterOptions={filterOptions}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            isLoading={isSubmissionsLoading}
            emptyMessage="No student submissions found matching the selected filter."
          />
        </div>

        {/* Side-by-Side PDF Preview & Interactive Grading Modal */}
        <PdfPreviewGradingModal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          submission={selectedSubmission}
        />

        {/* Assignment Edit Modal */}
        <AssignmentEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          assignment={assignment}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Delete Assignment
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 text-xs text-muted-foreground space-y-2">
              <p>
                Are you sure you want to delete <span className="font-bold text-foreground">"{assignment.title}"</span>?
              </p>
              <p className="text-destructive font-medium">
                This action is permanent and will remove all student submissions and grades associated with this assignment.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="text-xs flex items-center gap-1"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
