/**
 * Structural Suggestions Engine (Story 18.3)
 *
 * Generates deterministic structural suggestions based on 8 rules from the KB.
 * No LLM, no network, no database calls.
 */

import type { CandidateType } from './types';
import type { StructuralSuggestion } from '@/types/suggestions';

// ============================================================================
// TYPES
// ============================================================================

export interface StructuralSuggestionInput {
  /** Candidate type from detection */
  candidateType: CandidateType;
  /** Parsed resume sections (null = not present) */
  parsedResume: {
    summary?: string | null;
    skills?: string | null;
    experience?: string | null;
    education?: string | null;
    projects?: string | null;
    certifications?: string | null;
  };
  /** Order of sections as they appear in the resume (derived from parsing) */
  sectionOrder: string[];
  /** Raw resume text for header detection (optional) */
  rawResumeText?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Unsafe section headers that ATS parsers may fail to categorize.
 * Keys are lowercase for case-insensitive matching.
 * Values are recommended standard headers.
 */
const UNSAFE_HEADERS: Record<string, string> = {
  'my journey': 'Professional Experience',
  'track record': 'Professional Experience',
  'career path': 'Professional Experience',
  "what i've done": 'Professional Experience',
  'what i know': 'Technical Skills',
  'my toolkit': 'Technical Skills',
  'tech stack': 'Technical Skills',
  'learning': 'Education',
  'where i studied': 'Education',
  "things i've built": 'Projects',
  'my work': 'Projects',
  'about me': 'Professional Summary',
  'who i am': 'Professional Summary',
};

// ============================================================================
// RULE IMPLEMENTATIONS
// ============================================================================

/**
 * Rule 1: Co-op with Experience before Education → high priority reorder suggestion
 */
function checkRule1CoopExpBeforeEdu(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'coop') return null;

  const { sectionOrder } = input;
  const expIndex = sectionOrder.indexOf('experience');
  const eduIndex = sectionOrder.indexOf('education');

  // Only trigger if both sections present AND experience comes before education
  if (expIndex !== -1 && eduIndex !== -1 && expIndex < eduIndex) {
    return {
      id: 'rule-coop-exp-before-edu',
      priority: 'high',
      category: 'section_order',
      message: 'For co-op/internship resumes, Education should come before Experience',
      currentState: 'Experience section appears before Education section',
      recommendedAction:
        'Move Education section above Experience. Co-op candidates benefit from showcasing their academic credentials before work history.',
    };
  }

  return null;
}

/**
 * Rule 2: Co-op with no Skills at top → critical priority presence suggestion
 */
function checkRule2CoopNoSkillsAtTop(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'coop') return null;

  const { parsedResume, sectionOrder } = input;

  // Check if skills is missing OR not first in the order
  const skillsMissing = !parsedResume.skills;
  const skillsNotFirst = sectionOrder.length > 0 && sectionOrder[0] !== 'skills';

  if (skillsMissing || skillsNotFirst) {
    return {
      id: 'rule-coop-no-skills-at-top',
      priority: 'critical',
      category: 'section_presence',
      message: 'Co-op resumes must lead with Skills section',
      currentState: skillsMissing
        ? 'Skills section is missing'
        : 'Skills section is not positioned first',
      recommendedAction:
        'Add or move Skills section to the top of your resume (right after header). This maximizes keyword density for ATS systems and immediately demonstrates your technical capabilities.',
    };
  }

  return null;
}

/**
 * Rule 3: Co-op with generic summary present → high priority removal suggestion
 */
function checkRule3CoopGenericSummary(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'coop') return null;

  const { parsedResume } = input;

  // Trigger if any summary is present (Story 18.6 will handle keyword-rich detection)
  if (parsedResume.summary) {
    return {
      id: 'rule-coop-generic-summary',
      priority: 'high',
      category: 'section_presence',
      message: 'Co-op resumes typically should not include a Professional Summary',
      currentState: 'Professional Summary section is present',
      recommendedAction:
        'Consider removing the summary to save space; co-op/internship resumes benefit from leading with Skills instead. Use the extra space for Projects or relevant coursework.',
    };
  }

  return null;
}

/**
 * Rule 4: "Projects" heading → rename to "Project Experience" → moderate priority heading suggestion
 */
function checkRule4ProjectsHeading(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'coop') return null;

  const { parsedResume } = input;

  // Trigger if projects section exists (assumes heading is "Projects")
  if (parsedResume.projects) {
    return {
      id: 'rule-coop-projects-heading',
      priority: 'moderate',
      category: 'section_heading',
      message: 'Use "Project Experience" heading instead of "Projects"',
      currentState: 'Section is likely titled "Projects"',
      recommendedAction:
        'Rename the section heading to "Project Experience" for better ATS recognition and professional presentation.',
    };
  }

  return null;
}

/**
 * Rule 5: Full-time with Education before Experience → high priority reorder suggestion
 */
function checkRule5FulltimeEduBeforeExp(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'fulltime') return null;

  const { sectionOrder } = input;
  const expIndex = sectionOrder.indexOf('experience');
  const eduIndex = sectionOrder.indexOf('education');

  // Only trigger if both sections present AND education comes before experience
  if (expIndex !== -1 && eduIndex !== -1 && eduIndex < expIndex) {
    return {
      id: 'rule-fulltime-edu-before-exp',
      priority: 'high',
      category: 'section_order',
      message: 'For full-time positions, Experience should come before Education',
      currentState: 'Education section appears before Experience section',
      recommendedAction:
        'Move Experience section above Education. Full-time candidates should emphasize professional experience over academic credentials.',
    };
  }

  return null;
}

/**
 * Rule 6: Career changer without summary → critical priority presence suggestion
 */
function checkRule6CareerChangerNoSummary(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'career_changer') return null;

  const { parsedResume } = input;

  // Trigger if summary is missing
  if (!parsedResume.summary) {
    return {
      id: 'rule-career-changer-no-summary',
      priority: 'critical',
      category: 'section_presence',
      message: 'Career changers must include a Professional Summary',
      currentState: 'Professional Summary section is missing',
      recommendedAction:
        'Add a Professional Summary at the top of your resume to explain your career transition and highlight transferable skills. This section is essential for career changers to frame your narrative.',
    };
  }

  return null;
}

/**
 * Rule 7: Career changer with Education below Experience → high priority reorder suggestion
 */
function checkRule7CareerChangerEduBelowExp(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  if (input.candidateType !== 'career_changer') return null;

  const { sectionOrder } = input;
  const expIndex = sectionOrder.indexOf('experience');
  const eduIndex = sectionOrder.indexOf('education');

  // Only trigger if both sections present AND education comes after experience
  if (expIndex !== -1 && eduIndex !== -1 && eduIndex > expIndex) {
    return {
      id: 'rule-career-changer-edu-below-exp',
      priority: 'high',
      category: 'section_order',
      message: 'For career changers, Education should come before Experience',
      currentState: 'Education section appears after Experience section',
      recommendedAction:
        'Move Education section above Experience. Your degree is the pivot credential for your career change and should be prominently positioned.',
    };
  }

  return null;
}

/**
 * Rule 8: Non-standard section headers detected → moderate priority heading suggestion
 */
function checkRule8NonStandardHeaders(
  input: StructuralSuggestionInput
): StructuralSuggestion | null {
  const { rawResumeText } = input;

  // Skip if raw text not provided
  if (!rawResumeText) return null;

  const lowerText = rawResumeText.toLowerCase();
  const detectedUnsafeHeaders: string[] = [];

  // Check for unsafe headers at line boundaries to avoid false positives
  // (e.g., "learning" in "Machine Learning" or "my work" in "In my work at...")
  for (const [unsafeHeader, standardHeader] of Object.entries(UNSAFE_HEADERS)) {
    const escapedHeader = unsafeHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineStartPattern = new RegExp(`^\\s*${escapedHeader}\\s*$`, 'm');
    if (lineStartPattern.test(lowerText)) {
      detectedUnsafeHeaders.push(`"${unsafeHeader}" → "${standardHeader}"`);
    }
  }

  if (detectedUnsafeHeaders.length > 0) {
    return {
      id: 'rule-non-standard-headers',
      priority: 'moderate',
      category: 'section_heading',
      message: 'Non-standard section headings detected',
      currentState: `Detected: ${detectedUnsafeHeaders.join(', ')}`,
      recommendedAction:
        'Replace creative or informal section headings with standard ATS-friendly headers. This ensures proper categorization by applicant tracking systems.',
    };
  }

  return null;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generates structural suggestions based on candidate type and resume structure.
 * Applies 8 deterministic rules from the ATS Resume Structure Knowledge Base.
 *
 * @param input - Resume sections, candidate type, section order, and optional raw text
 * @returns Array of structural suggestions (empty if no issues detected)
 *
 * @example
 * ```typescript
 * const suggestions = generateStructuralSuggestions({
 *   candidateType: 'coop',
 *   parsedResume: {
 *     summary: 'Some summary text',
 *     skills: 'JavaScript, Python',
 *     experience: 'Co-op at Company X',
 *     education: 'BS CS, University',
 *   },
 *   sectionOrder: ['summary', 'experience', 'education', 'skills'],
 * });
 * // Returns suggestions for: summary removal, skills not at top, exp before edu
 * ```
 */
export function generateStructuralSuggestions(
  input: StructuralSuggestionInput
): StructuralSuggestion[] {
  const suggestions: StructuralSuggestion[] = [];

  // Apply all 8 rules
  const ruleFunctions = [
    checkRule1CoopExpBeforeEdu,
    checkRule2CoopNoSkillsAtTop,
    checkRule3CoopGenericSummary,
    checkRule4ProjectsHeading,
    checkRule5FulltimeEduBeforeExp,
    checkRule6CareerChangerNoSummary,
    checkRule7CareerChangerEduBelowExp,
    checkRule8NonStandardHeaders,
  ];

  for (const ruleFunc of ruleFunctions) {
    const suggestion = ruleFunc(input);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}
