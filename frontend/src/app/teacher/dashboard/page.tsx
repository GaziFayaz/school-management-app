'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTeacherAllocations,
  createTeacherAssignment,
} from '@/lib/api-teacher';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import TeacherOverviewTab from '@/components/teacher/TeacherOverviewTab';
import TeacherAssignmentsTab from '@/components/teacher/TeacherAssignmentsTab';
import TeacherClassesTab from '@/components/teacher/TeacherClassesTab';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Plus,
  BarChart3,
  FileText,
  School,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'overview');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Published');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam && ['overview', 'assignments', 'classes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch Allocations for Assignment Creation
  const { data: allocations = [] } = useQuery({
    queryKey: ['teacher-allocations'],
    queryFn: fetchTeacherAllocations,
  });

  // Create Assignment Mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!classId || !subjectId) {
        throw new Error('Please select an allocated Class and Subject.');
      }
      return createTeacherAssignment({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        classId,
        subjectId,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview-stats'] });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setDeadline('');
      setMaxMarks(100);
      setClassId('');
      setSubjectId('');
      setErrorMsg(null);
      setActiveTab('assignments');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create assignment.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!classId || !subjectId) {
      setErrorMsg('Please select a class and subject allocation.');
      return;
    }

    if (maxMarks <= 0) {
      setErrorMsg('Maximum marks must be greater than 0.');
      return;
    }

    createAssignmentMutation.mutate();
  };

  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Header Card with Tabs List & Primary Action */}
          <Card className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm border-border/70">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Teacher Academic Portal</h1>
                <p className="text-xs text-muted-foreground">
                  Coursework management, student PDF submission grading, and class rosters
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <TabsList className="grid grid-cols-3 h-auto p-1 bg-muted/60">
                <TabsTrigger value="overview" className="text-xs py-2 px-3 flex items-center gap-1.5 font-medium">
                  <BarChart3 className="w-3.5 h-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="assignments" className="text-xs py-2 px-3 flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5" /> Assignments
                </TabsTrigger>
                <TabsTrigger value="classes" className="text-xs py-2 px-3 flex items-center gap-1.5 font-medium">
                  <School className="w-3.5 h-3.5" /> My Classes
                </TabsTrigger>
              </TabsList>

              <Button
                onClick={() => {
                  setErrorMsg(null);
                  setIsCreateOpen(true);
                }}
                size="sm"
                className="h-9 text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Assignment
              </Button>
            </div>
          </Card>

          {/* Tab Contents */}
          <TabsContent value="overview" className="m-0 focus-visible:outline-none">
            <TeacherOverviewTab
              onCreateAssignment={() => {
                setErrorMsg(null);
                setIsCreateOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </TabsContent>

          <TabsContent value="assignments" className="m-0 focus-visible:outline-none">
            <TeacherAssignmentsTab
              onCreateClick={() => {
                setErrorMsg(null);
                setIsCreateOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="classes" className="m-0 focus-visible:outline-none">
            <TeacherClassesTab />
          </TabsContent>
        </Tabs>

        {/* Create Assignment Modal Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Plus className="w-4 h-4 text-primary" /> Create New Assignment
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Set up coursework instructions and deadlines for your allocated class
              </p>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 py-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Class & Subject Allocation <span className="text-destructive">*</span>
                </label>
                <select
                  value={classId && subjectId ? `${classId}|${subjectId}` : ''}
                  onChange={(e) => {
                    const parts = e.target.value.split('|');
                    if (parts.length === 2) {
                      setClassId(parts[0]);
                      setSubjectId(parts[1]);
                    } else {
                      setClassId('');
                      setSubjectId('');
                    }
                  }}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">-- Select Allocated Class & Subject --</option>
                  {allocations.map((alloc: any, i: number) => (
                    <option key={i} value={`${alloc.classId}|${alloc.subjectId}`}>
                      {alloc.className} — {alloc.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Assignment Title <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Linear Algebra Problem Set 2"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description & Instructions <span className="text-destructive">*</span>
                </label>
                <Textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe requirements, problem questions, and instructions for answer PDF uploads..."
                  className="resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Deadline Date & Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Maximum Marks <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Initial Publish Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Published">Publish Immediately (Visible to students)</option>
                  <option value="Draft">Save as Draft (Hidden from students)</option>
                </select>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createAssignmentMutation.isPending}
                  className="text-xs flex items-center gap-1.5"
                >
                  {createAssignmentMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Create Assignment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-muted-foreground">Loading dashboard...</div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}
