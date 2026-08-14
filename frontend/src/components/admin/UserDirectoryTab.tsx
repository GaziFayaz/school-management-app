'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, deleteUser, AdminUser } from '@/lib/api-admin';
import UserDetailModal from './UserDetailModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Search, Eye, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UserDirectoryTab() {
  const queryClient = useQueryClient();
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Create form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'Admin' | 'Teacher' | 'Student'>('Teacher');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', selectedRoleTab],
    queryFn: () => fetchUsers(selectedRoleTab),
  });

  const createUserMutation = useMutation({
    mutationFn: () => createUser({ name: userName, email: userEmail, password: userPassword, role: userRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setMsg({ type: 'success', text: 'User account created successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMsg({ type: 'success', text: 'User account deleted successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete user account.' });
    },
  });

  const filteredUsers = users.filter((u: AdminUser) => {
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {msg && (
        <Alert variant={msg.type === 'success' ? 'default' : 'destructive'}>
          {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Create New Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                <Input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <Input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@school.com" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Password</label>
                <Input type="password" required value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Student">Student</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={createUserMutation.isPending} className="w-full text-xs">
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Directory Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> User Directory ({filteredUsers.length})
            </CardTitle>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Role Tabs Filter */}
              <Tabs value={selectedRoleTab} onValueChange={setSelectedRoleTab} className="w-full sm:w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-2.5">All</TabsTrigger>
                  <TabsTrigger value="Admin" className="text-xs px-2.5">Admins</TabsTrigger>
                  <TabsTrigger value="Teacher" className="text-xs px-2.5">Teachers</TabsTrigger>
                  <TabsTrigger value="Student" className="text-xs px-2.5">Students</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search Bar */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search name/email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No users found matching your criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: AdminUser) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium text-xs text-foreground">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === 'Admin' ? 'destructive' : u.role === 'Teacher' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedUserId(u.id)}
                            className="h-7 w-7 text-primary"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete account for ${u.name}?`)) {
                                deleteUserMutation.mutate(u.id);
                              }
                            }}
                            className="h-7 w-7 text-destructive"
                            title="Delete User"
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
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
