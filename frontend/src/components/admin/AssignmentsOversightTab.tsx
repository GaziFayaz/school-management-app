'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminAssignments,
  deleteAdminAssignment,
  fetchClasses,
  fetchSubjects,
  fetchUsers,
  AdminAssignmentItem,
} from '@/lib/api-admin';
import AssignmentDetailModal from './AssignmentDetailModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FileText, Filter, Eye, Trash2, Loader2 } from 'lucide-react';

export default function AssignmentsOversightTab() {
  const queryClient = useQueryClient();

  // Filters state
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // Queries for filter options
  const { data: classes = [] } = useQuery({ queryKey: ['admin-classes'], queryFn: fetchClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ['admin-subjects'], queryFn: fetchSubjects });
  const { data: teachers = [] } = useQuery({ queryKey: ['admin-users', 'Teacher'], queryFn: () => fetchUsers('Teacher') });
  const { data: students = [] } = useQuery({ queryKey: ['admin-users', 'Student'], queryFn: () => fetchUsers('Student') });

  // Assignments query with filters
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: [
      'admin-assignments',
      selectedClassId,
      selectedSubjectId,
      selectedTeacherId,
      selectedStudentId,
      selectedStatus,
    ],
    queryFn: () =>
      fetchAdminAssignments({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: selectedTeacherId,
        studentId: selectedStudentId,
        status: selectedStatus,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
    },
  });

  const handleResetFilters = () => {
    setSelectedClassId('all');
    setSelectedSubjectId('all');
    setSelectedTeacherId('all');
    setSelectedStudentId('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6">
      {/* Multi-level Filter Toolbar Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filter Assignments & Submissions
            </span>
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-muted-foreground">
              Reset Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Filter 1: Class */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Subject */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Teacher */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 4: Student */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Student Enrolled</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Students</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 5: Status */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Institution Assignments Oversight ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center p-8">
              No assignments found matching the selected filter criteria.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Assignment Title</TableHead>
                  <TableHead className="text-xs">Class & Subject</TableHead>
                  <TableHead className="text-xs">Teacher</TableHead>
                  <TableHead className="text-xs">Deadline</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Submissions</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((item: AdminAssignmentItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-bold text-xs text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground">Max Marks: {item.maxMarks}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{item.className}</div>
                      <div className="text-[11px] text-muted-foreground">{item.subjectName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{item.teacherName}</div>
                      <div className="text-[11px] text-muted-foreground">{item.teacherEmail}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.deadline).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Published' ? 'default' : 'secondary'} className="text-[10px]">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.submissionCount} Total ({item.gradedCount} Graded)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedAssignmentId(item.id)}
                          className="h-7 w-7 text-primary"
                          title="View Details & Submissions"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Delete assignment "${item.title}"?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="h-7 w-7 text-destructive"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Detail & Submissions Modal */}
      <AssignmentDetailModal
        assignmentId={selectedAssignmentId}
        isOpen={!!selectedAssignmentId}
        onClose={() => setSelectedAssignmentId(null)}
      />
    </div>
  );
}
