'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, KeyRound, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      login({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        token: data.token,
      });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    },
  });

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    loginMutation.mutate();
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Assignment Portal</h1>
          <p className="text-xs text-slate-400">Sign in to access your role-based dashboard</p>
        </div>

        {/* Demo Credentials Quick Fill Buttons */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Demo Accounts Quick-Fill:</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@school.com', 'Admin@123')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-sky-400" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('teacher@school.com', 'Teacher@123')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-emerald-400" /> Teacher
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('student@school.com', 'Student@123')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <UserCheck className="w-3 h-3 text-purple-400" /> Student
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 font-semibold text-sm text-white rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all"
          >
            {loginMutation.isPending ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
