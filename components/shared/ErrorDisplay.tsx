'use client';

/**
 * ErrorDisplay Component
 *
 * Generalized error display component for all error types across the application.
 * Displays clear error messages with recovery suggestions and dismissal functionality.
 *
 * **Features:**
 * - Error type/category title
 * - Plain-language error message
 * - Recovery action suggestion
 * - Error code display (for debugging/support)
 * - Dismissible with X button
 * - Accessible (aria-live, role="alert")
 * - Red/danger color scheme
 *
 * **Usage:**
 * ```tsx
 * <ErrorDisplay
 *   errorCode="LLM_TIMEOUT"
 *   onDismiss={() => clearError()}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom message override
 * <ErrorDisplay
 *   errorCode="LLM_ERROR"
 *   message="Custom error message"
 *   onDismiss={() => store.setError(null)}
 * />
 * ```
 */

import { AlertCircle, X, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getErrorDisplay } from '@/lib/errorMessages';
import { isErrorRetriable, MAX_RETRY_ATTEMPTS } from '@/lib/retryUtils';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorDisplayProps {
  /** Error code from standardized error codes (e.g., 'LLM_TIMEOUT', 'INVALID_FILE_TYPE') */
  errorCode: string;
  /** Optional custom message override (if not provided, uses getErrorDisplay mapping) */
  message?: string;
  /** Optional callback when error is dismissed */
  onDismiss?: () => void;
  /** Optional callback when retry is clicked (Story 7.2) */
  onRetry?: () => void;
  /** Current retry attempt count (Story 7.2) */
  retryCount?: number;
  /** Whether retry is currently in progress (Story 7.2) */
  isRetrying?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ErrorDisplay({
  errorCode,
  message,
  onDismiss,
  onRetry,
  retryCount = 0,
  isRetrying = false,
  className,
}: ErrorDisplayProps) {
  // Get error display information from mapping
  const errorInfo = getErrorDisplay(errorCode);

  // Use custom message if provided, otherwise use mapped message
  const displayMessage = message ?? errorInfo.message;

  // Determine if error is retriable and retry button should be shown
  const canRetry = isErrorRetriable(errorCode) && onRetry !== undefined;
  const maxRetriesReached = retryCount >= MAX_RETRY_ATTEMPTS;

  return (
    <Card
      className={cn(
        'flex items-start gap-3 border-2 border-destructive bg-destructive/5 p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />

      {/* Error Content */}
      <div className="flex-1 min-w-0">
        {/* Error Title */}
        <p className="font-medium text-sm text-destructive">
          {errorInfo.title}
        </p>

        {/* Error Message */}
        <p className="text-sm text-foreground mt-1">
          {displayMessage}
        </p>

        {/* Recovery Suggestion */}
        <p className="text-xs text-muted-foreground mt-2">
          {errorInfo.recoveryAction}
        </p>

        {/* Error Code (for debugging/support) */}
        <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
          Error code: {errorCode}
        </p>

        {/* Max Retries Message (Story 7.2) */}
        {canRetry && maxRetriesReached && (
          <p className="text-xs text-orange-600 mt-2 font-medium">
            Maximum retry attempts reached
          </p>
        )}

        {/* Retry Button (Story 7.2) */}
        {canRetry && !maxRetriesReached && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {isRetrying ? (
              <>
                <RotateCw className="h-3 w-3 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RotateCw className="h-3 w-3 mr-2" />
                Retry {retryCount > 0 ? `(Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})` : ''}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Dismiss Button */}
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
