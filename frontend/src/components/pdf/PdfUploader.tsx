'use client';

import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from 'lucide-react';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export default function PdfUploader({ onFileSelect, isUploading = false }: PdfUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMessage('Invalid format. Only PDF files (.pdf) are allowed.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum limit of 10 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
        selectedFile ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
      }`}>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2 py-2">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs text-sky-300 font-medium">Uploading PDF to Cloudflare R2...</span>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <FileCheck className="w-8 h-8 text-emerald-400" />
            <span className="text-sm font-semibold text-white">{selectedFile.name}</span>
            <span className="text-xs text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - Ready to submit</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-center">
            <UploadCloud className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-200">Click or drag PDF file to upload</span>
            <span className="text-xs text-slate-400">Strictly PDF format only (Max size: 10 MB)</span>
          </div>
        )}
      </label>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
