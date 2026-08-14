'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SubmissionData {
  id: string;
  assignmentId: string;
  studentName: string;
  fileName: string;
  fileUrl: string;
  marks?: number;
  feedback?: string;
  assignmentMaxMarks: number;
}

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionData | null;
}

export default function GradingModal({ isOpen, onClose, submission }: GradingModalProps) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<number>(submission?.marks || 0);
  const [feedback, setFeedback] = useState<string>(submission?.feedback || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/teacher/submissions/${submission?.id}/grade`, {
        marks,
        feedback,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions', submission?.assignmentId] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to submit grade.');
    },
  });

  if (!submission) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (marks < 0 || marks > submission.assignmentMaxMarks) {
      setErrorMsg(`Marks must be between 0 and maximum marks (${submission.assignmentMaxMarks}).`);
      return;
    }

    gradeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grade Student Submission</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs text-muted-foreground font-medium mb-1">Student</label>
            <div className="text-sm font-semibold text-foreground">{submission.studentName}</div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground font-medium mb-1">Submission PDF</label>
            <div className="text-xs text-primary font-medium bg-primary/10 p-2.5 rounded border border-primary/20 truncate">
              {submission.fileName}
            </div>
          </div>

          <div>
            <label className="block text-xs text-foreground font-medium mb-1">
              Marks (Max: {submission.assignmentMaxMarks})
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max={submission.assignmentMaxMarks}
              value={marks}
              onChange={(e) => setMarks(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-foreground font-medium mb-1">Teacher Feedback</label>
            <Textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for the student..."
              className="resize-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Submit Grade
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
