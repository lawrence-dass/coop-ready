/**
 * Gap Addressability Processor
 *
 * Categorizes missing keywords by how addressable they are:
 * - terminology: Resume has the skill, just different wording
 * - potential: Resume might have related experience
 * - unfixable: Genuine gap, can't address honestly
 *
 * This enables suggestions to be consistent with ATS analysis
 * while preventing fabrication of skills.
 */

import type { KeywordAnalysisResult, ExtractedKeyword, MatchedKeyword, KeywordCategory } from '@/types/analysis';

// ============================================================================
// TYPES
// ============================================================================

export type GapAddressability = 'terminology' | 'potential' | 'unfixable';

export type SectionType = 'summary' | 'skills' | 'experience' | 'education';

export interface ProcessedGap {
  keyword: string;
  category: KeywordCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  requirement: 'required' | 'preferred';
  potentialImpact: number;
  addressability: GapAddressability;
  reason: string;
  evidence: string | null;
  targetSections: SectionType[];
  instruction: string;
}

export interface GapProcessingResult {
  processedGaps: ProcessedGap[];
  summary: {
    totalGaps: number;
    terminologyFixes: number;
    potentialAdditions: number;
    unfixableGaps: number;
    totalPotentialImpact: number;
  };
}

// ============================================================================
// TERMINOLOGY PATTERNS
// ============================================================================

/**
 * Maps common resume terms to their JD equivalents.
 * If resume has the key, it can be changed to the value (terminology fix).
 */
const TERMINOLOGY_MAPPINGS: Record<string, string[]> = {
  // API variations
  'RESTful API': ['REST API', 'REST APIs', 'RESTful APIs', 'REST services', 'API development'],
  'RESTful APIs': ['REST API', 'REST APIs', 'RESTful API', 'REST services', 'API development'],

  // Database variations
  'SQL': ['MySQL', 'PostgreSQL', 'database', 'databases', 'RDBMS'],
  'NoSQL': ['MongoDB', 'DynamoDB', 'Cassandra', 'document database'],

  // Methodology variations
  'Agile methodologies': ['Agile', 'Scrum', 'sprint', 'sprints', 'Kanban'],
  'Agile': ['Scrum', 'sprint', 'sprints', 'Kanban', 'Agile methodologies'],

  // Soft skills variations
  'Problem-Solving': ['problem solving', 'troubleshooting', 'debugging', 'analytical'],
  'Communication': ['communicate', 'collaboration', 'collaborative', 'team', 'teamwork'],
  'Leadership': ['led', 'leading', 'managed', 'mentored', 'mentor'],

  // Degree variations
  "Bachelor's Degree": ['Bachelor', 'BS', 'B.S.', 'BA', 'B.A.', 'undergraduate'],
  "Master's Degree": ['Master', 'MS', 'M.S.', 'MA', 'M.A.', 'graduate degree'],

  // Tech variations
  'CI/CD': ['continuous integration', 'continuous deployment', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'deployment pipeline'],
  'Unit Testing': ['unit tests', 'testing', 'test coverage', 'Jest', 'Vitest', 'pytest'],
  'Test-Driven Development': ['TDD', 'test-driven', 'tests first'],
};

/**
 * Technology families - if resume has one, might know related ones.
 */
const TECHNOLOGY_FAMILIES: Record<string, string[]> = {
  // Python web frameworks
  'Django': ['Python', 'Flask', 'FastAPI', 'web development'],
  'Flask': ['Python', 'Django', 'FastAPI', 'web development'],

  // JavaScript/TypeScript
  'TypeScript': ['JavaScript', 'React', 'Angular', 'Vue', 'Node.js'],

  // Cloud providers
  'AWS': ['cloud', 'Azure', 'GCP', 'EC2', 'S3', 'Lambda'],
  'Azure': ['cloud', 'AWS', 'GCP', 'Microsoft'],
  'GCP': ['cloud', 'AWS', 'Azure', 'Google Cloud'],

  // Containerization
  'Docker': ['container', 'containerization', 'Kubernetes', 'deployment'],
  'Kubernetes': ['Docker', 'container', 'K8s', 'orchestration', 'deployment'],

  // Databases
  'MongoDB': ['NoSQL', 'database', 'document database'],
  'PostgreSQL': ['SQL', 'database', 'MySQL', 'relational'],
  'MySQL': ['SQL', 'database', 'PostgreSQL', 'relational'],

  // Frontend
  'React': ['JavaScript', 'frontend', 'UI', 'component', 'Redux'],
  'Angular': ['JavaScript', 'TypeScript', 'frontend', 'UI'],
  'Vue': ['JavaScript', 'frontend', 'UI', 'component'],

  // Backend
  'Node.js': ['JavaScript', 'backend', 'Express', 'API'],
  'GraphQL': ['API', 'REST', 'query', 'Apollo'],

  // Architecture
  'Microservices': ['distributed', 'services', 'API', 'scalable', 'architecture'],
};

/**
 * Keywords that typically can't be added if not present (qualifications).
 */
const QUALIFICATION_KEYWORDS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Bachelor',
  'Master',
  'PhD',
  'years of experience',
  'certified',
  'certification',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if resume text contains any of the given terms (case-insensitive).
 */
function containsAnyTerm(text: string, terms: string[]): string | null {
  const lowerText = text.toLowerCase();
  for (const term of terms) {
    if (lowerText.includes(term.toLowerCase())) {
      return term;
    }
  }
  return null;
}

/**
 * Check if a keyword exists in the matched keywords list.
 */
function isKeywordMatched(keyword: string, matched: MatchedKeyword[]): boolean {
  const lowerKeyword = keyword.toLowerCase();
  return matched.some(m => m.keyword.toLowerCase() === lowerKeyword && m.found);
}

/**
 * Determine impact points based on priority and requirement.
 */
function calculateImpact(importance: 'high' | 'medium' | 'low', requirement: 'required' | 'preferred'): number {
  const baseImpact = {
    high: 12,
    medium: 8,
    low: 4,
  };

  // Required keywords have higher impact
  const multiplier = requirement === 'required' ? 1 : 0.5;
  return Math.round(baseImpact[importance] * multiplier);
}

/**
 * Map importance to priority.
 */
function importanceToPriority(
  importance: 'high' | 'medium' | 'low',
  requirement: 'required' | 'preferred'
): 'critical' | 'high' | 'medium' | 'low' {
  if (requirement === 'required') {
    if (importance === 'high') return 'critical';
    if (importance === 'medium') return 'high';
    return 'medium';
  } else {
    if (importance === 'high') return 'medium';
    return 'low';
  }
}

/**
 * Determine which sections can address a keyword gap.
 */
function determineTargetSections(category: KeywordCategory, keyword: string): SectionType[] {
  switch (category) {
    case 'skills':
    case 'technologies':
      return ['skills', 'experience'];
    case 'soft_skills':
      return ['summary', 'experience'];
    case 'qualifications':
      return ['education', 'summary'];
    case 'certifications':
      return ['education', 'skills'];
    case 'experience':
      return ['experience', 'summary'];
    default:
      return ['skills', 'experience'];
  }
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Process keyword gaps to determine their addressability.
 *
 * @param keywordAnalysis - The keyword analysis results from ATS scoring
 * @param resumeText - Full resume text for evidence checking
 * @param parsedSections - Parsed resume sections for more precise checking
 * @returns ProcessedGaps with addressability categorization
 */
export function processGapAddressability(
  keywordAnalysis: KeywordAnalysisResult,
  resumeText: string,
  parsedSections?: {
    summary?: string;
    skills?: string;
    experience?: string;
    education?: string;
  }
): GapProcessingResult {
  const processedGaps: ProcessedGap[] = [];
  const fullText = resumeText.toLowerCase();

  // Combine all section text for comprehensive checking
  const allSectionText = parsedSections
    ? [
        parsedSections.summary || '',
        parsedSections.skills || '',
        parsedSections.experience || '',
        parsedSections.education || '',
      ].join(' ').toLowerCase()
    : fullText;

  for (const missingKeyword of keywordAnalysis.missing) {
    const keyword = missingKeyword.keyword;
    const category = missingKeyword.category;
    const importance = missingKeyword.importance;
    const requirement = missingKeyword.requirement || 'preferred';

    let addressability: GapAddressability;
    let reason: string;
    let evidence: string | null = null;
    let instruction: string;

    // Step 1: Check if this is a terminology fix
    const termMappings = TERMINOLOGY_MAPPINGS[keyword];
    if (termMappings) {
      const foundTerm = containsAnyTerm(allSectionText, termMappings);
      if (foundTerm) {
        addressability = 'terminology';
        evidence = foundTerm;
        reason = `Resume uses "${foundTerm}" which is equivalent`;
        instruction = `Change "${foundTerm}" to "${keyword}" for exact JD match`;

        processedGaps.push({
          keyword,
          category,
          priority: importanceToPriority(importance, requirement),
          requirement,
          potentialImpact: calculateImpact(importance, requirement),
          addressability,
          reason,
          evidence,
          targetSections: determineTargetSections(category, keyword),
          instruction,
        });
        continue;
      }
    }

    // Step 2: Check for reverse terminology (resume might have exact, JD has variant)
    for (const [jdTerm, resumeVariants] of Object.entries(TERMINOLOGY_MAPPINGS)) {
      if (resumeVariants.includes(keyword)) {
        const foundTerm = containsAnyTerm(allSectionText, [jdTerm]);
        if (foundTerm) {
          addressability = 'terminology';
          evidence = foundTerm;
          reason = `Resume uses "${foundTerm}", can add "${keyword}" as explicit mention`;
          instruction = `Add "${keyword}" alongside existing "${foundTerm}"`;

          processedGaps.push({
            keyword,
            category,
            priority: importanceToPriority(importance, requirement),
            requirement,
            potentialImpact: calculateImpact(importance, requirement),
            addressability,
            reason,
            evidence,
            targetSections: determineTargetSections(category, keyword),
            instruction,
          });
          continue;
        }
      }
    }

    // Step 3: Check if keyword actually exists in resume (analysis might have missed it)
    if (fullText.includes(keyword.toLowerCase())) {
      addressability = 'terminology';
      evidence = keyword;
      reason = `Keyword "${keyword}" exists in resume but may not be prominent enough`;
      instruction = `Make "${keyword}" more prominent or add to skills section`;

      processedGaps.push({
        keyword,
        category,
        priority: importanceToPriority(importance, requirement),
        requirement,
        potentialImpact: calculateImpact(importance, requirement),
        addressability,
        reason,
        evidence,
        targetSections: determineTargetSections(category, keyword),
        instruction,
      });
      continue;
    }

    // Step 4: Check if this is a potential addition (related tech exists)
    const relatedTechs = TECHNOLOGY_FAMILIES[keyword];
    if (relatedTechs) {
      const foundRelated = containsAnyTerm(allSectionText, relatedTechs);
      if (foundRelated) {
        addressability = 'potential';
        evidence = foundRelated;
        reason = `Resume has "${foundRelated}" which is related to ${keyword}`;
        instruction = `Only add "${keyword}" if candidate genuinely has this experience`;

        processedGaps.push({
          keyword,
          category,
          priority: importanceToPriority(importance, requirement),
          requirement,
          potentialImpact: calculateImpact(importance, requirement),
          addressability,
          reason,
          evidence,
          targetSections: determineTargetSections(category, keyword),
          instruction,
        });
        continue;
      }
    }

    // Step 5: Check if this is a qualification (typically unfixable)
    const isQualification = QUALIFICATION_KEYWORDS.some(
      q => keyword.toLowerCase().includes(q.toLowerCase())
    );
    if (isQualification || category === 'qualifications' || category === 'certifications') {
      addressability = 'unfixable';
      reason = 'This is a qualification/certification that cannot be fabricated';
      instruction = `Cannot add "${keyword}" - this requires actual qualification`;

      processedGaps.push({
        keyword,
        category,
        priority: importanceToPriority(importance, requirement),
        requirement,
        potentialImpact: calculateImpact(importance, requirement),
        addressability,
        reason,
        evidence: null,
        targetSections: determineTargetSections(category, keyword),
        instruction,
      });
      continue;
    }

    // Step 6: Default - potential if skills/tech, unfixable otherwise
    if (category === 'skills' || category === 'technologies') {
      addressability = 'potential';
      reason = 'No direct evidence in resume, but could be added if candidate has experience';
      instruction = `Only add "${keyword}" if candidate genuinely has this skill`;
    } else {
      addressability = 'unfixable';
      reason = 'No evidence in resume and not a skill that can be easily added';
      instruction = `Cannot reliably add "${keyword}" without evidence`;
    }

    processedGaps.push({
      keyword,
      category,
      priority: importanceToPriority(importance, requirement),
      requirement,
      potentialImpact: calculateImpact(importance, requirement),
      addressability,
      reason,
      evidence: null,
      targetSections: determineTargetSections(category, keyword),
      instruction,
    });
  }

  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  processedGaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate summary
  const summary = {
    totalGaps: processedGaps.length,
    terminologyFixes: processedGaps.filter(g => g.addressability === 'terminology').length,
    potentialAdditions: processedGaps.filter(g => g.addressability === 'potential').length,
    unfixableGaps: processedGaps.filter(g => g.addressability === 'unfixable').length,
    totalPotentialImpact: processedGaps
      .filter(g => g.addressability !== 'unfixable')
      .reduce((sum, g) => sum + g.potentialImpact, 0),
  };

  return { processedGaps, summary };
}

/**
 * Filter processed gaps for a specific section.
 */
export function filterGapsForSection(
  gaps: ProcessedGap[],
  section: SectionType
): {
  terminologyFixes: ProcessedGap[];
  potentialAdditions: ProcessedGap[];
  opportunities: ProcessedGap[];
  cannotFix: ProcessedGap[];
} {
  const sectionGaps = gaps.filter(g => g.targetSections.includes(section));

  return {
    terminologyFixes: sectionGaps.filter(
      g => g.addressability === 'terminology' && g.requirement === 'required'
    ),
    potentialAdditions: sectionGaps.filter(
      g => g.addressability === 'potential' && g.requirement === 'required'
    ),
    opportunities: sectionGaps.filter(
      g => g.requirement === 'preferred' && g.addressability !== 'unfixable'
    ),
    cannotFix: sectionGaps.filter(g => g.addressability === 'unfixable'),
  };
}
