/**
 * Job Metadata Extraction
 *
 * Extracts job title and company name from job description text using LLM.
 * Falls back to regex extraction if LLM fails.
 *
 * Uses Claude Haiku for fast, cost-efficient extraction.
 */

import { ActionResponse } from '@/types';
import { getHaikuModel } from './models';
import {
  ChatPromptTemplate,
  createJsonParser,
  invokeWithActionResponse,
} from './chains';

// 5 second timeout - this is a quick extraction task
const EXTRACTION_TIMEOUT_MS = 5000;

// Only use first 1000 chars for extraction (title/company usually at top)
const MAX_JD_LENGTH = 1000;

/**
 * Extracted job metadata
 */
export interface JobMetadata {
  jobTitle: string | null;
  companyName: string | null;
}

/**
 * LLM response structure
 */
interface ExtractionResponse {
  jobTitle: string | null;
  companyName: string | null;
}

/**
 * Prompt template for job metadata extraction
 */
const extractionPrompt = ChatPromptTemplate.fromTemplate(`Extract the job title and company name from this job description.

<job_description>
{jobDescription}
</job_description>

Rules:
- Job title: The position being hired for (e.g., "Software Engineer", "Product Manager", "Senior Data Scientist")
- Company name: The hiring company's name
- Return null if not found or unclear
- Be concise - extract just the core title/name without extra words

Return ONLY valid JSON:
{{"jobTitle": "...", "companyName": "..."}}`);

/**
 * Create LCEL chain for job metadata extraction
 */
function createExtractionChain() {
  const model = getHaikuModel({ temperature: 0, maxTokens: 200 });
  const jsonParser = createJsonParser<ExtractionResponse>();
  return extractionPrompt.pipe(model).pipe(jsonParser);
}

/**
 * Regex-based fallback extraction for job title
 */
function extractJobTitleRegex(jdContent: string): string | null {
  const header = jdContent.substring(0, 500);
  const lines = header.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) return null;

  // Look for explicit title patterns
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes('position:') ||
      lower.includes('job title:') ||
      lower.includes('role:') ||
      lower.includes('title:')
    ) {
      const match = line.match(/(?:position|job title|role|title):\s*(.+)/i);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100);
      }
    }
  }

  // Fallback: use first line if short
  const firstLine = lines[0].trim();
  if (firstLine.length > 3 && firstLine.length < 100) {
    return firstLine;
  }

  return null;
}

/**
 * Regex-based fallback extraction for company name
 */
function extractCompanyNameRegex(jdContent: string): string | null {
  const header = jdContent.substring(0, 500);

  const companyPatterns = [
    /company:\s*(.+?)(?:\n|$)/i,
    /\bat\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*\n|,|$)/,
    /\bfor\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*\n|,|$)/,
    /([A-Z][a-zA-Z0-9\s&.]+?)\s+is\s+(?:hiring|looking|seeking)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = header.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 60) {
        return company;
      }
    }
  }

  return null;
}

/**
 * Extract job title and company name from job description text
 *
 * Uses LLM extraction with regex fallback. Safe - never throws.
 *
 * @param jdContent - Full job description text
 * @returns ActionResponse with JobMetadata or error
 */
export async function extractJobMetadata(
  jdContent: string
): Promise<ActionResponse<JobMetadata>> {
  // Validation
  if (!jdContent || jdContent.trim().length === 0) {
    return {
      data: { jobTitle: null, companyName: null },
      error: null,
    };
  }

  // Truncate to first 1000 chars - title/company usually at top
  const truncatedJD =
    jdContent.length > MAX_JD_LENGTH
      ? jdContent.substring(0, MAX_JD_LENGTH)
      : jdContent;

  console.log('[SS:metadata] Extracting job metadata (' + truncatedJD.length + ' chars)');

  // Try LLM extraction first
  const chain = createExtractionChain();
  const result = await invokeWithActionResponse(
    async () => {
      const response = await chain.invoke({ jobDescription: truncatedJD });
      console.log('[SS:metadata] LLM extraction:', response);
      return response;
    },
    { timeoutMs: EXTRACTION_TIMEOUT_MS }
  );

  // If LLM succeeded, return its results
  if (result.data) {
    return {
      data: {
        jobTitle: result.data.jobTitle || null,
        companyName: result.data.companyName || null,
      },
      error: null,
    };
  }

  // LLM failed - fall back to regex extraction
  console.log('[SS:metadata] LLM failed, using regex fallback:', result.error);

  const jobTitle = extractJobTitleRegex(jdContent);
  const companyName = extractCompanyNameRegex(jdContent);

  console.log('[SS:metadata] Regex extraction:', { jobTitle, companyName });

  return {
    data: { jobTitle, companyName },
    error: null,
  };
}

/**
 * Compute a session title from job metadata
 *
 * Format: "{Job Title} - {Company}" with fallbacks
 *
 * @param metadata - Extracted job metadata
 * @returns Computed session title string
 */
export function computeTitleFromMetadata(metadata: JobMetadata): string {
  if (metadata.jobTitle && metadata.companyName) {
    return `${metadata.jobTitle} - ${metadata.companyName}`;
  }

  if (metadata.jobTitle) {
    return metadata.jobTitle;
  }

  return 'Untitled Scan';
}
