'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTeacherAssignments,
  toggleAssignmentStatus,
  deleteTeacherAssignment,
  TeacherAssignment,
} from '@/lib/api-teacher';
import AssignmentEditModal from '@/components/teacher/AssignmentEditModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Calendar,
  Award,
  Users,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  ChevronRight,
  Search,
  AlertTriangle,
  Loader2,
  Inbox,
} from 'lucide-react';

interface TeacherAssignmentsTabProps {
  onCreateClick: () => void;
}

export default function TeacherAssignmentsTab({ onCreateClick }: TeacherAssignmentsTabProps) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Draft'>('all');
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<TeacherAssignment | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: fetchTeacherAssignments,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: 'Draft' | 'Published' }) =>
      toggleAssignmentStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeacherAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview-stats'] });
      setDeletingAssignment(null);
    },
  });

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Status filter
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(term);
        const matchClass = a.className.toLowerCase().includes(term);
        const matchSubject = a.subjectName.toLowerCase().includes(term);
        return matchTitle || matchClass || matchSubject;
      }

      return true;
    });
  }, [assignments, statusFilter, searchTerm]);

  const publishedCount = assignments.filter((a) => a.status === 'Published').length;
  const draftCount = assignments.filter((a) => a.status === 'Draft').length;

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Status Filters, & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by assignment title, class, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="h-7 text-xs px-2.5 font-medium"
            >
              All ({assignments.length})
            </Button>
            <Button
              variant={statusFilter === 'Published' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('Published')}
              className="h-7 text-xs px-2.5 font-medium"
            >
              Published ({publishedCount})
            </Button>
            <Button
              variant={statusFilter === 'Draft' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('Draft')}
              className="h-7 text-xs px-2.5 font-medium"
            >
              Drafts ({draftCount})
            </Button>
          </div>

          <Button onClick={onCreateClick} size="sm" className="h-9 text-xs flex items-center gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Create Assignment
          </Button>
        </div>
      </div>

      {/* Assignments Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Loading assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground space-y-3">
          <Inbox className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-xs">No assignments match the selected filter criteria.</p>
          <Button variant="outline" size="sm" onClick={onCreateClick} className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Your First Assignment
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((a) => {
            const isPastDeadline = new Date() > new Date(a.deadline);
            const pendingCount = (a.submissionsCount || 0) - (a.gradedSubmissionsCount || 0);

            return (
              <Card
                key={a.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all border-border/80 shadow-sm"
              >
                {/* Header & Badges */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                      {a.className} • {a.subjectName}
                    </Badge>

                    <Button
                      variant={a.status === 'Published' ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: a.id,
                          newStatus: a.status === 'Published' ? 'Draft' : 'Published',
                        })
                      }
                      className="h-6 text-[10px] px-2 font-medium"
                    >
                      {a.status}
                    </Button>
                  </div>

                  <h3 className="text-base font-bold text-foreground line-clamp-1">{a.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.description}</p>
                </div>

                {/* Metadata & Submissions Counter */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`flex items-center gap-1 ${isPastDeadline ? 'text-destructive font-medium' : ''}`}>
                      <Calendar className="w-3.5 h-3.5" /> Due: {new Date(a.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Award className="w-3.5 h-3.5 text-primary" /> Max: {a.maxMarks}
                    </span>
                  </div>

                  {/* Live Submission Count Badge */}
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-primary" /> Submissions:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {a.submissionsCount || 0} / {a.enrolledStudentsCount || 0}
                      </Badge>
                      {pendingCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          {pendingCount} Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAssignment(a)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Assignment"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAssignment(a)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button size="sm" asChild className="h-8 text-xs flex items-center gap-1 font-medium">
                      <Link href={`/teacher/assignments/${a.id}`}>
                        View Details & Submissions <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AssignmentEditModal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deletingAssignment} onOpenChange={(open) => !open && setDeletingAssignment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground space-y-2">
            <p>
              Are you sure you want to delete <span className="font-bold text-foreground">"{deletingAssignment?.title}"</span>?
            </p>
            <p className="text-destructive font-medium">
              This will permanently delete the assignment and all associated student PDF submissions and grades.
            </p>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingAssignment(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deletingAssignment && deleteMutation.mutate(deletingAssignment.id)}
              className="text-xs flex items-center gap-1"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
