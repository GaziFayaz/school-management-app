'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClasses, createClass, deleteClass, fetchSubjects, createSubject, deleteSubject, AdminClass, AdminSubject } from '@/lib/api-admin';
import ClassDetailModal from './ClassDetailModal';
import SubjectEditModal from './SubjectEditModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { School, BookOpen, Plus, Eye, Edit, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ClassDirectoryTab() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<AdminSubject | null>(null);

  // Forms
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: classes = [], isLoading: isClassesLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: fetchClasses,
  });

  const { data: subjects = [], isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: fetchSubjects,
  });

  const createClassMutation = useMutation({
    mutationFn: () => createClass({ name: className, gradeLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setClassName('');
      setGradeLevel('');
      setMsg({ type: 'success', text: 'Class created successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create class.' });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      setMsg({ type: 'success', text: 'Class deleted successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete class.' });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: () => createSubject({ name: subjectName, code: subjectCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setSubjectName('');
      setSubjectCode('');
      setMsg({ type: 'success', text: 'Subject created successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create subject.' });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      setMsg({ type: 'success', text: 'Subject deleted successfully.' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete subject.' });
    },
  });

  return (
    <div className="space-y-8">
      {msg && (
        <Alert variant={msg.type === 'success' ? 'default' : 'destructive'}>
          {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      {/* Section 1: Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <School className="w-5 h-5 text-primary" /> Classes Directory ({classes.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add New Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createClassMutation.mutate();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Class Name</label>
                  <Input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Grade 10-A"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Grade Level</label>
                  <Input
                    type="text"
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Grade 10"
                  />
                </div>
                <Button type="submit" disabled={createClassMutation.isPending} className="w-full text-xs">
                  Create Class
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 p-6">
            {isClassesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : classes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center p-6">No classes created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classes.map((c: AdminClass) => (
                  <Card key={c.id} className="p-4 flex justify-between items-center bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.gradeLevel}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClassId(c.id)}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Roster
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete class ${c.name}?`)) {
                            deleteClassMutation.mutate(c.id);
                          }
                        }}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Section 2: Subjects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Subjects Directory ({subjects.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add New Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createSubjectMutation.mutate();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Subject Name</label>
                  <Input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Subject Code</label>
                  <Input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="MATH101"
                  />
                </div>
                <Button type="submit" disabled={createSubjectMutation.isPending} className="w-full text-xs">
                  Create Subject
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 p-6">
            {isSubjectsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center p-6">No subjects created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((s: AdminSubject) => (
                  <Card key={s.id} className="p-4 flex justify-between items-center bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                      <Badge variant="outline" className="text-[11px] font-mono mt-0.5">{s.code}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedSubject(s)}
                        className="h-8 w-8 text-primary"
                        title="Edit Subject"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete subject ${s.name}?`)) {
                            deleteSubjectMutation.mutate(s.id);
                          }
                        }}
                        className="h-8 w-8 text-destructive"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ClassDetailModal
        classId={selectedClassId}
        isOpen={!!selectedClassId}
        onClose={() => setSelectedClassId(null)}
      />

      <SubjectEditModal
        subject={selectedSubject}
        isOpen={!!selectedSubject}
        onClose={() => setSelectedSubject(null)}
      />
    </div>
  );
}
