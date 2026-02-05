'use client';

/**
 * JobDescriptionInput Component
 *
 * Textarea for entering job description text with validation and character counter.
 *
 * **Features:**
 * - Real-time character counter
 * - Validation feedback (min 50 characters)
 * - Clear button when text is present
 * - Disabled state support
 *
 * @example
 * ```tsx
 * <JobDescriptionInput
 *   value={jdContent || ''}
 *   onChange={setJDContent}
 *   onClear={clearJD}
 *   isDisabled={isLoading}
 * />
 * ```
 */

import { cn } from '@/lib/utils';
import { MIN_JD_LENGTH, isJobDescriptionValid } from '@/lib/validations/jobDescription';
import { CheckCircle2, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface JobDescriptionInputProps {
  /** Current value of the textarea */
  value?: string;
  /** Callback when text changes */
  onChange: (text: string) => void;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Whether the input is disabled */
  isDisabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function JobDescriptionInput({
  value = '',
  onChange,
  onClear,
  isDisabled = false,
  className,
}: JobDescriptionInputProps) {
  const characterCount = value.length;
  // Use the same validation logic as the helper function (trims whitespace)
  const isValid = isJobDescriptionValid(value);
  const isEmpty = value.trim().length === 0;

  return (
    <div className={cn('space-y-2', className)}>
      <textarea
        id="jd-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        placeholder="Paste the job description here..."
        data-testid="job-description-input"
        className={cn(
          'w-full h-[295px] p-3 border rounded-md resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isValid && 'ring-1 ring-success border-success'
        )}
      />

      {/* Success Banner - shown when valid */}
      {isValid && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p className="flex-1">
            {characterCount.toLocaleString()} characters
          </p>
          <button
            type="button"
            onClick={onClear}
            disabled={isDisabled}
            className="ml-auto rounded-md p-1 text-green-600 hover:bg-green-100 hover:text-green-800 disabled:opacity-50"
            aria-label="Clear job description"
            data-testid="clear-jd-button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Character count - shown when not valid */}
      {!isValid && (
        <div className="flex justify-between items-center text-xs">
          <span
            className={cn(
              isEmpty && 'text-muted-foreground',
              !isEmpty && 'text-destructive'
            )}
          >
            {characterCount} characters
            {!isEmpty && ` (minimum ${MIN_JD_LENGTH} required)`}
            {isEmpty && ' (required)'}
          </span>
        </div>
      )}
    </div>
  );
}
