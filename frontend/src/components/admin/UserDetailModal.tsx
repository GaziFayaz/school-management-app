'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserDetail, updateUser, deleteUser, AdminUserDetail } from '@/lib/api-admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { User, Mail, Calendar, BookOpen, GraduationCap, Edit, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Teacher' | 'Student'>('Teacher');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: userDetail, isLoading, error } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => (userId ? fetchUserDetail(userId) : null),
    enabled: !!userId && isOpen,
  });

  useEffect(() => {
    if (userDetail) {
      setName(userDetail.name);
      setEmail(userDetail.email);
      setRole(userDetail.role);
    }
  }, [userDetail]);

  const updateMutation = useMutation({
    mutationFn: () => updateUser(userId!, { name, email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      setIsEditing(false);
      setMsg({ type: 'success', text: 'User profile updated successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update user profile.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete user.' });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setIsEditing(false); setMsg(null); onClose(); } }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> User Profile & Details
            </span>
            {userDetail && (
              <Badge variant={userDetail.role === 'Admin' ? 'destructive' : userDetail.role === 'Teacher' ? 'default' : 'secondary'}>
                {userDetail.role}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Detailed information, assigned relationships, and profile management.
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
        ) : error || !userDetail ? (
          <div className="p-4 text-center text-xs text-destructive">User details could not be loaded.</div>
        ) : (
          <div className="space-y-6 py-2">
            {/* User Profile Card */}
            <div className="bg-muted/40 p-4 rounded-xl border border-border/50 space-y-3">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Email Address</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="Student">Student</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {userDetail.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {userDetail.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> Account Created: {new Date(userDetail.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-xs self-start sm:self-auto">
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit Profile
                  </Button>
                </div>
              )}
            </div>

            {/* Role-Specific Details */}
            {userDetail.role === 'Teacher' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" /> Assigned Classes & Subjects
                </h4>
                {userDetail.roleDetails?.assignedClasses && userDetail.roleDetails.assignedClasses.length > 0 ? (
                  <Table className="border rounded-md">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Class</TableHead>
                        <TableHead className="text-xs">Grade</TableHead>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetail.roleDetails.assignedClasses.map((ac, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{ac.className}</TableCell>
                          <TableCell className="text-xs">{ac.gradeLevel}</TableCell>
                          <TableCell className="text-xs">{ac.subjectName}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="font-mono text-[10px]">{ac.subjectCode}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded text-center">
                    No active class/subject assignments for this teacher.
                  </p>
                )}
              </div>
            )}

            {userDetail.role === 'Student' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" /> Academic Enrollment & Submissions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <span className="text-[11px] text-muted-foreground block">Enrolled Class</span>
                    <span className="text-xs font-bold text-foreground">
                      {userDetail.roleDetails?.enrolledClass
                        ? `${userDetail.roleDetails.enrolledClass.className} (${userDetail.roleDetails.enrolledClass.gradeLevel})`
                        : 'Not Enrolled'}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <span className="text-[11px] text-muted-foreground block">Submissions History</span>
                    <span className="text-xs font-bold text-foreground">
                      {userDetail.roleDetails?.totalSubmissions || 0} Total Submissions (
                      {userDetail.roleDetails?.gradedSubmissions || 0} Graded)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this user account?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete User
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
