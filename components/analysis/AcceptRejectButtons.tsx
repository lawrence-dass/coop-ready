'use client'

/**
 * AcceptRejectButtons - Interactive accept/reject buttons for suggestions
 *
 * Features:
 * - Toggle between pending, accepted, rejected states
 * - Visual state changes with colors and icons
 * - Loading states during server action
 * - Accessibility with proper button semantics
 *
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { useSuggestionActions } from '@/hooks/useSuggestionActions'
import { useCallback, useState } from 'react'

interface AcceptRejectButtonsProps {
  suggestionId: string
  scanId: string
  currentStatus: 'pending' | 'accepted' | 'rejected'
  onStatusChange?: (newStatus: 'pending' | 'accepted' | 'rejected') => void
}

export function AcceptRejectButtons({
  suggestionId,
  scanId,
  currentStatus,
  onStatusChange,
}: AcceptRejectButtonsProps) {
  const { isPending, handleAccept, handleReject, handleResetToPending } = useSuggestionActions()
  const [optimisticStatus, setOptimisticStatus] = useState<
    'pending' | 'accepted' | 'rejected'
  >(currentStatus)

  const handleAcceptClick = useCallback(() => {
    const previousStatus = optimisticStatus

    if (optimisticStatus === 'accepted') {
      // Toggle back to pending
      setOptimisticStatus('pending')
      onStatusChange?.('pending')
      handleResetToPending(suggestionId, scanId, () => {
        // Rollback on error
        setOptimisticStatus(previousStatus)
        onStatusChange?.(previousStatus)
      })
    } else {
      // Accept the suggestion
      setOptimisticStatus('accepted')
      onStatusChange?.('accepted')
      handleAccept(suggestionId, scanId, () => {
        // Rollback on error
        setOptimisticStatus(previousStatus)
        onStatusChange?.(previousStatus)
      })
    }
  }, [optimisticStatus, suggestionId, scanId, handleAccept, handleResetToPending, onStatusChange])

  const handleRejectClick = useCallback(() => {
    const previousStatus = optimisticStatus

    if (optimisticStatus === 'rejected') {
      // Toggle back to pending
      setOptimisticStatus('pending')
      onStatusChange?.('pending')
      handleResetToPending(suggestionId, scanId, () => {
        // Rollback on error
        setOptimisticStatus(previousStatus)
        onStatusChange?.(previousStatus)
      })
    } else {
      // Reject the suggestion
      setOptimisticStatus('rejected')
      onStatusChange?.('rejected')
      handleReject(suggestionId, scanId, () => {
        // Rollback on error
        setOptimisticStatus(previousStatus)
        onStatusChange?.(previousStatus)
      })
    }
  }, [optimisticStatus, suggestionId, scanId, handleReject, handleResetToPending, onStatusChange])

  return (
    <div className="flex gap-2 pt-2 border-t">
      <Button
        size="sm"
        variant={optimisticStatus === 'accepted' ? 'default' : 'outline'}
        onClick={handleAcceptClick}
        disabled={isPending}
        className="flex-1 gap-2"
        aria-pressed={optimisticStatus === 'accepted'}
        aria-label={
          optimisticStatus === 'accepted'
            ? 'Accepted - click to revert'
            : 'Accept suggestion'
        }
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {optimisticStatus === 'accepted' ? 'Accepted' : 'Accept'}
      </Button>
      <Button
        size="sm"
        variant={optimisticStatus === 'rejected' ? 'default' : 'outline'}
        onClick={handleRejectClick}
        disabled={isPending}
        className="flex-1 gap-2"
        aria-pressed={optimisticStatus === 'rejected'}
        aria-label={
          optimisticStatus === 'rejected'
            ? 'Rejected - click to revert'
            : 'Reject suggestion'
        }
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        {optimisticStatus === 'rejected' ? 'Rejected' : 'Reject'}
      </Button>
    </div>
  )
}
