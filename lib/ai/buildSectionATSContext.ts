/**
 * Section ATS Context Builder
 *
 * Builds section-specific context from processed gaps for injection
 * into suggestion generation prompts.
 *
 * This ensures suggestions are consistent with ATS analysis findings.
 */

import type { ATSScoreV21, ScoreBreakdownV21 } from '@/lib/scoring/types';
import type { KeywordAnalysisResult } from '@/types/analysis';
import {
  processGapAddressability,
  filterGapsForSection,
  type ProcessedGap,
  type SectionType,
  type GapProcessingResult,
} from '@/lib/scoring/gapAddressability';

// ============================================================================
// TYPES
// ============================================================================

export interface SectionATSContext {
  section: SectionType;

  // Overall context
  overallScore: number;
  isWeakestComponent: boolean;

  // Component scores relevant to this section
  relevantScores: {
    component: string;
    score: number;
    weight: number;
    isWeak: boolean; // Score < 50
  }[];

  // Categorized gaps for this section
  terminologyFixes: ProcessedGap[];
  potentialAdditions: ProcessedGap[];
  opportunities: ProcessedGap[];
  cannotFix: ProcessedGap[];

  // Additional section-specific flags
  flags: {
    quantificationNeeded: boolean;
    actionVerbsWeak: boolean;
    keywordDensityLow: boolean;
  };

  // Formatted prompt context (ready for injection)
  promptContext: string;
}

export interface ATSContextInput {
  atsScore: ATSScoreV21;
  keywordAnalysis: KeywordAnalysisResult;
  resumeText: string;
  parsedSections?: {
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
  };
}

// ============================================================================
// SECTION-COMPONENT MAPPING
// ============================================================================

const SECTION_COMPONENT_MAP: Record<SectionType, (keyof ScoreBreakdownV21)[]> = {
  summary: ['keywords', 'contentQuality'],
  skills: ['keywords'],
  experience: ['keywords', 'contentQuality', 'qualificationFit'],
  education: ['qualificationFit', 'sections'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format a gap for prompt inclusion.
 */
function formatGapForPrompt(gap: ProcessedGap, includeInstruction: boolean = true): string {
  const parts = [`"${gap.keyword}"`];

  if (gap.evidence) {
    parts.push(`(related to "${gap.evidence}" in resume)`);
  }

  parts.push(`[+${gap.potentialImpact} pts]`);

  if (includeInstruction) {
    parts.push(`\n   → ${gap.instruction}`);
  }

  return parts.join(' ');
}

/**
 * Get the weakest component from the breakdown.
 */
function getWeakestComponent(breakdown: ScoreBreakdownV21): string {
  const components = Object.entries(breakdown) as [keyof ScoreBreakdownV21, { score: number }][];
  let weakest = components[0];

  for (const comp of components) {
    if (comp[1].score < weakest[1].score) {
      weakest = comp;
    }
  }

  return weakest[0];
}

/**
 * Check content quality flags from ATS score.
 */
function getContentQualityFlags(atsScore: ATSScoreV21): {
  quantificationNeeded: boolean;
  actionVerbsWeak: boolean;
  keywordDensityLow: boolean;
} {
  const contentQuality = atsScore.breakdownV21.contentQuality.details;

  return {
    quantificationNeeded:
      contentQuality.details.bulletsWithMetrics < contentQuality.details.totalBullets * 0.5,
    actionVerbsWeak: contentQuality.details.weakVerbCount > 2,
    keywordDensityLow: contentQuality.breakdown.keywordDensityScore < 50,
  };
}

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build ATS context for a specific section.
 *
 * @param section - Target section (summary, skills, experience, education)
 * @param input - ATS analysis results and resume data
 * @returns Section-specific context for prompt injection
 */
export function buildSectionATSContext(
  section: SectionType,
  input: ATSContextInput
): SectionATSContext {
  const { atsScore, keywordAnalysis, resumeText, parsedSections } = input;

  // Process gaps with addressability
  const gapResult = processGapAddressability(keywordAnalysis, resumeText, parsedSections);

  // Filter gaps for this section
  const sectionGaps = filterGapsForSection(gapResult.processedGaps, section);

  // Get relevant component scores
  const relevantComponentKeys = SECTION_COMPONENT_MAP[section];
  const breakdown = atsScore.breakdownV21;
  const weakestComponent = getWeakestComponent(breakdown);

  const relevantScores = relevantComponentKeys.map(key => ({
    component: key,
    score: Math.round(breakdown[key].score),
    weight: breakdown[key].weight,
    isWeak: breakdown[key].score < 50,
  }));

  // Check if keywords is the weakest and relevant to this section
  const isWeakestComponent = relevantComponentKeys.includes(weakestComponent as keyof ScoreBreakdownV21);

  // Get content quality flags
  const flags = getContentQualityFlags(atsScore);

  // Build the prompt context
  const promptContext = buildPromptContext(
    section,
    atsScore.overall,
    relevantScores,
    sectionGaps,
    flags,
    gapResult.summary
  );

  return {
    section,
    overallScore: atsScore.overall,
    isWeakestComponent,
    relevantScores,
    ...sectionGaps,
    flags,
    promptContext,
  };
}

/**
 * Build formatted prompt context string.
 */
function buildPromptContext(
  section: SectionType,
  overallScore: number,
  relevantScores: { component: string; score: number; weight: number; isWeak: boolean }[],
  gaps: {
    terminologyFixes: ProcessedGap[];
    potentialAdditions: ProcessedGap[];
    opportunities: ProcessedGap[];
    cannotFix: ProcessedGap[];
  },
  flags: {
    quantificationNeeded: boolean;
    actionVerbsWeak: boolean;
    keywordDensityLow: boolean;
  },
  summary: {
    totalGaps: number;
    terminologyFixes: number;
    potentialAdditions: number;
    unfixableGaps: number;
    totalPotentialImpact: number;
  }
): string {
  const lines: string[] = [];

  // Header
  lines.push(`## ATS Analysis Context for ${section.charAt(0).toUpperCase() + section.slice(1)} Section`);
  lines.push('');

  // Overall context
  lines.push(`Current ATS Score: ${overallScore}/100`);

  // Calculate required vs preferred impact
  const requiredImpact = [...gaps.terminologyFixes, ...gaps.potentialAdditions]
    .reduce((sum, g) => sum + g.potentialImpact, 0);
  const preferredImpact = gaps.opportunities
    .reduce((sum, g) => sum + g.potentialImpact, 0);

  // Priority explanation - CRITICAL for LLM understanding
  if (gaps.terminologyFixes.length > 0 || gaps.potentialAdditions.length > 0) {
    lines.push('');
    lines.push('**⚠️ PRIORITY ORDER - READ CAREFULLY:**');
    lines.push(`- REQUIRED keywords below are worth +${requiredImpact} pts total`);
    lines.push(`- PREFERRED keywords are only worth +${preferredImpact} pts total`);
    lines.push('- Missing REQUIRED keywords CAP your maximum score - address these FIRST');
    lines.push('- You MUST suggest REQUIRED keywords before suggesting any PREFERRED keywords');
  }

  // Relevant component scores
  const weakComponents = relevantScores.filter(s => s.isWeak);
  if (weakComponents.length > 0) {
    lines.push('');
    lines.push('**Weak components affecting this section:**');
    for (const comp of weakComponents) {
      lines.push(`- ${comp.component}: ${comp.score}/100 (${Math.round(comp.weight * 100)}% weight)`);
    }
  }

  // Terminology fixes (high confidence) - REQUIRED keywords
  if (gaps.terminologyFixes.length > 0) {
    lines.push('');
    lines.push('### 🔴 REQUIRED KEYWORDS - TERMINOLOGY FIXES (Must Address)');
    lines.push('These are REQUIRED by the job and you have equivalent experience. Change wording to match exactly:');
    lines.push('');
    for (const gap of gaps.terminologyFixes) {
      lines.push(`- ${formatGapForPrompt(gap)} [REQUIRED - MUST ADD]`);
    }
  }

  // Potential additions (medium confidence) - REQUIRED keywords
  if (gaps.potentialAdditions.length > 0) {
    lines.push('');
    lines.push('### 🔴 REQUIRED KEYWORDS - CRITICAL PRIORITY (Address First)');
    lines.push('These are REQUIRED by the job. Resume shows related experience - suggest adding if candidate has this skill:');
    lines.push('');
    for (const gap of gaps.potentialAdditions) {
      lines.push(`- ${formatGapForPrompt(gap)} [REQUIRED - HIGH IMPACT]`);
    }
  }

  // Opportunities (preferred keywords) - OPTIONAL
  if (gaps.opportunities.length > 0) {
    lines.push('');
    lines.push('### 🟡 PREFERRED KEYWORDS - OPTIONAL (Lower Priority)');
    lines.push('These are nice-to-have ONLY. Address REQUIRED keywords above BEFORE suggesting these:');
    lines.push('');
    for (const gap of gaps.opportunities.slice(0, 5)) { // Limit to top 5
      lines.push(`- ${formatGapForPrompt(gap, false)} [preferred - optional]`);
    }
    if (gaps.opportunities.length > 5) {
      lines.push(`  ... and ${gaps.opportunities.length - 5} more optional keywords`);
    }
  }

  // Cannot fix (acknowledgment)
  if (gaps.cannotFix.length > 0) {
    lines.push('');
    lines.push('### ⛔ CANNOT FIX (Do Not Fabricate)');
    lines.push('These gaps cannot be addressed by rewording - do not suggest adding:');
    lines.push('');
    for (const gap of gaps.cannotFix) {
      lines.push(`- "${gap.keyword}" - ${gap.reason}`);
    }
  }

  // Section-specific flags
  if (section === 'experience') {
    lines.push('');
    lines.push('### Content Quality Issues');
    if (flags.quantificationNeeded) {
      lines.push('- ⚠️ Many bullets lack quantifiable metrics - add numbers, percentages, or measurable outcomes');
    }
    if (flags.actionVerbsWeak) {
      lines.push('- ⚠️ Weak action verbs detected - use stronger verbs (led, developed, achieved vs. helped, worked, did)');
    }
    if (flags.keywordDensityLow) {
      lines.push('- ⚠️ Low keyword density - incorporate more JD keywords naturally into experience bullets');
    }
  }

  // Instructions - with MANDATORY priority enforcement
  lines.push('');
  lines.push('### MANDATORY Instructions for Suggestions');
  lines.push('1. **FIRST: Address ALL 🔴 REQUIRED keywords** - these have the highest impact and cap your score if missing');
  lines.push('2. **SECOND: Address terminology fixes** - these are safe, just wording changes');
  lines.push('3. **ONLY THEN: Consider 🟡 PREFERRED keywords** - only if you have addressed all required keywords');
  lines.push('4. **Do NOT fabricate** skills, certifications, or experience not evident in resume');
  lines.push('5. **Explain ATS impact** - in "Why this works", reference which gap each suggestion addresses');
  lines.push(`6. **Potential impact**: Up to +${summary.totalPotentialImpact} pts if all addressable gaps fixed`);
  lines.push('');
  lines.push('**VERIFICATION:** Before finalizing, confirm you have suggested ALL 🔴 REQUIRED keywords listed above.');

  return lines.join('\n');
}

/**
 * Build ATS context for all sections at once.
 * Useful when generating suggestions for all sections in one batch.
 */
export function buildAllSectionsATSContext(
  input: ATSContextInput
): Record<SectionType, SectionATSContext> {
  const sections: SectionType[] = ['summary', 'skills', 'experience', 'education'];

  const result: Partial<Record<SectionType, SectionATSContext>> = {};

  for (const section of sections) {
    result[section] = buildSectionATSContext(section, input);
  }

  return result as Record<SectionType, SectionATSContext>;
}

/**
 * Get a quick summary of addressable gaps for logging/debugging.
 */
export function getGapSummary(input: ATSContextInput): {
  total: number;
  addressable: number;
  terminology: number;
  potential: number;
  unfixable: number;
  potentialImpact: number;
} {
  const gapResult = processGapAddressability(
    input.keywordAnalysis,
    input.resumeText,
    input.parsedSections
  );

  return {
    total: gapResult.summary.totalGaps,
    addressable: gapResult.summary.terminologyFixes + gapResult.summary.potentialAdditions,
    terminology: gapResult.summary.terminologyFixes,
    potential: gapResult.summary.potentialAdditions,
    unfixable: gapResult.summary.unfixableGaps,
    potentialImpact: gapResult.summary.totalPotentialImpact,
  };
}
