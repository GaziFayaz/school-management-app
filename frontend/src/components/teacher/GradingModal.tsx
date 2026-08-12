'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

  if (!isOpen || !submission) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Grade Student Submission</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Student</label>
            <div className="text-sm font-semibold text-white">{submission.studentName}</div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Submission PDF</label>
            <div className="text-xs text-sky-400 font-medium bg-sky-500/10 p-2.5 rounded-lg border border-sky-500/20 truncate">
              {submission.fileName}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">
              Marks (Max: {submission.assignmentMaxMarks})
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={submission.assignmentMaxMarks}
              value={marks}
              onChange={(e) => setMarks(parseFloat(e.target.value) || 0)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1">Teacher Feedback</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for the student..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gradeMutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center gap-1.5"
            >
              {gradeMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Submit Grade
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
