/**
 * Education Suggestion Generation
 * Generate optimized education section suggestions
 * Phase 2: LCEL migration
 *
 * Uses Claude LLM to optimize user's education section by:
 * 1. Extracting education entries from resume
 * 2. Identifying relevant coursework for the JD
 * 3. Highlighting academic achievements and projects
 * 4. Matching degree requirements to JD
 * 5. Returning structured suggestions
 *
 * **Critical for Co-op/Internship candidates** where education is the primary credential.
 */

import { ActionResponse, OptimizationPreferences, UserContext } from '@/types';
import { EducationSuggestion } from '@/types/suggestions';
import {
  buildPreferencePrompt,
  getJobTypeVerbGuidance,
  getJobTypeFramingGuidance,
} from './preferences';
import { getSonnetModel } from './models';
import {
  ChatPromptTemplate,
  createJsonParser,
  invokeWithActionResponse,
} from './chains';
import { redactPII, restorePII } from './redactPII';
import type { SectionATSContext } from './buildSectionATSContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_EDUCATION_LENGTH = 3000;
const MAX_JD_LENGTH = 3000;
const MAX_RESUME_LENGTH = 4000;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

/**
 * Prompt template for education suggestion
 * Uses XML-wrapped user content for prompt injection defense
 */
const educationPrompt = ChatPromptTemplate.fromTemplate(`You are a resume optimization expert specializing in education sections, particularly for students and early-career professionals seeking co-op, internship, and entry-level positions.

**CRITICAL CONSTRAINT - ABSOLUTE RULE:**
You MUST NEVER create, invent, or suggest adding factual claims that don't exist in the user's original education section. This includes:
- ❌ Coursework not explicitly listed by the user
- ❌ Projects or capstone work not mentioned by the user
- ❌ Academic honors, awards, or achievements not stated by the user
- ❌ GPAs, dates, or institutions not provided by the user
- ❌ ANY content that claims the user did something they didn't list

**WHAT YOU CAN DO:**
✅ Reformat existing content for better ATS parsing
✅ Suggest moving information (e.g., "Move GPA to same line as degree")
✅ Improve phrasing of existing bullets (if user provided coursework/projects)
✅ Mark future actions as "Recommendation:" (e.g., "Recommendation: Consider obtaining AWS Cloud Practitioner certification")
✅ Formatting improvements (dates, location, structure)

**WHAT YOU CANNOT DO:**
❌ Add coursework lists unless user provided them
❌ Create project descriptions unless user mentioned projects
❌ Invent honors or achievements
❌ Add ANY new factual claims about the past

If the education section is sparse, suggest FORMATTING improvements only.
Recommendations for FUTURE actions (certifications, courses) must be clearly marked with "Recommendation:" prefix.

<user_content>
{education}
</user_content>

<job_description>
{jobDescription}
</job_description>

{resumeSection}
{atsContextSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Extract each education entry (institution, degree, dates, GPA if present)
2. Analyze JD for degree requirements and technical skills
3. ONLY suggest improvements to EXISTING content or clearly marked future recommendations
4. For each entry, suggest ONLY:
   - **Formatting improvements:** Date formats, location formatting, GPA placement (ONLY if these exist in original)
   - **Phrasing improvements:** Better wording of user's existing coursework/projects (ONLY if user listed them)
   - **Future Recommendations:** Certifications to consider obtaining (MUST start with "Recommendation:")
   - **Missing formatting details:** Location (ONLY if inferrable from institution name like "Stanford University" → "Stanford, CA")
5. Calculate point value for each suggestion (formatting = 1-3 points, recommendations = 2-5 points)
6. Provide actionable summary focused on what was improved, not what was added

**Suggestion Rules (CRITICAL):**
- Each suggestion is INDEPENDENT - base ALL suggestions on the ORIGINAL resume text provided by the user
- The "original" field MUST contain EXACT text from the user's resume, NEVER use descriptions like "No location formatting" or "Missing X"
- If the original text doesn't have something, use the actual text that exists (e.g., "DePaul University\n2020" not "No location")
- Do NOT create multiple suggestions for the same change - combine related improvements into ONE suggestion
- For location inference, the "original" should show the line WITHOUT location, "suggested" shows it WITH location
- Maximum 2-3 suggestions per entry to avoid redundancy

**Impact Tier Assignment:**
For each education suggestion, assign an impact tier:
- "critical" = Major formatting fix affecting ATS parseability
- "high" = Future certification recommendations aligned with JD
- "moderate" = Minor formatting improvements (dates, location)

Also assign a point_value for section-level calculations:
- critical = 3-4 points (Major formatting fixes only)
- high = 2-5 points (Certification recommendations for future action)
- moderate = 1-2 points (Minor formatting fixes)
- Total realistic range: 3-10 points for formatting improvements + recommendations

**Certification Recommendations (Future Actions Only):**
When suggesting certifications, these must be clearly marked as "Recommendation:" and are future actions, not current credentials:
- Cloud/AWS mentioned in JD → Recommendation: AWS Cloud Practitioner, AWS Solutions Architect Associate
- Azure mentioned in JD → Recommendation: Microsoft Azure Fundamentals (AZ-900)
- IT/Networking roles → Recommendation: CompTIA A+, CompTIA Network+, CompTIA Security+
- Web Development → Recommendation: Meta Front-End Developer, Google UX Design
- Data/Analytics → Recommendation: Google Data Analytics, IBM Data Science
- Project Management → Recommendation: CAPM (entry-level PMP), Scrum Fundamentals
- Cybersecurity → Recommendation: CompTIA Security+, ISC2 CC (Certified in Cybersecurity)
Note: These are SUGGESTIONS for future action, not claims about current credentials.

**Critical Rules:**
- NEVER fabricate coursework, projects, or achievements
- NEVER infer coursework unless user explicitly listed it
- For "original" field: use EXACT text from user's resume or "Formatting improvement needed"
- Do NOT fabricate GPAs, honors, or awards - only suggest format improvements if they exist
- Only suggest 1-3 bullets for sparse sections (formatting + recommendations only)
- For co-op/internship: If education is sparse, focus on formatting quality and future certification recommendations

**⚠️ MANDATORY - ATS Context Priority (If Provided):**
- If ATS context lists 🔴 REQUIRED qualifications/certifications, prioritize relevant certification RECOMMENDATIONS
- REQUIRED certifications have 3-6x more point impact than PREFERRED
- Focus on formatting fixes that improve ATS parseability for education entries
- Note: Education section cannot add degrees/qualifications the user doesn't have - only recommend future actions

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "education_entries": [
    {{
      "institution": "DePaul University",
      "degree": "Bachelor's Degree in Information Systems",
      "dates": "2020",
      "gpa": null,
      "original_bullets": [],
      "suggested_bullets": [
        {{
          "original": "Bachelor's Degree in Information Systems\\nDePaul University\\n2020",
          "suggested": "Bachelor's Degree in Information Systems | DePaul University, Chicago, IL | 2020",
          "keywords_incorporated": [],
          "impact": "moderate",
          "point_value": 2,
          "explanation": "Added inferred location (Chicago, IL) and pipe separators for better ATS parseability"
        }},
        {{
          "original": "User has not listed certifications or professional development",
          "suggested": "Recommendation: Consider CompTIA A+ or AWS Cloud Practitioner to complement Information Systems degree",
          "keywords_incorporated": ["AWS", "cloud"],
          "impact": "high",
          "point_value": 4,
          "explanation": "Future certification recommendation aligned with JD IT/cloud requirements"
        }}
      ]
    }}
  ],
  "matched_keywords": ["information systems"],
  "relevant_coursework": [],
  "total_point_value": 6,
  "summary": "Suggested formatting improvements (location and separators) and future certification recommendations. No content fabrication.",
  "explanation": "Education section has solid credentials. Focused on formatting optimization and future action recommendations."
}}`);

// ============================================================================
// TYPES
// ============================================================================

interface EducationLLMResponse {
  education_entries: Array<{
    institution: string;
    degree: string;
    dates: string;
    gpa?: string;
    original_bullets: string[];
    suggested_bullets: Array<{
      original: string;
      suggested: string;
      keywords_incorporated: string[];
      impact?: string;
      point_value?: number;
      explanation?: string;
    }>;
  }>;
  matched_keywords: string[];
  relevant_coursework: string[];
  total_point_value?: number;
  summary: string;
  explanation?: string;
}

// ============================================================================
// CHAIN
// ============================================================================

/**
 * Create the LCEL chain for education suggestion
 * Chain: prompt → model → jsonParser
 */
function createEducationSuggestionChain() {
  const model = getSonnetModel({ temperature: 0.3, maxTokens: 3000 });
  const jsonParser = createJsonParser<EducationLLMResponse>();

  return educationPrompt.pipe(model).pipe(jsonParser);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Detect invalid "original" field placeholders
 * Returns true if original field contains placeholder text instead of actual resume content
 */
function hasInvalidOriginalField(original: string): boolean {
  const placeholderPatterns = [
    /^No (location|coursework|projects|certifications|honors|GPA|achievements?)/i,
    /^Missing (location|coursework|details|information)/i,
    /^Add(ing)? (location|GPA|coursework)/i,
    /^Lacking /i,
    /^Include /i,
    /formatting$/i,  // "No location formatting"
    /^User has not/i,  // "User has not listed certifications"
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(original.trim())) {
      console.warn('[INVALID ORIGINAL FIELD]', {
        original,
        pattern: pattern.toString()
      });
      return true;
    }
  }

  return false;
}

/**
 * Detect fabrication patterns in suggestions
 * Returns true if suggestion appears to fabricate content
 *
 * This acts as a safety net to catch LLM hallucinations
 * that violate the anti-fabrication constraints.
 */
function detectFabrication(original: string, suggested: string): boolean {
  const fabricationSignals = [
    // Coursework fabrication
    /Relevant Coursework:.*,.*,.*,/i,  // Long course lists with multiple courses
    /Coursework: [A-Z].*[A-Z].*[A-Z]/,  // Multiple capitalized course names

    // Project fabrication
    /Capstone Project:/i,
    /Academic Project:/i,
    /Senior Project:/i,
    /Thesis:/i,
    /Developed .* (application|system|platform|tool)/i,
    /Built .* (using|with|in)/i,
    /Implemented .* (using|with|architecture)/i,
    /Created .* (application|system|website)/i,

    // Achievement fabrication
    /Dean's List/i,
    /Honor Roll/i,
    /Academic Honors?:/i,
    /Winner of/i,
    /Award for/i,
    /Hackathon (Winner|Participant|Award)/i,
    /Outstanding Student/i,
    /President's List/i,
    /Magna Cum Laude/i,
    /Summa Cum Laude/i,
    /Cum Laude/i,

    // Adding content patterns
    /^Add(ed)? (coursework|project|honor|achievement|award)/i,
  ];

  // If original mentions "No X" or "Missing X", it's likely fabrication
  const isAddingNew = /^(No|Missing|Lacking|Add|Include)/.test(original);

  // If original is fabrication-prone AND suggested contains fabrication signals
  if (isAddingNew) {
    for (const pattern of fabricationSignals) {
      if (pattern.test(suggested)) {
        console.warn('[FABRICATION DETECTED]', {
          original,
          suggested: suggested.substring(0, 100),
          pattern: pattern.toString()
        });
        return true;
      }
    }
  }

  // Check for specific fabrication keywords in suggestions
  // Allow "Recommendation:" prefix for future actions
  if (!suggested.startsWith('Recommendation:')) {
    const fabricationKeywords = [
      'Capstone Project',
      'Dean\'s List',
      'Hackathon',
      'Outstanding Student',
      'Academic Award',
      'Honor Roll',
    ];

    for (const keyword of fabricationKeywords) {
      if (suggested.includes(keyword)) {
        console.warn('[FABRICATION KEYWORD DETECTED]', { keyword, suggested: suggested.substring(0, 100) });
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate optimized education suggestion using Claude LLM
 *
 * **Features:**
 * - Extracts education entries with institution, degree, dates, GPA
 * - Identifies relevant coursework for the JD
 * - Suggests academic projects and achievements to highlight
 * - Critical for co-op/internship candidates
 * - Applies user optimization preferences
 * - Returns structured ActionResponse
 *
 * Uses LCEL chain composition for better observability and composability.
 *
 * **Security:**
 * - User content wrapped in XML tags (prompt injection defense)
 * - Server-side only (never expose API key to client)
 *
 * @param resumeEducation - User's current education section
 * @param jobDescription - Job description text
 * @param resumeContent - Full resume content for context
 * @param preferences - User's optimization preferences (optional)
 * @param userContext - User context from onboarding (optional)
 * @returns ActionResponse with suggestion or error
 */
export async function generateEducationSuggestion(
  resumeEducation: string,
  jobDescription: string,
  resumeContent?: string,
  preferences?: OptimizationPreferences | null,
  userContext?: UserContext,
  atsContext?: SectionATSContext
): Promise<ActionResponse<EducationSuggestion>> {
  // Validation
  if (!resumeEducation || resumeEducation.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume education section is required',
      },
    };
  }

  if (!jobDescription || jobDescription.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      },
    };
  }

  console.log('[SS:genEducation] Generating education suggestion');
  console.log(
    '[SS:genEducation] Input - Education:',
    resumeEducation?.length,
    'chars, JD:',
    jobDescription?.length,
    'chars'
  );
  console.log(
    '[SS:genEducation] Education preview:',
    resumeEducation?.substring(0, 200)
  );
  console.log(
    '[SS:genEducation] Preferences:',
    preferences
      ? `jobType=${preferences.jobType}, modLevel=${preferences.modificationLevel}`
      : 'none'
  );

  // Truncate very long inputs to avoid timeout
  let processedEducation =
    resumeEducation.length > MAX_EDUCATION_LENGTH
      ? resumeEducation.substring(0, MAX_EDUCATION_LENGTH)
      : resumeEducation;

  let processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  let processedResume = resumeContent
    ? resumeContent.length > MAX_RESUME_LENGTH
      ? resumeContent.substring(0, MAX_RESUME_LENGTH)
      : resumeContent
    : '';

  // Redact PII before sending to LLM
  const educationRedaction = redactPII(processedEducation);
  const jdRedaction = redactPII(processedJD);
  const resumeRedaction = processedResume
    ? redactPII(processedResume)
    : {
        redactedText: '',
        redactionMap: new Map(),
        stats: { emails: 0, phones: 0, urls: 0, addresses: 0 },
      };

  processedEducation = educationRedaction.redactedText;
  processedJD = jdRedaction.redactedText;
  processedResume = resumeRedaction.redactedText;

  console.log('[SS:genEducation] PII redacted:', {
    education: educationRedaction.stats,
    jd: jdRedaction.stats,
    resume: resumeRedaction.stats,
  });

  // Build conditional prompt sections
  const resumeSection = processedResume
    ? `<full_resume_context>\n${processedResume}\n</full_resume_context>\n`
    : '';

  // Build job-type-specific guidance for education section
  const jobTypeGuidance = preferences
    ? `${getJobTypeVerbGuidance(preferences.jobType)}\n\n${getJobTypeFramingGuidance(preferences.jobType, 'education', true)}\n\n`
    : '';

  const preferenceSection = preferences
    ? `\n${buildPreferencePrompt(preferences, userContext)}\n`
    : '';

  // Build ATS context section if provided
  const atsContextSection = atsContext
    ? `<ats_analysis_context>\n${atsContext.promptContext}\n</ats_analysis_context>\n\n`
    : '';

  if (atsContext) {
    console.log('[SS:genEducation] ATS context provided:', {
      terminologyFixes: atsContext.terminologyFixes.length,
      potentialAdditions: atsContext.potentialAdditions.length,
      opportunities: atsContext.opportunities.length,
    });
  }

  // Log the prompt sections being used
  console.log('[SS:genEducation] Building prompt with:');
  console.log(
    '[SS:genEducation] - jobTypeGuidance length:',
    jobTypeGuidance.length,
    'chars'
  );
  console.log(
    '[SS:genEducation] - preferenceSection length:',
    preferenceSection.length,
    'chars'
  );
  console.log(
    '[SS:genEducation] - resumeSection length:',
    resumeSection.length,
    'chars'
  );

  // Create and invoke LCEL chain
  const chain = createEducationSuggestionChain();

  const result = await invokeWithActionResponse(async () => {
    console.log('[SS:genEducation] Invoking LLM chain...');
    const parsed = await chain.invoke({
      education: processedEducation,
      jobDescription: processedJD,
      resumeSection,
      atsContextSection,
      jobTypeGuidance,
      preferenceSection,
    });

      console.log('[SS:genEducation] Raw LLM response:', JSON.stringify(parsed, null, 2).substring(0, 1000));

      // Validate structure
      if (!parsed.education_entries || !Array.isArray(parsed.education_entries)) {
        throw new Error('Invalid education_entries structure from LLM');
      }

      if (!parsed.summary || typeof parsed.summary !== 'string') {
        throw new Error('Invalid summary structure from LLM');
      }

      // Validate each entry has required fields
      for (const entry of parsed.education_entries) {
        if (!entry.institution || !entry.degree || !entry.dates) {
          throw new Error('Invalid education entry structure from LLM');
        }

        if (!Array.isArray(entry.suggested_bullets)) {
          throw new Error('Invalid suggested_bullets structure from LLM');
        }
      }

      // Normalize education entries
      const validImpactTiers = ['critical', 'high', 'moderate'];
      const normalizedEntries = parsed.education_entries.map((entry) => ({
        // Restore PII in institution/degree/dates
        institution: restorePII(
          String(entry.institution || ''),
          educationRedaction.redactionMap
        ),
        degree: restorePII(
          String(entry.degree || ''),
          educationRedaction.redactionMap
        ),
        dates: restorePII(
          String(entry.dates || ''),
          educationRedaction.redactionMap
        ),
        gpa: entry.gpa ? String(entry.gpa) : undefined,
        original_bullets: Array.isArray(entry.original_bullets)
          ? entry.original_bullets
          : [],
        suggested_bullets: (entry.suggested_bullets || [])
          .filter((bullet) => {
            // CRITICAL: Reject fabrications
            if (detectFabrication(bullet.original, bullet.suggested)) {
              console.error('[FABRICATION REJECTED]', {
                original: bullet.original,
                suggested: bullet.suggested.substring(0, 100),
              });
              return false; // Filter out fabricated suggestions
            }

            // QUALITY: Reject invalid "original" field placeholders
            if (hasInvalidOriginalField(bullet.original)) {
              console.error('[INVALID ORIGINAL FIELD REJECTED]', {
                original: bullet.original,
                suggested: bullet.suggested.substring(0, 100),
              });
              return false; // Filter out suggestions with placeholder original text
            }

            return true;
          })
          .map((bullet) => {
            const pointValue = bullet.point_value;
            // Validate point_value if present
            const validPointValue =
              typeof pointValue === 'number' &&
              pointValue >= 0 &&
              pointValue <= 100
                ? pointValue
                : undefined;

            // Validate impact tier if present
            const validImpact =
              bullet.impact && validImpactTiers.includes(bullet.impact)
                ? (bullet.impact as 'critical' | 'high' | 'moderate')
                : undefined;

            // Handle explanation field (graceful fallback)
            let explanation: string | undefined = undefined;
            if (bullet.explanation !== undefined && bullet.explanation !== null) {
              if (typeof bullet.explanation === 'string') {
                // Truncate if too long (max 500 chars)
                explanation =
                  bullet.explanation.length > 500
                    ? bullet.explanation.substring(0, 497) + '...'
                    : bullet.explanation;

                // Restore PII in explanation
                explanation = restorePII(explanation, jdRedaction.redactionMap);
              }
            }

            return {
              original: restorePII(
                String(bullet.original || ''),
                educationRedaction.redactionMap
              ),
              suggested: restorePII(
                String(bullet.suggested || ''),
                educationRedaction.redactionMap
              ),
              keywords_incorporated: Array.isArray(bullet.keywords_incorporated)
                ? bullet.keywords_incorporated
                : [],
              impact: validImpact,
              point_value: validPointValue,
              explanation: explanation,
            };
          }),
      }));

      // Validate total_point_value if present
      const totalPointValue =
        typeof parsed.total_point_value === 'number' &&
        parsed.total_point_value >= 0
          ? parsed.total_point_value
          : undefined;

      if (parsed.total_point_value !== undefined && totalPointValue === undefined) {
        console.warn('[SS:genEducation] Invalid total_point_value from LLM, ignoring:', parsed.total_point_value);
      }

      // Handle explanation field (graceful fallback)
      let explanation: string | undefined = undefined;
      if (parsed.explanation !== undefined && parsed.explanation !== null) {
        if (typeof parsed.explanation === 'string') {
          // Truncate if too long (max 500 chars)
          explanation =
            parsed.explanation.length > 500
              ? parsed.explanation.substring(0, 497) + '...'
              : parsed.explanation;

          // Validate explanation quality (log warning if generic)
          const genericPhrases = [
            'improves score',
            'helps ats',
            'better ranking',
            'increases match',
          ];
          const isGeneric = genericPhrases.some((phrase) =>
            explanation!.toLowerCase().includes(phrase)
          );
          if (
            isGeneric &&
            !explanation.match(
              /[A-Z][a-z]+ (requirement|coursework|degree|experience)/i
            )
          ) {
            console.warn(
              '[SS:genEducation] Generic explanation detected (missing specific JD keywords):',
              explanation
            );
          }

          // Restore PII in explanation
          explanation = restorePII(explanation, jdRedaction.redactionMap);
        }
      }

      // Restore PII in summary
      const restoredSummary = restorePII(
        parsed.summary,
        educationRedaction.redactionMap
      );

      const bulletCount = normalizedEntries.reduce(
        (count, entry) => count + entry.suggested_bullets.length,
        0
      );
      console.log(
        '[SS:genEducation] Education generated:',
        normalizedEntries.length,
        'entries,',
        bulletCount,
        'suggestions, total_point_value:',
        totalPointValue
      );

      return {
        original: resumeEducation, // Return full original, not truncated
        education_entries: normalizedEntries,
        matched_keywords: Array.isArray(parsed.matched_keywords)
          ? parsed.matched_keywords
          : [],
        relevant_coursework: Array.isArray(parsed.relevant_coursework)
          ? parsed.relevant_coursework
          : [],
        total_point_value: totalPointValue,
        summary: restoredSummary,
        explanation: explanation,
      };
    },
    { errorMessage: 'Failed to generate education suggestion' }
  );

  return result;
}
