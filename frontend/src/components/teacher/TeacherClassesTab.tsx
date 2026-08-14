'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherClasses } from '@/lib/api-teacher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  School,
  BookOpen,
  Users,
  FileText,
  ChevronRight,
  Loader2,
  Inbox,
  GraduationCap,
} from 'lucide-react';

export default function TeacherClassesTab() {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: fetchTeacherClasses,
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <School className="w-4 h-4 text-primary" /> My Allocated Classes & Subjects ({classes.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Explore your assigned classes, subject curriculum, and enrolled student rosters
          </p>
        </div>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Loading allocated classes...</span>
        </div>
      ) : classes.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground space-y-3">
          <Inbox className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-xs">You have not been allocated to any classes or subjects yet.</p>
          <p className="text-[11px] text-muted-foreground">
            Contact your school administrator to assign class and subject allocations.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <Card
              key={cls.allocationId}
              className="p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all border-border/80 shadow-sm"
            >
              {/* Header */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                      <School className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{cls.className}</h3>
                      <Badge variant="outline" className="text-[10px] font-semibold mt-0.5">
                        Grade {cls.classGradeLevel}
                      </Badge>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {cls.subjectCode}
                  </Badge>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/60">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" /> {cls.subjectName}
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 p-2 rounded border border-border/60 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3 text-primary" /> Enrolled
                    </span>
                    <div className="font-bold text-foreground">{cls.enrolledStudentsCount} Students</div>
                  </div>

                  <div className="bg-muted/40 p-2 rounded border border-border/60 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-500" /> Coursework
                    </span>
                    <div className="font-bold text-foreground">
                      {cls.assignmentsCount} Assignments
                    </div>
                  </div>
                </div>

                {/* Primary Button */}
                <Button size="sm" asChild className="w-full text-xs flex items-center justify-center gap-1.5">
                  <Link href={`/teacher/classes/${cls.classId}`}>
                    <GraduationCap className="w-3.5 h-3.5" /> View Class Details & Roster <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
