/**
 * LLM Preferences Prompt Builder
 *
 * This module provides utility functions to build LLM prompt instructions
 * based on user optimization preferences.
 *
 * Story: 11.2 - Implement Optimization Preferences
 */

import type { OptimizationPreferences } from '@/types';

/**
 * Build a prompt section describing user preferences
 *
 * This function takes user preferences and generates clear LLM instructions
 * that guide suggestion generation according to user preferences.
 *
 * @param preferences - User's optimization preferences
 * @returns Formatted prompt instructions as string
 *
 * @example
 * ```typescript
 * const prefs: OptimizationPreferences = {
 *   tone: 'technical',
 *   verbosity: 'concise',
 *   emphasis: 'keywords',
 *   industry: 'tech',
 *   experienceLevel: 'senior'
 * };
 *
 * const promptSection = buildPreferencePrompt(prefs);
 * // Returns formatted instructions for the LLM
 * ```
 */
export function buildPreferencePrompt(preferences: OptimizationPreferences): string {
  const lines: string[] = [
    '**User Preferences:**',
    'Generate suggestions according to these user preferences:',
  ];

  // Tone preference
  if (preferences.tone === 'professional') {
    lines.push('- **Tone:** Use professional, formal corporate language and standard business terminology');
  } else if (preferences.tone === 'technical') {
    lines.push('- **Tone:** Emphasize technical depth, tools, frameworks, and technical terminology');
  } else if (preferences.tone === 'casual') {
    lines.push('- **Tone:** Use conversational, approachable language; less formal, more natural');
  }

  // Verbosity preference
  if (preferences.verbosity === 'concise') {
    lines.push('- **Verbosity:** Keep suggestions concise (1-2 lines per bullet, remove unnecessary words)');
  } else if (preferences.verbosity === 'detailed') {
    lines.push('- **Verbosity:** Provide standard detail level (2-3 lines per bullet, balanced clarity)');
  } else if (preferences.verbosity === 'comprehensive') {
    lines.push('- **Verbosity:** Be comprehensive (3-4 lines per bullet with extensive context and metrics)');
  }

  // Emphasis preference
  if (preferences.emphasis === 'skills') {
    lines.push('- **Emphasis:** Highlight technical skills, tools, frameworks, and certifications prominently');
  } else if (preferences.emphasis === 'impact') {
    lines.push('- **Emphasis:** Focus on quantifiable results, outcomes, and business value impact');
  } else if (preferences.emphasis === 'keywords') {
    lines.push('- **Emphasis:** Maximize ATS keyword coverage from the job description');
  }

  // Industry preference
  if (preferences.industry === 'tech') {
    lines.push('- **Industry:** Use technology industry language (APIs, databases, CI/CD, scalability, etc.)');
  } else if (preferences.industry === 'finance') {
    lines.push('- **Industry:** Use finance industry language (ROI, financial modeling, compliance, risk, etc.)');
  } else if (preferences.industry === 'healthcare') {
    lines.push('- **Industry:** Use healthcare industry language (patient outcomes, HIPAA, clinical, care, etc.)');
  } else if (preferences.industry === 'generic') {
    lines.push('- **Industry:** Use industry-agnostic, neutral language suitable for any field');
  }

  // Experience level preference
  if (preferences.experienceLevel === 'entry') {
    lines.push('- **Experience Level:** Frame for entry-level (emphasize learning, collaboration, potential, foundational skills)');
    lines.push('  - Use language like: "Contributed to...", "Collaborated on...", "Developed skills in..."');
  } else if (preferences.experienceLevel === 'mid') {
    lines.push('- **Experience Level:** Frame for mid-level (balance execution and leadership, show depth and breadth)');
    lines.push('  - Use language like: "Led...", "Owned...", "Improved...", show career progression');
  } else if (preferences.experienceLevel === 'senior') {
    lines.push('- **Experience Level:** Frame for senior-level (emphasize strategy, mentorship, business impact, innovation)');
    lines.push('  - Use language like: "Drove...", "Architected...", "Established...", "Mentored..."');
  }

  lines.push('');
  lines.push('**Important:** Apply ALL of these preferences consistently throughout the suggestions.');

  return lines.join('\n');
}
