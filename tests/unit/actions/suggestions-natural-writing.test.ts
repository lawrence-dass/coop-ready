/**
 * @file suggestions-natural-writing.test.ts
 * @description Integration tests for natural writing suggestions in the suggestion pipeline
 * @see Story 9.3: Natural Writing Enforcement - Task 3.9
 */

import { generateNaturalWritingSuggestions } from '@/actions/suggestions'

describe('generateNaturalWritingSuggestions', () => {
  describe('AC1: Banned Phrase Detection', () => {
    it('should generate action_verb suggestion for "spearheaded" with correct alternatives', async () => {
      // Using 20+ word bullet to avoid word count suggestion
      const bullets = ['Spearheaded a team of 5 developers to deliver the enterprise project on time and under budget, resulting in 30% cost savings']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const bannedPhraseSuggestions = suggestions.filter(s => s.reasoning.includes('AI-flagged'))
      expect(bannedPhraseSuggestions).toHaveLength(1)
      expect(bannedPhraseSuggestions[0].type).toBe('action_verb')
      expect(bannedPhraseSuggestions[0].section).toBe('experience')
      expect(bannedPhraseSuggestions[0].suggestedText).toBe('Led')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('spearheaded')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('Led')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('Directed')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('Initiated')
      expect(bannedPhraseSuggestions[0].urgency).toBe('high')
    })

    it('should generate action_verb suggestion for "leveraged" with correct alternatives', async () => {
      // Using 20+ word bullet to avoid word count suggestion
      const bullets = ['Leveraged React and TypeScript to build a modern dashboard that improved user engagement by 45% and reduced page load times significantly']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const bannedPhraseSuggestions = suggestions.filter(s => s.reasoning.includes('AI-flagged'))
      expect(bannedPhraseSuggestions).toHaveLength(1)
      expect(bannedPhraseSuggestions[0].type).toBe('action_verb')
      expect(bannedPhraseSuggestions[0].suggestedText).toBe('Used')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('leveraged')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('Used')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('Applied')
      expect(bannedPhraseSuggestions[0].reasoning).toContain('Employed')
    })

    it('should generate suggestion for "synergized"', async () => {
      // Using 20+ word bullet to avoid word count suggestion
      const bullets = ['Synergized with cross-functional teams across multiple departments to improve collaboration and deliver a highly successful product launch on schedule']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const bannedPhraseSuggestions = suggestions.filter(s => s.reasoning.includes('AI-flagged'))
      expect(bannedPhraseSuggestions).toHaveLength(1)
      expect(bannedPhraseSuggestions[0].reasoning).toContain('synergized')
    })

    it('should generate suggestion for "utilize" variants', async () => {
      const bullets = [
        'Utilized Python for data processing',
        'Utilizing modern frameworks to build apps',
      ]
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      // Both bullets should generate suggestions (word count issues aside)
      const bannedPhraseSuggestions = suggestions.filter(
        (s) => s.type === 'action_verb' && s.reasoning.includes('AI-flagged')
      )
      expect(bannedPhraseSuggestions.length).toBeGreaterThanOrEqual(2)
    })

    it('should detect multiple banned phrases in one bullet', async () => {
      const bullets = ['Spearheaded initiative and leveraged cutting-edge tools']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const bannedPhraseSuggestions = suggestions.filter(
        (s) => s.type === 'action_verb' && s.reasoning.includes('AI-flagged')
      )
      expect(bannedPhraseSuggestions).toHaveLength(2)
    })
  })

  describe('AC2: Word Count Validation', () => {
    it('should generate format suggestion for bullets with < 15 words', async () => {
      const bullets = ['Led a team of five developers successfully']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const wordCountSuggestions = suggestions.filter((s) => s.type === 'format')
      expect(wordCountSuggestions).toHaveLength(1)
      expect(wordCountSuggestions[0].reasoning).toContain('Consider adding more context')
      expect(wordCountSuggestions[0].urgency).toBe('low')
    })

    it('should generate format suggestion for bullets with > 40 words', async () => {
      const longBullet =
        'Led a comprehensive cross-functional team of fifteen developers, designers, and product managers across multiple departments and various geographic locations to deliver a highly complex enterprise-level application that significantly improved customer satisfaction metrics and operational efficiency across the entire organization while maintaining high quality standards'
      const bullets = [longBullet]
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const wordCountSuggestions = suggestions.filter((s) => s.type === 'format')
      expect(wordCountSuggestions).toHaveLength(1)
      expect(wordCountSuggestions[0].reasoning).toContain('Consider splitting or condensing')
      expect(wordCountSuggestions[0].urgency).toBe('low')
    })

    it('should NOT generate word count suggestion for optimal range (20-35 words)', async () => {
      const optimalBullet =
        'Led a cross-functional team of 12 developers to deliver a customer-facing dashboard, improving user engagement by 45% and reducing support tickets by 30%'
      const bullets = [optimalBullet]
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const wordCountSuggestions = suggestions.filter((s) => s.type === 'format')
      expect(wordCountSuggestions).toHaveLength(0)
    })
  })

  describe('AC3: Verb Diversity Check', () => {
    it('should generate suggestions when same verb appears 3+ times', async () => {
      const bullets = ['Led team A to success', 'Led team B to victory', 'Led team C to finish', 'Led team D to complete']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      // Should have verb diversity suggestions for bullets starting with "Led"
      const diversitySuggestions = suggestions.filter(
        (s) => s.type === 'action_verb' && s.reasoning.includes('Vary action verbs')
      )
      // At least 3 suggestions (one for each bullet after the first that starts with repeated verb)
      expect(diversitySuggestions.length).toBeGreaterThanOrEqual(3)
      expect(diversitySuggestions[0].reasoning).toContain('led')
      expect(diversitySuggestions[0].reasoning).toContain('4 times')
      expect(diversitySuggestions[0].urgency).toBe('medium')
    })

    it('should provide alternatives from same category for repeated verbs', async () => {
      const bullets = ['Led team A', 'Led team B', 'Led team C']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const diversitySuggestions = suggestions.filter(
        (s) => s.type === 'action_verb' && s.reasoning.includes('Vary action verbs')
      )
      // Should suggest alternatives like Managed, Directed, Coordinated
      expect(diversitySuggestions.length).toBeGreaterThan(0)
      const reasoning = diversitySuggestions[0].reasoning
      expect(
        reasoning.includes('Managed') ||
          reasoning.includes('Directed') ||
          reasoning.includes('Coordinated')
      ).toBe(true)
    })

    it('should NOT generate diversity suggestion when verbs appear <= 2 times', async () => {
      const bullets = ['Led team A successfully', 'Led team B effectively', 'Managed team C efficiently']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const diversitySuggestions = suggestions.filter(
        (s) => s.type === 'action_verb' && s.reasoning.includes('Vary action verbs')
      )
      expect(diversitySuggestions).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty bullet array', async () => {
      const suggestions = await generateNaturalWritingSuggestions([])
      expect(suggestions).toHaveLength(0)
    })

    it('should handle null/undefined gracefully', async () => {
      // @ts-expect-error - testing runtime behavior with invalid input
      const suggestions = await generateNaturalWritingSuggestions(null)
      expect(suggestions).toHaveLength(0)
    })

    it('should handle clean resume with no issues', async () => {
      // Both bullets are 20+ words with no banned phrases
      const bullets = [
        'Led a cross-functional team of 10 developers to build a customer dashboard that improved user satisfaction by 25% within three months',
        'Built scalable microservices architecture serving 50K daily active users with 99.9% uptime and automated deployment pipelines for continuous delivery',
      ]
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      // No banned phrases, optimal word count, no verb diversity issues
      expect(suggestions).toHaveLength(0)
    })

    it('should be case-insensitive for banned phrase detection', async () => {
      const bullets = ['SPEARHEADED the project initiative']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      const bannedPhraseSuggestions = suggestions.filter(
        (s) => s.type === 'action_verb' && s.reasoning.includes('AI-flagged')
      )
      expect(bannedPhraseSuggestions).toHaveLength(1)
    })
  })

  describe('Integration with Suggestion Pipeline', () => {
    it('should return suggestions in correct format for pipeline consumption', async () => {
      const bullets = ['Spearheaded a very short task']
      const suggestions = await generateNaturalWritingSuggestions(bullets)

      // Verify structure matches pipeline expectations
      for (const suggestion of suggestions) {
        expect(suggestion).toHaveProperty('type')
        expect(suggestion).toHaveProperty('section')
        expect(suggestion).toHaveProperty('originalText')
        expect(suggestion).toHaveProperty('suggestedText')
        expect(suggestion).toHaveProperty('reasoning')
        expect(suggestion).toHaveProperty('urgency')
        expect(['action_verb', 'format']).toContain(suggestion.type)
        expect(suggestion.section).toBe('experience')
        expect(['high', 'medium', 'low']).toContain(suggestion.urgency)
      }
    })

    it('should preserve original bullet text in suggestions', async () => {
      const originalBullet = 'Leveraged Python for automation tasks'
      const suggestions = await generateNaturalWritingSuggestions([originalBullet])

      expect(suggestions[0].originalText).toBe(originalBullet)
    })
  })
})
