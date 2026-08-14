'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentAssignments, StudentAssignment } from '@/lib/api-student';
import { DataTable, ColumnDef, FilterTabOption } from '@/components/ui/data-table';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getFileUrl } from '@/lib/utils';
import {
  FileText,
  Clock,
  CheckCircle2,
  Award,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Eye,
  Download,
  ArrowRight,
  Loader2,
  Calendar,
  User,
  School,
  BookOpen,
} from 'lucide-react';

export default function StudentAssignmentsTab() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);

  const { data: assignments = [], isLoading, isError } = useQuery<StudentAssignment[]>({
    queryKey: ['student-assignments'],
    queryFn: fetchStudentAssignments,
  });

  // Extract distinct subjects for dropdown
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    assignments.forEach((a) => {
      if (a.subjectName) subs.add(a.subjectName);
    });
    return Array.from(subs).sort();
  }, [assignments]);

  // Counts for status tabs
  const counts = useMemo(() => {
    const now = new Date();
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    let overdue = 0;

    assignments.forEach((a) => {
      const isPast = new Date(a.deadline) < now;
      if (a.submissionStatus === 'Graded') {
        graded++;
      } else if (a.isSubmitted) {
        submitted++;
      } else if (isPast) {
        overdue++;
      } else {
        pending++;
      }
    });

    return {
      all: assignments.length,
      pending,
      submitted,
      graded,
      overdue,
    };
  }, [assignments]);

  // Filtered dataset
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      // Status filter
      const isPast = new Date(a.deadline) < now;
      if (statusFilter === 'pending' && (a.isSubmitted || isPast)) return false;
      if (statusFilter === 'submitted' && (!a.isSubmitted || a.submissionStatus === 'Graded')) return false;
      if (statusFilter === 'graded' && a.submissionStatus !== 'Graded') return false;
      if (statusFilter === 'overdue' && (a.isSubmitted || !isPast)) return false;

      // Subject filter
      if (subjectFilter !== 'all' && a.subjectName !== subjectFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesDesc = a.description?.toLowerCase().includes(query);
        const matchesSubject = a.subjectName?.toLowerCase().includes(query);
        const matchesTeacher = a.teacherName?.toLowerCase().includes(query);
        const matchesClass = a.className?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSubject && !matchesTeacher && !matchesClass) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, statusFilter, subjectFilter, searchTerm]);

  // Table Columns Definition
  const columns: ColumnDef<StudentAssignment>[] = useMemo(
    () => [
      {
        header: 'Assignment & Subject',
        accessorKey: 'title',
        sortable: true,
        cell: (item) => (
          <div className="space-y-1 py-1">
            <Link
              href={`/student/assignments/${item.id}`}
              className="text-xs font-semibold text-foreground hover:text-primary transition-colors block"
            >
              {item.title}
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 h-4">
                {item.subjectName}
              </Badge>
              <span>•</span>
              <span>{item.className}</span>
            </div>
          </div>
        ),
      },
      {
        header: 'Instructor',
        accessorKey: 'teacherName',
        sortable: true,
        cell: (item) => (
          <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{item.teacherName}</span>
          </div>
        ),
      },
      {
        header: 'Due Date',
        accessorKey: 'deadline',
        sortable: true,
        cell: (item) => {
          const isPast = new Date(item.deadline) < new Date();
          return (
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1 text-foreground">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <p className={`text-[10px] ${isPast && !item.isSubmitted ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                {new Date(item.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        },
      },
      {
        header: 'Max Marks',
        accessorKey: 'maxMarks',
        sortable: true,
        cell: (item) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {item.maxMarks} pts
          </Badge>
        ),
      },
      {
        header: 'Status',
        accessorKey: 'submissionStatus',
        cell: (item) => {
          const isPast = new Date(item.deadline) < new Date();
          if (item.submissionStatus === 'Graded') {
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium">
                <Award className="w-3 h-3 mr-1" /> {item.marks} / {item.maxMarks}
              </Badge>
            );
          }
          if (item.isSubmitted) {
            return (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-medium">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
              </Badge>
            );
          }
          if (isPast) {
            return (
              <Badge variant="destructive" className="text-[10px] font-medium">
                <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
              </Badge>
            );
          }
          return (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-medium">
              <Clock className="w-3 h-3 mr-1" /> Pending
            </Badge>
          );
        },
      },
      {
        header: 'Action',
        className: 'text-right',
        cell: (item) => (
          <div className="flex items-center justify-end gap-1.5">
            {item.fileUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewPdf({ url: item.fileUrl!, name: item.fileName || 'submission.pdf' })}
                className="h-7 px-2 text-xs"
                title="Preview PDF"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
              </Button>
            )}
            <Button asChild size="sm" className="h-7 text-xs px-2.5">
              <Link href={`/student/assignments/${item.id}`}>
                {item.isSubmitted ? 'View' : 'Submit'}
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const filterTabOptions: FilterTabOption[] = [
    { label: 'All', value: 'all', count: counts.all },
    { label: 'Pending', value: 'pending', count: counts.pending },
    { label: 'Submitted', value: 'submitted', count: counts.submitted },
    { label: 'Graded', value: 'graded', count: counts.graded },
    { label: 'Overdue', value: 'overdue', count: counts.overdue },
  ];

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span>Loading assignments catalog...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar: Status Filter Tabs, Subject Filter, Search, and View Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/60">
          {filterTabOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                statusFilter === opt.value
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <span>{opt.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === opt.value ? 'bg-primary/15 text-primary font-bold' : 'bg-muted text-muted-foreground'
              }`}>
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Subject Filter & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Subjects</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-muted/60 rounded-lg border border-border/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        filteredAssignments.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-xs border-dashed">
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            No assignments match your current filters.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssignments.map((assignment) => {
              const deadlineDate = new Date(assignment.deadline);
              const isOverdue = new Date() > deadlineDate;
              const isSubmitted = assignment.isSubmitted;
              const isGraded = assignment.submissionStatus === 'Graded';

              return (
                <Card
                  key={assignment.id}
                  className="border border-border/80 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {assignment.subjectName}
                      </Badge>

                      {isGraded ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium">
                          <Award className="w-3 h-3 mr-1" /> {assignment.marks} / {assignment.maxMarks}
                        </Badge>
                      ) : isSubmitted ? (
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-[10px] font-medium">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-medium">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>

                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-2 block"
                    >
                      {assignment.title}
                    </Link>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {assignment.description || 'No detailed instructions provided.'}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <School className="w-3.5 h-3.5" /> {assignment.className}
                        </span>
                        <span className="font-semibold text-foreground font-mono">
                          Max: {assignment.maxMarks} pts
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {assignment.teacherName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center gap-2">
                      {assignment.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewPdf({ url: assignment.fileUrl!, name: assignment.fileName || 'submission.pdf' })}
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                          title="Preview PDF"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                        </Button>
                      )}
                      <Button asChild size="sm" className="w-full h-8 text-xs flex items-center justify-center gap-1">
                        <Link href={`/student/assignments/${assignment.id}`}>
                          {isSubmitted ? 'View Submission' : 'Submit Answer'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Table View */
        <DataTable
          columns={columns}
          data={filteredAssignments}
          emptyMessage="No assignments found matching your filter criteria."
          pageSize={10}
        />
      )}

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={!!previewPdf}
        onClose={() => setPreviewPdf(null)}
        fileUrl={previewPdf?.url || ''}
        fileName={previewPdf?.name || ''}
      />
    </div>
  );
}
