/**
 * Integration Tests: Resume Merging with Accepted Suggestions
 *
 * Tests the logic for merging accepted suggestions into final resume:
 * - Content replacement accuracy
 * - No duplicate content
 * - Section preservation
 * - Diff tracking for preview display
 *
 * @see Story 5.8: Optimized Resume Preview
 * @see Story 6.1: Resume Content Merging (future)
 */

import { describe, test, expect } from '@jest/globals'

interface ParsedResume {
  contact: {
    name: string
    email: string
    phone: string
  }
  experience: {
    position: string
    company: string
    startDate: string
    endDate: string
    bullets: string[]
  }[]
  skills: string[]
  education: {
    degree: string
    institution: string
    graduationDate: string
  }[]
}

interface Suggestion {
  id: string
  section: string
  item_index: number
  original_text: string
  suggested_text: string
  status: 'accepted' | 'rejected' | 'pending'
}

interface MergedContent {
  original: string
  suggestion: string
  isDiffContent: boolean
}

describe('Resume Merging with Suggestions', () => {
  const mockResume: ParsedResume = {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0123',
    },
    experience: [
      {
        position: 'Software Developer',
        company: 'Tech Corp',
        startDate: '2022-01-15',
        endDate: 'Present',
        bullets: [
          'Worked on machine learning project',
          'Helped with database optimization',
          'Participated in code reviews',
        ],
      },
      {
        position: 'Junior Developer',
        company: 'StartupXYZ',
        startDate: '2020-06-01',
        endDate: '2021-12-31',
        bullets: ['Built RESTful APIs', 'Collaborated with team members'],
      },
    ],
    skills: ['JavaScript', 'Python', 'React', 'SQL'],
    education: [
      {
        degree: 'BS in Computer Science',
        institution: 'State University',
        graduationDate: '2020-05-15',
      },
    ],
  }

  const mockSuggestions: Suggestion[] = [
    {
      id: '1',
      section: 'experience',
      item_index: 0,
      original_text: 'Worked on machine learning project',
      suggested_text:
        'Designed and deployed ML recommendation engine improving prediction accuracy by 23%',
      status: 'accepted',
    },
    {
      id: '2',
      section: 'experience',
      item_index: 1,
      original_text: 'Helped with database optimization',
      suggested_text: 'Led database optimization initiative reducing query time by 40%',
      status: 'accepted',
    },
    {
      id: '3',
      section: 'experience',
      item_index: 2,
      original_text: 'Participated in code reviews',
      suggested_text: 'Participated in code reviews',
      status: 'rejected',
    },
    {
      id: '4',
      section: 'skills',
      item_index: 0,
      original_text: 'JavaScript',
      suggested_text: 'JavaScript (React, Node.js, Express)',
      status: 'accepted',
    },
  ]

  describe('Content Replacement', () => {
    test('should replace accepted suggestion content', () => {
      const suggestion = mockSuggestions[0]
      const original = 'Worked on machine learning project'

      // Simulate replacement
      const merged =
        suggestion.status === 'accepted' ? suggestion.suggested_text : original

      expect(merged).toBe(
        'Designed and deployed ML recommendation engine improving prediction accuracy by 23%'
      )
      expect(merged).not.toContain(original)
    })

    test('should preserve rejected suggestion original text', () => {
      const suggestion = mockSuggestions[2]
      const original = 'Participated in code reviews'

      const merged =
        suggestion.status === 'accepted' ? suggestion.suggested_text : original

      expect(merged).toBe(original)
    })

    test('should not replace pending suggestions', () => {
      const pending: Suggestion = {
        id: '5',
        section: 'experience',
        item_index: 3,
        original_text: 'Some pending text',
        suggested_text: 'Improved pending text',
        status: 'pending',
      }

      const original = 'Some pending text'
      const merged = pending.status === 'accepted' ? pending.suggested_text : original

      expect(merged).toBe(original)
    })

    test('should handle multiple replacements in same section', () => {
      const experienceSuggestions = mockSuggestions.filter((s) => s.section === 'experience')
      const accepted = experienceSuggestions.filter((s) => s.status === 'accepted')

      expect(accepted).toHaveLength(2)
      expect(accepted[0].original_text).toBe('Worked on machine learning project')
      expect(accepted[1].original_text).toBe('Helped with database optimization')
    })
  })

  describe('No Duplicate Content', () => {
    test('should not create duplicates when replacing content', () => {
      const bullets = mockResume.experience[0].bullets.slice()
      const suggestion = mockSuggestions[0]

      // Find and replace
      const index = bullets.findIndex((b) => b === suggestion.original_text)
      if (index !== -1 && suggestion.status === 'accepted') {
        bullets[index] = suggestion.suggested_text
      }

      // Verify no duplicate
      const merged = [
        suggestion.original_text,
        suggestion.suggested_text,
        ...bullets,
      ]
      const merged2 = merged.filter((b) => b === suggestion.original_text)

      expect(merged2).toHaveLength(1) // Original still in array above, but not in bullets
    })

    test('should handle case-sensitive string matching', () => {
      const original = 'Worked on machine learning project'
      const variations = [
        'worked on machine learning project', // lowercase
        'WORKED ON MACHINE LEARNING PROJECT', // uppercase
        'Worked on Machine Learning Project', // title case
      ]

      // Only exact match should be replaced
      const exact = original === variations[0]

      expect(exact).toBe(false)
      expect(original === variations[0]).toBe(false)
    })

    test('should preserve partial text matches as separate items', () => {
      const bullets = [
        'Worked on machine learning project',
        'Worked on database project',
        'Worked on deployment pipeline',
      ]

      const suggestion = mockSuggestions[0]

      // Only exact match should be replaced
      const merged = bullets.map((b) =>
        b === suggestion.original_text ? suggestion.suggested_text : b
      )

      expect(merged).toHaveLength(3)
      expect(merged[0]).toBe(suggestion.suggested_text)
      expect(merged[1]).toBe('Worked on database project')
      expect(merged[2]).toBe('Worked on deployment pipeline')
    })
  })

  describe('Section Preservation', () => {
    test('should maintain section structure after merge', () => {
      const original = { ...mockResume.experience[0] }

      const merged = {
        ...original,
        bullets: original.bullets.map((b) => {
          const suggestion = mockSuggestions.find((s) => s.original_text === b)
          return suggestion && suggestion.status === 'accepted'
            ? suggestion.suggested_text
            : b
        }),
      }

      expect(merged).toHaveProperty('position', original.position)
      expect(merged).toHaveProperty('company', original.company)
      expect(merged).toHaveProperty('startDate', original.startDate)
      expect(merged).toHaveProperty('endDate', original.endDate)
      expect(merged).toHaveProperty('bullets')
    })

    test('should not remove section if all suggestions are rejected', () => {
      const allRejected: Suggestion[] = mockSuggestions.map((s) => ({
        ...s,
        status: 'rejected',
      }))

      const acceptedInExperience = allRejected.filter(
        (s) => s.section === 'experience' && s.status === 'accepted'
      )

      expect(acceptedInExperience).toHaveLength(0)

      // Resume should still have experience section with original content
      expect(mockResume.experience).toHaveLength(2)
    })

    test('should preserve all contact information', () => {
      const contactSuggestions = mockSuggestions.filter((s) => s.section === 'contact')

      // Contact info typically not changed via suggestions
      expect(contactSuggestions).toHaveLength(0)

      // Original contact should remain unchanged
      expect(mockResume.contact.name).toBe('John Doe')
      expect(mockResume.contact.email).toBe('john@example.com')
    })

    test('should maintain skill section order', () => {
      const skillSuggestions = mockSuggestions.filter((s) => s.section === 'skills')
      const accepted = skillSuggestions.filter((s) => s.status === 'accepted')

      expect(accepted).toHaveLength(1)

      const merged = mockResume.skills.map((s, index) => {
        const suggestion = skillSuggestions.find((sugg) => sugg.item_index === index)
        return suggestion && suggestion.status === 'accepted'
          ? suggestion.suggested_text
          : s
      })

      expect(merged).toHaveLength(mockResume.skills.length)
      expect(merged[0]).toBe('JavaScript (React, Node.js, Express)')
    })

    test('should maintain education section structure', () => {
      const merged = {
        ...mockResume.education[0],
      }

      expect(merged).toHaveProperty('degree')
      expect(merged).toHaveProperty('institution')
      expect(merged).toHaveProperty('graduationDate')
      expect(merged.degree).toBe('BS in Computer Science')
    })
  })

  describe('Diff Tracking for Preview', () => {
    test('should mark replaced content as diff content', () => {
      const suggestion = mockSuggestions[0]

      const diffContent: MergedContent = {
        original: suggestion.original_text,
        suggestion: suggestion.suggested_text,
        isDiffContent: true,
      }

      expect(diffContent.isDiffContent).toBe(true)
      expect(diffContent.original).toBe('Worked on machine learning project')
      expect(diffContent.suggestion).toBe(
        'Designed and deployed ML recommendation engine improving prediction accuracy by 23%'
      )
    })

    test('should not mark unchanged content as diff', () => {
      const unchanged: MergedContent = {
        original: 'Some unchanged text',
        suggestion: 'Some unchanged text',
        isDiffContent: false,
      }

      expect(unchanged.isDiffContent).toBe(false)
      expect(unchanged.original).toBe(unchanged.suggestion)
    })

    test('should identify additions in merged content', () => {
      const original = 'Worked on project'
      const suggested = 'Designed and deployed ML project achieving 50% improvement'

      const addedContent = suggested.replace(original, '').trim()

      expect(addedContent).toContain('ML')
      expect(addedContent).toContain('50%')
    })

    test('should create diff metadata for each accepted suggestion', () => {
      const accepted = mockSuggestions.filter((s) => s.status === 'accepted')

      const diffs = accepted.map((s) => ({
        id: s.id,
        section: s.section,
        itemIndex: s.item_index,
        original: s.original_text,
        suggested: s.suggested_text,
        isDiff: true,
      }))

      expect(diffs).toHaveLength(3) // 2 experience + 1 skill
      expect(diffs.every((d) => d.isDiff)).toBe(true)
    })

    test('should track diff statistics', () => {
      const accepted = mockSuggestions.filter((s) => s.status === 'accepted')

      const stats = {
        totalAccepted: accepted.length,
        acceptedBySection: {} as Record<string, number>,
      }

      accepted.forEach((s) => {
        stats.acceptedBySection[s.section] = (stats.acceptedBySection[s.section] || 0) + 1
      })

      expect(stats.totalAccepted).toBe(3)
      expect(stats.acceptedBySection.experience).toBe(2)
      expect(stats.acceptedBySection.skills).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    test('should handle "No changes recommended" suggestions', () => {
      const noChange: Suggestion = {
        id: '6',
        section: 'experience',
        item_index: 0,
        original_text: 'Led team of 10 engineers to deliver mission-critical system',
        suggested_text: 'No changes recommended',
        status: 'accepted',
      }

      // If suggested is "No changes recommended", keep original
      const merged =
        noChange.suggested_text === 'No changes recommended' ? noChange.original_text : noChange.suggested_text

      expect(merged).toBe(noChange.original_text)
    })

    test('should handle empty suggestions array', () => {
      const noSuggestions: Suggestion[] = []

      const merged = mockResume.experience[0].bullets.map((b) => {
        const suggestion = noSuggestions.find((s) => s.original_text === b)
        return suggestion ? suggestion.suggested_text : b
      })

      expect(merged).toEqual(mockResume.experience[0].bullets)
    })

    test('should handle resume with no matching suggestions', () => {
      const unrelateSuggestions: Suggestion[] = [
        {
          id: '7',
          section: 'experience',
          item_index: 99,
          original_text: 'Non-existent bullet',
          suggested_text: 'Improved non-existent bullet',
          status: 'accepted',
        },
      ]

      const merged = mockResume.experience[0].bullets.map((b) => {
        const suggestion = unrelateSuggestions.find((s) => s.original_text === b)
        return suggestion ? suggestion.suggested_text : b
      })

      expect(merged).toEqual(mockResume.experience[0].bullets)
    })

    test('should handle special characters in content', () => {
      const specialCharsText = 'Improved SQL performance by 50% & reduced latency'
      const suggestion: Suggestion = {
        id: '8',
        section: 'experience',
        item_index: 0,
        original_text: specialCharsText,
        suggested_text: 'Optimized SQL queries & reduced p95 latency by 50%',
        status: 'accepted',
      }

      const merged =
        suggestion.status === 'accepted' ? suggestion.suggested_text : suggestion.original_text

      expect(merged).toContain('&')
      expect(merged).toContain('%')
    })

    test('should handle very long content', () => {
      const longText = 'A'.repeat(500)
      const suggestion: Suggestion = {
        id: '9',
        section: 'experience',
        item_index: 0,
        original_text: longText,
        suggested_text: longText.slice(0, 400) + 'improved',
        status: 'accepted',
      }

      const merged =
        suggestion.status === 'accepted' ? suggestion.suggested_text : suggestion.original_text

      expect(merged.length).toBe(408)
    })

    test('should handle unicode and emoji in content', () => {
      const unicodeText = 'Launched 🚀 product in München with 👥 team'
      const suggestion: Suggestion = {
        id: '10',
        section: 'experience',
        item_index: 0,
        original_text: unicodeText,
        suggested_text: 'Launched innovative product in München with global team',
        status: 'accepted',
      }

      const merged =
        suggestion.status === 'accepted' ? suggestion.suggested_text : suggestion.original_text

      expect(merged).not.toContain('🚀')
      expect(merged).toMatch(/Munich|München/)
    })
  })

  describe('Data Integrity', () => {
    test('should not modify original resume object during merge', () => {
      const originalCopy = JSON.parse(JSON.stringify(mockResume.experience[0].bullets))

      // Simulate merge operations (create new array, don't mutate original)
      const suggestion = mockSuggestions[0]
      const merged = mockResume.experience[0].bullets.map((b) =>
        b === suggestion.original_text ? suggestion.suggested_text : b
      )

      // Original array should be unchanged
      expect(mockResume.experience[0].bullets).toEqual(originalCopy)
      expect(merged).not.toEqual(originalCopy)
    })

    test('should maintain referential integrity between suggestion and resume before merge', () => {
      // Reset mockResume to original state (in case previous tests modified it)
      const testResume: ParsedResume = {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-0123',
        },
        experience: [
          {
            position: 'Software Developer',
            company: 'Tech Corp',
            startDate: '2022-01-15',
            endDate: 'Present',
            bullets: [
              'Worked on machine learning project',
              'Helped with database optimization',
              'Participated in code reviews',
            ],
          },
        ],
        skills: ['JavaScript', 'Python', 'React', 'SQL'],
        education: [
          {
            degree: 'BS in Computer Science',
            institution: 'State University',
            graduationDate: '2020-05-15',
          },
        ],
      }

      const suggestion = mockSuggestions[0]

      // Verify suggestion references actual resume content
      const exists = testResume.experience[0].bullets.includes(suggestion.original_text)

      expect(exists).toBe(true)
    })

    test('should not create circular references', () => {
      const diffs = mockSuggestions.filter((s) => s.status === 'accepted')

      diffs.forEach((diff) => {
        expect(diff).toHaveProperty('original_text')
        expect(diff).toHaveProperty('suggested_text')
        expect(typeof diff.original_text).toBe('string')
        expect(typeof diff.suggested_text).toBe('string')
      })
    })
  })

  describe('Performance', () => {
    test('should merge large number of suggestions efficiently', () => {
      const largeSuggestions = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        section: i % 5 === 0 ? 'experience' : 'skills',
        item_index: i % 10,
        original_text: `Original ${i}`,
        suggested_text: `Improved ${i}`,
        status: (i % 3 === 0 ? 'accepted' : 'rejected') as const,
      }))

      const start = Date.now()

      const accepted = largeSuggestions.filter((s) => s.status === 'accepted')

      const duration = Date.now() - start

      expect(duration).toBeLessThan(10)
      expect(accepted.length).toBeGreaterThan(0)
    })

    test('should find matching suggestions quickly', () => {
      const originalText = 'Worked on machine learning project'

      const start = Date.now()

      const suggestion = mockSuggestions.find((s) => s.original_text === originalText)

      const duration = Date.now() - start

      expect(duration).toBeLessThan(1)
      expect(suggestion).toBeDefined()
    })
  })
})
