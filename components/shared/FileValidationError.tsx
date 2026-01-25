'use client';

/**
 * FileValidationError Component
 *
 * Displays file validation errors with clear messaging and recovery guidance.
 *
 * **Features:**
 * - Error icon (AlertCircle from lucide-react)
 * - Error message with code
 * - Recovery suggestions
 * - Optional dismiss button
 * - Red color scheme (error indication)
 *
 * @example
 * ```tsx
 * <FileValidationError
 *   code="FILE_TOO_LARGE"
 *   message="File too large. Maximum size is 5MB."
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface FileValidationErrorProps {
  /** Error code from validation */
  code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE';
  /** Error message to display */
  message: string;
  /** Optional callback when error is dismissed */
  onDismiss?: () => void;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileValidationError({
  code,
  message,
  onDismiss,
  className,
}: FileValidationErrorProps) {
  return (
    <Card
      className={cn(
        'flex items-start gap-3 border-2 border-destructive bg-destructive/5 p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-destructive">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {code === 'FILE_TOO_LARGE'
            ? 'Try uploading a smaller file (under 5MB).'
            : 'Try uploading a PDF or DOCX file.'}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{code}</p>
      </div>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="Close error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
}
