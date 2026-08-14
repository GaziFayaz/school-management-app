'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gradeTeacherSubmission, TeacherSubmission } from '@/lib/api-teacher';
import { getFileUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Award,
  Clock,
  User,
  MessageSquare,
} from 'lucide-react';

interface PdfPreviewGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: TeacherSubmission | null;
  onGraded?: () => void;
}

export default function PdfPreviewGradingModal({
  isOpen,
  onClose,
  submission,
  onGraded,
}: PdfPreviewGradingModalProps) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<number | string>('');
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when submission opens
  useEffect(() => {
    if (submission) {
      setMarks(submission.marks !== null && submission.marks !== undefined ? submission.marks : '');
      setFeedback(submission.feedback || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [submission]);

  const gradeMutation = useMutation({
    mutationFn: async () => {
      if (!submission) return;
      const numMarks = typeof marks === 'string' ? parseFloat(marks) : marks;
      return gradeTeacherSubmission(submission.id, {
        marks: numMarks || 0,
        feedback: feedback.trim(),
      });
    },
    onSuccess: () => {
      setSuccessMsg('Grade and feedback saved successfully!');
      setErrorMsg(null);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions', submission?.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignment-detail', submission?.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview-stats'] });

      if (onGraded) onGraded();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to save grade.');
      setSuccessMsg(null);
    },
  });

  if (!submission) return null;

  const fullFileUrl = getFileUrl(submission.fileUrl);

  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numMarks = typeof marks === 'string' ? parseFloat(marks) : marks;

    if (isNaN(numMarks)) {
      setErrorMsg('Please enter a valid numeric mark.');
      return;
    }

    if (numMarks < 0 || numMarks > submission.assignmentMaxMarks) {
      setErrorMsg(`Marks must be between 0 and the maximum marks (${submission.assignmentMaxMarks}).`);
      return;
    }

    gradeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header Bar */}
        <DialogHeader className="px-6 py-3.5 border-b border-border bg-card flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="truncate">
              <DialogTitle className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                <span>{submission.studentName}</span>
                <span className="text-muted-foreground font-normal text-xs">({submission.studentEmail})</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate font-mono">
                {submission.fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mr-6 shrink-0">
            <Button variant="secondary" size="sm" asChild className="h-8 text-xs">
              <a href={fullFileUrl} download={submission.fileName} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> New Tab
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* Side-by-Side Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-muted/20">
          {/* Left Pane: PDF Viewer (65% width on desktop) */}
          <div className="lg:col-span-8 h-full bg-muted/40 p-2 sm:p-3 flex flex-col relative border-r border-border overflow-hidden">
            <iframe
              src={`${fullFileUrl}#toolbar=0`}
              className="w-full h-full rounded border border-border bg-white"
              title={submission.fileName}
            />
          </div>

          {/* Right Pane: Interactive Grading Panel (35% width on desktop) */}
          <div className="lg:col-span-4 h-full bg-card p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* Status & Submission Metadata */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" /> Evaluation & Grading
                </span>
                <Badge variant={submission.status === 'Graded' ? 'default' : 'secondary'} className="text-[11px]">
                  {submission.status}
                </Badge>
              </div>

              <div className="bg-muted/40 p-3 rounded-lg border border-border/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Student:
                  </span>
                  <span className="font-semibold text-foreground">{submission.studentName}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Submitted:
                  </span>
                  <span className="text-foreground">{new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Maximum Marks:</span>
                  <Badge variant="outline" className="font-bold text-foreground">
                    {submission.assignmentMaxMarks} Marks
                  </Badge>
                </div>
              </div>

              {/* Grading Form */}
              <form id="grading-form" onSubmit={handleSubmitGrade} className="space-y-3.5 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">
                      Awarded Marks <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Max: {submission.assignmentMaxMarks}
                    </span>
                  </div>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max={submission.assignmentMaxMarks}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`e.g. ${Math.round(submission.assignmentMaxMarks * 0.85)}`}
                    required
                    className="h-9 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> Teacher Feedback
                  </label>
                  <Textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide constructive feedback or explanations for deducted points..."
                    className="resize-none text-xs"
                  />
                </div>

                {errorMsg && (
                  <Alert variant="destructive" className="py-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}

                {successMsg && (
                  <Alert className="py-2 text-xs border-primary/30 bg-primary/10 text-primary">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <AlertDescription className="text-primary font-medium">{successMsg}</AlertDescription>
                  </Alert>
                )}
              </form>
            </div>

            {/* Panel Footer Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
              <Button
                type="submit"
                form="grading-form"
                size="sm"
                disabled={gradeMutation.isPending}
                className="text-xs flex items-center gap-1.5"
              >
                {gradeMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> {submission.status === 'Graded' ? 'Update Grade' : 'Submit Grade'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
