'use client'

/**
 * SuggestionsErrorState - Client component for error state with retry button
 *
 * Extracted from server component to allow onClick handler.
 *
 * @see Story 5.9: Suggestions Page UI Implementation - AC7
 */

import { useRouter } from 'next/navigation'

interface SuggestionsErrorStateProps {
  errorMessage: string
}

export function SuggestionsErrorState({ errorMessage }: SuggestionsErrorStateProps) {
  const router = useRouter()

  const handleRetry = () => {
    router.refresh()
  }

  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6" data-testid="suggestions-error-state">
      <h3 className="font-semibold text-red-900 mb-2">
        Failed to load suggestions
      </h3>
      <p className="text-sm text-red-700 mb-4">
        {errorMessage || 'An unexpected error occurred while loading suggestions.'}
      </p>
      <button
        onClick={handleRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        data-testid="retry-button"
      >
        Retry
      </button>
    </div>
  )
}
