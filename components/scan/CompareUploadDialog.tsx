'use client';

/**
 * CompareUploadDialog Component (Story 17.2)
 *
 * Dialog for uploading an updated resume to compare against original.
 * Shows actual improvement after applying suggestions.
 *
 * **Features:**
 * - Reuses ResumeUploader component for validation
 * - Handles file selection and error display
 * - Shows loading state during comparison
 * - Provides encouraging copy for user motivation
 *
 * @example
 * ```tsx
 * <CompareUploadDialog
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 *   sessionId={session.id}
 * />
 * ```
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResumeUploader } from '@/components/shared/ResumeUploader';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { compareResume } from '@/actions/compareResume';

// ============================================================================
// TYPES
// ============================================================================

interface CompareUploadDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback to change dialog state */
  onOpenChange: (open: boolean) => void;
  /** Current session ID for comparison */
  sessionId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompareUploadDialog({
  open,
  onOpenChange,
  sessionId,
}: CompareUploadDialogProps) {
  // Note: useRouter will be needed in Story 17.4 for navigation to comparison results
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<{ code: string; message: string } | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUploadedFile(null);
      setUploadError(null);
      setIsComparing(false);
    }
  }, [open]);

  /**
   * Handle file selection from uploader
   * Story 17.3: Implements actual comparison flow
   */
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setUploadError(null);
    setIsComparing(true);

    try {
      const { data, error } = await compareResume(sessionId, file);

      if (error) {
        setUploadError(error);
        setIsComparing(false);
        return;
      }

      // Success - show improvement and close dialog
      toast.success(`Score improved by ${Math.round(data.improvementPoints)} points!`);
      onOpenChange(false);

      // Story 17.4 will add navigation to comparison results page:
      // router.push(`/scan/${sessionId}/comparison`);
    } catch (err) {
      setUploadError({
        code: 'VALIDATION_ERROR',
        message: 'Unexpected error during comparison'
      });
      setIsComparing(false);
    }
  };

  /**
   * Handle file removal
   */
  const handleFileRemove = () => {
    setUploadedFile(null);
    setUploadError(null);
    setIsComparing(false);
  };

  /**
   * Handle upload errors
   */
  const handleError = (error: { code: string; message: string }) => {
    setUploadError(error);
    setIsComparing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compare with Updated Resume</DialogTitle>
          <DialogDescription>
            Upload your updated resume to see your actual improvement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to see your improvement? Upload your resume with the suggestions applied.
            We'll compare it against your original to show your actual score increase.
          </p>

          <ResumeUploader
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            onError={handleError}
            selectedFile={
              uploadedFile
                ? { name: uploadedFile.name, size: uploadedFile.size }
                : null
            }
          />

          {uploadError && (
            <ErrorDisplay
              errorCode={uploadError.code}
              message={uploadError.message}
              onDismiss={() => setUploadError(null)}
            />
          )}

          {isComparing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your updated resume...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isComparing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
