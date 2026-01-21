/**
 * North American resume standards and validation helpers
 * Used to generate format and content removal suggestions
 */

export interface ResumeStandards {
  maxPagesByLevel: Record<string, number>;
  prohibitedFields: string[];
  sensitiveFields: string[];
  recommendedDateFormats: string[];
  commonFormatIssues: string[];
}

export const NORTH_AMERICAN_RESUME_STANDARDS: ResumeStandards = {
  maxPagesByLevel: {
    "entry-level": 1, // < 2 years experience
    "mid-level": 2, // 2-5 years
    senior: 2, // 5-10 years
    executive: 2, // > 10 years (still 2 pages recommended)
  },
  prohibitedFields: [
    "photo",
    "date_of_birth",
    "age",
    "marital_status",
    "nationality",
    "religion",
    "political_affiliation",
    "criminal_record",
    "sexual_orientation",
  ],
  sensitiveFields: [
    "visa_status",
    "work_authorization",
    "social_media_handles",
    "personal_email_if_unprofessional",
    "references_on_resume", // References should be "available upon request"
  ],
  recommendedDateFormats: [
    "MMM YYYY", // Jan 2023
    "Month Year", // January 2023
    "MM/YYYY", // 01/2023
  ],
  commonFormatIssues: [
    "Inconsistent date format (mix of 01/15/2023 and Jan 2023)",
    "Mixed bullet point styles (• - *)",
    "Inconsistent spacing between sections",
    "Multiple font sizes without clear hierarchy",
    "Lines exceeding 80 characters (hard to read)",
    "Missing white space (crowded layout)",
  ],
};

/**
 * Get max pages recommendation by experience level
 */
export function getMaxPagesRecommendation(experienceYears: number): {
  maxPages: number;
  level: string;
  reasoning: string;
} {
  if (experienceYears < 2) {
    return {
      maxPages: 1,
      level: "entry-level",
      reasoning:
        "Entry-level candidates should keep resumes to 1 page to highlight most relevant achievements",
    };
  }
  if (experienceYears < 5) {
    return {
      maxPages: 2,
      level: "mid-level",
      reasoning:
        "Mid-level candidates can use up to 2 pages but should prioritize recent, relevant experience",
    };
  }
  if (experienceYears < 10) {
    return {
      maxPages: 2,
      level: "senior",
      reasoning:
        "Senior candidates should condense to 2 pages, focusing on leadership and impact",
    };
  }
  return {
    maxPages: 2,
    level: "executive",
    reasoning:
      "Executive candidates should maintain 2-page limit, use executive summary format",
  };
}

/**
 * Check if a field should be prohibited
 */
export function isProhibitedField(fieldName: string): boolean {
  return NORTH_AMERICAN_RESUME_STANDARDS.prohibitedFields.some(
    (f) => f.toLowerCase() === fieldName.toLowerCase()
  );
}

/**
 * Check if a field is sensitive (needs context-aware suggestions)
 */
export function isSensitiveField(fieldName: string): boolean {
  return NORTH_AMERICAN_RESUME_STANDARDS.sensitiveFields.some(
    (f) => f.toLowerCase() === fieldName.toLowerCase()
  );
}

/**
 * Get formatting guidance for a field
 */
export function getFormatGuidance(
  fieldName: string
): { guidance: string; examples: string[] } | null {
  if (fieldName.toLowerCase().includes("date")) {
    return {
      guidance: "Use consistent date format throughout resume",
      examples: [
        "Jan 2023 (recommended)",
        "January 2023",
        "01/2023",
        "NOT: 01/15/2023 (too specific for duration)",
      ],
    };
  }

  if (fieldName.toLowerCase().includes("phone")) {
    return {
      guidance: "Use consistent phone formatting",
      examples: ["(123) 456-7890", "+1-123-456-7890", "123.456.7890"],
    };
  }

  if (fieldName.toLowerCase().includes("email")) {
    return {
      guidance: "Use professional email address",
      examples: [
        "firstname.lastname@domain.com (professional)",
        "NOT: partyguy@email.com (unprofessional)",
      ],
    };
  }

  return null;
}

/**
 * Classify experience by age and context
 */
export function classifyExperienceRelevance(
  yearsAgo: number,
  _targetRole: string, // Reserved for future role-specific relevance logic
  industryJumps: number
): { isRelevant: boolean; reasoning: string } {
  // Experience < 5 years is almost always relevant
  if (yearsAgo < 5) {
    return { isRelevant: true, reasoning: "Recent experience (< 5 years)" };
  }

  // 5-10 years: depends on industry continuity
  if (yearsAgo < 10) {
    if (industryJumps === 0) {
      return {
        isRelevant: true,
        reasoning: "Relevant experience in same industry",
      };
    }
    return {
      isRelevant: false,
      reasoning:
        "Older experience with industry change - consider removing unless unique skills are relevant",
    };
  }

  // > 10 years: generally not relevant unless exceptional circumstances
  return {
    isRelevant: false,
    reasoning:
      "Experience > 10 years old - consider removing to keep focus on recent achievements",
  };
}

/**
 * Analyze resume length
 */
export function analyzeResumeLength(
  wordCount: number,
  pages: number,
  experienceYears: number
): { status: string; suggestion: string | null } {
  const recommendation = getMaxPagesRecommendation(experienceYears);

  if (pages > recommendation.maxPages) {
    return {
      status: "too-long",
      suggestion: `Consider condensing to ${recommendation.maxPages} page(s). Currently ${pages} pages. ${recommendation.reasoning}`,
    };
  }

  if (pages < recommendation.maxPages && wordCount < 200) {
    return {
      status: "too-short",
      suggestion: "Resume appears sparse - consider adding more accomplishments",
    };
  }

  return {
    status: "acceptable",
    suggestion: null,
  };
}
