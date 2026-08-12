'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSubject, AdminSubject } from '@/lib/api-admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface SubjectEditModalProps {
  subject: AdminSubject | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubjectEditModal({ subject, isOpen, onClose }: SubjectEditModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setCode(subject.code);
      setMsg(null);
    }
  }, [subject]);

  const mutation = useMutation({
    mutationFn: () => updateSubject(subject!.id, { name, code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      onClose();
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update subject.' });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Edit Subject Details
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update subject title and unique course code.
          </DialogDescription>
        </DialogHeader>

        {msg && (
          <Alert variant={msg.type === 'success' ? 'default' : 'destructive'} className="my-2">
            {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription className="text-xs">{msg.text}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-3 py-2"
        >
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Subject Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Mathematics" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Subject Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="MATH101" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending} className="text-xs">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
