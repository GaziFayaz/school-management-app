'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import GradingModal from '@/components/teacher/GradingModal';
import { BookOpen, Plus, Eye, CheckCircle, FileText, Calendar, Award, X, Edit, Trash2 } from 'lucide-react';

export default function TeacherDashboard() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // Modal Preview & Grade States
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Published');

  // TanStack Queries
  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: async () => (await apiClient.get('/teacher/assignments')).data,
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['teacher-allocations'],
    queryFn: async () => (await apiClient.get('/teacher/assignments/my-allocations')).data,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['teacher-submissions', selectedAssignmentId],
    queryFn: async () => {
      if (!selectedAssignmentId) return [];
      return (await apiClient.get(`/teacher/submissions/assignment/${selectedAssignmentId}`)).data;
    },
    enabled: !!selectedAssignmentId,
  });

  // Create Assignment Mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/teacher/assignments', {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks,
        classId,
        subjectId,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setIsCreateOpen(false);
      setTitle(''); setDescription(''); setDeadline('');
    },
  });

  // Toggle Draft / Published Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      return apiClient.patch(`/teacher/assignments/${id}/status?status=${newStatus}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });

  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <div className="space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Teacher Dashboard</h1>
              <p className="text-xs text-slate-400">Manage assignments, draft/publish status, and grade student PDF submissions</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create New Assignment
          </button>
        </div>

        {/* Content Layout: Assignments List + Submissions Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Assignments Column */}
          <div className={`${selectedAssignmentId ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4 transition-all`}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Created Assignments ({assignments.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {assignments.map((a: any) => (
                <div
                  key={a.id}
                  className={`p-5 bg-slate-900 rounded-2xl border transition-all ${
                    selectedAssignmentId === a.id ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {a.className} • {a.subjectName}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{a.title}</h3>
                    </div>

                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: a.id, newStatus: a.status === 'Published' ? 'Draft' : 'Published' })}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                        a.status === 'Published'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      }`}
                    >
                      {a.status}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-2">{a.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Due: {new Date(a.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-200">
                      <Award className="w-3.5 h-3.5 text-emerald-400" /> Max: {a.maxMarks} Marks
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedAssignmentId(selectedAssignmentId === a.id ? null : a.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
                        selectedAssignmentId === a.id
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {selectedAssignmentId === a.id ? 'Close Submissions' : 'View Student Submissions'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions Drawer */}
          {selectedAssignmentId && (
            <div className="lg:col-span-6 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Student PDF Submissions ({submissions.length})
                </h3>
                <button onClick={() => setSelectedAssignmentId(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No student submissions received yet.</div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub: any) => (
                    <div key={sub.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{sub.studentName}</h4>
                          <span className="text-[11px] text-slate-400">{sub.studentEmail}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          sub.status === 'Graded' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        }`}>{sub.status}</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-300 truncate font-mono">{sub.fileName}</span>
                        
                        {/* Click to Preview Button & Download Action */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setPreviewPdf({ url: sub.fileUrl, name: sub.fileName })}
                            className="px-2.5 py-1 text-[11px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-md font-medium"
                          >
                            Click to Preview
                          </button>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}${sub.fileUrl}`}
                            download={sub.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md font-medium"
                          >
                            Download
                          </a>
                        </div>
                      </div>

                      {sub.status === 'Graded' && (
                        <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-lg text-xs space-y-1">
                          <div className="font-semibold text-emerald-300">Awarded Marks: {sub.marks} / {sub.assignmentMaxMarks}</div>
                          {sub.feedback && <div className="text-slate-300 text-[11px]">Feedback: {sub.feedback}</div>}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setGradingSubmission(sub)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> {sub.status === 'Graded' ? 'Edit Grade' : 'Grade Submission'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Create Assignment Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Create New Assignment</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createAssignmentMutation.mutate(); }} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Class & Subject Allocation</label>
                  <select
                    onChange={(e) => {
                      const [cId, sId] = e.target.value.split('|');
                      setClassId(cId); setSubjectId(sId);
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Allocated Class & Subject</option>
                    {allocations.map((alloc: any, i: number) => (
                      <option key={i} value={`${alloc.classId}|${alloc.subjectId}`}>
                        {alloc.className} — {alloc.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Algebra Problem Set 1" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Description & Instructions</label>
                  <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Solve Chapter 3 problems and submit your solution PDF..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Deadline Date & Time</label>
                    <input type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Maximum Marks</label>
                    <input type="number" min="1" required value={maxMarks} onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 100)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Publish Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="Published">Publish Immediately</option>
                    <option value="Draft">Keep as Draft</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-medium text-slate-400 border border-slate-700 rounded-lg">Cancel</button>
                  <button type="submit" disabled={createAssignmentMutation.isPending} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg">Create Assignment</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PDF Preview Modal Component */}
        <PdfPreviewModal
          isOpen={!!previewPdf}
          onClose={() => setPreviewPdf(null)}
          fileUrl={previewPdf?.url || ''}
          fileName={previewPdf?.name || ''}
        />

        {/* Teacher Grading Modal Component */}
        <GradingModal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          submission={gradingSubmission}
        />

      </div>
    </ProtectedRoute>
  );
}
