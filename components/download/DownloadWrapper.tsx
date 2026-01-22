'use client'

/**
 * DownloadWrapper Component
 * Client component that fetches download data and renders DownloadContainer
 * Story 6.4: Download UI & Format Selection
 */

import React, { useEffect, useState } from 'react'
import { DownloadContainer } from './DownloadContainer'
import { validateDownloadAccess } from '@/actions/download'
import { Skeleton } from '@/components/ui/skeleton'

export interface DownloadWrapperProps {
  scanId: string
}

/**
 * Wrapper that fetches download prerequisites and renders DownloadContainer
 */
export function DownloadWrapper({ scanId }: DownloadWrapperProps): React.ReactElement | null {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAcceptedSuggestions, setHasAcceptedSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDownloadData() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await validateDownloadAccess({ scanId })

        if (result.error) {
          console.error('[DownloadWrapper] Validation error:', result.error)
          setError(result.error.message)
          setIsLoading(false)
          return
        }

        if (result.data) {
          setHasAcceptedSuggestions(result.data.hasAcceptedSuggestions)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('[DownloadWrapper] Unexpected error:', err)
        setError('Failed to load download options')
        setIsLoading(false)
      }
    }

    loadDownloadData()
  }, [scanId])

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    )
  }

  if (error) {
    // Don't show download UI if there's an error
    return null
  }

  return (
    <DownloadContainer
      scanId={scanId}
      hasAcceptedSuggestions={hasAcceptedSuggestions}
    />
  )
}
