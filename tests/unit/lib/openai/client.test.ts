/**
 * OpenAI Client Unit Tests
 *
 * Tests all error handling paths, retry logic, response parsing,
 * and configuration validation.
 */

import { jest } from '@jest/globals'
import type { ChatCompletion } from 'openai/resources/chat'
import {
  isRateLimitError,
  isNetworkError,
  isTimeoutError,
  classifyError,
  calculateBackoffDelay,
  getUserFriendlyMessage,
  shouldRetry,
  createOpenAIError,
  withRetry,
} from '@/lib/openai/retry'
import {
  parseOpenAIResponse,
  calculateCost,
  isValidChatCompletion,
} from '@/lib/openai/parseResponse'
import {
  OPENAI_PRICING,
  MAX_RETRIES,
  NETWORK_RETRY_COUNT,
} from '@/lib/openai/types'
import type { OpenAIErrorType } from '@/lib/openai/types'

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('OpenAI Error Classification', () => {
  describe('isRateLimitError', () => {
    it('should detect 429 status code', () => {
      const error = { status: 429 }
      expect(isRateLimitError(error)).toBe(true)
    })

    it('should detect rate_limit_exceeded code', () => {
      const error = { code: 'rate_limit_exceeded' }
      expect(isRateLimitError(error)).toBe(true)
    })

    it('should detect rate_limit type', () => {
      const error = { type: 'rate_limit' }
      expect(isRateLimitError(error)).toBe(true)
    })

    it('should return false for non-rate-limit errors', () => {
      expect(isRateLimitError({ status: 500 })).toBe(false)
      expect(isRateLimitError({ code: 'timeout' })).toBe(false)
      expect(isRateLimitError(null)).toBe(false)
      expect(isRateLimitError('string error')).toBe(false)
    })
  })

  describe('isNetworkError', () => {
    it('should detect ECONNREFUSED', () => {
      const error = { code: 'ECONNREFUSED' }
      expect(isNetworkError(error)).toBe(true)
    })

    it('should detect ENOTFOUND', () => {
      const error = { code: 'ENOTFOUND' }
      expect(isNetworkError(error)).toBe(true)
    })

    it('should detect ECONNRESET', () => {
      const error = { code: 'ECONNRESET' }
      expect(isNetworkError(error)).toBe(true)
    })

    it('should detect network error in message', () => {
      const error = { message: 'Network connection failed' }
      expect(isNetworkError(error)).toBe(true)
    })

    it('should detect nested cause code', () => {
      const error = { cause: { code: 'ECONNREFUSED' } }
      expect(isNetworkError(error)).toBe(true)
    })

    it('should return false for non-network errors', () => {
      expect(isNetworkError({ code: 'INVALID_API_KEY' })).toBe(false)
      expect(isNetworkError(null)).toBe(false)
    })
  })

  describe('isTimeoutError', () => {
    it('should detect ETIMEDOUT code', () => {
      const error = { code: 'ETIMEDOUT' }
      expect(isTimeoutError(error)).toBe(true)
    })

    it('should detect TimeoutError name', () => {
      const error = { name: 'TimeoutError' }
      expect(isTimeoutError(error)).toBe(true)
    })

    it('should detect timeout in message', () => {
      const error = { message: 'Request timed out after 30 seconds' }
      expect(isTimeoutError(error)).toBe(true)
    })

    it('should return false for non-timeout errors', () => {
      expect(isTimeoutError({ code: 'ECONNREFUSED' })).toBe(false)
      expect(isTimeoutError(null)).toBe(false)
    })
  })

  describe('classifyError', () => {
    it('should classify rate limit error', () => {
      expect(classifyError({ status: 429 })).toBe('rate_limit')
    })

    it('should classify timeout error', () => {
      expect(classifyError({ code: 'ETIMEDOUT' })).toBe('timeout')
    })

    it('should classify network error', () => {
      expect(classifyError({ code: 'ECONNREFUSED' })).toBe('network')
    })

    it('should classify config error from message', () => {
      expect(classifyError({ message: 'Invalid API key' })).toBe('config')
      expect(classifyError({ message: 'Authentication failed' })).toBe('config')
    })

    it('should classify unknown errors', () => {
      expect(classifyError({ message: 'Something went wrong' })).toBe('unknown')
      expect(classifyError(new Error('Generic error'))).toBe('unknown')
    })
  })
})

describe('Exponential Backoff', () => {
  describe('calculateBackoffDelay', () => {
    it('should calculate correct delays for attempts', () => {
      // Retry 1 (attempt index 0): 2^0 * 1000 = 1000ms = 1 second
      expect(calculateBackoffDelay(0)).toBe(1000)

      // Retry 2 (attempt index 1): 2^1 * 1000 = 2000ms = 2 seconds
      expect(calculateBackoffDelay(1)).toBe(2000)

      // Retry 3 (attempt index 2): 2^2 * 1000 = 4000ms = 4 seconds
      expect(calculateBackoffDelay(2)).toBe(4000)
    })

    it('should handle larger attempt numbers', () => {
      expect(calculateBackoffDelay(3)).toBe(8000)
      expect(calculateBackoffDelay(4)).toBe(16000)
    })
  })

  describe('shouldRetry', () => {
    it('should retry rate limit errors up to MAX_RETRIES', () => {
      expect(shouldRetry('rate_limit', 0)).toBe(true)
      expect(shouldRetry('rate_limit', 1)).toBe(true)
      expect(shouldRetry('rate_limit', 2)).toBe(true)
      expect(shouldRetry('rate_limit', MAX_RETRIES)).toBe(false)
    })

    it('should retry network errors up to NETWORK_RETRY_COUNT', () => {
      expect(shouldRetry('network', 0)).toBe(true)
      expect(shouldRetry('network', NETWORK_RETRY_COUNT)).toBe(false)
    })

    it('should not retry timeout errors', () => {
      expect(shouldRetry('timeout', 0)).toBe(false)
    })

    it('should not retry config errors', () => {
      expect(shouldRetry('config', 0)).toBe(false)
    })

    it('should not retry malformed errors', () => {
      expect(shouldRetry('malformed', 0)).toBe(false)
    })
  })
})

describe('User-Friendly Error Messages', () => {
  describe('getUserFriendlyMessage', () => {
    it('should return appropriate message for each error type', () => {
      const testCases: Array<[OpenAIErrorType, string]> = [
        [
          'rate_limit',
          'The AI service is busy. Please wait a moment and try again.',
        ],
        [
          'network',
          'Analysis service temporarily unavailable. Please check your connection and try again.',
        ],
        [
          'timeout',
          'Analysis is taking longer than expected. Please try again.',
        ],
        ['config', 'Analysis service configuration error'],
        ['malformed', 'Unexpected response from analysis service'],
        ['unknown', 'An unexpected error occurred. Please try again.'],
      ]

      testCases.forEach(([errorType, expectedMessage]) => {
        expect(getUserFriendlyMessage(errorType)).toBe(expectedMessage)
      })
    })

    it('should never expose technical details', () => {
      const errorTypes: OpenAIErrorType[] = [
        'rate_limit',
        'network',
        'timeout',
        'config',
        'malformed',
        'unknown',
      ]

      errorTypes.forEach((type) => {
        const message = getUserFriendlyMessage(type)
        // Should not contain technical terms like "API", "key", "status code", etc.
        expect(message.toLowerCase()).not.toContain('api key')
        expect(message.toLowerCase()).not.toContain('status code')
        expect(message.toLowerCase()).not.toContain('exception')
      })
    })
  })

  describe('createOpenAIError', () => {
    it('should create structured error with user-friendly message', () => {
      const error = createOpenAIError('rate_limit', new Error('Original error'))

      expect(error.type).toBe('rate_limit')
      expect(error.message).toBe(
        'The AI service is busy. Please wait a moment and try again.'
      )
      expect(error.retryable).toBe(true)
      expect(error.originalError).toBeDefined()
    })

    it('should mark non-retryable errors correctly', () => {
      const timeoutError = createOpenAIError('timeout')
      expect(timeoutError.retryable).toBe(false)

      const configError = createOpenAIError('config')
      expect(configError.retryable).toBe(false)
    })
  })
})

describe('Response Parsing', () => {
  const createMockResponse = (overrides?: Partial<ChatCompletion>): ChatCompletion => {
    return {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is the AI response',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
      ...overrides,
    } as ChatCompletion
  }

  describe('parseOpenAIResponse', () => {
    it('should successfully parse valid response', () => {
      const mockResponse = createMockResponse()
      const result = parseOpenAIResponse(mockResponse)

      expect(result.content).toBe('This is the AI response')
      expect(result.usage.promptTokens).toBe(100)
      expect(result.usage.completionTokens).toBe(50)
      expect(result.usage.totalTokens).toBe(150)
      expect(result.costEstimate).toBeGreaterThan(0)
    })

    it('should throw on missing choices', () => {
      const mockResponse = createMockResponse({ choices: [] })
      expect(() => parseOpenAIResponse(mockResponse)).toThrow(
        'Malformed OpenAI response'
      )
    })

    it('should throw on missing message content', () => {
      const mockResponse = createMockResponse({
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: null as unknown as string },
            finish_reason: 'stop',
          },
        ],
      } as Partial<ChatCompletion>)

      expect(() => parseOpenAIResponse(mockResponse)).toThrow(
        'Malformed OpenAI response'
      )
    })

    it('should throw on missing usage metadata', () => {
      const mockResponse = createMockResponse()
      delete (mockResponse as Partial<ChatCompletion>).usage

      expect(() => parseOpenAIResponse(mockResponse)).toThrow(
        'Malformed OpenAI response'
      )
    })

    it('should log token usage', () => {
      const consoleSpy = jest.spyOn(console, 'debug')
      const mockResponse = createMockResponse()

      parseOpenAIResponse(mockResponse)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[OpenAI] Token usage',
        expect.objectContaining({
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        })
      )
    })

    it('should log cost estimate', () => {
      const consoleSpy = jest.spyOn(console, 'debug')
      const mockResponse = createMockResponse()

      parseOpenAIResponse(mockResponse)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[OpenAI] Cost estimate',
        expect.objectContaining({
          costUSD: expect.any(String),
        })
      )
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost correctly for GPT-4o-mini', () => {
      // Example: 1000 prompt tokens, 500 completion tokens
      // Input: 1000 * $0.15 / 1M = $0.00015
      // Output: 500 * $0.60 / 1M = $0.00030
      // Total: $0.00045
      const cost = calculateCost(1000, 500)

      const expectedInputCost = (1000 * OPENAI_PRICING.INPUT_PER_MILLION) / 1_000_000
      const expectedOutputCost =
        (500 * OPENAI_PRICING.OUTPUT_PER_MILLION) / 1_000_000
      const expectedTotal = expectedInputCost + expectedOutputCost

      expect(cost).toBeCloseTo(expectedTotal, 8)
    })

    it('should calculate correct cost for large token counts', () => {
      // 100k prompt tokens, 50k completion tokens
      const cost = calculateCost(100_000, 50_000)

      // Input: 100k * 0.15 / 1M = 0.015
      // Output: 50k * 0.60 / 1M = 0.030
      // Total: 0.045
      expect(cost).toBeCloseTo(0.045, 8)
    })

    it('should handle zero tokens', () => {
      expect(calculateCost(0, 0)).toBe(0)
    })
  })

  describe('isValidChatCompletion', () => {
    it('should validate correct response', () => {
      const mockResponse = createMockResponse()
      expect(isValidChatCompletion(mockResponse)).toBe(true)
    })

    it('should reject invalid responses', () => {
      expect(isValidChatCompletion(null)).toBe(false)
      expect(isValidChatCompletion(undefined)).toBe(false)
      expect(isValidChatCompletion({})).toBe(false)
      expect(isValidChatCompletion({ choices: [] })).toBe(false)
      expect(isValidChatCompletion({ usage: {} })).toBe(false)
    })
  })
})

describe('Retry Logic Integration', () => {
  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      const result = await withRetry(operation, 'test operation')

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry rate limit errors with exponential backoff', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, 'test operation')

      // Fast-forward through backoff delays
      await jest.runAllTimersAsync()

      const result = await promise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should retry network errors once', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
        .mockResolvedValueOnce('success')

      const promise = withRetry(operation, 'test operation')

      await jest.runAllTimersAsync()

      const result = await promise

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('should not retry timeout errors', async () => {
      const operation = jest.fn().mockRejectedValue({ code: 'ETIMEDOUT' })

      const promise = withRetry(operation, 'test operation')

      await expect(promise).rejects.toMatchObject({
        type: 'timeout',
        retryable: false,
      })

      expect(operation).toHaveBeenCalledTimes(1) // No retries
    })

    it(
      'should exhaust retries and throw error',
      async () => {
        // Use real timers for this test to avoid Jest fake timer issues
        jest.useRealTimers()

        const operation = jest.fn().mockRejectedValue({ status: 429 })

        // Expect the operation to fail after retries
        // Total wait time: 1s + 2s + 4s = 7s for exponential backoff
        await expect(withRetry(operation, 'test operation')).rejects.toMatchObject({
          type: 'rate_limit',
          message: 'The AI service is busy. Please wait a moment and try again.',
          retryable: true,
        })

        // Initial + MAX_RETRIES attempts = 4 total (0, 1, 2, 3)
        expect(operation).toHaveBeenCalledTimes(MAX_RETRIES + 1)

        // Restore fake timers for other tests
        jest.useFakeTimers()
      },
      10000 // 10 second timeout for this test
    )
  })
})

describe('Client Initialization', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset modules to clear singleton state
    jest.resetModules()
    // Clone env to avoid mutation issues
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initializeOpenAI', () => {
    it('should throw error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY

      const { initializeOpenAI } = await import('@/lib/openai/client')

      expect(() => initializeOpenAI()).toThrow('OpenAI API key is not configured')
    })

    it('should throw error when API key is empty string', async () => {
      process.env.OPENAI_API_KEY = ''

      const { initializeOpenAI } = await import('@/lib/openai/client')

      expect(() => initializeOpenAI()).toThrow('OpenAI API key is not configured')
    })

    it('should throw error when API key is whitespace only', async () => {
      process.env.OPENAI_API_KEY = '   '

      const { initializeOpenAI } = await import('@/lib/openai/client')

      expect(() => initializeOpenAI()).toThrow('OpenAI API key is not configured')
    })

    it('should log FATAL error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY
      const consoleSpy = jest.spyOn(console, 'error')

      const { initializeOpenAI } = await import('@/lib/openai/client')

      try {
        initializeOpenAI()
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        '[OpenAI] FATAL: Missing OPENAI_API_KEY environment variable'
      )
    })

    it('should initialize successfully with valid API key', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-valid-key-12345'
      const consoleSpy = jest.spyOn(console, 'info')

      const { initializeOpenAI } = await import('@/lib/openai/client')

      const client = initializeOpenAI()

      expect(client).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith(
        '[OpenAI] Client initialized successfully',
        expect.objectContaining({
          timeout: 30000,
        })
      )
    })

    it('should return same instance on subsequent calls (singleton)', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-valid-key-12345'

      const { initializeOpenAI } = await import('@/lib/openai/client')

      const client1 = initializeOpenAI()
      const client2 = initializeOpenAI()

      expect(client1).toBe(client2)
    })
  })

  describe('getOpenAIClient', () => {
    it('should auto-initialize when called without prior initialization', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-valid-key-12345'

      const { getOpenAIClient } = await import('@/lib/openai/client')

      const client = getOpenAIClient()

      expect(client).toBeDefined()
    })

    it('should return same instance as initializeOpenAI', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-valid-key-12345'

      const { initializeOpenAI, getOpenAIClient } = await import('@/lib/openai/client')

      const client1 = initializeOpenAI()
      const client2 = getOpenAIClient()

      expect(client1).toBe(client2)
    })

    it('should throw when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY

      const { getOpenAIClient } = await import('@/lib/openai/client')

      expect(() => getOpenAIClient()).toThrow('OpenAI API key is not configured')
    })
  })
})
