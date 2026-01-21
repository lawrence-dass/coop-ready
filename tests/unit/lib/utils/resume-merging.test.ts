/**
 * Unit Tests for Resume Merging Logic
 * Story 5.8: Optimized Resume Preview
 */

import { mergeAcceptedSuggestions } from '@/lib/utils/resume-merging'
import type { StoredResume } from '@/lib/types/resume'
import type { DisplaySuggestion } from '@/lib/utils/suggestion-types'

describe('mergeAcceptedSuggestions', () => {
  const mockResume: StoredResume = {
    experience: [
      {
        company: 'TechCorp',
        title: 'Senior Developer',
        dates: '2020-01 to 2023-12',
        bulletPoints: ['Led team of 5 developers', 'Built microservices architecture'],
      },
    ],
    education: [
      {
        institution: 'State University',
        degree: 'BS Computer Science',
        dates: '2016-05',
      },
    ],
    skills: [
      { name: 'JavaScript', category: 'technical' },
      { name: 'React', category: 'technical' },
    ],
    projects: undefined,
  }

  it('should merge accepted suggestions into resume content', () => {
    const suggestions: DisplaySuggestion[] = [
      {
        id: 'sugg1',
        section: 'experience',
        itemIndex: 0,
        originalText: 'Led team of 5 developers',
        suggestedText: 'Directed team of 5 engineers, delivering 3 major features',
        suggestionType: 'action_verb',
        reasoning: 'Stronger action verb',
        status: 'accepted',
      },
    ]

    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    expect(result.experience.items[0].highlighted).toBe(true)
    expect(result.experience.items[0].content).toContain('Directed')
    expect(result.experience.items[0].diff.length).toBeGreaterThan(0)
  })

  it('should not apply rejected suggestions', () => {
    const suggestions: DisplaySuggestion[] = [
      {
        id: 'sugg1',
        section: 'experience',
        itemIndex: 0,
        originalText: 'Led team of 5 developers',
        suggestedText: 'Directed team of 5 engineers',
        suggestionType: 'action_verb',
        reasoning: 'Stronger action verb',
        status: 'rejected',
      },
    ]

    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    expect(result.experience.items[0].highlighted).toBe(false)
    expect(result.experience.items[0].content).toContain('Led team')
  })

  it('should handle items with no suggestions', () => {
    const result = mergeAcceptedSuggestions(mockResume, [])
    expect(result.experience.items[0].highlighted).toBe(false)
    expect(result.experience.items[0].content).toContain('Led team')
  })

  it('should track diff information for display', () => {
    const suggestions: DisplaySuggestion[] = [
      {
        id: 'sugg1',
        section: 'experience',
        itemIndex: 0,
        originalText: 'Led team of 5 developers',
        suggestedText: 'Directed team of 5 engineers, delivering 3 major features',
        suggestionType: 'action_verb',
        reasoning: '',
        status: 'accepted',
      },
    ]

    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    const diff = result.experience.items[0].diff
    expect(diff.some((d) => d.type === 'removed')).toBe(true)
    expect(diff.some((d) => d.type === 'added')).toBe(true)
  })

  it('should handle multiple suggestions on same item', () => {
    const suggestions: DisplaySuggestion[] = [
      {
        id: 'sugg1',
        section: 'experience',
        itemIndex: 0,
        originalText: 'Led team of 5 developers',
        suggestedText: 'Directed team of 5 engineers',
        suggestionType: 'action_verb',
        reasoning: 'Better verb',
        status: 'accepted',
      },
      {
        id: 'sugg2',
        section: 'experience',
        itemIndex: 0,
        originalText: 'Built microservices architecture',
        suggestedText: 'Architected scalable microservices system processing 1M+ requests/day',
        suggestionType: 'quantification',
        reasoning: 'Add metrics',
        status: 'accepted',
      },
    ]

    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    expect(result.experience.items[0].highlighted).toBe(true)
    const content = result.experience.items[0].content
    expect(content).toContain('Directed')
    expect(content).toContain('Architected')
  })

  it('should preserve pending suggestions (not apply them)', () => {
    const suggestions: DisplaySuggestion[] = [
      {
        id: 'sugg1',
        section: 'experience',
        itemIndex: 0,
        originalText: 'Led team of 5 developers',
        suggestedText: 'Directed team of 5 engineers',
        suggestionType: 'action_verb',
        reasoning: 'Better verb',
        status: 'pending',
      },
    ]

    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    expect(result.experience.items[0].highlighted).toBe(false)
    expect(result.experience.items[0].content).toContain('Led team')
  })

  it('should handle education section suggestions', () => {
    const suggestions: DisplaySuggestion[] = [
      {
        id: 'sugg1',
        section: 'education',
        itemIndex: 0,
        originalText: 'BS Computer Science',
        suggestedText: 'BS Computer Science (Honors)',
        suggestionType: 'skill_expansion',
        reasoning: 'Highlight distinction',
        status: 'accepted',
      },
    ]

    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    expect(result.education.items[0].highlighted).toBe(true)
    expect(result.education.items[0].content).toContain('Honors')
  })

  it('should return empty array for non-existent sections', () => {
    const suggestions: DisplaySuggestion[] = []
    const result = mergeAcceptedSuggestions(mockResume, suggestions)
    expect(Object.keys(result)).toContain('experience')
    expect(Object.keys(result)).toContain('education')
    expect(Object.keys(result)).toContain('skills')
  })

  it('should handle resume without optional sections', () => {
    const minimalResume: StoredResume = {
      experience: [],
      education: [],
      skills: [],
    }

    const result = mergeAcceptedSuggestions(minimalResume, [])
    expect(result.experience.items).toEqual([])
    expect(result.education.items).toEqual([])
  })

  it('should generate unique IDs for merged items', () => {
    const suggestions: DisplaySuggestion[] = []
    const result = mergeAcceptedSuggestions(mockResume, suggestions)

    const ids = new Set<string>()
    Object.values(result).forEach((section) => {
      section.items.forEach((item) => {
        ids.add(item.id)
      })
    })

    expect(ids.size).toBe(Object.values(result).reduce((sum, s) => sum + s.items.length, 0))
  })
})
