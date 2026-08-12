'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else if (user.role === 'Admin') router.push('/admin/dashboard');
      else if (user.role === 'Teacher') router.push('/teacher/dashboard');
      else if (user.role === 'Student') router.push('/student/dashboard');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex items-center space-x-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Redirecting to portal...</span>
      </div>
    </div>
  );
}
