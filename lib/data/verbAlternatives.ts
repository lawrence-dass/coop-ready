/**
 * @file verbAlternatives.ts
 * @description Verb alternatives mapping for natural writing enforcement
 * @see Story 9.3: Natural Writing Enforcement - Task 2
 */

/**
 * Verb category definitions with alternatives
 */
export const VERB_ALTERNATIVES = {
  leadership: {
    category: 'Leadership',
    verbs: {
      led: {
        alternatives: ['Directed', 'Managed', 'Coordinated', 'Guided'],
        reasoning: 'Vary leadership verbs to demonstrate range of management skills',
      },
      directed: {
        alternatives: ['Led', 'Managed', 'Coordinated', 'Guided'],
        reasoning: 'Use different leadership verbs to show diverse management experience',
      },
      managed: {
        alternatives: ['Led', 'Directed', 'Coordinated', 'Oversaw'],
        reasoning: 'Vary management verbs for stronger impact',
      },
      coordinated: {
        alternatives: ['Led', 'Directed', 'Managed', 'Organized'],
        reasoning: 'Use varied coordination verbs to show organizational skills',
      },
      guided: {
        alternatives: ['Led', 'Directed', 'Mentored', 'Coached'],
        reasoning: 'Vary guidance verbs to demonstrate mentorship abilities',
      },
      organized: {
        alternatives: ['Coordinated', 'Arranged', 'Structured', 'Planned'],
        reasoning: 'Use different organizational verbs for variety',
      },
    },
  },
  technical: {
    category: 'Technical',
    verbs: {
      built: {
        alternatives: ['Developed', 'Created', 'Designed', 'Engineered'],
        reasoning: 'Vary technical verbs to showcase diverse development skills',
      },
      developed: {
        alternatives: ['Built', 'Created', 'Designed', 'Implemented'],
        reasoning: 'Use different development verbs to show technical range',
      },
      designed: {
        alternatives: ['Architected', 'Built', 'Created', 'Engineered'],
        reasoning: 'Vary design verbs to demonstrate technical creativity',
      },
      implemented: {
        alternatives: ['Developed', 'Built', 'Deployed', 'Integrated'],
        reasoning: 'Use varied implementation verbs for stronger technical narrative',
      },
      created: {
        alternatives: ['Built', 'Developed', 'Designed', 'Produced'],
        reasoning: 'Vary creation verbs to show technical versatility',
      },
      engineered: {
        alternatives: ['Built', 'Designed', 'Developed', 'Architected'],
        reasoning: 'Use different engineering verbs for variety',
      },
    },
  },
  analytics: {
    category: 'Analytics',
    verbs: {
      analyzed: {
        alternatives: ['Evaluated', 'Assessed', 'Examined', 'Investigated'],
        reasoning: 'Vary analytical verbs to demonstrate diverse analysis skills',
      },
      evaluated: {
        alternatives: ['Analyzed', 'Assessed', 'Reviewed', 'Measured'],
        reasoning: 'Use different evaluation verbs to show analytical depth',
      },
      assessed: {
        alternatives: ['Analyzed', 'Evaluated', 'Measured', 'Determined'],
        reasoning: 'Vary assessment verbs for stronger analytical narrative',
      },
      measured: {
        alternatives: ['Quantified', 'Tracked', 'Evaluated', 'Monitored'],
        reasoning: 'Use varied measurement verbs to show data-driven approach',
      },
      quantified: {
        alternatives: ['Measured', 'Calculated', 'Tracked', 'Assessed'],
        reasoning: 'Vary quantification verbs to demonstrate metrics focus',
      },
      determined: {
        alternatives: ['Identified', 'Established', 'Assessed', 'Evaluated'],
        reasoning: 'Use different determination verbs for variety',
      },
    },
  },
  communication: {
    category: 'Communication',
    verbs: {
      communicated: {
        alternatives: ['Presented', 'Articulated', 'Conveyed', 'Reported'],
        reasoning: 'Vary communication verbs to show diverse presentation skills',
      },
      presented: {
        alternatives: ['Delivered', 'Demonstrated', 'Showcased', 'Communicated'],
        reasoning: 'Use different presentation verbs for stronger impact',
      },
      articulated: {
        alternatives: ['Communicated', 'Explained', 'Expressed', 'Conveyed'],
        reasoning: 'Vary articulation verbs to demonstrate clarity',
      },
      explained: {
        alternatives: ['Clarified', 'Described', 'Illustrated', 'Communicated'],
        reasoning: 'Use varied explanation verbs to show teaching ability',
      },
      conveyed: {
        alternatives: ['Communicated', 'Presented', 'Articulated', 'Delivered'],
        reasoning: 'Vary communication verbs for variety',
      },
    },
  },
  problemSolving: {
    category: 'Problem Solving',
    verbs: {
      resolved: {
        alternatives: ['Solved', 'Addressed', 'Fixed', 'Remedied'],
        reasoning: 'Vary problem-solving verbs to show troubleshooting skills',
      },
      solved: {
        alternatives: ['Resolved', 'Addressed', 'Fixed', 'Corrected'],
        reasoning: 'Use different solution verbs for stronger impact',
      },
      addressed: {
        alternatives: ['Resolved', 'Solved', 'Tackled', 'Handled'],
        reasoning: 'Vary problem-addressing verbs to demonstrate initiative',
      },
      overcame: {
        alternatives: ['Conquered', 'Surmounted', 'Resolved', 'Addressed'],
        reasoning: 'Use varied challenge-overcoming verbs to show resilience',
      },
      improved: {
        alternatives: ['Enhanced', 'Optimized', 'Upgraded', 'Strengthened'],
        reasoning: 'Vary improvement verbs to demonstrate continuous enhancement',
      },
    },
  },
} as const

/**
 * Get verb category and alternatives
 *
 * @param verb - The verb to look up
 * @returns Category info with alternatives and reasoning, or null if not found
 */
export function getVerbInfo(verb: string): {
  category: string
  alternatives: string[]
  reasoning: string
} | null {
  const normalized = verb.toLowerCase()

  for (const categoryData of Object.values(VERB_ALTERNATIVES)) {
    if (normalized in categoryData.verbs) {
      const verbInfo = categoryData.verbs[normalized as keyof typeof categoryData.verbs] as {
        alternatives: readonly string[]
        reasoning: string
      }
      return {
        category: categoryData.category,
        alternatives: [...verbInfo.alternatives], // Spread to convert readonly array to mutable
        reasoning: verbInfo.reasoning,
      }
    }
  }

  return null
}

/**
 * Get all verbs in a category
 *
 * @param category - Category name (e.g., 'leadership', 'technical')
 * @returns Array of all verbs in that category
 */
export function getVerbsByCategory(category: keyof typeof VERB_ALTERNATIVES): string[] {
  const categoryData = VERB_ALTERNATIVES[category]
  return Object.keys(categoryData.verbs)
}

/**
 * Check if a verb belongs to a specific category
 *
 * @param verb - The verb to check
 * @param category - The category to check against
 * @returns True if verb belongs to category
 */
export function isVerbInCategory(
  verb: string,
  category: keyof typeof VERB_ALTERNATIVES
): boolean {
  const normalized = verb.toLowerCase()
  const categoryData = VERB_ALTERNATIVES[category]
  return normalized in categoryData.verbs
}
