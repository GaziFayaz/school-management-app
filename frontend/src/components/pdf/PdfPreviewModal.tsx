'use client';

import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export default function PdfPreviewModal({ isOpen, onClose, fileUrl, fileName }: PdfPreviewModalProps) {
  if (!isOpen) return null;

  // Resolve full stream URL for backend serving
  const fullFileUrl = fileUrl.startsWith('http')
    ? fileUrl
    : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white truncate max-w-md">{fileName}</h3>
              <p className="text-xs text-slate-400">PDF Document Preview</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={fullFileUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-medium px-3 py-1.5 rounded-lg border border-sky-500/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Embedded Frame Body */}
        <div className="flex-1 bg-slate-950 p-2 relative">
          <iframe
            src={`${fullFileUrl}#toolbar=0`}
            className="w-full h-full rounded-lg border border-slate-800"
            title={fileName}
          />
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/50">
          <span>Format: Application/PDF</span>
          <a
            href={fullFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline flex items-center gap-1"
          >
            Open in new tab <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
}
