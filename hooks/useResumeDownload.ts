'use client'

/**
 * useResumeDownload Hook
 * Manages resume download state and orchestrates PDF/DOCX generation
 * Story 6.4: Download UI & Format Selection
 */

import { useState, useCallback } from 'react'
import { generateResumePDF } from '@/actions/export'
import { generateResumeDOCX } from '@/actions/export'
import { trackDownload } from '@/actions/download'

export interface UseResumeDownloadOptions {
  onSuccess?: (format: 'pdf' | 'docx') => void
  onError?: (error: Error) => void
}

export interface UseResumeDownloadReturn {
  download: (format: 'pdf' | 'docx') => Promise<void>
  isLoading: boolean
  error: Error | null
  retry: () => Promise<void>
}

/**
 * Custom hook for downloading resume in PDF or DOCX format
 *
 * @param scanId - Scan ID to download resume for
 * @param options - Optional callbacks for success and error
 * @returns Download function, loading state, error, and retry
 */
export function useResumeDownload(
  scanId: string,
  options?: UseResumeDownloadOptions
): UseResumeDownloadReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFormat, setLastFormat] = useState<'pdf' | 'docx' | null>(null)

  /**
   * Download resume in specified format
   */
  const download = useCallback(
    async (format: 'pdf' | 'docx') => {
      setIsLoading(true)
      setError(null)
      setLastFormat(format)

      try {
        // Call appropriate generator based on format
        const result = format === 'pdf'
          ? await generateResumePDF({ scanId, format })
          : await generateResumeDOCX({ scanId, format })

        if (result.error) {
          throw new Error(result.error.message || `Failed to generate ${format.toUpperCase()}`)
        }

        if (!result.data) {
          throw new Error(`No file data received for ${format.toUpperCase()}`)
        }

        const { fileBlob, fileName, mimeType } = result.data

        // Convert Buffer to Blob for browser download
        // Buffer from server needs to be converted to Uint8Array for Blob
        const uint8Array = new Uint8Array(fileBlob)
        const blob = new Blob([uint8Array], { type: mimeType })
        const url = URL.createObjectURL(blob)

        // Trigger browser download
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Track download in database
        await trackDownload({ scanId, format })

        // Call success callback
        options?.onSuccess?.(format)

        setIsLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Download failed')
        console.error('[useResumeDownload] Download error:', error)
        setError(error)
        setIsLoading(false)

        // Call error callback
        options?.onError?.(error)
      }
    },
    [scanId, options]
  )

  /**
   * Retry last download
   */
  const retry = useCallback(async () => {
    if (!lastFormat) {
      console.error('[useResumeDownload] No format to retry')
      return
    }
    await download(lastFormat)
  }, [download, lastFormat])

  return {
    download,
    isLoading,
    error,
    retry,
  }
}
