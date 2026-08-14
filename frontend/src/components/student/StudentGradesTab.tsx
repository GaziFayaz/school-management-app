'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentGrades, StudentGradeItem } from '@/lib/api-student';
import { DataTable, ColumnDef, FilterTabOption } from '@/components/ui/data-table';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getFileUrl } from '@/lib/utils';
import {
  Award,
  BookOpen,
  Calendar,
  Eye,
  Download,
  MessageSquare,
  Sparkles,
  Loader2,
  TrendingUp,
  User,
  School,
  CheckCircle2,
} from 'lucide-react';

export default function StudentGradesTab() {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<StudentGradeItem | null>(null);

  const { data: grades = [], isLoading, isError } = useQuery<StudentGradeItem[]>({
    queryKey: ['student-grades'],
    queryFn: fetchStudentGrades,
  });

  // Calculate Grade Statistics
  const stats = useMemo(() => {
    const graded = grades.filter((g) => g.status === 'Graded' && g.marks !== null && g.marks !== undefined);
    const totalGraded = graded.length;

    let totalPercent = 0;
    let highestPercent = 0;
    let distinctionCount = 0;
    let passCount = 0;
    let needsImprovementCount = 0;

    graded.forEach((g) => {
      const pct = g.percentage ?? ((g.marks! / g.maxMarks) * 100);
      totalPercent += pct;
      if (pct > highestPercent) highestPercent = pct;

      if (pct >= 80) distinctionCount++;
      else if (pct >= 50) passCount++;
      else needsImprovementCount++;
    });

    const averagePercent = totalGraded > 0 ? Math.round(totalPercent / totalGraded) : 0;

    return {
      totalGraded,
      totalSubmissions: grades.length,
      averagePercent,
      highestPercent: Math.round(highestPercent),
      distinctionCount,
      passCount,
      needsImprovementCount,
    };
  }, [grades]);

  // Filtered dataset
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const pct = g.percentage ?? (g.marks !== null && g.marks !== undefined ? (g.marks / g.maxMarks) * 100 : null);

      if (filterTier === 'distinction') {
        return pct !== null && pct >= 80;
      }
      if (filterTier === 'pass') {
        return pct !== null && pct >= 50 && pct < 80;
      }
      if (filterTier === 'improvement') {
        return pct !== null && pct < 50;
      }
      return true;
    });
  }, [grades, filterTier]);

  const filterOptions: FilterTabOption[] = [
    { label: 'All Grades', value: 'all', count: grades.length },
    { label: 'Distinction (≥80%)', value: 'distinction', count: stats.distinctionCount },
    { label: 'Pass (50-79%)', value: 'pass', count: stats.passCount },
    { label: 'Needs Improvement (<50%)', value: 'improvement', count: stats.needsImprovementCount },
  ];

  // Column definitions
  const columns: ColumnDef<StudentGradeItem>[] = useMemo(
    () => [
      {
        header: 'Assignment & Subject',
        accessorKey: 'assignmentTitle',
        sortable: true,
        cell: (item) => (
          <div className="space-y-1 py-1">
            <Link
              href={`/student/assignments/${item.assignmentId}`}
              className="text-xs font-semibold text-foreground hover:text-primary transition-colors block"
            >
              {item.assignmentTitle}
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
        header: 'Submitted',
        accessorKey: 'submittedAt',
        sortable: true,
        cell: (item) => (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        ),
      },
      {
        header: 'Marks Awarded',
        accessorKey: 'marks',
        sortable: true,
        cell: (item) => {
          if (item.marks === null || item.marks === undefined) {
            return <span className="text-xs text-muted-foreground italic">Pending</span>;
          }
          return (
            <div className="text-xs font-semibold text-foreground font-mono">
              {item.marks} / {item.maxMarks}
            </div>
          );
        },
      },
      {
        header: 'Score %',
        accessorKey: 'percentage',
        sortable: true,
        cell: (item) => {
          if (item.percentage === null || item.percentage === undefined) {
            return (
              <Badge variant="secondary" className="text-[10px]">
                Under Review
              </Badge>
            );
          }

          const pct = item.percentage;
          if (pct >= 80) {
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px]">
                {pct}% Distinction
              </Badge>
            );
          }
          if (pct >= 50) {
            return (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px]">
                {pct}% Pass
              </Badge>
            );
          }
          return (
            <Badge variant="destructive" className="font-bold text-[10px]">
              {pct}% Needs Work
            </Badge>
          );
        },
      },
      {
        header: 'Teacher Feedback',
        cell: (item) => {
          if (!item.feedback) {
            return <span className="text-xs text-muted-foreground italic">None provided</span>;
          }
          return (
            <button
              onClick={() => setSelectedFeedback(item)}
              className="text-xs text-left text-muted-foreground hover:text-foreground line-clamp-1 max-w-xs flex items-center gap-1 group"
              title="Click to view full feedback"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">"{item.feedback}"</span>
            </button>
          );
        },
      },
      {
        header: 'Submitted File',
        className: 'text-right',
        cell: (item) => (
          <div className="flex items-center justify-end gap-1.5">
            {item.fileUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewPdf({ url: item.fileUrl, name: item.fileName })}
                  className="h-7 px-2 text-xs"
                  title="Preview PDF"
                >
                  <Eye className="w-3.5 h-3.5 text-primary mr-1" /> Preview
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0" title="Download PDF">
                  <a href={getFileUrl(item.fileUrl)} download={item.fileName} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span>Loading academic transcript and gradebook...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Evaluated Submissions</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalGraded}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Out of {stats.totalSubmissions} Total Submissions</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cumulative Average</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.averagePercent}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Across all graded coursework</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Highest Score</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.highestPercent}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Peak academic benchmark</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gradebook DataTable */}
      <DataTable
        columns={columns}
        data={filteredGrades}
        searchKey="assignmentTitle"
        searchPlaceholder="Search by assignment, instructor or subject..."
        filterOptions={filterOptions}
        filterValue={filterTier}
        onFilterChange={(v) => setFilterTier(v)}
        emptyMessage="No evaluated submissions found matching your filters."
        pageSize={10}
      />

      {/* Teacher Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Instructor Feedback & Remarks
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {selectedFeedback?.assignmentTitle} ({selectedFeedback?.className})
            </p>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground">Teacher: </span>
                <span className="font-semibold text-foreground">{selectedFeedback?.teacherName}</span>
              </div>
              <Badge className="bg-emerald-500 text-white font-bold">
                {selectedFeedback?.marks} / {selectedFeedback?.maxMarks} ({selectedFeedback?.percentage}%)
              </Badge>
            </div>

            <div className="p-4 rounded-lg bg-background border border-border/80 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
              {selectedFeedback?.feedback || 'No written comments provided.'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
