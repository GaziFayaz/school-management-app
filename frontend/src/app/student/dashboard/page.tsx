'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import StudentOverviewTab from '@/components/student/StudentOverviewTab';
import StudentAssignmentsTab from '@/components/student/StudentAssignmentsTab';
import StudentClassesTab from '@/components/student/StudentClassesTab';
import StudentGradesTab from '@/components/student/StudentGradesTab';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  School,
  Award,
  Loader2,
} from 'lucide-react';

function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const validTabs = ['overview', 'assignments', 'classes', 'grades'];
  const [activeTab, setActiveTab] = useState<string>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'overview'
  );

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', val);
    router.replace(`/student/dashboard?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Header Banner */}
      <Card className="p-5 sm:p-6 border border-border/80 shadow-sm bg-gradient-to-r from-card via-card to-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Student Academic Portal
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage your coursework assignments, PDF submissions, curriculum subjects, and academic grades
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Multi-Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto sm:inline-flex p-1 bg-muted/70 border border-border/60 rounded-xl">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 text-xs sm:text-sm font-medium py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>Overview</span>
          </TabsTrigger>

          <TabsTrigger
            value="assignments"
            className="flex items-center gap-2 text-xs sm:text-sm font-medium py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Assignments</span>
          </TabsTrigger>

          <TabsTrigger
            value="classes"
            className="flex items-center gap-2 text-xs sm:text-sm font-medium py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <School className="w-4 h-4 text-amber-500" />
            <span>Classes & Subjects</span>
          </TabsTrigger>

          <TabsTrigger
            value="grades"
            className="flex items-center gap-2 text-xs sm:text-sm font-medium py-2 px-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Grades & Feedback</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <StudentOverviewTab onNavigateTab={handleTabChange} />
        </TabsContent>

        {/* Tab 2: Assignments */}
        <TabsContent value="assignments" className="mt-0 focus-visible:outline-none">
          <StudentAssignmentsTab />
        </TabsContent>

        {/* Tab 3: Classes & Subjects */}
        <TabsContent value="classes" className="mt-0 focus-visible:outline-none">
          <StudentClassesTab />
        </TabsContent>

        {/* Tab 4: Grades & Feedback */}
        <TabsContent value="grades" className="mt-0 focus-visible:outline-none">
          <StudentGradesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <Suspense
        fallback={
          <div className="py-24 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>Loading Student Portal...</span>
          </div>
        }
      >
        <StudentDashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
