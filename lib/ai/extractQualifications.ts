/**
 * V2.1: Qualification Extraction from JD and Resume
 *
 * Extracts structured qualification data for the Qualification Fit component:
 * - From JD: degree requirements, experience years, certification requirements
 * - From Resume: degree held, total experience years, certifications list
 *
 * Uses Haiku model for cost efficiency.
 */

import { ActionResponse } from '@/types';
import { getHaikuModel } from './models';
import {
  ChatPromptTemplate,
  createJsonParser,
  invokeWithActionResponse,
} from './chains';
import type {
  JDQualifications,
  ResumeQualifications,
  DegreeLevel,
} from '@/lib/scoring/types';
import { redactPII } from './redactPII';

const EXTRACTION_TIMEOUT_MS = 15000;

// ============================================================================
// JD Qualification Extraction
// ============================================================================

const jdQualificationPrompt = ChatPromptTemplate.fromTemplate(`You are a job posting analyst extracting qualification requirements.

<job_description>
{jobDescription}
</job_description>

Extract the following qualification requirements from this job description:

1. **Degree Requirement**:
   - level: "high_school", "associate", "bachelor", "master", or "phd" (choose highest mentioned)
   - fields: Array of acceptable fields (e.g., ["Computer Science", "related field"])
   - required: true if degree is mandatory, false if preferred/optional

2. **Experience Requirement**:
   - minYears: Minimum years required (0 if not specified)
   - maxYears: Maximum years if range given (omit if not specified)
   - required: true if experience is mandatory

3. **Certification Requirements**:
   - certifications: Array of certification names/acronyms mentioned
   - required: true if any cert is required, false if preferred

**Rules:**
- If a requirement is not mentioned, omit that field entirely
- "Bachelor's or equivalent experience" = required: false
- "3-5 years" = minYears: 3, maxYears: 5
- "5+ years" = minYears: 5
- "CS or related field" = fields: ["Computer Science", "related field"]

Return ONLY valid JSON (no markdown):
{{
  "degreeRequired": {{
    "level": "bachelor",
    "fields": ["Computer Science", "Engineering"],
    "required": true
  }},
  "experienceRequired": {{
    "minYears": 3,
    "maxYears": 5,
    "required": true
  }},
  "certificationsRequired": {{
    "certifications": ["AWS", "PMP"],
    "required": false
  }}
}}`);

interface JDQualificationResponse {
  degreeRequired?: {
    level: string;
    fields?: string[];
    required: boolean;
  };
  experienceRequired?: {
    minYears: number;
    maxYears?: number;
    required: boolean;
  };
  certificationsRequired?: {
    certifications: string[];
    required: boolean;
  };
}

function createJDQualificationChain() {
  const model = getHaikuModel({ temperature: 0, maxTokens: 1000 });
  const jsonParser = createJsonParser<JDQualificationResponse>();
  return jdQualificationPrompt.pipe(model).pipe(jsonParser);
}

/**
 * Extract qualification requirements from a job description.
 *
 * @param jobDescription - Raw job description text
 * @returns ActionResponse with structured JD qualifications
 */
export async function extractJDQualifications(
  jobDescription: string
): Promise<ActionResponse<JDQualifications>> {
  if (!jobDescription || jobDescription.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      },
    };
  }

  console.log('[SS:qual] Extracting JD qualifications...');

  // Redact PII before sending to LLM
  const { redactedText, stats } = redactPII(jobDescription);
  console.log('[SS:qual] JD PII redacted:', stats);

  const chain = createJDQualificationChain();

  return invokeWithActionResponse(async () => {
    const response = await chain.invoke({ jobDescription: redactedText });

      // Map string level to DegreeLevel type
      const mapLevel = (level: string): DegreeLevel => {
        const mapping: Record<string, DegreeLevel> = {
          high_school: 'high_school',
          associate: 'associate',
          bachelor: 'bachelor',
          master: 'master',
          phd: 'phd',
        };
        return mapping[level] || 'bachelor';
      };

      const result: JDQualifications = {};

      if (response.degreeRequired) {
        result.degreeRequired = {
          level: mapLevel(response.degreeRequired.level),
          fields: response.degreeRequired.fields,
          required: response.degreeRequired.required,
        };
      }

      if (response.experienceRequired) {
        result.experienceRequired = {
          minYears: response.experienceRequired.minYears,
          maxYears: response.experienceRequired.maxYears,
          required: response.experienceRequired.required,
        };
      }

      if (response.certificationsRequired) {
        result.certificationsRequired = {
          certifications: response.certificationsRequired.certifications,
          required: response.certificationsRequired.required,
        };
      }

      console.log('[SS:qual] JD qualifications extracted:', JSON.stringify(result));

      return result;
    },
    { timeoutMs: EXTRACTION_TIMEOUT_MS }
  );
}

// ============================================================================
// Resume Qualification Extraction
// ============================================================================

const resumeQualificationPrompt = ChatPromptTemplate.fromTemplate(`You are a resume analyst extracting candidate qualifications.

<resume_content>
{resumeContent}
</resume_content>

Extract the following from this resume:

1. **Degree**:
   - level: Highest degree earned ("high_school", "associate", "bachelor", "master", "phd")
   - field: Field of study (e.g., "Computer Science", "Business Administration")
   - If no degree mentioned, omit this field

2. **Total Experience Years**:
   - Calculate from work history date ranges
   - Count years from earliest job to latest (or present)
   - Round to nearest 0.5 year

3. **Certifications**:
   - List all certifications, licenses, or credentials mentioned
   - Include acronyms (e.g., "AWS Certified Solutions Architect", "PMP", "CPA")

**Date parsing rules:**
- "Jan 2020 - Present" = count to current date
- "2018 - 2020" = 2 years
- Overlapping jobs don't double-count

Return ONLY valid JSON (no markdown):
{{
  "degree": {{
    "level": "bachelor",
    "field": "Computer Science"
  }},
  "totalExperienceYears": 5.5,
  "certifications": ["AWS Certified Solutions Architect", "Kubernetes Admin"]
}}`);

interface ResumeQualificationResponse {
  degree?: {
    level: string;
    field: string;
  };
  totalExperienceYears: number;
  certifications: string[];
}

function createResumeQualificationChain() {
  const model = getHaikuModel({ temperature: 0, maxTokens: 1000 });
  const jsonParser = createJsonParser<ResumeQualificationResponse>();
  return resumeQualificationPrompt.pipe(model).pipe(jsonParser);
}

/**
 * Extract qualifications from a resume.
 *
 * @param resumeContent - Parsed resume text
 * @returns ActionResponse with structured resume qualifications
 */
export async function extractResumeQualifications(
  resumeContent: string
): Promise<ActionResponse<ResumeQualifications>> {
  if (!resumeContent || resumeContent.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume content is required',
      },
    };
  }

  console.log('[SS:qual] Extracting resume qualifications...');

  // Redact PII before sending to LLM
  const { redactedText, stats } = redactPII(resumeContent);
  console.log('[SS:qual] Resume PII redacted:', stats);

  const chain = createResumeQualificationChain();

  return invokeWithActionResponse(async () => {
    const response = await chain.invoke({ resumeContent: redactedText });

      // Map string level to DegreeLevel type
      const mapLevel = (level: string): DegreeLevel => {
        const mapping: Record<string, DegreeLevel> = {
          high_school: 'high_school',
          associate: 'associate',
          bachelor: 'bachelor',
          master: 'master',
          phd: 'phd',
        };
        return mapping[level] || 'bachelor';
      };

      const result: ResumeQualifications = {
        totalExperienceYears: response.totalExperienceYears || 0,
        certifications: response.certifications || [],
      };

      if (response.degree) {
        result.degree = {
          level: mapLevel(response.degree.level),
          field: response.degree.field,
        };
      }

      console.log('[SS:qual] Resume qualifications extracted:', JSON.stringify(result));

      return result;
    },
    { timeoutMs: EXTRACTION_TIMEOUT_MS }
  );
}

/**
 * Extract qualifications from both JD and resume in parallel.
 *
 * @param jobDescription - Raw job description text
 * @param resumeContent - Parsed resume text
 * @returns ActionResponse with both JD and resume qualifications
 */
export async function extractQualificationsBoth(
  jobDescription: string,
  resumeContent: string
): Promise<
  ActionResponse<{
    jdQualifications: JDQualifications;
    resumeQualifications: ResumeQualifications;
  }>
> {
  console.log('[SS:qual] Extracting qualifications from both JD and resume...');

  // Run both extractions in parallel
  const [jdResult, resumeResult] = await Promise.all([
    extractJDQualifications(jobDescription),
    extractResumeQualifications(resumeContent),
  ]);

  // Check for errors
  if (jdResult.error) {
    return {
      data: null,
      error: jdResult.error,
    };
  }

  if (resumeResult.error) {
    return {
      data: null,
      error: resumeResult.error,
    };
  }

  return {
    data: {
      jdQualifications: jdResult.data!,
      resumeQualifications: resumeResult.data!,
    },
    error: null,
  };
}
