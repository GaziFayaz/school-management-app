'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminAssignmentDetail,
  fetchAdminAssignmentSubmissions,
  deleteAdminAssignment,
  AdminSubmissionItem,
} from '@/lib/api-admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FileText, Calendar, Award, User, BookOpen, Trash2, ExternalLink, Download, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { getFileUrl } from '@/lib/utils';

interface AssignmentDetailModalProps {
  assignmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentDetailModal({ assignmentId, isOpen, onClose }: AssignmentDetailModalProps) {
  const queryClient = useQueryClient();

  const { data: assignment, isLoading: isAssignmentLoading } = useQuery({
    queryKey: ['admin-assignment-detail', assignmentId],
    queryFn: () => (assignmentId ? fetchAdminAssignmentDetail(assignmentId) : null),
    enabled: !!assignmentId && isOpen,
  });

  const { data: submissions = [], isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['admin-assignment-submissions', assignmentId],
    queryFn: () => (assignmentId ? fetchAdminAssignmentSubmissions(assignmentId) : []),
    enabled: !!assignmentId && isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminAssignment(assignmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Assignment Detail & Submissions
            </span>
            {assignment && (
              <Badge variant={assignment.status === 'Published' ? 'default' : 'secondary'}>
                {assignment.status}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review comprehensive assignment metadata, instructions, and all student submissions.
          </DialogDescription>
        </DialogHeader>

        {isAssignmentLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !assignment ? (
          <div className="p-4 text-center text-xs text-destructive">Assignment details could not be loaded.</div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Header Metadata Card */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border/50 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <div>
                  <h3 className="text-base font-bold text-foreground">{assignment.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" /> {assignment.className} ({assignment.gradeLevel}) &bull; {assignment.subjectName} ({assignment.subjectCode})
                    </span>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-left sm:text-right space-y-1">
                  <div className="flex items-center gap-1 sm:justify-end">
                    <User className="w-3.5 h-3.5" /> Teacher: <span className="font-semibold text-foreground">{assignment.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Calendar className="w-3.5 h-3.5" /> Deadline: <span className="font-semibold text-foreground">{new Date(assignment.deadline).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Award className="w-3.5 h-3.5" /> Max Marks: <span className="font-semibold text-foreground">{assignment.maxMarks}</span>
                  </div>
                </div>
              </div>

              {assignment.description && (
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1">Instructions & Description</span>
                  <p className="text-xs text-foreground whitespace-pre-wrap bg-background/60 p-2.5 rounded border border-border/50">
                    {assignment.description}
                  </p>
                </div>
              )}
            </div>

            {/* Submissions Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Student Submissions ({submissions.length})</span>
                <span className="text-muted-foreground text-[11px]">
                  Graded: {submissions.filter((s) => s.status === 'Graded').length} / {submissions.length}
                </span>
              </h4>

              {isSubmissionsLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/20 p-4 rounded text-center">
                  No student submissions received for this assignment yet.
                </p>
              ) : (
                <Table className="border rounded-md">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Submission File</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Grade / Marks</TableHead>
                      <TableHead className="text-xs">Teacher Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub: AdminSubmissionItem) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="font-medium text-xs text-foreground">{sub.studentName}</div>
                          <div className="text-[11px] text-muted-foreground">{sub.studentEmail}</div>
                        </TableCell>
                        <TableCell>
                          {sub.fileUrl ? (
                            <a
                              href={getFileUrl(sub.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              <Download className="w-3.5 h-3.5" /> {sub.fileName || 'View File'}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">No File</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.status === 'Graded' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {sub.status === 'Graded' ? (
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1 text-amber-400" />
                            )}
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {sub.marks !== null ? `${sub.marks} / ${assignment.maxMarks}` : 'Un-graded'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={sub.feedback || ''}>
                          {sub.feedback || 'No feedback'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this assignment and all associated student submissions?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Assignment
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
