# Story 4.2: ATS Score Calculation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**, I want **to see an ATS compatibility score (0-100) for my resume** so that **I know how well my resume matches the job description**.

## Acceptance Criteria

1. ✓ User submits resume and job description for analysis
2. ✓ ATS score calculated between 0-100 reflecting keyword match, skills alignment, experience relevance
3. ✓ Score justification provided explaining the scoring rationale
4. ✓ High match resumes (70-100) receive high score with strong keyword alignment mentioned
5. ✓ Low match resumes (<50) receive lower score with missing keywords identified
6. ✓ Score and justification saved to `scans` table (`ats_score`, `score_justification` columns)
7. ✓ Error handling: if AI analysis fails, scan status set to "failed" with user-friendly error
8. ✓ Analysis completes within reasonable time (30s timeout from Story 4.1)
9. ✓ Token usage logged for cost tracking (from Story 4.1)
10. ✓ User receives immediate feedback on scan status

## Tasks / Subtasks

- [x] **Task 1: Create Analysis Prompts** (AC: 2, 3, 4, 5)
  - [x] Create `lib/openai/prompts/scoring.ts` with analysis prompt template
  - [x] Design prompt to extract and score: keyword density, skills match, experience relevance, format quality
  - [x] Score breakdown: Keywords (40%), Skills (30%), Experience (20%), Format (10%)
  - [x] Prompt includes resume text and job description as inputs
  - [x] Prompt instructs OpenAI to return structured JSON response with:
    - `overallScore: number` (0-100)
    - `scoreBreakdown: { keywords: number, skills: number, experience: number, format: number }`
    - `justification: string` (brief explanation of score)
    - `strengths: string[]` (what's working well)
    - `weaknesses: string[]` (areas to improve)
  - [x] Include example scores in prompt to improve consistency
  - [x] Add context about role: `experienceLevel` and `targetRole` for personalized scoring

- [x] **Task 2: Add Database Columns** (AC: 6)
  - [x] Create migration: add `ats_score` (integer, 0-100) to `scans` table
  - [x] Create migration: add `score_justification` (text) to `scans` table
  - [x] Columns nullable initially (set during analysis)
  - [x] Add indexes for querying scans by score (performance optimization)
  - [x] Verify RLS policies allow users to see own scan scores

- [x] **Task 3: Implement runAnalysis Server Action** (AC: 1, 2, 6, 8)
  - [x] Create `actions/analysis.ts` with `runAnalysis` Server Action
  - [x] Function signature: `runAnalysis(scanId: string): Promise<ActionResponse<AnalysisResult>>`
  - [x] Load scan record from database by scanId
  - [x] Verify user owns the scan (security check)
  - [x] Load resume text from `resumes.extracted_text` (updated from scans.text_content)
  - [x] Load job description from `scans.job_description`
  - [x] Load user profile to get `experienceLevel` and `targetRole`
  - [x] Create analysis prompt with resume, JD, and user context
  - [x] Call OpenAI client (from Story 4.1) with prompt
  - [x] Parse response to extract score and justification
  - [x] Update scan record with `ats_score` and `score_justification`
  - [x] Set scan status to "completed"
  - [x] Return analysis result to client
  - [x] Follow `ActionResponse<T>` pattern from project-context

- [x] **Task 4: Implement Response Parsing** (AC: 2, 3)
  - [x] Create `lib/openai/prompts/parseAnalysis.ts`
  - [x] Export `parseAnalysisResponse(response: string): AnalysisResult` function
  - [x] Parse JSON response from OpenAI
  - [x] Validate score is 0-100 (clamp if out of range)
  - [x] Extract justification, strengths, weaknesses
  - [x] Handle malformed responses with fallback scoring
  - [x] Return structured `AnalysisResult` type
  - [x] Log parsed results at DEBUG level (for debugging)

- [x] **Task 5: Error Handling & Fallbacks** (AC: 7)
  - [x] Handle OpenAI errors from Story 4.1 (rate limits, network, timeouts)
  - [x] If analysis fails:
    - Set scan status to "failed"
    - Log error with scanId and context
    - Return user-friendly error: "Analysis failed. Please try again later."
  - [x] Log all error scenarios for monitoring
  - Note: Retry button in UI deferred to Story 4.7 (Results Page)

- [x] **Task 6: Create Type Definitions** (AC: All)
  - [x] Create `lib/types/analysis.ts`
  - [x] Export `AnalysisInput` type: `{ scanId: string }`
  - [x] Export `AnalysisResult` type with score, justification, breakdown
  - [x] Export `ScoreBreakdown` type: `{ keywords: number, skills: number, experience: number, format: number }`
  - [x] Export `ScanRecord` type with all fields from scans table

- [x] **Task 7: Unit Tests** (AC: All)
  - [x] Create `tests/unit/actions/analysis.test.ts`
  - [x] Test successful analysis flow with mock OpenAI response
  - [x] Test score calculation (mock various response scores)
  - [x] Test score boundaries (0, 50, 100)
  - [x] Test high match scenario (70+ score with keyword mention)
  - [x] Test low match scenario (<50 with missing keywords)
  - [x] Test database update (verify ats_score and score_justification saved)
  - [x] Test error handling (OpenAI failure)
  - [x] Test security (user can only analyze own scans)
  - [x] Test prompt construction (verify experienceLevel and targetRole included)
  - [x] Test response parsing (malformed JSON handling)

- [x] **Task 8: Integration Tests** (AC: All)
  - [x] Create E2E test: `tests/e2e/analysis-flow.spec.ts`
  - [x] Test full flow: user initiates scan → analysis → database update
  - [x] Verify error handling shows appropriate message
  - [x] Test security (cannot analyze other user's scans)
  - [x] Test missing resume text handling
  - Note: Results page display deferred to Story 4.7, experience level variations tested via unit tests

- [x] **Task 9: Documentation** (AC: All)
  - [x] Update `README.md` with "Analysis Engine" section
  - [x] Document scoring formula (40% keywords, 30% skills, 20% exp, 10% format)
  - [x] Document error codes and recovery steps
  - [x] Update `docs/OPENAI_SETUP.md` with analysis cost estimates

## Dev Notes

### Architecture Context

**Story Dependencies:**
- **Depends On**: Story 4.1 (OpenAI Integration) - uses OpenAI client with retry logic
- **Depends On**: Epic 3 (Resume Input) - uses `text_content` and `job_description` from scans
- **Depends On**: Epic 2 (User Profile) - uses `experienceLevel` and `targetRole` for context
- **Feeds Into**: Story 4.3+ (Keyword Detection, Section Scoring) - score calculation provides foundation
- **Feeds Into**: Story 4.7 (Results Page) - displays score to user

**Why This Story Second:**
- Story 4.1 established OpenAI client and error handling patterns
- This story applies that client to primary use case (ATS scoring)
- Establishes prompt engineering patterns for Stories 4.3-4.6
- Provides core value proposition to users ("How well does my resume match?")

**Integration Points:**
- Resume text already extracted and stored in Epic 3
- Job description already captured in Epic 3
- User profile (experience level) available from Epic 2
- Error handling uses patterns from Story 4.1

### Technical Context

**Server Actions Pattern** (project-context.md:40-57):
```typescript
export async function runAnalysis(input: AnalysisInput): Promise<ActionResponse<AnalysisResult>> {
  const parsed = analysisInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }
  try {
    // Load scan, verify ownership
    const scan = await supabase
      .from('scans')
      .select('*')
      .eq('id', parsed.data.scanId)
      .single()

    if (!scan.data) {
      return { data: null, error: { message: 'Scan not found', code: 'NOT_FOUND' } }
    }

    // Verify user owns scan (from session)
    if (scan.data.user_id !== userId) {
      return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }
    }

    // Call OpenAI with prompt
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: analysisPrompt }]
    })

    const result = parseAnalysisResponse(response.choices[0].message.content)

    // Update database
    await supabase
      .from('scans')
      .update({ ats_score: result.overallScore, score_justification: result.justification })
      .eq('id', parsed.data.scanId)

    return { data: result, error: null }
  } catch (e) {
    console.error('[runAnalysis]', e)
    return { data: null, error: { message: 'Analysis failed', code: 'ANALYSIS_ERROR' } }
  }
}
```

**Database Schema Updates:**
```sql
-- Existing scans table (from Epic 3)
ALTER TABLE scans ADD COLUMN ats_score INTEGER;
ALTER TABLE scans ADD COLUMN score_justification TEXT;
CREATE INDEX idx_scans_ats_score ON scans(ats_score);

-- Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'scans';
```

**Scoring Formula Context:**
The 40-30-20-10 breakdown balances:
- **Keywords (40%)**: Most visible to ATS systems, easy to verify
- **Skills (30%)**: Shows technical capability, valued by hiring managers
- **Experience (20%)**: Demonstrates relevant background, less critical for entry-level
- **Format (10%)**: Ensures ATS can parse resume, basic table stakes

**Experience-Level Awareness:**
- For Students: Weight academic projects, certifications equally with internships
- For Career Changers: Look for transferable skills, emphasize growth narrative
- Prompt includes user's `experienceLevel` and `targetRole` for contextual scoring

### Implementation Considerations

**Prompt Engineering:**
- System prompt sets tone: "You are an expert ATS optimizer"
- User prompt includes structured format request (JSON output)
- Examples in prompt improve consistency (few-shot prompting)
- Resume and JD provided as context with clear boundaries
- Score guidance: "0-30 is poor fit, 30-50 is fair, 50-70 is good, 70+ is excellent"

**Cost Optimization:**
- Story 4.1 logging tracks token usage per request
- Estimated cost per analysis: $0.001-0.003 (GPT-4o-mini)
- At 3 free scans/month: ~$0.01/user free tier
- At 30 scans/month paid: ~$0.05/user (cost >> $5 revenue, need higher tiers or efficiency)

**Performance Considerations:**
- Analysis runs synchronously in Server Action (30s timeout from Story 4.1)
- Consider async job queue if analyses pile up (future optimization)
- Database indexes on `ats_score` and `user_id` for fast lookups
- Caching consideration: same resume+JD could be cached (implement later)

**Security:**
- Always verify user owns scan before analyzing (prevent scan hijacking)
- Never expose raw OpenAI errors to frontend
- Sanitize user inputs (resume text, JD) before sending to OpenAI (prevent prompt injection)
- Log analyses for audit trail and cost tracking

### Testing Strategy

**Unit Tests Priority:**
1. Response parsing (handle various JSON formats from OpenAI)
2. Score calculation (verify boundaries and formulas)
3. Database operations (insert, update, verify RLS)
4. Error paths (OpenAI failures, missing scans)

**Integration Test Priority:**
1. Full flow: scan creation → analysis → database update
2. User security: verify can only analyze own scans
3. Error recovery: failed analysis → retry button
4. Different user types: student vs career changer scoring differences

### Previous Story Learnings

**From Story 4.1 (OpenAI Integration):**
- Client handles retries and timeouts automatically
- Token logging provides cost insights
- User-friendly errors hide API internals
- Singleton pattern prevents multiple client instances

**From Epic 3 (Resume Input):**
- Resume text already extracted and stored in `scans.text_content`
- Job description stored in `scans.job_description`
- Scan records created when user initiates analysis
- File uploads handled through Supabase Storage

**From Epic 2 (User Profile):**
- User profile includes `experienceLevel` and `targetRole`
- Profile data loaded in authenticated actions
- User context essential for personalized feedback

### Git Intelligence

**Recent Implementation Patterns:**
- Server Actions in `actions/` directory (from Epics 1-3)
- Prompt engineering in `lib/openai/prompts/` (established in Story 4.1)
- Database migrations follow naming convention
- E2E tests use Playwright fixtures from Epic 8

**Related Code Patterns:**
- `actions/` directory has established Server Action patterns
- Database queries use Supabase client with RLS enforcement
- Type definitions centralized in `lib/types/`
- Error handling follows `ActionResponse<T>` pattern

### References

- [OpenAI Structured Output Guide](https://platform.openai.com/docs/guides/structured-outputs)
- [Prompt Engineering Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [GPT-4o-mini Model Details](https://platform.openai.com/docs/models#gpt-4-and-gpt-4-turbo)
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-openai-integration-setup.md`
- Epic 3: Resume & Job Description Input
- Epic 2: User Onboarding & Profile Management
- Project Context: `_bmad-output/project-context.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

Implementation completed 2026-01-20

### Implementation Plan

Followed TDD approach with types-first strategy:
1. Created comprehensive type definitions (AnalysisResult, ScoreBreakdown, AnalysisContext)
2. Implemented analysis prompt template with few-shot examples and context-aware scoring
3. Built response parsing with score clamping, fallback handling, and validation
4. Created database migration for ats_score and score_justification columns
5. Implemented runAnalysis Server Action with full error handling and security checks
6. Wrote 43 unit tests covering all error paths, scoring scenarios, and edge cases
7. Created E2E integration tests for full analysis flow
8. Updated documentation in README.md and OPENAI_SETUP.md

Key technical decisions:
- Scoring formula: 40% keywords, 30% skills, 20% experience, 10% format (ATS-focused)
- Few-shot prompting with examples improves scoring consistency
- Fallback scoring (50/50/50/50) prevents complete failures from malformed responses
- Context-aware prompts adapt to user experience level (student, career_changer, experienced)
- Temperature 0.3 for more deterministic scoring (consistency over creativity)
- Score validation with 15-point tolerance between overall and calculated breakdown

### Completion Notes List

- [x] Analysis prompt created with score breakdown formula (40-30-20-10 weighting)
- [x] Prompt includes experienceLevel and targetRole context for personalized scoring
- [x] Few-shot examples in prompt improve scoring consistency
- [x] Database migration: 007_add_ats_score_columns.sql created with CHECK constraints
- [x] runAnalysis Server Action implemented with full error handling
- [x] Zod validation schema created for analysis input
- [x] Response parsing handles malformed JSON gracefully with fallback scoring
- [x] Score boundaries validated (0-100 clamping with rounding)
- [x] Score validation ensures overall matches breakdown (15-point tolerance)
- [x] Database update verified with RLS security check
- [x] User ownership verification prevents scan hijacking
- [x] OpenAI retry logic (from Story 4.1) handles transient failures automatically
- [x] 43 unit tests written: 28 for parseAnalysis, 15 for runAnalysis action
- [x] All unit tests pass (100% success rate)
- [x] Integration tests created for E2E analysis flow
- [x] Documentation updated in README.md with Analysis Engine section
- [x] Cost estimates documented in OPENAI_SETUP.md ($0.001-0.003 per analysis)
- [x] Build verified successfully with no TypeScript errors
- [x] Integration ready for Story 4.3 (Keyword Detection)

### File List

**Files Created:**
- `lib/openai/prompts/scoring.ts` - ATS scoring prompt template with few-shot examples
- `lib/openai/prompts/parseAnalysis.ts` - Response parsing with score clamping and validation
- `actions/analysis.ts` - runAnalysis Server Action with full error handling
- `lib/types/analysis.ts` - Type definitions (AnalysisResult, ScoreBreakdown, AnalysisContext, etc.)
- `lib/validations/analysis.ts` - Zod validation schema for analysis input
- `tests/unit/actions/analysis.test.ts` - 15 unit tests for runAnalysis action
- `tests/unit/lib/openai/prompts/parseAnalysis.test.ts` - 28 unit tests for parsing logic
- `tests/e2e/analysis-flow.spec.ts` - E2E integration tests
- `supabase/migrations/007_add_ats_score_columns.sql` - Database migration
- `app/api/test/analysis/route.ts` - Test API endpoint for E2E tests (code review fix)

**Files Updated:**
- `README.md` - Added "Analysis Engine" section (lines 73-128)
- `docs/OPENAI_SETUP.md` - Added ATS analysis cost estimates section

**Files Verified (No Changes):**
- `supabase/migrations/006_create_scans_table.sql` - Verified RLS policies exist
- `lib/openai/client.ts` - Verified OpenAI client available for use
- `lib/openai/types.ts` - Verified TokenUsage, OpenAIResponse types exist

### Change Log

- **2026-01-20**: Code review fixes applied (Claude Opus 4.5)
  - H1 FIX: Rewrote E2E tests to use test API endpoint instead of importing Server Actions in browser context
  - M1 FIX: Invalid analysis results now return error instead of saving garbage data to database
  - M2 FIX: Added prompt injection protection with XML delimiters and security instructions
  - M3 FIX: Exported prompts from lib/openai/index.ts for consistency
  - L1 FIX: Corrected backoff timing documentation (1s, 2s, 4s not 2s, 4s, 8s)
  - Added test API endpoint: app/api/test/analysis/route.ts
  - Added unit test for validation failure scenario
  - Total tests: 44 (16 action tests + 28 parsing tests)

- **2026-01-20**: Story 4.2 implementation completed
  - Created ATS scoring prompt template with 40-30-20-10 weighting formula
  - Implemented context-aware prompts with experience level personalization
  - Built response parsing with score clamping (0-100) and fallback scoring
  - Created database migration adding ats_score and score_justification columns
  - Implemented runAnalysis Server Action with comprehensive error handling
  - Added security checks: user ownership verification, RLS policy compliance
  - Wrote 43 unit tests covering all error paths and scoring scenarios (100% pass)
  - Created E2E integration tests for analysis flow
  - Updated documentation: README.md Analysis Engine section, OPENAI_SETUP.md cost estimates
  - All 10 acceptance criteria satisfied
  - Ready for integration in Story 4.3 (Missing Keywords Detection)

