'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentClassHistory, TeacherSubmission } from '@/lib/api-teacher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  User,
  GraduationCap,
  Award,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import PdfPreviewGradingModal from '@/components/pdf/PdfPreviewGradingModal';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  studentId: string | null;
}

export default function StudentDetailModal({
  isOpen,
  onClose,
  classId,
  studentId,
}: StudentDetailModalProps) {
  const [gradingSubmission, setGradingSubmission] = useState<TeacherSubmission | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ['teacher-student-history', classId, studentId],
    queryFn: () => (classId && studentId ? fetchStudentClassHistory(classId, studentId) : null),
    enabled: isOpen && !!classId && !!studentId,
  });

  if (!studentId) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border bg-card">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {history?.studentName || 'Student Profile & Performance'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {history?.studentEmail} • {history?.className} (Grade {history?.classGradeLevel})
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Loading student records...</span>
              </div>
            ) : !history ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Unable to load student details.
              </div>
            ) : (
              <>
                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="p-3.5 bg-muted/30 border-border/70 space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" /> Assigned Tasks
                    </span>
                    <div className="text-lg font-bold text-foreground">{history.totalAssignedTasks}</div>
                  </Card>

                  <Card className="p-3.5 bg-muted/30 border-border/70 space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Submitted
                    </span>
                    <div className="text-lg font-bold text-foreground">{history.submittedTasksCount}</div>
                  </Card>

                  <Card className="p-3.5 bg-muted/30 border-border/70 space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Graded
                    </span>
                    <div className="text-lg font-bold text-foreground">{history.gradedTasksCount}</div>
                  </Card>

                  <Card className="p-3.5 bg-muted/30 border-border/70 space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-primary" /> Average Mark
                    </span>
                    <div className="text-lg font-bold text-primary">
                      {history.averageMark !== null && history.averageMark !== undefined
                        ? `${history.averageMark.toFixed(1)}`
                        : 'N/A'}
                    </div>
                  </Card>
                </div>

                {/* Submissions List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" /> Submissions & Grade History ({history.submissions.length})
                  </h3>

                  {history.submissions.length === 0 ? (
                    <Card className="p-8 text-center text-xs text-muted-foreground">
                      No submissions recorded for this student in this class yet.
                    </Card>
                  ) : (
                    <div className="space-y-2.5">
                      {history.submissions.map((sub) => (
                        <Card key={sub.id} className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors border-border/70 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-foreground">{sub.assignmentTitle}</h4>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> Submitted: {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            <Badge variant={sub.status === 'Graded' ? 'default' : 'secondary'} className="text-[10px]">
                              {sub.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between bg-card p-2.5 rounded border border-border text-xs">
                            <span className="text-muted-foreground font-mono truncate max-w-[200px]">
                              {sub.fileName}
                            </span>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setGradingSubmission({
                                  ...sub,
                                  studentId: history.studentId,
                                  studentName: history.studentName,
                                  studentEmail: history.studentEmail,
                                  status: sub.status as any,
                                })
                              }
                              className="h-7 text-[11px] flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Preview & Grade
                            </Button>
                          </div>

                          {sub.status === 'Graded' && (
                            <div className="bg-primary/10 border border-primary/20 p-2.5 rounded text-xs space-y-1">
                              <div className="font-bold text-primary flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" /> Awarded Marks: {sub.marks} / {sub.assignmentMaxMarks}
                              </div>
                              {sub.feedback && (
                                <p className="text-[11px] text-muted-foreground">
                                  <span className="font-semibold text-foreground">Feedback:</span> {sub.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested PDF Preview & Grading Modal */}
      <PdfPreviewGradingModal
        isOpen={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        submission={gradingSubmission}
      />
    </>
  );
}
