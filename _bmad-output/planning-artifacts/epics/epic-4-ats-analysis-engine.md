# Epic 4: ATS Analysis Engine

Users receive an ATS compatibility score (0-100) with detailed analysis of their resume against the job description.

## Story 4.1: OpenAI Integration Setup

As a **developer**,
I want **a configured OpenAI client with proper error handling**,
So that **the AI analysis features work reliably**.

**Acceptance Criteria:**

**Given** the OpenAI API key is configured in environment variables
**When** the application starts
**Then** the OpenAI client is initialized successfully
**And** the client can make API calls to GPT-4o-mini

**Given** an API call is made to OpenAI
**When** the response is successful
**Then** the response is parsed and returned correctly
**And** token usage is logged for cost monitoring

**Given** an API call fails due to rate limiting (429)
**When** the error is caught
**Then** the system retries with exponential backoff (max 3 retries)
**And** if all retries fail, a user-friendly error is returned

**Given** an API call fails due to network issues
**When** the error is caught
**Then** the system retries once
**And** if retry fails, returns "Analysis service temporarily unavailable"

**Given** an API call times out (> 30 seconds)
**When** the timeout is reached
**Then** the request is cancelled
**And** the user sees "Analysis is taking longer than expected. Please try again."

**Given** the OpenAI API key is invalid or missing
**When** an API call is attempted
**Then** a clear error is logged server-side
**And** the user sees "Analysis service configuration error"

**Technical Notes:**
- Create `lib/openai/client.ts` with singleton pattern
- Implement retry logic with exponential backoff
- Create `lib/openai/parseResponse.ts` for response handling
- Log all errors with context for debugging
- Use GPT-4o-mini for cost efficiency
- Set timeout to 30 seconds per request

---

## Story 4.2: ATS Score Calculation

As a **user**,
I want **to see an ATS compatibility score (0-100) for my resume**,
So that **I know how well my resume matches the job description**.

**Acceptance Criteria:**

**Given** I have submitted a resume and job description for analysis
**When** the ATS score calculation runs
**Then** I receive a score between 0 and 100
**And** the score reflects keyword match, skills alignment, and experience relevance

**Given** my resume closely matches the job description
**When** the score is calculated
**Then** I receive a high score (70-100)
**And** the score justification mentions strong keyword alignment

**Given** my resume has few matching keywords
**When** the score is calculated
**Then** I receive a lower score (below 50)
**And** the score justification mentions missing keywords

**Given** the analysis completes
**When** the score is saved
**Then** the `scans` table is updated with `ats_score` (integer)
**And** `score_justification` (text) explains the score

**Given** the AI analysis fails
**When** error handling runs
**Then** the scan status is set to "failed"
**And** the user sees an appropriate error message (FR46)

**Technical Notes:**
- Create `lib/openai/prompts/analysis.ts` with scoring prompt
- Add columns to `scans`: `ats_score`, `score_justification`
- Create `actions/analysis.ts` with `runAnalysis` action
- Prompt should consider: keyword density, skills match, experience relevance, formatting
- Score breakdown: Keywords (40%), Skills (30%), Experience (20%), Format (10%)

---

## Story 4.3: Missing Keywords Detection

As a **user**,
I want **to see which keywords from the job description are missing from my resume**,
So that **I know what to add to improve my match**.

**Acceptance Criteria:**

**Given** analysis is running on my resume and JD
**When** keyword detection completes
**Then** I see a list of important keywords from the JD
**And** keywords are categorized: Present (in my resume) vs Missing

**Given** keywords are detected
**When** I view the missing keywords list
**Then** keywords are sorted by importance/frequency in the JD
**And** I see at least the top 10 missing keywords

**Given** keywords are detected
**When** I view the present keywords list
**Then** I see which JD keywords my resume already contains
**And** this validates that relevant content was detected

**Given** my resume contains all major keywords
**When** I view the missing keywords section
**Then** I see a message "Great job! Your resume covers the key requirements"
**And** any minor missing keywords are still listed

**Given** analysis completes
**When** results are saved
**Then** the `scans` table is updated with `keywords_found` (JSON array)
**And** `keywords_missing` (JSON array) is populated

**Technical Notes:**
- Extend analysis prompt to extract and categorize keywords
- Add columns to `scans`: `keywords_found` (JSONB), `keywords_missing` (JSONB)
- Keywords should include: technical skills, soft skills, tools, certifications, industry terms
- Consider keyword variants (e.g., "JS" = "JavaScript")

---

## Story 4.4: Section-Level Score Breakdown

As a **user**,
I want **to see how each section of my resume scores**,
So that **I know which areas need the most improvement**.

**Acceptance Criteria:**

**Given** analysis has completed
**When** I view the section breakdown
**Then** I see individual scores for: Experience, Education, Skills, Projects (if applicable)
**And** each section score is 0-100

**Given** I view a section score
**When** I look at the details
**Then** I see a brief explanation of why this section scored as it did
**And** I understand what's strong and what's weak

**Given** my Experience section scores low
**When** I view the explanation
**Then** it mentions specific issues (e.g., "Missing quantified achievements", "No relevant keywords")

**Given** my Skills section scores high
**When** I view the explanation
**Then** it mentions what's working well (e.g., "Strong match for technical requirements")

**Given** analysis completes
**When** results are saved
**Then** the `scans` table is updated with `section_scores` (JSONB)
**And** format: `{ experience: { score: 75, explanation: "..." }, ... }`

**Technical Notes:**
- Extend analysis prompt to score each section individually
- Add column to `scans`: `section_scores` (JSONB)
- Sections to score: Experience, Education, Skills, Projects, Summary/Objective
- Only score sections that exist in the parsed resume

---

## Story 4.5: Experience-Level-Aware Analysis

As a **user**,
I want **the analysis to consider my experience level**,
So that **I get relevant feedback for my situation**.

**Acceptance Criteria:**

**Given** I am a "Student/Recent Graduate"
**When** analysis runs
**Then** the AI weights academic projects and education more heavily
**And** missing "years of experience" is not penalized
**And** feedback focuses on translating academic work to professional language

**Given** I am a "Career Changer"
**When** analysis runs
**Then** the AI looks for transferable skills from previous career
**And** feedback emphasizes mapping existing experience to tech terminology
**And** bootcamp/certification projects are valued appropriately

**Given** my experience level is considered
**When** I view the score justification
**Then** it references my experience level context
**And** suggestions are tailored to my situation

**Given** analysis runs
**When** the prompt is constructed
**Then** the user's experience level from their profile is included
**And** the target role is included for role-specific feedback

**Technical Notes:**
- Modify analysis prompt to accept `experienceLevel` and `targetRole` parameters
- Fetch user profile in `runAnalysis` action
- Create different prompt templates or sections for Student vs Career Changer
- Store `experience_level_context` in scan results for reference

---

## Story 4.6: Resume Format Issues Detection

As a **user**,
I want **to know if my resume has formatting problems**,
So that **I can fix structural issues that hurt my ATS score**.

**Acceptance Criteria:**

**Given** analysis runs on my resume
**When** format detection completes
**Then** I see a list of format issues (if any)
**And** issues are categorized by severity: Critical, Warning, Suggestion

**Given** my resume is longer than 1 page (for entry-level)
**When** format issues are detected
**Then** I see a warning "Resume is X pages. Consider condensing to 1 page for entry-level roles"

**Given** my resume has no clear section headers
**When** format issues are detected
**Then** I see a critical issue "ATS may not parse sections correctly. Add clear headers."

**Given** my resume includes a photo or personal info (international format)
**When** format issues are detected
**Then** I see a suggestion "Remove photo/DOB for North American applications"

**Given** my resume uses uncommon fonts or complex formatting
**When** format issues are detected
**Then** I see a warning about ATS compatibility

**Given** no format issues are found
**When** I view the format section
**Then** I see "No format issues detected" with a checkmark

**Given** analysis completes
**When** results are saved
**Then** the `scans` table is updated with `format_issues` (JSONB array)
**And** format: `[{ type: "warning", message: "...", detail: "..." }]`

**Technical Notes:**
- Analyze parsed resume structure for format issues
- Add column to `scans`: `format_issues` (JSONB)
- Check for: length, section headers, date formats, contact info presence, ATS-unfriendly elements
- Some checks can be rule-based (length), others AI-assisted (content issues)

---

## Story 4.7: Analysis Results Page

As a **user**,
I want **to view all my analysis results on a dedicated page**,
So that **I can understand my resume's strengths and weaknesses**.

**Acceptance Criteria:**

**Given** I have initiated a scan
**When** I am on the results page `/scan/[scanId]`
**Then** I see a loading state while analysis is in progress
**And** the page auto-refreshes or uses polling to check for completion

**Given** analysis is complete
**When** the results page loads
**Then** I see my ATS score prominently displayed (large number with donut chart)
**And** I see the score justification below it
**And** the design matches UX9 (donut chart visualization)

**Given** I am viewing complete results
**When** I scroll down
**Then** I see section-level score breakdown with visual indicators
**And** I see missing keywords section
**And** I see format issues section (if any)

**Given** I am viewing complete results
**When** I look at the layout
**Then** results are organized in cards per UX6
**And** each card is expandable/collapsible for detail
**And** the most important info (score) is above the fold

**Given** analysis failed
**When** I view the results page
**Then** I see an error message explaining what went wrong (FR46)
**And** I see a "Try Again" button to retry the analysis
**And** I see a "Start New Scan" button as alternative

**Given** analysis is taking longer than expected (> 15 seconds)
**When** I am waiting
**Then** I see a progress message "Analysis in progress... This usually takes 10-20 seconds"
**And** I see a skeleton loading state for the results

**Technical Notes:**
- Create `app/(dashboard)/scan/[scanId]/page.tsx`
- Create `app/(dashboard)/scan/[scanId]/loading.tsx` for loading state
- Create `components/analysis/ScoreCard.tsx` with donut chart (use recharts or similar)
- Create `components/analysis/ScoreBreakdown.tsx` for section scores
- Create `components/analysis/KeywordList.tsx` for keyword display
- Use polling or Supabase realtime to detect completion
- Implement retry logic for failed scans

---
