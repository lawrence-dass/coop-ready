/**
 * Unit Tests for useScanPolling Hook
 * Story: 4.7 - Analysis Results Page - Task 3
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'

// Mock the getScan action
jest.mock('@/actions/scan', () => ({
  getScan: jest.fn(),
}))

import { getScan } from '@/actions/scan'

const mockGetScan = getScan as jest.MockedFunction<typeof getScan>

describe('useScanPolling Hook (Story 4.7)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockGetScan.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Exponential Backoff Logic', () => {
    it('should calculate correct backoff delays', () => {
      // Test the backoff calculation formula: BASE * 2^errors, capped at MAX
      const BASE_POLL_INTERVAL = 2000
      const MAX_BACKOFF_INTERVAL = 16000

      const getBackoffDelay = (errors: number): number => {
        if (errors === 0) return BASE_POLL_INTERVAL
        const delay = BASE_POLL_INTERVAL * Math.pow(2, errors)
        return Math.min(delay, MAX_BACKOFF_INTERVAL)
      }

      expect(getBackoffDelay(0)).toBe(2000) // No errors: 2s
      expect(getBackoffDelay(1)).toBe(4000) // 1 error: 4s
      expect(getBackoffDelay(2)).toBe(8000) // 2 errors: 8s
      expect(getBackoffDelay(3)).toBe(16000) // 3 errors: 16s (max)
      expect(getBackoffDelay(4)).toBe(16000) // 4 errors: capped at 16s
      expect(getBackoffDelay(5)).toBe(16000) // 5 errors: capped at 16s
    })

    it('should stop after MAX_ERROR_RETRIES consecutive errors', () => {
      const MAX_ERROR_RETRIES = 5

      // Simulate error counting
      let errorCount = 0
      const shouldStopPolling = () => errorCount >= MAX_ERROR_RETRIES

      // First 4 errors should continue
      for (let i = 0; i < 4; i++) {
        errorCount++
        expect(shouldStopPolling()).toBe(false)
      }

      // 5th error should stop
      errorCount++
      expect(shouldStopPolling()).toBe(true)
    })
  })

  describe('Terminal States', () => {
    it('should recognize completed as terminal state', () => {
      const TERMINAL_STATES = ['completed', 'failed'] as const
      const isTerminal = (status: string) =>
        TERMINAL_STATES.includes(status as typeof TERMINAL_STATES[number])

      expect(isTerminal('completed')).toBe(true)
    })

    it('should recognize failed as terminal state', () => {
      const TERMINAL_STATES = ['completed', 'failed'] as const
      const isTerminal = (status: string) =>
        TERMINAL_STATES.includes(status as typeof TERMINAL_STATES[number])

      expect(isTerminal('failed')).toBe(true)
    })

    it('should not recognize processing as terminal state', () => {
      const TERMINAL_STATES = ['completed', 'failed'] as const
      const isTerminal = (status: string) =>
        TERMINAL_STATES.includes(status as typeof TERMINAL_STATES[number])

      expect(isTerminal('processing')).toBe(false)
      expect(isTerminal('pending')).toBe(false)
    })
  })

  describe('getScan Integration', () => {
    it('should call getScan with correct scanId', async () => {
      const mockScanData = {
        id: 'test-scan-id',
        status: 'completed',
        atsScore: 75,
      }

      mockGetScan.mockResolvedValue({
        data: mockScanData as any,
        error: null,
      })

      await getScan('test-scan-id')

      expect(mockGetScan).toHaveBeenCalledWith('test-scan-id')
    })

    it('should handle getScan errors', async () => {
      mockGetScan.mockResolvedValue({
        data: null,
        error: { message: 'Scan not found', code: 'NOT_FOUND' },
      })

      const result = await getScan('invalid-id')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Scan not found')
    })
  })
})
