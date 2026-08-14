'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTeacherAssignment, TeacherAssignment } from '@/lib/api-teacher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface AssignmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: TeacherAssignment | null;
  onUpdated?: () => void;
}

export default function AssignmentEditModal({
  isOpen,
  onClose,
  assignment,
  onUpdated,
}: AssignmentEditModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [status, setStatus] = useState<'Draft' | 'Published'>('Published');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      // Format deadline for datetime-local input
      if (assignment.deadline) {
        const d = new Date(assignment.deadline);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDeadline(formatted);
      } else {
        setDeadline('');
      }
      setMaxMarks(assignment.maxMarks || 100);
      setStatus(assignment.status || 'Published');
      setErrorMsg(null);
    }
  }, [assignment]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!assignment) return;
      return updateTeacherAssignment(assignment.id, {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignment-detail', assignment?.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview-stats'] });
      if (onUpdated) onUpdated();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update assignment.');
    },
  });

  if (!assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Title is required.');
      return;
    }

    if (!deadline) {
      setErrorMsg('Deadline date and time is required.');
      return;
    }

    if (maxMarks <= 0) {
      setErrorMsg('Maximum marks must be greater than 0.');
      return;
    }

    updateMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit className="w-4 h-4 text-primary" /> Edit Assignment
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {assignment.className} • {assignment.subjectName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Assignment Title <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algebra Problem Set 1"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description & Instructions <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear instructions for student PDF submissions..."
              className="resize-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Deadline Date & Time <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Maximum Marks <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="1"
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 0)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Publish Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published')}
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="Published">Published (Visible to students)</option>
              <option value="Draft">Draft (Hidden from students)</option>
            </select>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={updateMutation.isPending} className="text-xs flex items-center gap-1.5">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
