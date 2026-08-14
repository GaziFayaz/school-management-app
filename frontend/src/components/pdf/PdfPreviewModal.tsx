'use client';

import React from 'react';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getFileUrl } from '@/lib/utils';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export default function PdfPreviewModal({ isOpen, onClose, fileUrl, fileName }: PdfPreviewModalProps) {
  // Resolve full stream URL for backend serving
  const fullFileUrl = getFileUrl(fileUrl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header Bar */}
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded">
              <FileText className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground truncate max-w-md">
                {fileName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">PDF Document Preview</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mr-6">
            <Button variant="secondary" size="sm" asChild>
              <a href={fullFileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
              </a>
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Embedded Frame Body */}
        <div className="flex-1 bg-muted p-2 relative">
          <iframe
            src={`${fullFileUrl}#toolbar=0`}
            className="w-full h-full rounded border border-border"
            title={fileName}
          />
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-card">
          <span>Format: Application/PDF</span>
          <a
            href={fullFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            Open in new tab <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
