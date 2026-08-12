'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, GraduationCap, User, BookOpen, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-sky-400" />
          <span className="font-bold text-lg tracking-tight">EduAssign Portal</span>
          <span className="text-xs bg-sky-500/20 text-sky-300 font-medium px-2.5 py-0.5 rounded-full border border-sky-500/30">
            {user.role}
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          {user.role === 'Admin' && (
            <Link href="/admin/dashboard" className="text-slate-300 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </Link>
          )}
          {user.role === 'Teacher' && (
            <Link href="/teacher/dashboard" className="text-slate-300 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
              <BookOpen className="w-4 h-4" /> Teacher Assignments
            </Link>
          )}
          {user.role === 'Student' && (
            <Link href="/student/dashboard" className="text-slate-300 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors">
              <GraduationCap className="w-4 h-4" /> My Assignments
            </Link>
          )}

          <div className="h-4 w-px bg-slate-700 mx-2" />

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-300" /> {user.name}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium px-3 py-1.5 rounded-md transition-all border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
