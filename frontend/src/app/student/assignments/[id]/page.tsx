'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudentAssignmentDetail,
  submitStudentAssignment,
} from '@/lib/api-student';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PdfUploader from '@/components/pdf/PdfUploader';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getFileUrl } from '@/lib/utils';
import {
  ChevronLeft,
  Calendar,
  Award,
  BookOpen,
  User,
  Mail,
  Clock,
  CheckCircle2,
  FileText,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  School,
  FileCheck,
} from 'lucide-react';

export default function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isResubmitting, setIsResubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: assignment, isLoading, isError } = useQuery({
    queryKey: ['student-assignment-detail', assignmentId],
    queryFn: () => fetchStudentAssignmentDetail(assignmentId),
  });

  const submitMutation = useMutation({
    mutationFn: async (file: File) => {
      return await submitStudentAssignment(assignmentId, file);
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Assignment submitted successfully!');
      setErrorMessage(null);
      setSelectedFile(null);
      setIsResubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['student-assignment-detail', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-grades'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to submit assignment. Please try again.');
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    submitMutation.mutate(selectedFile);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['Student']}>
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Loading assignment details...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (isError || !assignment) {
    return (
      <ProtectedRoute allowedRoles={['Student']}>
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/dashboard?tab=assignments" className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back to Assignments
            </Link>
          </Button>
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Assignment Not Found</AlertTitle>
            <AlertDescription>
              The assignment does not exist or you are not enrolled in the associated class.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  const deadlineDate = new Date(assignment.deadline);
  const isOverdue = new Date() > deadlineDate;
  const isSubmitted = assignment.isSubmitted;
  const isGraded = assignment.submissionStatus === 'Graded';
  const fullPdfUrl = assignment.fileUrl ? getFileUrl(assignment.fileUrl) : '';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" asChild className="hover:bg-muted">
            <Link href="/student/dashboard?tab=assignments" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> Back to Assignments
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] bg-background">
              Class: {assignment.className}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {assignment.subjectName}
            </Badge>
          </div>
        </div>

        {/* Hero Header Card */}
        <Card className="border border-border/80 shadow-sm bg-gradient-to-b from-card to-muted/20">
          <CardHeader className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {assignment.subjectCode || 'ACADEMIC'}
                  </Badge>
                  {isGraded ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                      <Award className="w-3 h-3 mr-1" /> Graded: {assignment.marks} / {assignment.maxMarks}
                    </Badge>
                  ) : isSubmitted ? (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                    </Badge>
                  ) : isOverdue ? (
                    <Badge variant="destructive" className="font-medium">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
                      <Clock className="w-3 h-3 mr-1" /> Pending Submission
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {assignment.title}
                </h1>
              </div>

              {/* Deadline & Max Marks Block */}
              <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border border-border/60">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Due: {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>Max Marks: {assignment.maxMarks}</span>
                </div>
              </div>
            </div>

            {/* Teacher & Class Info Bar */}
            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                  {assignment.teacherName ? assignment.teacherName.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <span className="font-medium text-foreground">{assignment.teacherName}</span>
                  {assignment.teacherEmail && (
                    <span className="text-[11px] text-muted-foreground ml-1.5">({assignment.teacherEmail})</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5" /> Grade {assignment.classGradeLevel} • {assignment.className}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {assignment.subjectName}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status Alerts */}
        {successMessage && (
          <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Column: Assignment Instructions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border/80 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Assignment Instructions & Brief
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
                  {assignment.description || 'No detailed instructions provided for this assignment.'}
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Assigned by {assignment.teacherName}</span>
                  <span>PDF submission format only (max 10MB)</span>
                </div>
              </CardContent>
            </Card>

            {/* If Graded: Teacher Evaluation & Feedback Card */}
            {isGraded && (
              <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                <CardHeader className="pb-3 border-b border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Teacher Evaluation & Feedback
                    </CardTitle>
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-3 py-1">
                      {assignment.marks} / {assignment.maxMarks} Marks (
                      {Math.round(((assignment.marks || 0) / assignment.maxMarks) * 100)}%)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher Feedback:</span>
                    <p className="mt-1.5 text-sm text-foreground bg-background/80 p-3.5 rounded-lg border border-border/80 whitespace-pre-wrap leading-relaxed">
                      {assignment.feedback || 'Good effort! No detailed commentary provided.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Submission Status & Action */}
          <div className="space-y-6">
            {/* If Submitted: Submission Info Box */}
            {isSubmitted && !isResubmitting ? (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Your Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate" title={assignment.fileName}>
                            {assignment.fileName || 'Submission.pdf'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(assignment.fileSize)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium text-foreground">Submitted on: </span>
                        {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Status: </span>
                        <span className={`font-semibold ${isGraded ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {assignment.submissionStatus || 'Submitted'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" /> Preview Submitted PDF
                    </Button>

                    <Button variant="secondary" size="sm" asChild className="w-full">
                      <a href={fullPdfUrl} download={assignment.fileName || 'submission.pdf'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </a>
                    </Button>

                    {/* Resubmit option if not graded and deadline not passed */}
                    {!isGraded && !isOverdue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsResubmitting(true)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replace / Resubmit PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* If NOT Submitted or Resubmitting: Upload Form */}
            {(!isSubmitted || isResubmitting) && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary" />
                      {isResubmitting ? 'Replace Submission' : 'Submit Assignment'}
                    </CardTitle>
                    {isResubmitting && (
                      <Button variant="ghost" size="sm" onClick={() => setIsResubmitting(false)} className="text-xs h-7 px-2">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {isOverdue ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertTitle>Deadline Expired</AlertTitle>
                      <AlertDescription>
                        The deadline for this assignment has passed. Submissions are no longer accepted.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <PdfUploader
                        onFileSelect={(file) => setSelectedFile(file)}
                        isUploading={submitMutation.isPending}
                      />

                      <Button
                        type="submit"
                        disabled={!selectedFile || submitMutation.isPending}
                        className="w-full"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading & Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {isResubmitting ? 'Update Submission' : 'Submit Assignment'}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Meta Card */}
            <Card className="border border-border/80 bg-muted/20">
              <CardContent className="pt-4 text-xs space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="font-semibold text-foreground">{assignment.className}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <span className="font-semibold text-foreground">{assignment.subjectName} ({assignment.subjectCode})</span>
                </div>
                <div className="flex justify-between">
                  <span>Instructor:</span>
                  <span className="font-semibold text-foreground">{assignment.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Marks:</span>
                  <span className="font-semibold text-foreground">{assignment.maxMarks}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PDF Preview Modal */}
        {assignment.fileUrl && (
          <PdfPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            fileUrl={assignment.fileUrl}
            fileName={assignment.fileName || 'submission.pdf'}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
