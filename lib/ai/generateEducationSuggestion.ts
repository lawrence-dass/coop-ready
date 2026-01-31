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
import { buildPreferencePrompt, getJobTypeVerbGuidance, getJobTypeFramingGuidance } from './preferences';
import { getSonnetModel } from './models';
import { ChatPromptTemplate, createJsonParser, invokeWithActionResponse } from './chains';

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

Your task is to ENHANCE and EXPAND a sparse education section by:
1. Adding relevant coursework based on degree program and job requirements
2. Suggesting academic projects and achievements to highlight
3. Adding missing details (location, GPA prompt, graduation formatting)
4. Making education a STRONG asset for the application

**CRITICAL:** Many students have sparse education sections with just degree/institution/date. Your job is to suggest ADDING valuable content, not just optimizing existing content.

<user_content>
{education}
</user_content>

<job_description>
{jobDescription}
</job_description>

{resumeSection}
{jobTypeGuidance}
{preferenceSection}
**Instructions:**
1. Extract each education entry (institution, degree, dates, GPA if present)
2. Analyze JD for degree requirements, technical skills, and coursework needs
3. **ALWAYS generate at least 2-4 suggested bullets per entry**, even if original is sparse
4. For each entry, suggest bullets that ADD:
   - **Relevant Coursework:** 4-6 specific courses matching JD (e.g., "Relevant Coursework: Data Structures, Database Systems, Network Administration, Software Development")
   - **Academic Projects:** Project description with technologies/skills from JD (e.g., "Capstone Project: Developed [type of application] using [relevant technologies]")
   - **Certifications:** Recommend relevant certifications based on JD requirements and degree (e.g., "Recommended Certifications: AWS Cloud Practitioner, CompTIA A+")
   - **GPA/Honors:** If GPA not shown, suggest "Add GPA if 3.5+ (strengthens entry-level candidacy)"
   - **Location:** Add city, state if missing (e.g., "Denver, CO")
   - **Graduation Date:** Format consistently (e.g., "Expected May 2024" or "Graduated: May 2021")
5. Calculate point value for each suggestion
6. Provide actionable summary

**Impact Tier Assignment:**
For each education suggestion, assign an impact tier:
- "critical" = Core coursework or academic projects directly matching JD requirements
- "high" = Certification recommendations or strong relevant additions
- "moderate" = Formatting fixes, location, or minor enhancements

Also assign a point_value for section-level calculations:
- critical = 8-12 points (Relevant Coursework, major Academic Projects)
- high = 4-7 points (Certification recommendations, GPA/honors)
- moderate = 1-3 points (Location/formatting fixes)
- Total realistic range: 18-40 points for enhanced education section

**Coursework Inference by Degree:**
- Information Technology → Database Management, Network Administration, Systems Analysis, IT Project Management, Web Development, Programming (Java/Python), Cybersecurity Fundamentals
- Computer Science → Data Structures, Algorithms, Database Systems, Operating Systems, Software Engineering, Computer Networks
- Software Engineering → Software Design, Agile Methodologies, Testing & QA, System Architecture, DevOps Practices
- Business/MIS → Business Analytics, Database Management, Systems Analysis, Project Management, Business Intelligence
- Engineering (General) → Calculus, Physics, Engineering Design, Technical Communication, Statistics

**Certification Recommendations by Degree/JD:**
- Cloud/AWS mentioned in JD → AWS Cloud Practitioner, AWS Solutions Architect Associate
- Azure mentioned in JD → Microsoft Azure Fundamentals (AZ-900)
- IT/Networking degree → CompTIA A+, CompTIA Network+, CompTIA Security+
- Web Development → Meta Front-End Developer, Google UX Design
- Data/Analytics → Google Data Analytics, IBM Data Science
- Project Management → CAPM (entry-level PMP), Scrum Fundamentals
- Cybersecurity → CompTIA Security+, ISC2 CC (Certified in Cybersecurity)
- General Tech → GitHub Foundations, Google IT Support Professional
Note: Many certifications are free/discounted for students. Recommend based on JD keywords.

**Critical Rules:**
- ALWAYS suggest at least 2 bullets, even for sparse input
- Infer coursework from degree program - these are standard curriculum courses
- For "original" field: use descriptive text like "No coursework listed" or "Missing relevant details"
- Do NOT fabricate GPAs or specific grades - suggest adding if strong
- Be specific with course names (not just "programming courses")
- For co-op/internship: education is PRIMARY credential - maximize impact

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{
  "education_entries": [
    {{
      "institution": "University of Colorado Denver",
      "degree": "Bachelor of Science in Information Technology",
      "dates": "2021",
      "gpa": null,
      "original_bullets": [],
      "suggested_bullets": [
        {{
          "original": "No relevant coursework listed",
          "suggested": "Relevant Coursework: Database Management, Network Administration, Systems Analysis, Web Development, IT Project Management, Programming",
          "keywords_incorporated": ["database", "network", "systems", "programming"],
          "impact": "critical",
          "point_value": 10,
          "explanation": "Adding relevant coursework demonstrates technical foundation matching JD requirements"
        }},
        {{
          "original": "No academic projects listed",
          "suggested": "Capstone Project: Designed and implemented [project type] demonstrating skills in [relevant technologies from JD]",
          "keywords_incorporated": ["project management", "implementation"],
          "impact": "critical",
          "point_value": 6,
          "explanation": "Academic projects show practical application of skills for entry-level roles"
        }},
        {{
          "original": "No certifications listed",
          "suggested": "Recommended Certifications: AWS Cloud Practitioner, CompTIA A+ (aligns with JD requirements for cloud and IT fundamentals)",
          "keywords_incorporated": ["AWS", "cloud", "IT"],
          "impact": "high",
          "point_value": 4,
          "explanation": "Industry certifications validate skills beyond coursework and directly match JD keywords"
        }},
        {{
          "original": "GPA not displayed",
          "suggested": "Add GPA if 3.5+ (e.g., GPA: 3.X/4.0) - strengthens candidacy for entry-level positions",
          "keywords_incorporated": [],
          "impact": "high",
          "point_value": 4,
          "explanation": "Strong GPA validates academic performance for employers evaluating entry-level candidates"
        }},
        {{
          "original": "Location not specified",
          "suggested": "Add location: Denver, CO",
          "keywords_incorporated": [],
          "impact": "moderate",
          "point_value": 1,
          "explanation": "Location helps recruiters assess local candidates and reduces relocation concerns"
        }}
      ]
    }}
  ],
  "matched_keywords": ["database", "network", "IT", "programming", "AWS", "cloud"],
  "relevant_coursework": ["Database Management", "Network Administration", "Systems Analysis", "Web Development"],
  "total_point_value": 25,
  "summary": "Enhanced sparse education section with relevant coursework, capstone project, certification recommendations, and formatting improvements. Added 5 ATS-optimized elements.",
  "explanation": "For entry-level positions, education section is primary credential. Adding specific coursework and certification recommendations matching JD requirements significantly improves ATS score and recruiter engagement."
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
  userContext?: UserContext
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
  console.log('[SS:genEducation] Input - Education:', resumeEducation?.length, 'chars, JD:', jobDescription?.length, 'chars');
  console.log('[SS:genEducation] Education preview:', resumeEducation?.substring(0, 200));
  console.log('[SS:genEducation] Preferences:', preferences ? `jobType=${preferences.jobType}, modLevel=${preferences.modificationLevel}` : 'none');

  // Truncate very long inputs to avoid timeout
  const processedEducation =
    resumeEducation.length > MAX_EDUCATION_LENGTH
      ? resumeEducation.substring(0, MAX_EDUCATION_LENGTH)
      : resumeEducation;

  const processedJD =
    jobDescription.length > MAX_JD_LENGTH
      ? jobDescription.substring(0, MAX_JD_LENGTH)
      : jobDescription;

  const processedResume = resumeContent
    ? resumeContent.length > MAX_RESUME_LENGTH
      ? resumeContent.substring(0, MAX_RESUME_LENGTH)
      : resumeContent
    : '';

  // Build conditional prompt sections
  const resumeSection = processedResume
    ? `<full_resume_context>\n${processedResume}\n</full_resume_context>\n`
    : '';

  // Build job-type-specific guidance for education section
  const jobTypeGuidance = preferences
    ? `${getJobTypeVerbGuidance(preferences.jobType)}\n\n${getJobTypeFramingGuidance(preferences.jobType, 'education', true)}\n\n`
    : '';

  const preferenceSection = preferences ? `\n${buildPreferencePrompt(preferences, userContext)}\n` : '';

  // Log the prompt sections being used
  console.log('[SS:genEducation] Building prompt with:');
  console.log('[SS:genEducation] - jobTypeGuidance length:', jobTypeGuidance.length, 'chars');
  console.log('[SS:genEducation] - preferenceSection length:', preferenceSection.length, 'chars');
  console.log('[SS:genEducation] - resumeSection length:', resumeSection.length, 'chars');

  // Create and invoke LCEL chain
  const chain = createEducationSuggestionChain();

  const result = await invokeWithActionResponse(
    async () => {
      console.log('[SS:genEducation] Invoking LLM chain...');
      const parsed = await chain.invoke({
        education: processedEducation,
        jobDescription: processedJD,
        resumeSection,
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
        institution: String(entry.institution || ''),
        degree: String(entry.degree || ''),
        dates: String(entry.dates || ''),
        gpa: entry.gpa ? String(entry.gpa) : undefined,
        original_bullets: Array.isArray(entry.original_bullets) ? entry.original_bullets : [],
        suggested_bullets: (entry.suggested_bullets || []).map((bullet) => {
          const pointValue = bullet.point_value;
          // Validate point_value if present
          const validPointValue =
            typeof pointValue === 'number' && pointValue >= 0 && pointValue <= 100
              ? pointValue
              : undefined;

          // Validate impact tier if present
          const validImpact = bullet.impact && validImpactTiers.includes(bullet.impact)
            ? bullet.impact as 'critical' | 'high' | 'moderate'
            : undefined;

          // Handle explanation field (graceful fallback)
          let explanation: string | undefined = undefined;
          if (bullet.explanation !== undefined && bullet.explanation !== null) {
            if (typeof bullet.explanation === 'string') {
              // Truncate if too long (max 500 chars)
              explanation = bullet.explanation.length > 500
                ? bullet.explanation.substring(0, 497) + '...'
                : bullet.explanation;
            }
          }

          return {
            original: String(bullet.original || ''),
            suggested: String(bullet.suggested || ''),
            keywords_incorporated: Array.isArray(bullet.keywords_incorporated) ? bullet.keywords_incorporated : [],
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
          explanation = parsed.explanation.length > 500
            ? parsed.explanation.substring(0, 497) + '...'
            : parsed.explanation;

          // Validate explanation quality (log warning if generic)
          const genericPhrases = ['improves score', 'helps ats', 'better ranking', 'increases match'];
          const isGeneric = genericPhrases.some(phrase => explanation!.toLowerCase().includes(phrase));
          if (isGeneric && !explanation.match(/[A-Z][a-z]+ (requirement|coursework|degree|experience)/i)) {
            console.warn('[SS:genEducation] Generic explanation detected (missing specific JD keywords):', explanation);
          }
        }
      }

      const bulletCount = normalizedEntries.reduce((count, entry) =>
        count + entry.suggested_bullets.length, 0);
      console.log('[SS:genEducation] Education generated:', normalizedEntries.length, 'entries,', bulletCount, 'suggestions, total_point_value:', totalPointValue);

      return {
        original: resumeEducation, // Return full original, not truncated
        education_entries: normalizedEntries,
        matched_keywords: Array.isArray(parsed.matched_keywords) ? parsed.matched_keywords : [],
        relevant_coursework: Array.isArray(parsed.relevant_coursework) ? parsed.relevant_coursework : [],
        total_point_value: totalPointValue,
        summary: parsed.summary,
        explanation: explanation,
      };
    },
    { errorMessage: 'Failed to generate education suggestion' }
  );

  return result;
}
