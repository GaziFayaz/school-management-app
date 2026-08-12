'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClassDetail, updateClass, deleteClass, unassignTeacher, unenrollStudent, AdminClassDetail } from '@/lib/api-admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { School, Users, BookOpen, Edit, Trash2, UserMinus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ClassDetailModalProps {
  classId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClassDetailModal({ classId, isOpen, onClose }: ClassDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: classDetail, isLoading, error } = useQuery({
    queryKey: ['admin-class-detail', classId],
    queryFn: () => (classId ? fetchClassDetail(classId) : null),
    enabled: !!classId && isOpen,
  });

  useEffect(() => {
    if (classDetail) {
      setName(classDetail.name);
      setGradeLevel(classDetail.gradeLevel);
    }
  }, [classDetail]);

  const updateClassMutation = useMutation({
    mutationFn: () => updateClass(classId!, { name, gradeLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-class-detail', classId] });
      setIsEditing(false);
      setMsg({ type: 'success', text: 'Class updated successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update class.' });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: () => deleteClass(classId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      onClose();
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete class.' });
    },
  });

  const unassignTeacherMutation = useMutation({
    mutationFn: (allocationId: string) => unassignTeacher(allocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-teacher'] });
      setMsg({ type: 'success', text: 'Teacher unassigned from class.' });
    },
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) => unenrollStudent(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-student'] });
      setMsg({ type: 'success', text: 'Student unenrolled from class.' });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsEditing(false); setMsg(null); onClose(); } }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <School className="w-5 h-5 text-primary" /> Class Roster & Oversight
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage assigned teaching staff, subject mappings, and student enrollments.
          </DialogDescription>
        </DialogHeader>

        {msg && (
          <Alert variant={msg.type === 'success' ? 'default' : 'destructive'} className="my-2">
            {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription className="text-xs">{msg.text}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error || !classDetail ? (
          <div className="p-4 text-center text-xs text-destructive">Class details could not be loaded.</div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Header / Edit Class Card */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateClassMutation.mutate();
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Class Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Grade Level</label>
                      <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={updateClassMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{classDetail.name}</h3>
                    <p className="text-xs text-muted-foreground">Grade Level: {classDetail.gradeLevel}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-xs">
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit Class Info
                  </Button>
                </div>
              )}
            </div>

            {/* Roster 1: Assigned Teachers */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" /> Assigned Teachers ({classDetail.teacherAssignments.length})
                </span>
              </h4>
              {classDetail.teacherAssignments.length > 0 ? (
                <Table className="border rounded-md">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Teacher</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classDetail.teacherAssignments.map((ta) => (
                      <TableRow key={ta.id}>
                        <TableCell>
                          <div className="font-medium text-xs text-foreground">{ta.teacherName}</div>
                          <div className="text-[11px] text-muted-foreground">{ta.teacherEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-foreground">{ta.subjectName}</div>
                          <Badge variant="outline" className="font-mono text-[10px]">{ta.subjectCode}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unassignTeacherMutation.mutate(ta.id)}
                            disabled={unassignTeacherMutation.isPending}
                            className="text-xs text-destructive hover:bg-destructive/10"
                          >
                            <UserMinus className="w-3.5 h-3.5 mr-1" /> Unassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded text-center">
                  No teachers assigned to this class yet.
                </p>
              )}
            </div>

            {/* Roster 2: Enrolled Students */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Enrolled Students ({classDetail.studentEnrollments.length})
                </span>
              </h4>
              {classDetail.studentEnrollments.length > 0 ? (
                <Table className="border rounded-md">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classDetail.studentEnrollments.map((se) => (
                      <TableRow key={se.id}>
                        <TableCell className="text-xs font-medium text-foreground">{se.studentName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{se.studentEmail}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unenrollStudentMutation.mutate(se.id)}
                            disabled={unenrollStudentMutation.isPending}
                            className="text-xs text-destructive hover:bg-destructive/10"
                          >
                            <UserMinus className="w-3.5 h-3.5 mr-1" /> Unenroll
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded text-center">
                  No students currently enrolled in this class.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this class? This will also remove all class allocations.')) {
                deleteClassMutation.mutate();
              }
            }}
            disabled={deleteClassMutation.isPending}
            className="text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Class
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
