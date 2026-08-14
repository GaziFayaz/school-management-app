'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PdfUploader from '@/components/pdf/PdfUploader';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { GraduationCap, Award, Upload, Download, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getFileUrl } from '@/lib/utils';

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
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-xs text-muted-foreground">View enrolled assignments, submit PDF answers, preview submissions, and track grades</p>
            </div>
          </div>
        </Card>

        {/* Assignments List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-xs">
            No active assignments found for your enrolled classes.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((a: any) => {
              const isPastDeadline = new Date() > new Date(a.deadline);

              return (
                <Card key={a.id} className="p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {a.className} • {a.subjectName}
                      </Badge>
                      {a.isSubmitted ? (
                        <Badge variant={a.submissionStatus === 'Graded' ? 'default' : 'secondary'}>
                          {a.submissionStatus === 'Graded' ? 'Graded' : 'Submitted'}
                        </Badge>
                      ) : (
                        <Badge variant={isPastDeadline ? 'destructive' : 'secondary'}>
                          {isPastDeadline ? 'Overdue' : 'Pending'}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">{a.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(a.deadline).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-foreground">Max: {a.maxMarks} Marks</span>
                    </div>

                    {/* Submission status or Grade details */}
                    {a.isSubmitted ? (
                      <Card className="p-3 bg-muted/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-mono truncate max-w-[150px]">{a.fileName}</span>
                          
                          <div className="flex items-center space-x-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setPreviewPdf({ url: a.fileUrl, name: a.fileName })}
                              className="h-6 text-[10px] px-2"
                            >
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" asChild className="h-6 w-6 p-0">
                              <a
                                href={getFileUrl(a.fileUrl)}
                                download={a.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                            </Button>
                          </div>
                        </div>

                        {a.submissionStatus === 'Graded' && (
                          <div className="bg-primary/10 border border-primary/20 p-2.5 rounded text-xs space-y-1">
                            <div className="font-bold text-primary flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" /> Grade: {a.marks} / {a.maxMarks}
                            </div>
                            {a.feedback && <div className="text-muted-foreground text-[11px]">Feedback: {a.feedback}</div>}
                          </div>
                        )}
                      </Card>
                    ) : null}

                    {/* Submit / Re-submit Button */}
                    {a.submissionStatus !== 'Graded' && !isPastDeadline && (
                      <Button
                        onClick={() => { setSubmittingAssignment(a); setSelectedFile(null); setErrorMsg(null); }}
                        className="w-full text-xs flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {a.isSubmitted ? 'Resubmit PDF Answer' : 'Submit PDF Answer'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Submit PDF Modal */}
        <Dialog open={!!submittingAssignment} onOpenChange={(open) => !open && setSubmittingAssignment(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Answer PDF</DialogTitle>
              <p className="text-xs text-muted-foreground">{submittingAssignment?.title}</p>
            </DialogHeader>

            <div className="py-2 space-y-4">
              <PdfUploader
                onFileSelect={(file) => setSelectedFile(file)}
                isUploading={submitPdfMutation.isPending}
              />

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubmittingAssignment(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || submitPdfMutation.isPending}
                onClick={() => submitPdfMutation.mutate()}
              >
                {submitPdfMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Submit to Teacher
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
