/**
 * Tests for context-aware action verb and quantification prompts
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import { describe, it, expect } from '@jest/globals'
import { createActionVerbAndQuantificationPrompt } from '@/lib/openai/prompts/action-verbs'

describe('createActionVerbAndQuantificationPrompt - Context Detection', () => {
  it('detects financial context and includes financial metric guidance', () => {
    const bullets = ['Managed $5M budget and reduced cost by 20%']
    const types = ['financial']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: financial')
    expect(prompt).toContain('dollar amount')
    expect(prompt).toContain('$500K in revenue')
  })

  it('detects tech context and includes tech metric guidance', () => {
    const bullets = ['Scaled API to 1M users with 99.9% uptime']
    const types = ['tech']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: tech')
    expect(prompt).toContain('user count')
    expect(prompt).toContain('1M users')
  })

  it('detects leadership context and includes leadership metric guidance', () => {
    const bullets = ['Led team of engineers and mentored junior developers']
    const types = ['leadership']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: leadership')
    expect(prompt).toContain('team size')
    expect(prompt).toContain('team of 8')
  })

  it('detects competitive context and includes competitive metric guidance', () => {
    const bullets = ['Won Best Innovation Award recognized by industry']
    const types = ['competitive']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: competitive')
    expect(prompt).toContain('ranking position')
    expect(prompt).toContain('Top 5%')
  })

  it('detects scale context and includes scale metric guidance', () => {
    const bullets = ['Delivered 15 projects over 12 months']
    const types = ['scale']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: scale')
    expect(prompt).toContain('volume')
    expect(prompt).toContain('15 projects')
  })

  it('handles bullets with no detected context', () => {
    const bullets = ['Performed various tasks efficiently']
    const types = ['general']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: none')
    expect(prompt).toContain('specific numbers or metrics')
  })

  it('detects different contexts for different bullets', () => {
    const bullets = [
      'Managed $2M budget efficiently',
      'Scaled API to 500K users',
      'Led team of 10 developers',
    ]
    const types = ['financial', 'tech', 'leadership']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: financial')
    expect(prompt).toContain('Context: tech')
    expect(prompt).toContain('Context: leadership')
    expect(prompt).toContain('dollar amount')
    expect(prompt).toContain('user count')
    expect(prompt).toContain('team size')
  })

  it('includes context-specific metric guidance for each bullet', () => {
    const bullets = [
      'Increased revenue through process improvement',
      'Improved system performance significantly',
    ]
    const types = ['financial', 'tech']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Metric Guidance:')
    const guidanceCount = (prompt.match(/Metric Guidance:/g) || []).length
    expect(guidanceCount).toBe(2)
  })

  it('updates quantification instructions to reference context', () => {
    const bullets = ['Managed budget effectively']
    const types = ['financial']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Use the context-specific Metric Guidance')
    expect(prompt).toContain('financial, tech, leadership, competitive, scale')
    expect(prompt).toContain('Include specific examples from the Metric Guidance')
  })
})

describe('createActionVerbAndQuantificationPrompt - Target Role Integration', () => {
  it('prioritizes financial context when target role is finance', () => {
    const bullets = ['Performed various tasks'] // No context detected
    const types = ['general']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'Financial Analyst')

    expect(prompt).toContain('Context: financial')
    expect(prompt).toContain('dollar amount')
  })

  it('prioritizes tech context when target role is engineering', () => {
    const bullets = ['Completed daily assignments'] // No context detected
    const types = ['general']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'Software Engineer')

    expect(prompt).toContain('Context: tech')
    expect(prompt).toContain('user count')
  })

  it('prioritizes leadership context when target role is management', () => {
    // "Completed daily assignments" has no context keywords
    const bullets = ['Completed daily assignments']
    const types = ['general']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'Director of Engineering')

    expect(prompt).toContain('Context: leadership')
    expect(prompt).toContain('team size')
  })

  it('keeps bullet context when detected, ignoring target role', () => {
    const bullets = ['Increased revenue by 50%'] // Financial context detected
    const types = ['financial']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'Software Engineer')

    // Should stay financial despite tech target role (bullet context takes priority)
    expect(prompt).toContain('Context: financial')
    expect(prompt).toContain('dollar amount')
  })

  it('includes scale adjustment for senior roles', () => {
    const bullets = ['Performed various tasks']
    const types = ['general']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'Senior Software Engineer')

    expect(prompt).toContain('10x scale')
  })

  it('includes scale adjustment for executive roles', () => {
    const bullets = ['Performed various tasks']
    const types = ['general']

    // CFO maps to financial context where executives get 100x scale
    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'CFO')

    expect(prompt).toContain('100x scale')
  })

  it('does not include scale adjustment for entry-level roles', () => {
    const bullets = ['Performed various tasks']
    const types = ['general']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types, undefined, 'Software Engineer')

    expect(prompt).not.toContain('x scale')
  })

  it('works without target role (backward compatible)', () => {
    const bullets = ['Managed $5M budget']
    const types = ['financial']

    const prompt = createActionVerbAndQuantificationPrompt(bullets, types)

    expect(prompt).toContain('Context: financial')
    expect(prompt).not.toContain('x scale')
  })
})
