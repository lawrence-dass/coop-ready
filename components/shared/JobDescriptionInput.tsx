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
          'w-full h-[210px] p-3 border rounded-md resize-none',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isValid && 'ring-1 ring-green-500 border-green-500'
        )}
      />

      <div className="flex justify-between items-center text-xs">
        <span
          className={cn(
            isEmpty && 'text-gray-500',
            !isEmpty && !isValid && 'text-red-600',
            isValid && 'text-green-600'
          )}
        >
          {characterCount} characters
          {!isValid && !isEmpty && ` (minimum ${MIN_JD_LENGTH} required)`}
          {isEmpty && ' (required)'}
        </span>
        {!isEmpty && (
          <button
            onClick={onClear}
            disabled={isDisabled}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            type="button"
            aria-label="Clear job description"
            data-testid="clear-jd-button"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
