'use client'

/**
 * SectionActions - Bulk accept/reject buttons for all suggestions in a section
 *
 * Features:
 * - Only visible when pending suggestions exist
 * - Bulk update with single click
 * - Shows count in toast notification
 * - Section-level controls
 *
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useSuggestionActions } from '@/hooks/useSuggestionActions'

interface SectionActionsProps {
  scanId: string
  section: string
  hasPendingSuggestions: boolean
}

export function SectionActions({
  scanId,
  section,
  hasPendingSuggestions,
}: SectionActionsProps) {
  const { isPending, handleAcceptAll, handleRejectAll } =
    useSuggestionActions()

  if (!hasPendingSuggestions) return null

  return (
    <div className="flex gap-2 p-3 border-t border-gray-200 bg-gray-50">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAcceptAll(scanId, section)}
        disabled={isPending}
        className="gap-2 flex-1"
        aria-label={`Accept all suggestions in ${section}`}
      >
        <CheckCircle2 className="h-4 w-4" />
        Accept All
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleRejectAll(scanId, section)}
        disabled={isPending}
        className="gap-2 flex-1"
        aria-label={`Reject all suggestions in ${section}`}
      >
        <XCircle className="h-4 w-4" />
        Reject All
      </Button>
    </div>
  )
}
