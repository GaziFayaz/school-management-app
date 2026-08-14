'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, GraduationCap, User, BookOpen, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="bg-card border-b border-border text-card-foreground sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg tracking-tight">School Management App</span>
          <Badge variant="secondary" className="font-medium">
            {user.role}
          </Badge>
        </div>

        <nav className="flex items-center space-x-4">
          {user.role === 'Admin' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard" className="flex items-center gap-1.5 text-sm font-medium">
                <ShieldCheck className="w-4 h-4" /> Admin Console
              </Link>
            </Button>
          )}
          {user.role === 'Teacher' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher/dashboard" className="flex items-center gap-1.5 text-sm font-medium">
                <BookOpen className="w-4 h-4" /> Teacher Portal
              </Link>
            </Button>
          )}
          {user.role === 'Student' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/dashboard" className="flex items-center gap-1.5 text-sm font-medium">
                <GraduationCap className="w-4 h-4" /> Student Portal
              </Link>
            </Button>
          )}

          <div className="h-4 w-px bg-border mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 p-1">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-foreground font-medium flex items-center gap-1">
                  {user.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{user.name}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
