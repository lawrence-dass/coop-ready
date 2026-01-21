'use client'

/**
 * useSuggestionActions - Custom hook for managing suggestion status updates
 *
 * Provides optimistic updates, loading states, and toast notifications for:
 * - Accepting/rejecting individual suggestions
 * - Bulk accepting/rejecting suggestions in a section
 *
 * @see Story 5.7: Accept/Reject Individual Suggestions
 */

import { useCallback } from 'react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  updateSuggestionStatus,
  acceptAllInSection,
  rejectAllInSection,
} from '@/actions/suggestions'

export function useSuggestionActions() {
  const [isPending, startTransition] = useTransition()

  /**
   * Accept a single suggestion
   * Supports error rollback via optional callback
   */
  const handleAccept = useCallback(
    (suggestionId: string, scanId: string, onError?: () => void) => {
      startTransition(async () => {
        const { error } = await updateSuggestionStatus({
          suggestionId,
          scanId,
          status: 'accepted',
        })

        if (error) {
          toast.error(error.message)
          onError?.()
          return
        }

        toast.success('Suggestion accepted')
      })
    },
    []
  )

  /**
   * Reject a single suggestion
   * Supports error rollback via optional callback
   */
  const handleReject = useCallback(
    (suggestionId: string, scanId: string, onError?: () => void) => {
      startTransition(async () => {
        const { error } = await updateSuggestionStatus({
          suggestionId,
          scanId,
          status: 'rejected',
        })

        if (error) {
          toast.error(error.message)
          onError?.()
          return
        }

        toast.success('Suggestion rejected')
      })
    },
    []
  )

  /**
   * Reset a suggestion back to pending
   * Used for toggling from accepted/rejected back to pending
   */
  const handleResetToPending = useCallback(
    (suggestionId: string, scanId: string, onError?: () => void) => {
      startTransition(async () => {
        const { error } = await updateSuggestionStatus({
          suggestionId,
          scanId,
          status: 'pending',
        })

        if (error) {
          toast.error(error.message)
          onError?.()
          return
        }

        toast.success('Suggestion reset')
      })
    },
    []
  )

  /**
   * Accept all suggestions in a section
   * Shows count in toast notification
   */
  const handleAcceptAll = useCallback(
    (scanId: string, section: string) => {
      startTransition(async () => {
        const { data, error } = await acceptAllInSection({
          scanId,
          section,
        })

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success(`${data?.count || 0} suggestions accepted`)
      })
    },
    []
  )

  /**
   * Reject all suggestions in a section
   * Shows count in toast notification
   */
  const handleRejectAll = useCallback(
    (scanId: string, section: string) => {
      startTransition(async () => {
        const { data, error } = await rejectAllInSection({
          scanId,
          section,
        })

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success(`${data?.count || 0} suggestions rejected`)
      })
    },
    []
  )

  return {
    isPending,
    handleAccept,
    handleReject,
    handleResetToPending,
    handleAcceptAll,
    handleRejectAll,
  }
}
