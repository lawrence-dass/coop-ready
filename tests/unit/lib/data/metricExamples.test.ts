/**
 * Metric Examples Tests
 *
 * Tests for metric template lookup and context-aware prompt generation.
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import { describe, it, expect } from '@jest/globals'
import {
  getMetricTemplate,
  getContextPrompt,
  FINANCIAL_METRICS,
  TECH_METRICS,
  LEADERSHIP_METRICS,
  COMPETITIVE_METRICS,
  SCALE_METRICS,
} from '@/lib/data/metricExamples'

describe('getMetricTemplate', () => {
  it('returns financial metrics for financial context', () => {
    const template = getMetricTemplate('financial')
    expect(template).toBe(FINANCIAL_METRICS)
    expect(template?.prompts).toContain('dollar amount')
    expect(template?.examples).toContain('$500K in revenue')
  })

  it('returns tech metrics for tech context', () => {
    const template = getMetricTemplate('tech')
    expect(template).toBe(TECH_METRICS)
    expect(template?.prompts).toContain('user count')
    expect(template?.examples).toContain('1M users')
  })

  it('returns leadership metrics for leadership context', () => {
    const template = getMetricTemplate('leadership')
    expect(template).toBe(LEADERSHIP_METRICS)
    expect(template?.prompts).toContain('team size')
    expect(template?.examples).toContain('team of 8')
  })

  it('returns competitive metrics for competitive context', () => {
    const template = getMetricTemplate('competitive')
    expect(template).toBe(COMPETITIVE_METRICS)
    expect(template?.prompts).toContain('ranking position')
    expect(template?.examples).toContain('Top 5%')
  })

  it('returns scale metrics for scale context', () => {
    const template = getMetricTemplate('scale')
    expect(template).toBe(SCALE_METRICS)
    expect(template?.prompts).toContain('volume')
    expect(template?.examples).toContain('15 projects')
  })

  it('returns null for none context', () => {
    const template = getMetricTemplate('none')
    expect(template).toBeNull()
  })
})

describe('getContextPrompt', () => {
  it('generates financial context prompt', () => {
    const prompt = getContextPrompt('financial')
    expect(prompt).toContain('dollar amount')
    expect(prompt).toContain('$500K in revenue')
    expect(prompt).toContain('Financial metrics strengthen')
  })

  it('generates tech context prompt', () => {
    const prompt = getContextPrompt('tech')
    expect(prompt).toContain('user count')
    expect(prompt).toContain('1M users')
    expect(prompt).toContain('technical impact')
  })

  it('generates leadership context prompt', () => {
    const prompt = getContextPrompt('leadership')
    expect(prompt).toContain('team size')
    expect(prompt).toContain('team of 8')
    expect(prompt).toContain('team scope')
  })

  it('generates competitive context prompt', () => {
    const prompt = getContextPrompt('competitive')
    expect(prompt).toContain('ranking position')
    expect(prompt).toContain('Top 5%')
    expect(prompt).toContain('ranking context')
  })

  it('generates scale context prompt', () => {
    const prompt = getContextPrompt('scale')
    expect(prompt).toContain('volume')
    expect(prompt).toContain('15 projects')
    expect(prompt).toContain('Scale provides context')
  })

  it('returns generic prompt for none context', () => {
    const prompt = getContextPrompt('none')
    expect(prompt).toBe('Consider adding: specific numbers or metrics relevant to this achievement')
  })

  it('includes at least 3 examples in prompt', () => {
    const prompt = getContextPrompt('financial')
    const exampleMatches = prompt.match(/"[^"]+"/g)
    expect(exampleMatches).not.toBeNull()
    expect(exampleMatches!.length).toBeGreaterThanOrEqual(3)
  })
})

describe('metric templates structure', () => {
  it('financial template has required fields', () => {
    expect(FINANCIAL_METRICS.context).toBe('financial')
    expect(FINANCIAL_METRICS.prompts.length).toBeGreaterThanOrEqual(5)
    expect(FINANCIAL_METRICS.examples.length).toBeGreaterThanOrEqual(5)
    expect(FINANCIAL_METRICS.reasoning).toBeTruthy()
  })

  it('tech template has required fields', () => {
    expect(TECH_METRICS.context).toBe('tech')
    expect(TECH_METRICS.prompts.length).toBeGreaterThanOrEqual(5)
    expect(TECH_METRICS.examples.length).toBeGreaterThanOrEqual(5)
    expect(TECH_METRICS.reasoning).toBeTruthy()
  })

  it('leadership template has required fields', () => {
    expect(LEADERSHIP_METRICS.context).toBe('leadership')
    expect(LEADERSHIP_METRICS.prompts.length).toBeGreaterThanOrEqual(5)
    expect(LEADERSHIP_METRICS.examples.length).toBeGreaterThanOrEqual(5)
    expect(LEADERSHIP_METRICS.reasoning).toBeTruthy()
  })

  it('competitive template has required fields', () => {
    expect(COMPETITIVE_METRICS.context).toBe('competitive')
    expect(COMPETITIVE_METRICS.prompts.length).toBeGreaterThanOrEqual(3)
    expect(COMPETITIVE_METRICS.examples.length).toBeGreaterThanOrEqual(3)
    expect(COMPETITIVE_METRICS.reasoning).toBeTruthy()
  })

  it('scale template has required fields', () => {
    expect(SCALE_METRICS.context).toBe('scale')
    expect(SCALE_METRICS.prompts.length).toBeGreaterThanOrEqual(5)
    expect(SCALE_METRICS.examples.length).toBeGreaterThanOrEqual(5)
    expect(SCALE_METRICS.reasoning).toBeTruthy()
  })
})
