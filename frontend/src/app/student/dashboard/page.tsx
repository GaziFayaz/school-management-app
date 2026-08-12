'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PdfUploader from '@/components/pdf/PdfUploader';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { GraduationCap, Calendar, Award, Upload, Eye, Download, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // TanStack Query: Fetch student's enrolled assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: async () => (await apiClient.get('/student/submissions/my-assignments')).data,
  });

  // Submit PDF Mutation
  const submitPdfMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !submittingAssignment) return;
      const formData = new FormData();
      formData.append('assignmentId', submittingAssignment.id);
      formData.append('file', selectedFile);

      const res = await apiClient.post('/student/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      setSubmittingAssignment(null);
      setSelectedFile(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to submit assignment.');
    },
  });

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <GraduationCap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Student Dashboard</h1>
              <p className="text-xs text-slate-400">View enrolled assignments, submit PDF answers, preview submissions, and track grades</p>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
            No active assignments found for your enrolled classes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((a: any) => {
              const isPastDeadline = new Date() > new Date(a.deadline);

              return (
                <div key={a.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {a.className} • {a.subjectName}
                      </span>
                      {a.isSubmitted ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          a.submissionStatus === 'Graded' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        }`}>
                          {a.submissionStatus === 'Graded' ? 'Graded' : 'Submitted'}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isPastDeadline ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {isPastDeadline ? 'Overdue' : 'Pending'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3">{a.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {new Date(a.deadline).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-slate-200">Max: {a.maxMarks} Marks</span>
                    </div>

                    {/* Submission status or Grade details */}
                    {a.isSubmitted ? (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-mono truncate max-w-[150px]">{a.fileName}</span>
                          
                          {/* PDF Preview & Download Actions */}
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => setPreviewPdf({ url: a.fileUrl, name: a.fileName })}
                              className="px-2 py-1 text-[10px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded font-medium"
                            >
                              Preview
                            </button>
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}${a.fileUrl}`}
                              download={a.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {a.submissionStatus === 'Graded' && (
                          <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="font-bold text-emerald-300 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-emerald-400" /> Grade: {a.marks} / {a.maxMarks}
                            </div>
                            {a.feedback && <div className="text-slate-300 text-[11px]">Feedback: {a.feedback}</div>}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Submit / Re-submit Button */}
                    {a.submissionStatus !== 'Graded' && !isPastDeadline && (
                      <button
                        onClick={() => { setSubmittingAssignment(a); setSelectedFile(null); setErrorMsg(null); }}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-500/15"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {a.isSubmitted ? 'Resubmit PDF Answer' : 'Submit PDF Answer'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Submit PDF Modal */}
        {submittingAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Submit Answer PDF</h3>
                  <p className="text-xs text-slate-400">{submittingAssignment.title}</p>
                </div>
                <button onClick={() => setSubmittingAssignment(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PDF Drag-and-Drop Uploader */}
              <PdfUploader
                onFileSelect={(file) => setSelectedFile(file)}
                isUploading={submitPdfMutation.isPending}
              />

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 border border-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || submitPdfMutation.isPending}
                  onClick={() => submitPdfMutation.mutate()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Submit to Teacher
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        <PdfPreviewModal
          isOpen={!!previewPdf}
          onClose={() => setPreviewPdf(null)}
          fileUrl={previewPdf?.url || ''}
          fileName={previewPdf?.name || ''}
        />

      </div>
    </ProtectedRoute>
  );
}
