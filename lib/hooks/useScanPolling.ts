'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getScan, type ScanData } from '@/actions/scan'

/**
 * Scan Polling Hook
 *
 * Polls for scan status updates with exponential backoff on errors.
 * Automatically stops polling when scan reaches terminal state.
 *
 * @see Story 4.7: Analysis Results Page - Task 3
 */

// Configuration
const BASE_POLL_INTERVAL = 2000 // 2 seconds
const MAX_BACKOFF_INTERVAL = 16000 // 16 seconds max
const MAX_ERROR_RETRIES = 5 // Stop after 5 consecutive errors
const TERMINAL_STATES = ['completed', 'failed'] as const

interface UseScanPollingOptions {
  /** Initial scan data (if available) */
  initialScan?: ScanData | null
  /** Whether to start polling immediately */
  enabled?: boolean
}

interface UseScanPollingResult {
  /** Current scan data */
  scan: ScanData | null
  /** Whether initial load is in progress */
  isLoading: boolean
  /** Error message if polling failed */
  error: string | null
  /** Whether polling is active */
  isPolling: boolean
  /** Number of consecutive errors */
  errorCount: number
  /** Manually trigger a refresh */
  refresh: () => Promise<void>
}

export function useScanPolling(
  scanId: string | undefined,
  options: UseScanPollingOptions = {}
): UseScanPollingResult {
  const { initialScan = null, enabled = true } = options

  const [scan, setScan] = useState<ScanData | null>(initialScan)
  const [isLoading, setIsLoading] = useState(!initialScan)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [errorCount, setErrorCount] = useState(0)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Calculate backoff delay based on error count
  const getBackoffDelay = useCallback((errors: number): number => {
    if (errors === 0) return BASE_POLL_INTERVAL
    // Exponential backoff: 2s, 4s, 8s, 16s (capped)
    const delay = BASE_POLL_INTERVAL * Math.pow(2, errors)
    return Math.min(delay, MAX_BACKOFF_INTERVAL)
  }, [])

  // Fetch scan data
  const fetchScan = useCallback(async (showLoading = false): Promise<boolean> => {
    if (!scanId || !mountedRef.current) return false

    if (showLoading) setIsLoading(true)

    try {
      const { data, error: scanError } = await getScan(scanId)

      if (!mountedRef.current) return false

      if (scanError || !data) {
        const newErrorCount = errorCount + 1
        setErrorCount(newErrorCount)

        if (newErrorCount >= MAX_ERROR_RETRIES) {
          setError(scanError?.message || 'Failed to load scan after multiple attempts')
          setIsPolling(false)
          setIsLoading(false)
          return false
        }

        // Continue polling with backoff
        return true
      }

      // Success - reset error count
      setScan(data)
      setError(null)
      setErrorCount(0)
      setIsLoading(false)

      // Check if we should stop polling
      if (TERMINAL_STATES.includes(data.status as typeof TERMINAL_STATES[number])) {
        setIsPolling(false)
        return false
      }

      return true
    } catch {
      if (!mountedRef.current) return false

      const newErrorCount = errorCount + 1
      setErrorCount(newErrorCount)

      if (newErrorCount >= MAX_ERROR_RETRIES) {
        setError('Network error. Please check your connection.')
        setIsPolling(false)
        setIsLoading(false)
        return false
      }

      return true
    }
  }, [scanId, errorCount])

  // Manual refresh function
  const refresh = useCallback(async () => {
    setErrorCount(0)
    setError(null)
    await fetchScan(true)
  }, [fetchScan])

  // Polling effect
  useEffect(() => {
    if (!scanId || !enabled) return

    mountedRef.current = true

    const poll = async () => {
      const shouldContinue = await fetchScan(isLoading)

      if (shouldContinue && mountedRef.current) {
        setIsPolling(true)
        const delay = getBackoffDelay(errorCount)
        timeoutRef.current = setTimeout(poll, delay)
      }
    }

    // Start initial poll
    poll()

    // Cleanup
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [scanId, enabled, fetchScan, getBackoffDelay, errorCount, isLoading])

  return {
    scan,
    isLoading,
    error,
    isPolling,
    errorCount,
    refresh,
  }
}
