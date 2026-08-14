'use client';

import React, { useState, DragEvent } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2, FileUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export default function PdfUploader({ onFileSelect, isUploading = false }: PdfUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Invalid format. Only PDF files (.pdf) are allowed.');
      setSelectedFile(null);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum limit of 10 MB.');
      setSelectedFile(null);
      return false;
    }

    setSelectedFile(file);
    onFileSelect(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndProcessFile(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the drop container
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <Card
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`overflow-hidden border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-primary/10 shadow-lg scale-[1.01]'
            : selectedFile
            ? 'border-primary/50 bg-primary/5'
            : 'border-border bg-muted/40 hover:bg-muted/60 hover:border-muted-foreground/40'
        }`}
      >
        <label className="p-6 flex flex-col items-center justify-center cursor-pointer transition-colors w-full h-full">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 py-3">
              <Loader2 className="w-9 h-9 text-primary animate-spin" />
              <span className="text-sm text-primary font-medium">Uploading PDF to secure storage...</span>
              <span className="text-xs text-muted-foreground">Please do not navigate away</span>
            </div>
          ) : isDragging ? (
            <div className="flex flex-col items-center space-y-2 py-3 text-primary animate-pulse">
              <FileUp className="w-10 h-10 text-primary" />
              <span className="text-sm font-semibold">Drop your PDF file here</span>
              <span className="text-xs text-primary/80">Release to select file</span>
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center space-y-2 py-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FileCheck className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-foreground max-w-xs truncate text-center">
                {selectedFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drop another file to replace
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Click or drag & drop PDF file to upload
              </span>
              <span className="text-xs text-muted-foreground">
                PDF document only • Maximum file size: 10 MB
              </span>
            </div>
          )}
        </label>
      </Card>

      {errorMessage && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
