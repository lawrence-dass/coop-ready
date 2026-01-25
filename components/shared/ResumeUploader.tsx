'use client';

/**
 * ResumeUploader Component
 *
 * Handles file upload via drag-drop or click-to-browse.
 * Supports PDF and DOCX files only.
 *
 * **Features:**
 * - Drag-and-drop file upload
 * - Click-to-browse file picker
 * - Visual feedback on drag-over
 * - File display with name and size
 * - Remove file functionality
 *
 * @example
 * ```tsx
 * <ResumeUploader
 *   onFileSelect={(file) => setPendingFile(file)}
 *   onFileRemove={() => setPendingFile(null)}
 *   selectedFile={pendingFile ? { name: pendingFile.name, size: pendingFile.size } : null}
 * />
 * ```
 */

import { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, FileType, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ResumeUploaderProps {
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when file is removed */
  onFileRemove: () => void;
  /** Callback when file validation fails */
  onError?: (error: { code: string; message: string }) => void;
  /** Currently selected file metadata */
  selectedFile?: { name: string; size: number } | null;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum file size in bytes (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Accepted MIME types for resume uploads */
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format file size in human-readable format
 *
 * @example
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1024 * 1024) // "1.0 MB"
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render file type icon based on file extension
 */
function FileIcon({ filename }: { filename: string }) {
  const Icon = filename.toLowerCase().endsWith('.pdf') ? FileText : FileType;
  return <Icon className="h-8 w-8 text-muted-foreground shrink-0" />;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ResumeUploader({
  onFileSelect,
  onFileRemove,
  onError,
  selectedFile,
  className,
}: ResumeUploaderProps) {
  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  // Handle file rejection
  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      if (!onError || rejections.length === 0) return;

      const rejection = rejections[0];
      const firstError = rejection.errors[0];

      if (firstError.code === 'file-too-large') {
        onError({
          code: 'FILE_TOO_LARGE',
          message: 'File too large. Maximum size is 5MB.',
        });
      } else if (firstError.code === 'file-invalid-type') {
        onError({
          code: 'INVALID_FILE_TYPE',
          message: 'Invalid file type. Please upload a PDF or DOCX file.',
        });
      }
    },
    [onError]
  );

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  // ============================================================================
  // RENDER: File Selected State
  // ============================================================================

  if (selectedFile) {
    return (
      <Card
        className={cn(
          'flex items-center justify-between gap-4 border-2 border-solid p-4',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FileIcon filename={selectedFile.name} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onFileRemove}
          className="shrink-0"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  // ============================================================================
  // RENDER: Empty Upload Zone
  // ============================================================================

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-8 transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/50 hover:bg-muted/20',
        className
      )}
    >
      <input {...getInputProps()} aria-label="Upload resume. Accepts PDF and DOCX files." />

      <div className="rounded-full bg-primary/10 p-3">
        <Upload
          className={cn(
            'h-8 w-8 text-primary',
            isDragActive && 'animate-bounce'
          )}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop file here' : 'Upload Resume'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Drag & drop or click to browse
        </p>
      </div>

      <div className="flex gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted px-2 py-1 font-mono">PDF</span>
        <span className="rounded-md bg-muted px-2 py-1 font-mono">DOCX</span>
      </div>
    </Card>
  );
}
