'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import GradingModal from '@/components/teacher/GradingModal';
import { BookOpen, Plus, Eye, CheckCircle, FileText, Calendar, Award, X, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Teacher Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage assignments, draft/publish status, and grade student PDF submissions</p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create New Assignment
          </Button>
        </Card>

        {/* Content Layout: Assignments List + Submissions Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Assignments Column */}
          <div className={`${selectedAssignmentId ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4 transition-all`}>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Created Assignments ({assignments.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {assignments.map((a: any) => (
                <Card
                  key={a.id}
                  className={`p-5 border transition-all ${
                    selectedAssignmentId === a.id ? 'border-primary ring-1 ring-primary/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {a.className} • {a.subjectName}
                      </Badge>
                      <h3 className="text-base font-bold text-foreground mt-1.5">{a.title}</h3>
                    </div>

                    <Button
                      variant={a.status === 'Published' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: a.id, newStatus: a.status === 'Published' ? 'Draft' : 'Published' })}
                      className="h-7 text-[11px]"
                    >
                      {a.status}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{a.description}</p>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Due: {new Date(a.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Award className="w-3.5 h-3.5 text-primary" /> Max: {a.maxMarks} Marks
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <Button
                      variant={selectedAssignmentId === a.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAssignmentId(selectedAssignmentId === a.id ? null : a.id)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {selectedAssignmentId === a.id ? 'Close Submissions' : 'View Student Submissions'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Submissions Drawer */}
          {selectedAssignmentId && (
            <Card className="lg:col-span-6 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" /> Student PDF Submissions ({submissions.length})
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAssignmentId(null)} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">No student submissions received yet.</div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub: any) => (
                    <Card key={sub.id} className="p-4 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{sub.studentName}</h4>
                          <span className="text-[11px] text-muted-foreground">{sub.studentEmail}</span>
                        </div>
                        <Badge variant={sub.status === 'Graded' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between bg-card p-2.5 rounded border border-border text-xs">
                        <span className="text-foreground truncate font-mono">{sub.fileName}</span>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPreviewPdf({ url: sub.fileUrl, name: sub.fileName })}
                            className="h-7 text-[11px]"
                          >
                            Click to Preview
                          </Button>
                          <Button variant="outline" size="sm" asChild className="h-7 text-[11px]">
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}${sub.fileUrl}`}
                              download={sub.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>

                      {sub.status === 'Graded' && (
                        <div className="bg-primary/10 border border-primary/20 p-2.5 rounded text-xs space-y-1">
                          <div className="font-semibold text-primary">Awarded Marks: {sub.marks} / {sub.assignmentMaxMarks}</div>
                          {sub.feedback && <div className="text-muted-foreground text-[11px]">Feedback: {sub.feedback}</div>}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          onClick={() => setGradingSubmission(sub)}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> {sub.status === 'Graded' ? 'Edit Grade' : 'Grade Submission'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Create Assignment Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); createAssignmentMutation.mutate(); }} className="space-y-3 py-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Class & Subject Allocation</label>
                <select
                  onChange={(e) => {
                    const [cId, sId] = e.target.value.split('|');
                    setClassId(cId); setSubjectId(sId);
                  }}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <label className="block text-xs text-muted-foreground mb-1">Title</label>
                <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Algebra Problem Set 1" />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Description & Instructions</label>
                <Textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Solve Chapter 3 problems and submit your solution PDF..." className="resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Deadline Date & Time</label>
                  <Input type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Maximum Marks</label>
                  <Input type="number" min="1" required value={maxMarks} onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 100)} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Publish Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Published">Publish Immediately</option>
                  <option value="Draft">Keep as Draft</option>
                </select>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAssignmentMutation.isPending}>Create Assignment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
