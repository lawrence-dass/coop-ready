/**
 * Role to Context Mapping Tests
 *
 * Tests for mapping target roles to bullet contexts for prioritization.
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import { describe, it, expect } from '@jest/globals'
import {
  roleToContextMapping,
  prioritizeContextByRole,
  getScaleAdjustmentForRole,
} from '@/lib/utils/roleToContextMapping'

describe('roleToContextMapping', () => {
  it('maps finance roles to financial context', () => {
    expect(roleToContextMapping('Financial Analyst').primaryContext).toBe('financial')
    expect(roleToContextMapping('Investment Banker').primaryContext).toBe('financial')
    expect(roleToContextMapping('Accountant').primaryContext).toBe('financial')
    expect(roleToContextMapping('CFO').primaryContext).toBe('financial')
  })

  it('maps tech roles to tech context', () => {
    expect(roleToContextMapping('Software Engineer').primaryContext).toBe('tech')
    expect(roleToContextMapping('Frontend Developer').primaryContext).toBe('tech')
    expect(roleToContextMapping('Data Scientist').primaryContext).toBe('tech')
    expect(roleToContextMapping('DevOps Engineer').primaryContext).toBe('tech')
  })

  it('maps leadership roles to leadership context', () => {
    expect(roleToContextMapping('Engineering Manager').primaryContext).toBe('leadership')
    expect(roleToContextMapping('Director of Product').primaryContext).toBe('leadership')
    expect(roleToContextMapping('VP of Sales').primaryContext).toBe('leadership')
    expect(roleToContextMapping('Team Lead').primaryContext).toBe('leadership')
  })

  it('returns none for unknown roles', () => {
    expect(roleToContextMapping('Marketing Specialist').primaryContext).toBe('none')
    expect(roleToContextMapping('Sales Representative').primaryContext).toBe('none')
    expect(roleToContextMapping('Content Writer').primaryContext).toBe('none')
  })

  it('is case-insensitive', () => {
    expect(roleToContextMapping('SOFTWARE ENGINEER').primaryContext).toBe('tech')
    expect(roleToContextMapping('financial analyst').primaryContext).toBe('financial')
    expect(roleToContextMapping('Engineering MANAGER').primaryContext).toBe('leadership')
  })

  it('handles compound roles correctly', () => {
    expect(roleToContextMapping('Senior Software Engineer').primaryContext).toBe('tech')
    expect(roleToContextMapping('Lead Financial Analyst').primaryContext).toBe('financial')
  })
})

describe('prioritizeContextByRole', () => {
  it('keeps bullet context when detected', () => {
    const result = prioritizeContextByRole('financial', 'Software Engineer')
    expect(result).toBe('financial')
  })

  it('uses role context when bullet context is none', () => {
    const result = prioritizeContextByRole('none', 'Financial Analyst')
    expect(result).toBe('financial')
  })

  it('prioritizes bullet tech context even for finance role', () => {
    const result = prioritizeContextByRole('tech', 'Financial Analyst')
    expect(result).toBe('tech')
  })

  it('prioritizes bullet financial context even for tech role', () => {
    const result = prioritizeContextByRole('financial', 'Software Engineer')
    expect(result).toBe('financial')
  })

  it('uses leadership context from bullet for non-leadership role', () => {
    const result = prioritizeContextByRole('leadership', 'Software Engineer')
    expect(result).toBe('leadership')
  })

  it('handles unknown role with detected context', () => {
    const result = prioritizeContextByRole('tech', 'Marketing Specialist')
    expect(result).toBe('tech')
  })
})

describe('getScaleAdjustmentForRole', () => {
  describe('financial context', () => {
    it('returns 1x scale for entry/mid-level finance roles', () => {
      expect(getScaleAdjustmentForRole('financial', 'Financial Analyst')).toBe(1)
      expect(getScaleAdjustmentForRole('financial', 'Accountant')).toBe(1)
    })

    it('returns 10x scale for senior finance roles', () => {
      expect(getScaleAdjustmentForRole('financial', 'Senior Financial Analyst')).toBe(10)
      expect(getScaleAdjustmentForRole('financial', 'Director of Finance')).toBe(10)
      expect(getScaleAdjustmentForRole('financial', 'VP of Finance')).toBe(10)
    })

    it('returns 100x scale for executive finance roles', () => {
      expect(getScaleAdjustmentForRole('financial', 'CFO')).toBe(100)
      expect(getScaleAdjustmentForRole('financial', 'Chief Financial Officer')).toBe(100)
    })
  })

  describe('tech context', () => {
    it('returns 1x scale for entry/mid-level tech roles', () => {
      expect(getScaleAdjustmentForRole('tech', 'Software Engineer')).toBe(1)
      expect(getScaleAdjustmentForRole('tech', 'Frontend Developer')).toBe(1)
    })

    it('returns 10x scale for senior tech roles', () => {
      expect(getScaleAdjustmentForRole('tech', 'Senior Software Engineer')).toBe(10)
      expect(getScaleAdjustmentForRole('tech', 'Director of Engineering')).toBe(10)
    })

    it('returns 100x scale for executive tech roles', () => {
      expect(getScaleAdjustmentForRole('tech', 'CTO')).toBe(100)
      expect(getScaleAdjustmentForRole('tech', 'VP of Engineering')).toBe(10) // VP is senior, not executive
    })
  })

  describe('leadership context', () => {
    it('returns 1x scale for entry-level leadership', () => {
      expect(getScaleAdjustmentForRole('leadership', 'Team Lead')).toBe(1)
      expect(getScaleAdjustmentForRole('leadership', 'Manager')).toBe(1)
    })

    it('returns 5x scale for senior leadership', () => {
      expect(getScaleAdjustmentForRole('leadership', 'Senior Manager')).toBe(5)
      expect(getScaleAdjustmentForRole('leadership', 'Director')).toBe(5)
    })

    it('returns 10x scale for executive leadership', () => {
      expect(getScaleAdjustmentForRole('leadership', 'CEO')).toBe(10)
      expect(getScaleAdjustmentForRole('leadership', 'Executive Vice President')).toBe(10)
    })
  })

  describe('other contexts', () => {
    it('returns 1x scale for competitive context', () => {
      expect(getScaleAdjustmentForRole('competitive', 'Software Engineer')).toBe(1)
      expect(getScaleAdjustmentForRole('competitive', 'CEO')).toBe(1)
    })

    it('returns 1x scale for scale context', () => {
      expect(getScaleAdjustmentForRole('scale', 'Senior Manager')).toBe(1)
    })
  })
})
