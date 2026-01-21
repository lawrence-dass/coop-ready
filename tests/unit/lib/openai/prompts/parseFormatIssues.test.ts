/**
 * Unit Tests for Format Issues Parsing
 * Story: 4.6 - Resume Format Issues Detection
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals'

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
import {
  parseFormatIssuesResponse,
  mergeFormatIssues,
  isValidFormatIssue,
} from '@/lib/openai/prompts/parseFormatIssues'
import type { FormatIssue } from '@/lib/types/analysis'

describe('Format Issues Parsing (Story 4.6)', () => {
  describe('parseFormatIssuesResponse', () => {
    it('should parse valid formatIssues array from OpenAI response', () => {
      const response = `{
        "overallScore": 75,
        "formatIssues": [
          {
            "type": "warning",
            "message": "Resume is 2 pages",
            "detail": "Entry-level resumes are typically 1 page. Consider condensing.",
            "source": "ai-detected"
          },
          {
            "type": "suggestion",
            "message": "Photo reference detected",
            "detail": "Remove photo for North American applications.",
            "source": "ai-detected"
          }
        ]
      }`

      const issues = parseFormatIssuesResponse(response)

      expect(issues).toHaveLength(2)
      expect(issues[0].type).toBe('warning')
      expect(issues[0].message).toBe('Resume is 2 pages')
      expect(issues[0].source).toBe('ai-detected')
      expect(issues[1].type).toBe('suggestion')
    })

    it('should return empty array when formatIssues is empty', () => {
      const response = `{
        "overallScore": 85,
        "formatIssues": []
      }`

      const issues = parseFormatIssuesResponse(response)
      expect(issues).toEqual([])
    })

    it('should return empty array when formatIssues is missing', () => {
      const response = `{
        "overallScore": 80
      }`

      const issues = parseFormatIssuesResponse(response)
      expect(issues).toEqual([])
    })

    it('should handle malformed JSON gracefully', () => {
      const response = 'Not valid JSON at all'

      const issues = parseFormatIssuesResponse(response)
      expect(issues).toEqual([])
    })

    it('should filter out invalid format issues', () => {
      const response = `{
        "formatIssues": [
          {
            "type": "warning",
            "message": "Valid issue",
            "detail": "This is valid",
            "source": "ai-detected"
          },
          {
            "type": "invalid-type",
            "message": "Bad issue"
          },
          {
            "message": "Missing type field"
          }
        ]
      }`

      const issues = parseFormatIssuesResponse(response)
      expect(issues).toHaveLength(1)
      expect(issues[0].message).toBe('Valid issue')
    })
  })

  describe('mergeFormatIssues', () => {
    it('should merge rule-based and AI-detected issues', () => {
      const ruleBased: FormatIssue[] = [
        {
          type: 'critical',
          message: 'No section headers',
          detail: 'Add clear headers',
          source: 'rule-based',
        },
      ]

      const aiDetected: FormatIssue[] = [
        {
          type: 'suggestion',
          message: 'Photo reference detected',
          detail: 'Remove photo',
          source: 'ai-detected',
        },
      ]

      const merged = mergeFormatIssues(ruleBased, aiDetected)

      expect(merged).toHaveLength(2)
      expect(merged[0].type).toBe('critical') // Rule-based critical comes first
      expect(merged[1].type).toBe('suggestion')
    })

    it('should deduplicate similar issues', () => {
      const ruleBased: FormatIssue[] = [
        {
          type: 'warning',
          message: 'Resume is 2 pages',
          detail: 'Consider condensing to 1 page',
          source: 'rule-based',
        },
      ]

      const aiDetected: FormatIssue[] = [
        {
          type: 'warning',
          message: 'Resume exceeds 1 page',
          detail: 'Entry-level resumes should be 1 page',
          source: 'ai-detected',
        },
      ]

      const merged = mergeFormatIssues(ruleBased, aiDetected)

      // Should deduplicate similar "page length" issues
      expect(merged).toHaveLength(1)
      // Should prefer AI version for more detailed explanation
      expect(merged[0].source).toBe('ai-detected')
    })

    it('should sort by severity: critical > warning > suggestion', () => {
      const ruleBased: FormatIssue[] = [
        {
          type: 'suggestion',
          message: 'Suggestion issue',
          detail: 'Detail',
          source: 'rule-based',
        },
        {
          type: 'critical',
          message: 'Critical issue',
          detail: 'Detail',
          source: 'rule-based',
        },
      ]

      const aiDetected: FormatIssue[] = [
        {
          type: 'warning',
          message: 'Warning issue',
          detail: 'Detail',
          source: 'ai-detected',
        },
      ]

      const merged = mergeFormatIssues(ruleBased, aiDetected)

      expect(merged[0].type).toBe('critical')
      expect(merged[1].type).toBe('warning')
      expect(merged[2].type).toBe('suggestion')
    })

    it('should handle empty arrays', () => {
      const merged1 = mergeFormatIssues([], [])
      expect(merged1).toEqual([])

      const ruleBased: FormatIssue[] = [
        {
          type: 'warning',
          message: 'Issue',
          detail: 'Detail',
          source: 'rule-based',
        },
      ]
      const merged2 = mergeFormatIssues(ruleBased, [])
      expect(merged2).toHaveLength(1)

      const merged3 = mergeFormatIssues([], ruleBased)
      expect(merged3).toHaveLength(1)
    })
  })

  describe('isValidFormatIssue', () => {
    it('should validate complete format issue', () => {
      const issue: FormatIssue = {
        type: 'warning',
        message: 'Valid message',
        detail: 'Valid detail',
        source: 'rule-based',
      }

      expect(isValidFormatIssue(issue)).toBe(true)
    })

    it('should reject issue with invalid type', () => {
      const issue: any = {
        type: 'invalid',
        message: 'Message',
        detail: 'Detail',
        source: 'rule-based',
      }

      expect(isValidFormatIssue(issue)).toBe(false)
    })

    it('should reject issue with missing fields', () => {
      const issue1: any = {
        type: 'warning',
        detail: 'Detail',
        source: 'rule-based',
      }
      expect(isValidFormatIssue(issue1)).toBe(false)

      const issue2: any = {
        type: 'warning',
        message: 'Message',
        source: 'rule-based',
      }
      expect(isValidFormatIssue(issue2)).toBe(false)

      const issue3: any = {
        type: 'warning',
        message: 'Message',
        detail: 'Detail',
      }
      expect(isValidFormatIssue(issue3)).toBe(false)
    })

    it('should reject issue with invalid source', () => {
      const issue: any = {
        type: 'warning',
        message: 'Message',
        detail: 'Detail',
        source: 'invalid-source',
      }

      expect(isValidFormatIssue(issue)).toBe(false)
    })

    it('should accept all valid severity types', () => {
      const critical: FormatIssue = {
        type: 'critical',
        message: 'M',
        detail: 'D',
        source: 'rule-based',
      }
      const warning: FormatIssue = {
        type: 'warning',
        message: 'M',
        detail: 'D',
        source: 'ai-detected',
      }
      const suggestion: FormatIssue = {
        type: 'suggestion',
        message: 'M',
        detail: 'D',
        source: 'rule-based',
      }

      expect(isValidFormatIssue(critical)).toBe(true)
      expect(isValidFormatIssue(warning)).toBe(true)
      expect(isValidFormatIssue(suggestion)).toBe(true)
    })
  })
})
