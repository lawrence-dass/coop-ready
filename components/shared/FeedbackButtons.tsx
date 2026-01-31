'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FeedbackButtonsProps {
  /** Unique suggestion ID for tracking */
  suggestionId: string;

  /** Which section this suggestion belongs to */
  sectionType: 'summary' | 'skills' | 'experience' | 'education';

  /** Current feedback state: true = helpful, false = not helpful, null = no feedback */
  currentFeedback?: boolean | null;

  /** Callback when user provides feedback */
  onFeedback: (helpful: boolean | null) => Promise<void>;

  /** Disable buttons (e.g., while saving) */
  disabled?: boolean;
}

/**
 * FeedbackButtons Component
 *
 * Displays thumbs up/down buttons for suggestion feedback.
 * Supports toggle functionality and visual confirmation.
 *
 * Story 7.4: Implement Suggestion Feedback
 */
export function FeedbackButtons({
  suggestionId,
  sectionType,
  currentFeedback = null,
  onFeedback,
  disabled = false,
}: FeedbackButtonsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (helpful: boolean) => {
    // Toggle: if same button clicked, remove feedback
    const newFeedback = currentFeedback === helpful ? null : helpful;

    setIsSubmitting(true);
    try {
      await onFeedback(newFeedback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || isSubmitting;

  // Extract index from suggestionId format "sug_{section}_{index}"
  const suggestionIndex = suggestionId.split('_').pop() ?? '0';

  return (
    <div
      className="flex items-center gap-3"
      data-suggestion-id={suggestionId}
      data-section={sectionType}
    >
      {/* Thumbs Up Button */}
      <button
        type="button"
        aria-label="Mark as helpful"
        onClick={() => handleFeedback(true)}
        disabled={isDisabled}
        tabIndex={0}
        data-testid={`feedback-up-${sectionType}-${suggestionIndex}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFeedback(true);
          }
        }}
        className={cn(
          'inline-flex items-center justify-center',
          'w-10 h-10 rounded-md',
          'transition-all duration-200 ease-in-out',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          currentFeedback === true
            ? 'text-accent bg-accent/10 active'
            : 'text-gray-400 bg-white'
        )}
      >
        <ThumbsUp
          className={cn(
            'w-5 h-5',
            currentFeedback === true ? 'fill-current' : ''
          )}
        />
      </button>

      {/* Thumbs Down Button */}
      <button
        type="button"
        aria-label="Mark as not helpful"
        onClick={() => handleFeedback(false)}
        disabled={isDisabled}
        tabIndex={0}
        data-testid={`feedback-down-${sectionType}-${suggestionIndex}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFeedback(false);
          }
        }}
        className={cn(
          'inline-flex items-center justify-center',
          'w-10 h-10 rounded-md',
          'transition-all duration-200 ease-in-out',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          currentFeedback === false
            ? 'text-accent bg-accent/10 active'
            : 'text-gray-400 bg-white'
        )}
      >
        <ThumbsDown
          className={cn(
            'w-5 h-5',
            currentFeedback === false ? 'fill-current' : ''
          )}
        />
      </button>
    </div>
  );
}
