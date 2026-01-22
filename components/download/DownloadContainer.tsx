'use client'

/**
 * DownloadContainer Component
 * Orchestrates download flow with format selection and error handling
 * Story 6.4: Download UI & Format Selection
 */

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadButton } from './DownloadButton'
import { FormatSelectionModal } from './FormatSelectionModal'
import { useResumeDownload } from '@/hooks/useResumeDownload'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AlertCircle, RefreshCw } from 'lucide-react'

export interface DownloadContainerProps {
  scanId: string
  hasAcceptedSuggestions: boolean
}

/**
 * Container component that manages download state and user flow
 */
export function DownloadContainer({
  scanId,
  hasAcceptedSuggestions,
}: DownloadContainerProps): React.ReactElement {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showNoSuggestionsWarning, setShowNoSuggestionsWarning] = useState(false)

  // Download hook (userName removed - filename generated server-side from contact info)
  const { download, isLoading, error, retry } = useResumeDownload(
    scanId,
    {
      onSuccess: (format) => {
        toast.success('Resume downloaded!', {
          description: `Your ${format.toUpperCase()} resume has been saved to your downloads.`,
        })
        setIsModalOpen(false)
      },
      onError: (err) => {
        toast.error('Download failed', {
          description: err.message || 'Please try again.',
        })
      },
    }
  )

  /**
   * Handle download button click
   * Show warning if no suggestions accepted, otherwise show format selector
   */
  const handleDownloadClick = useCallback(() => {
    if (!hasAcceptedSuggestions) {
      setShowNoSuggestionsWarning(true)
    } else {
      setIsModalOpen(true)
    }
  }, [hasAcceptedSuggestions])

  /**
   * Handle format selection
   */
  const handleFormatSelect = useCallback(
    async (format: 'pdf' | 'docx') => {
      await download(format)
    },
    [download]
  )

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(async () => {
    await retry()
  }, [retry])

  /**
   * Download original resume (no suggestions applied)
   */
  const handleDownloadOriginal = useCallback(() => {
    setShowNoSuggestionsWarning(false)
    setIsModalOpen(true)
  }, [])

  /**
   * Navigate to suggestions page using Next.js router for SPA navigation
   */
  const handleReviewSuggestions = useCallback(() => {
    setShowNoSuggestionsWarning(false)
    router.push(`/analysis/${scanId}/suggestions`)
  }, [router, scanId])

  return (
    <div className="space-y-4">
      {/* Download Button - AC1 */}
      <div className="flex justify-center">
        <DownloadButton
          onClick={handleDownloadClick}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>

      {/* Format Selection Modal - AC2, AC3, AC4, AC5 */}
      <FormatSelectionModal
        isOpen={isModalOpen && !showNoSuggestionsWarning}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleFormatSelect}
        isLoading={isLoading}
      />

      {/* No Suggestions Warning Sheet - AC7 (using Sheet for accessibility) */}
      <Sheet open={showNoSuggestionsWarning} onOpenChange={setShowNoSuggestionsWarning}>
        <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto" aria-label="No changes warning">
          <SheetHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <SheetTitle>No Changes Accepted</SheetTitle>
                <SheetDescription className="mt-1">
                  You haven&apos;t accepted any suggestions yet. Do you want to download your original resume?
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleReviewSuggestions}
              className="flex-1"
            >
              Review Suggestions
            </Button>
            <Button
              onClick={handleDownloadOriginal}
              className="flex-1"
            >
              Download Original
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Error State with Retry - AC6 */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Download Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {error.message || 'An error occurred while generating your resume.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
