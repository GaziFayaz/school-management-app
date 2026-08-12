'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { Users, BookOpen, ShieldCheck, Plus, Trash2, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'subjects' | 'allocations'>('users');

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'Admin' | 'Teacher' | 'Student'>('Teacher');

  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  const [allocClassId, setAllocClassId] = useState('');
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocTeacherId, setAllocTeacherId] = useState('');

  const [enrollClassId, setEnrollClassId] = useState('');
  const [enrollStudentId, setEnrollStudentId] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // TanStack Queries
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await apiClient.get('/admin/users')).data,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: async () => (await apiClient.get('/admin/classes')).data,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => (await apiClient.get('/admin/subjects')).data,
  });

  const { data: teacherAllocations = [] } = useQuery({
    queryKey: ['admin-allocations-teacher'],
    queryFn: async () => (await apiClient.get('/admin/allocations/teacher-assignments')).data,
  });

  const { data: studentEnrollments = [] } = useQuery({
    queryKey: ['admin-allocations-student'],
    queryFn: async () => (await apiClient.get('/admin/allocations/student-enrollments')).data,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async () => apiClient.post('/admin/users', { name: userName, email: userEmail, password: userPassword, role: userRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setUserName(''); setUserEmail(''); setUserPassword('');
      setMsg({ type: 'success', text: 'User created successfully.' });
    },
    onError: (err: any) => setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const createClassMutation = useMutation({
    mutationFn: async () => apiClient.post('/admin/classes', { name: className, gradeLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setClassName(''); setGradeLevel('');
      setMsg({ type: 'success', text: 'Class created successfully.' });
    },
    onError: (err: any) => setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create class.' }),
  });

  const createSubjectMutation = useMutation({
    mutationFn: async () => apiClient.post('/admin/subjects', { name: subjectName, code: subjectCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setSubjectName(''); setSubjectCode('');
      setMsg({ type: 'success', text: 'Subject created successfully.' });
    },
    onError: (err: any) => setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create subject.' }),
  });

  const assignTeacherMutation = useMutation({
    mutationFn: async () => apiClient.post('/admin/allocations/assign-teacher', { classId: allocClassId, subjectId: allocSubjectId, teacherId: allocTeacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-teacher'] });
      setMsg({ type: 'success', text: 'Teacher allocated to class and subject successfully.' });
    },
    onError: (err: any) => setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to assign teacher.' }),
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async () => apiClient.post('/admin/allocations/enroll-student', { classId: enrollClassId, studentId: enrollStudentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allocations-student'] });
      setMsg({ type: 'success', text: 'Student enrolled in class successfully.' });
    },
    onError: (err: any) => setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to enroll student.' }),
  });

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Administrator Console</h1>
              <p className="text-xs text-slate-400">Manage school users, classes, subjects, and teacher allocations</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'users' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'classes' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Classes ({classes.length})
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'subjects' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Subjects ({subjects.length})
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'allocations' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Allocations
            </button>
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" /> Create New Account
              </h2>
              <form onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(); }} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Jane Doe" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="user@school.com" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <input type="password" required value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role</label>
                  <select value={userRole} onChange={(e) => setUserRole(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <button type="submit" disabled={createUserMutation.isPending} className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create User
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" /> User Directory
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-medium text-white">{u.name}</td>
                        <td className="p-3 text-slate-400">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            u.role === 'Teacher' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>{u.role}</span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => deleteUserMutation.mutate(u.id)} className="text-rose-400 hover:text-rose-300 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Classes */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-sky-400" /> Create Class</h2>
              <form onSubmit={(e) => { e.preventDefault(); createClassMutation.mutate(); }} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Class Name</label>
                  <input type="text" required value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Grade 10-A" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Grade Level</label>
                  <input type="text" required value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="Grade 10" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg">Add Class</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.map((c: any) => (
                  <div key={c.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-slate-400">{c.gradeLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Subjects */}
        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-sky-400" /> Create Subject</h2>
              <form onSubmit={(e) => { e.preventDefault(); createSubjectMutation.mutate(); }} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subject Name</label>
                  <input type="text" required value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Mathematics" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subject Code</label>
                  <input type="text" required value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="MATH101" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <button type="submit" className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg">Add Subject</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((s: any) => (
                  <div key={s.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-white">{s.name}</h3>
                      <span className="text-xs font-mono text-sky-400">{s.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Allocations */}
        {activeTab === 'allocations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teacher Assignment Form */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> Assign Teacher to Class & Subject</h2>
              <form onSubmit={(e) => { e.preventDefault(); assignTeacherMutation.mutate(); }} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Class</label>
                  <select value={allocClassId} onChange={(e) => setAllocClassId(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="">Select Class</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subject</label>
                  <select value={allocSubjectId} onChange={(e) => setAllocSubjectId(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="">Select Subject</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Teacher</label>
                  <select value={allocTeacherId} onChange={(e) => setAllocTeacherId(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="">Select Teacher</option>
                    {users.filter((u: any) => u.role === 'Teacher').map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg">Assign Teacher</button>
              </form>
            </div>

            {/* Student Enrollment Form */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-purple-400" /> Enroll Student into Class</h2>
              <form onSubmit={(e) => { e.preventDefault(); enrollStudentMutation.mutate(); }} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Class</label>
                  <select value={enrollClassId} onChange={(e) => setEnrollClassId(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="">Select Class</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Student</label>
                  <select value={enrollStudentId} onChange={(e) => setEnrollStudentId(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="">Select Student</option>
                    {users.filter((u: any) => u.role === 'Student').map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg">Enroll Student</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
