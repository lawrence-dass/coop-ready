/**
 * Context Detector Tests
 *
 * Tests for context detection utility that identifies bullet contexts
 * for context-aware quantification prompts.
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import { describe, it, expect } from '@jest/globals'
import {
  detectFinancialContext,
  detectTechContext,
  detectLeadershipContext,
  detectCompetitiveContext,
  detectScaleContext,
  classifyContext,
  type BulletContext,
} from '@/lib/utils/contextDetector'

describe('detectFinancialContext', () => {
  it('detects primary financial keywords', () => {
    expect(detectFinancialContext('Managed budget of $500K')).toBe(true)
    expect(detectFinancialContext('Increased revenue by 25%')).toBe(true)
    expect(detectFinancialContext('Reduced cost through optimization')).toBe(true)
    expect(detectFinancialContext('Achieved ROI of 150%')).toBe(true)
    expect(detectFinancialContext('Managed $2M AUM portfolio')).toBe(true)
  })

  it('detects secondary financial keywords', () => {
    expect(detectFinancialContext('Analyzed investment portfolio')).toBe(true)
    expect(detectFinancialContext('Reviewed P&L statements')).toBe(true)
    expect(detectFinancialContext('Optimized pricing strategy')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(detectFinancialContext('REVENUE growth')).toBe(true)
    expect(detectFinancialContext('Budget planning')).toBe(true)
    expect(detectFinancialContext('Cost Savings initiative')).toBe(true)
  })

  it('returns false for non-financial text', () => {
    expect(detectFinancialContext('Developed new feature')).toBe(false)
    expect(detectFinancialContext('Led team of engineers')).toBe(false)
  })
})

describe('detectTechContext', () => {
  it('detects primary tech keywords', () => {
    expect(detectTechContext('Scaled to 1M users')).toBe(true)
    expect(detectTechContext('Improved API performance')).toBe(true)
    expect(detectTechContext('Reduced latency by 50%')).toBe(true)
    expect(detectTechContext('Managed deployment pipeline')).toBe(true)
    expect(detectTechContext('Increased traffic by 200%')).toBe(true)
  })

  it('detects secondary tech keywords', () => {
    expect(detectTechContext('Optimized database queries')).toBe(true)
    expect(detectTechContext('Managed server infrastructure')).toBe(true)
    expect(detectTechContext('Built microservices architecture')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(detectTechContext('USERS reached 10K')).toBe(true)
    expect(detectTechContext('Performance optimization')).toBe(true)
  })

  it('returns false for non-tech text', () => {
    expect(detectTechContext('Managed budget efficiently')).toBe(false)
    expect(detectTechContext('Led marketing campaign')).toBe(false)
  })
})

describe('detectLeadershipContext', () => {
  it('detects primary leadership keywords', () => {
    expect(detectLeadershipContext('Led team of 5 engineers')).toBe(true)
    expect(detectLeadershipContext('Managed cross-functional group')).toBe(true)
    expect(detectLeadershipContext('Mentored junior developers')).toBe(true)
    expect(detectLeadershipContext('Trained new hires')).toBe(true)
    expect(detectLeadershipContext('Supervised daily operations')).toBe(true)
  })

  it('detects secondary leadership keywords', () => {
    expect(detectLeadershipContext('Provided strategic direction')).toBe(true)
    expect(detectLeadershipContext('Maintained accountability')).toBe(true)
    expect(detectLeadershipContext('Built team culture')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(detectLeadershipContext('LED initiative')).toBe(true)
    expect(detectLeadershipContext('Team management')).toBe(true)
  })

  it('returns false for non-leadership text', () => {
    expect(detectLeadershipContext('Developed API endpoints')).toBe(false)
    expect(detectLeadershipContext('Analyzed financial data')).toBe(false)
  })
})

describe('detectCompetitiveContext', () => {
  it('detects primary competitive keywords', () => {
    expect(detectCompetitiveContext('Won first place award')).toBe(true)
    expect(detectCompetitiveContext('Recognized as top performer')).toBe(true)
    expect(detectCompetitiveContext('Ranked #1 in region')).toBe(true)
    expect(detectCompetitiveContext('Selected as finalist')).toBe(true)
    expect(detectCompetitiveContext('Best in class performance')).toBe(true)
  })

  it('detects secondary competitive keywords', () => {
    expect(detectCompetitiveContext('Chosen for leadership program')).toBe(true)
    expect(detectCompetitiveContext('Featured in company newsletter')).toBe(true)
    expect(detectCompetitiveContext('Distinguished service award')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(detectCompetitiveContext('AWARD winner')).toBe(true)
    expect(detectCompetitiveContext('Top Performer')).toBe(true)
  })

  it('returns false for non-competitive text', () => {
    expect(detectCompetitiveContext('Developed features')).toBe(false)
    expect(detectCompetitiveContext('Managed team')).toBe(false)
  })
})

describe('detectScaleContext', () => {
  it('detects primary scale keywords', () => {
    expect(detectScaleContext('Completed 10 projects')).toBe(true)
    expect(detectScaleContext('Over 6 months period')).toBe(true)
    expect(detectScaleContext('Weekly deliverables')).toBe(true)
    expect(detectScaleContext('Quarterly reviews')).toBe(true)
    expect(detectScaleContext('Annual planning')).toBe(true)
  })

  it('detects secondary scale keywords', () => {
    expect(detectScaleContext('Led multiple initiatives')).toBe(true)
    expect(detectScaleContext('Managed programs across teams')).toBe(true)
    expect(detectScaleContext('Coordinated campaigns')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(detectScaleContext('PROJECTS delivered')).toBe(true)
    expect(detectScaleContext('Monthly Cadence')).toBe(true)
  })

  it('returns false for non-scale text', () => {
    expect(detectScaleContext('Improved performance')).toBe(false)
    expect(detectScaleContext('Reduced costs')).toBe(false)
  })
})

describe('classifyContext', () => {
  it('identifies financial as primary context', () => {
    const result = classifyContext('Managed $5M budget and increased revenue')
    expect(result.primaryContext).toBe('financial')
    expect(result.detectedContexts).toContain('financial')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('identifies tech as primary context', () => {
    const result = classifyContext('Scaled API to handle 10M users with low latency')
    expect(result.primaryContext).toBe('tech')
    expect(result.detectedContexts).toContain('tech')
  })

  it('identifies leadership as primary context', () => {
    const result = classifyContext('Led and mentored team of 8 developers')
    expect(result.primaryContext).toBe('leadership')
    expect(result.detectedContexts).toContain('leadership')
  })

  it('identifies competitive as primary context', () => {
    const result = classifyContext('Won Best Innovation Award ranked #1')
    expect(result.primaryContext).toBe('competitive')
    expect(result.detectedContexts).toContain('competitive')
  })

  it('identifies scale as primary context', () => {
    const result = classifyContext('Delivered 15 projects over 12 months')
    expect(result.primaryContext).toBe('scale')
    expect(result.detectedContexts).toContain('scale')
  })

  it('returns none when no context detected', () => {
    const result = classifyContext('Performed various tasks')
    expect(result.primaryContext).toBe('none')
    expect(result.detectedContexts).toHaveLength(0)
    expect(result.confidence).toBe(0)
  })

  it('prioritizes financial over other contexts', () => {
    const result = classifyContext('Led team to manage $2M budget with 1M users')
    expect(result.primaryContext).toBe('financial')
    expect(result.detectedContexts.length).toBeGreaterThan(1)
  })

  it('prioritizes tech over leadership', () => {
    const result = classifyContext('Led engineering team to scale API to 5M users')
    expect(result.primaryContext).toBe('tech')
    expect(result.detectedContexts).toContain('tech')
    expect(result.detectedContexts).toContain('leadership')
  })

  it('has high confidence for single context', () => {
    const result = classifyContext('Increased revenue by 50%')
    expect(result.confidence).toBe(1.0)
    expect(result.detectedContexts).toHaveLength(1)
  })

  it('has lower confidence for multiple contexts', () => {
    const result = classifyContext('Led team to increase revenue and scale users')
    expect(result.confidence).toBe(0.7)
    expect(result.detectedContexts.length).toBeGreaterThan(1)
  })

  it('handles edge case with typos gracefully', () => {
    const result = classifyContext('Manged budgt') // typos
    expect(result.primaryContext).toBe('none')
  })

  it('detects context in complex sentences', () => {
    const result = classifyContext(
      'Spearheaded initiative to reduce operational costs by optimizing infrastructure, resulting in $500K annual savings'
    )
    expect(result.primaryContext).toBe('financial')
    expect(result.detectedContexts).toContain('financial')
  })
})

describe('context detection - edge cases', () => {
  it('handles empty string', () => {
    const result = classifyContext('')
    expect(result.primaryContext).toBe('none')
    expect(result.confidence).toBe(0)
  })

  it('handles very short text', () => {
    const result = classifyContext('Led')
    expect(result.primaryContext).toBe('leadership')
  })

  it('handles text with numbers', () => {
    const result = classifyContext('Managed 10M users')
    expect(result.primaryContext).toBe('tech')
  })

  it('handles text with special characters', () => {
    const result = classifyContext('Increased P&L by 25%')
    expect(result.primaryContext).toBe('financial')
  })

  it('detects multiple keywords from same context', () => {
    const result = classifyContext('Reduced budget, cut cost, and increased ROI')
    expect(result.primaryContext).toBe('financial')
    expect(result.detectedContexts).toEqual(['financial'])
    expect(result.confidence).toBe(1.0) // Single context detected
  })
})

describe('context detection - false positive rejection (word boundary)', () => {
  it('does not match "led" in "settled"', () => {
    expect(detectLeadershipContext('I settled accounts receivable disputes')).toBe(false)
  })

  it('does not match "top" in "stop"', () => {
    expect(detectCompetitiveContext('I could not stop the process')).toBe(false)
  })

  it('does not match "best" in "bestseller"', () => {
    expect(detectCompetitiveContext('The product was a bestseller')).toBe(false)
  })

  it('does not match "won" in "wondered"', () => {
    expect(detectCompetitiveContext('I wondered about the results')).toBe(false)
  })

  it('does not match "team" in "steamline"', () => {
    expect(detectLeadershipContext('Streamlined operations')).toBe(false)
  })

  it('does not match "cost" in "costumer" (hypothetical)', () => {
    expect(detectFinancialContext('Worked with costumers')).toBe(false)
  })

  it('still matches "led" as standalone word', () => {
    expect(detectLeadershipContext('Led the engineering team')).toBe(true)
  })

  it('still matches "top" as standalone word', () => {
    expect(detectCompetitiveContext('Achieved top performance')).toBe(true)
  })

  it('still matches "best" as standalone word', () => {
    expect(detectCompetitiveContext('Won best innovation award')).toBe(true)
  })

  it('matches keywords at end of sentence', () => {
    expect(detectFinancialContext('Responsible for budget')).toBe(true)
  })

  it('matches keywords at start of sentence', () => {
    expect(detectLeadershipContext('Team of 5 engineers')).toBe(true)
  })
})
