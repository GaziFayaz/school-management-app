'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ShieldCheck, BarChart3, Users, School, BookOpen, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import OverviewTab from '@/components/admin/OverviewTab';
import UserDirectoryTab from '@/components/admin/UserDirectoryTab';
import ClassDirectoryTab from '@/components/admin/ClassDirectoryTab';
import AllocationManagerTab from '@/components/admin/AllocationManagerTab';
import AssignmentsOversightTab from '@/components/admin/AssignmentsOversightTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Header Bar with Main Tabs */}
          <Card className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm border-border/60">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Administrator Console</h1>
                <p className="text-xs text-muted-foreground">
                  Complete management oversight for users, classes, subjects, allocations, and assignments
                </p>
              </div>
            </div>

            <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-muted/60">
              <TabsTrigger value="overview" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Users
              </TabsTrigger>
              <TabsTrigger value="classes" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" /> Classes & Subjects
              </TabsTrigger>
              <TabsTrigger value="allocations" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Allocations
              </TabsTrigger>
              <TabsTrigger value="assignments" className="text-xs py-2 px-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Assignments
              </TabsTrigger>
            </TabsList>
          </Card>

          {/* Tab Contents */}
          <TabsContent value="overview" className="m-0 focus-visible:outline-none">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="users" className="m-0 focus-visible:outline-none">
            <UserDirectoryTab />
          </TabsContent>

          <TabsContent value="classes" className="m-0 focus-visible:outline-none">
            <ClassDirectoryTab />
          </TabsContent>

          <TabsContent value="allocations" className="m-0 focus-visible:outline-none">
            <AllocationManagerTab />
          </TabsContent>

          <TabsContent value="assignments" className="m-0 focus-visible:outline-none">
            <AssignmentsOversightTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
