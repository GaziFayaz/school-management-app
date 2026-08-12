'use client';

import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

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
      <Card className="overflow-hidden border-2 border-dashed">
        <label className={`p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          selectedFile ? 'bg-primary/5 border-primary/50' : 'bg-muted/40 hover:bg-muted/60'
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
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-primary font-medium">Uploading PDF to Cloudflare R2...</span>
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center space-y-2">
              <FileCheck className="w-8 h-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - Ready to submit</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-center">
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Click or drag PDF file to upload</span>
              <span className="text-xs text-muted-foreground">Strictly PDF format only (Max size: 10 MB)</span>
            </div>
          )}
        </label>
      </Card>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
