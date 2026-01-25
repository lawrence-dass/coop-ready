'use server';

import { Anthropic } from '@anthropic-ai/sdk';
import type { ActionResponse } from '@/types';
import type { Resume } from '@/types/optimization';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ParseResult {
  summary: string | null;
  skills: string | null;
  experience: string | null;
  education: string | null;
}

interface ParseResumeOptions {
  /** Original filename for metadata tracking */
  filename?: string;
  /** File size in bytes for metadata tracking */
  fileSize?: number;
}

/**
 * Parse raw resume text into structured sections using Claude LLM
 *
 * @param rawText - Extracted text from PDF/DOCX file
 * @param options - Optional metadata (filename, fileSize)
 * @returns ActionResponse<Resume> with parsed sections
 *
 * @example
 * ```typescript
 * const { data, error } = await parseResumeText(extractedText, { filename: 'resume.pdf', fileSize: 12345 });
 * if (error) {
 *   console.error(error.message);
 *   return;
 * }
 * console.log(data.summary, data.skills, data.experience, data.education);
 * ```
 */
export async function parseResumeText(
  rawText: string,
  options: ParseResumeOptions = {}
): Promise<ActionResponse<Resume>> {
  try {
    // Validate input
    if (!rawText || rawText.trim().length === 0) {
      return {
        data: null,
        error: { code: 'PARSE_ERROR', message: 'Resume text is empty' },
      };
    }

    // Call Claude to parse sections with timeout
    const response = await client.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Parse the following resume into structured sections. Identify and extract: Summary (professional summary/objective), Skills, Experience (work history), and Education. If a section is not present or empty, set it to null.

Return ONLY valid JSON in this format:
{
  "summary": "text or null",
  "skills": "text or null",
  "experience": "text or null",
  "education": "text or null"
}

<user_content>
${rawText}
</user_content>`,
          },
        ],
      },
      {
        timeout: 10000, // 10 second timeout
      }
    );

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON (handle markdown code blocks)
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7); // Remove ```json
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3); // Remove ```
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3); // Remove trailing ```
    }
    jsonStr = jsonStr.trim();

    const parsed: ParseResult = JSON.parse(jsonStr);

    // Build Resume object with metadata
    const resume: Resume = {
      rawText,
      summary: parsed.summary || undefined,
      skills: parsed.skills || undefined,
      experience: parsed.experience || undefined,
      education: parsed.education || undefined,
      filename: options.filename,
      fileSize: options.fileSize,
      uploadedAt: new Date(),
    };

    return {
      data: resume,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: null,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to parse resume sections: ${message}`,
      },
    };
  }
}
