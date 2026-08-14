'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClasses,
  fetchSubjects,
  fetchUsers,
  fetchTeacherAllocations,
  assignTeacher,
  unassignTeacher,
  fetchStudentEnrollments,
  enrollStudent,
  unenrollStudent,
  AdminTeacherAllocation,
  AdminStudentEnrollment,
} from '@/lib/api-admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { BookOpen, UserPlus, Search, UserMinus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AllocationManagerTab() {
  const queryClient = useQueryClient();

  // Form states
  const [allocClassId, setAllocClassId] = useState('');
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocTeacherId, setAllocTeacherId] = useState('');

  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');

  // Search filter states
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const { data: classes = [] } = useQuery({ queryKey: ['admin-classes'], queryFn: fetchClasses });
  const { data: subjects = [] } = useQuery({ queryKey: ['admin-subjects'], queryFn: fetchSubjects });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users', 'all'], queryFn: () => fetchUsers('all') });

  const { data: teacherAllocations = [], isLoading: isTeacherAllocLoading } = useQuery({
    queryKey: ['admin-allocations-teacher'],
    queryFn: fetchTeacherAllocations,
  });

  const { data: studentEnrollments = [], isLoading: isStudentAllocLoading } = useQuery({
    queryKey: ['admin-allocations-student'],
    queryFn: fetchStudentEnrollments,
  });

  // Mutations
  const assignTeacherMutation = useMutation({
    mutationFn: () => assignTeacher({ classId: allocClassId, subjectId: allocSubjectId, teacherId: allocTeacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-teacher'] });
      setAllocClassId('');
      setAllocSubjectId('');
      setAllocTeacherId('');
      setMsg({ type: 'success', text: 'Teacher assigned to class & subject successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to assign teacher.' });
    },
  });

  const unassignTeacherMutation = useMutation({
    mutationFn: (id: string) => unassignTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-teacher'] });
      setMsg({ type: 'success', text: 'Teacher unassigned successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to unassign teacher.' });
    },
  });

  const enrollStudentMutation = useMutation({
    mutationFn: () => enrollStudent({ classId: enrollClassId, studentId: enrollStudentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-student'] });
      setEnrollClassId('');
      setEnrollStudentId('');
      setMsg({ type: 'success', text: 'Student enrolled in class successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to enroll student.' });
    },
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: (id: string) => unenrollStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-student'] });
      setMsg({ type: 'success', text: 'Student unenrolled successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to unenroll student.' });
    },
  });

  // Filtered lists
  const filteredTeacherAllocations = teacherAllocations.filter((a: AdminTeacherAllocation) => {
    const q = teacherSearch.toLowerCase();
    return (
      a.className.toLowerCase().includes(q) ||
      a.subjectName.toLowerCase().includes(q) ||
      a.teacherName.toLowerCase().includes(q)
    );
  });

  const filteredStudentEnrollments = studentEnrollments.filter((e: AdminStudentEnrollment) => {
    const q = studentSearch.toLowerCase();
    return (
      e.className.toLowerCase().includes(q) ||
      e.studentName.toLowerCase().includes(q) ||
      e.studentEmail.toLowerCase().includes(q)
    );
  });

  const teachersList = users.filter((u) => u.role === 'Teacher');
  const studentsList = users.filter((u) => u.role === 'Student');

  return (
    <div className="space-y-6">
      {msg && (
        <Alert variant={msg.type === 'success' ? 'default' : 'destructive'}>
          {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      {/* Creation Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assign Teacher Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Assign Teacher to Class & Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignTeacherMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Target Class</label>
                <select
                  value={allocClassId}
                  onChange={(e) => setAllocClassId(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Subject</label>
                <select
                  value={allocSubjectId}
                  onChange={(e) => setAllocSubjectId(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Teacher</label>
                <select
                  value={allocTeacherId}
                  onChange={(e) => setAllocTeacherId(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select Teacher Account</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" disabled={assignTeacherMutation.isPending} className="w-full text-xs">
                Assign Teacher
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enroll Student Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Enroll Student into Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enrollStudentMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Target Class</label>
                <select
                  value={enrollClassId}
                  onChange={(e) => setEnrollClassId(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Student</label>
                <select
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select Student Account</option>
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" disabled={enrollStudentMutation.isPending} className="w-full text-xs">
                Enroll Student
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Management Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Teacher Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Active Teacher Allocations ({filteredTeacherAllocations.length})
            </CardTitle>
            <div className="relative w-36 sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter teacher/class..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isTeacherAllocLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredTeacherAllocations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center p-6">No teacher allocations found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Class & Subject</TableHead>
                    <TableHead className="text-xs">Teacher</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeacherAllocations.map((a: AdminTeacherAllocation) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium text-xs text-foreground">{a.className}</div>
                        <div className="text-[11px] text-muted-foreground">{a.subjectName}</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">{a.teacherName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unassignTeacherMutation.mutate(a.id)}
                          disabled={unassignTeacherMutation.isPending}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Table 2: Student Enrollments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Active Student Enrollments ({filteredStudentEnrollments.length})
            </CardTitle>
            <div className="relative w-36 sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter student/class..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isStudentAllocLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredStudentEnrollments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center p-6">No student enrollments found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Class</TableHead>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentEnrollments.map((e: AdminStudentEnrollment) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs font-medium text-foreground">{e.className}</TableCell>
                      <TableCell>
                        <div className="font-medium text-xs text-foreground">{e.studentName}</div>
                        <div className="text-[11px] text-muted-foreground">{e.studentEmail}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unenrollStudentMutation.mutate(e.id)}
                          disabled={unenrollStudentMutation.isPending}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
