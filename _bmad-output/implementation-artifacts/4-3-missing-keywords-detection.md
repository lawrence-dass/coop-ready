# Story 4.3: Missing Keywords Detection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**, I want **to see which keywords from the job description are missing from my resume** so that **I know what to add to improve my match**.

## Acceptance Criteria

1. ✓ Analysis detects keywords from job description
2. ✓ Keywords categorized as: Present (in resume) vs Missing
3. ✓ Missing keywords sorted by importance/frequency in job description
4. ✓ User sees at least top 10 missing keywords
5. ✓ User sees which JD keywords resume already contains (validates detection)
6. ✓ If resume contains all major keywords: show "Great job! Your resume covers the key requirements"
7. ✓ Any minor missing keywords still listed even when all major keywords present
8. ✓ `scans` table updated with `keywords_found` (JSONB array)
9. ✓ `scans` table updated with `keywords_missing` (JSONB array)
10. ✓ Keyword detection respects keyword variants (e.g., "JS" = "JavaScript")

## Tasks / Subtasks

- [x] **Task 1: Add Database Columns** (AC: 8, 9)
  - [x] Create migration: add `keywords_found` (JSONB array) to `scans` table
  - [x] Create migration: add `keywords_missing` (JSONB array) to `scans` table
  - [x] Columns nullable initially (set during analysis)
  - [x] Verify RLS policies allow users to see own keyword data
  - [x] Add comments documenting keyword data structure (array of {keyword, frequency} objects)

- [x] **Task 2: Extend Analysis Prompt** (AC: 1, 2, 3, 4, 10)
  - [x] Update `lib/openai/prompts/scoring.ts` to include keyword extraction section
  - [x] Add instruction to extract keywords from JD:
    - Technical skills (languages, frameworks, tools, databases)
    - Soft skills (communication, leadership, teamwork)
    - Certifications and credentials
    - Industry-specific terms
    - Years of experience requirements
  - [x] Add instruction to match keywords against resume text
  - [x] Add instruction to detect keyword variants (e.g., "JS" matches "JavaScript")
  - [x] Prompt returns structured JSON with:
    - `keywordsFound: Array<{ keyword: string, frequency: number, variant?: string }>`
    - `keywordsMissing: Array<{ keyword: string, frequency: number, priority: 'high' | 'medium' | 'low' }>`
    - `majorKeywordsCoverage: number` (percentage of high-priority keywords found)
  - [x] Add examples of keyword extraction in prompt for consistency
  - [x] Frequency values indicate how often keyword appears in JD (for sorting)

- [x] **Task 3: Implement Keyword Parsing** (AC: 1, 2, 3, 4, 10)
  - [x] Create `lib/openai/prompts/parseKeywords.ts`
  - [x] Export `parseKeywordsResponse(response: string)` function
  - [x] Parse JSON response from OpenAI
  - [x] Validate keyword arrays are properly formatted
  - [x] Sort keywords by frequency (highest first)
  - [x] Limit missing keywords to ensure top 10+ included
  - [x] Handle malformed responses with empty arrays (fallback)
  - [x] Return structured `KeywordExtractionResult` type
  - [x] Log parsed keywords at DEBUG level

- [x] **Task 4: Update runAnalysis Action** (AC: All)
  - [x] Modify `actions/analysis.ts` to use extended prompt (with keywords)
  - [x] Parse keyword data from analysis response
  - [x] Update scan record with `keywords_found` and `keywords_missing`
  - [x] Include keyword data in returned `AnalysisResult`
  - [x] Verify database update includes all new columns
  - [x] Add keyword extraction to existing error handling

- [x] **Task 5: Create Type Definitions** (AC: All)
  - [x] Update `lib/types/analysis.ts` with keyword types
  - [x] Export `Keyword` type: `{ keyword: string, frequency: number, variant?: string }`
  - [x] Export `MissingKeyword` type: `{ keyword: string, frequency: number, priority: 'high' | 'medium' | 'low' }`
  - [x] Export `KeywordExtractionResult` type with found and missing arrays
  - [x] Export `KeywordAnalysis` type combining all keyword data

- [x] **Task 6: Validation & Keyword Variants** (AC: 10)
  - [x] Create `lib/utils/keywordVariants.ts` with common abbreviations/variants
  - [x] Support common tech abbreviations: JS/JavaScript, TS/TypeScript, API/REST API, DB/Database
  - [x] Support common skill variants: React/ReactJS, Node/NodeJS, SQL/PostgreSQL/MySQL
  - [x] Add configuration for domain-specific variants
  - [x] Document how to add new variants (future extensibility)

- [x] **Task 7: Unit Tests** (AC: All)
  - [x] Create `tests/unit/lib/openai/prompts/parseKeywords.test.ts`
  - [x] Test keyword extraction from mock OpenAI response
  - [x] Test sorting by frequency (highest first)
  - [x] Test keyword variant matching (JS matches JavaScript)
  - [x] Test missing keyword limit (at least top 10)
  - [x] Test present keywords detection
  - [x] Test majorKeywordsCoverage calculation
  - [x] Test malformed response handling (empty arrays fallback)
  - [x] Test edge case: no keywords in JD
  - [x] Test edge case: all keywords present in resume
  - [x] Test edge case: mixed present and missing keywords

- [x] **Task 8: Integration Tests** (AC: All)
  - [x] Update `tests/e2e/analysis-flow.spec.ts` with keyword checks
  - [x] Test full flow: initiate scan → get keywords found and missing
  - [x] Verify keywords are properly saved to database
  - [x] Test user can query own scan keywords
  - [x] Test keyword data structure (valid JSON arrays)
  - [x] Test filtering/sorting of keywords in results

- [x] **Task 9: Update runAnalysis Tests** (AC: All)
  - [x] Update `tests/unit/actions/analysis.test.ts` with keyword test cases
  - [x] Mock OpenAI response with keyword extraction data
  - [x] Test database columns updated with keyword arrays
  - [x] Test keyword data included in returned AnalysisResult
  - [x] Test error handling with keyword extraction failures

- [x] **Task 10: Documentation** (AC: All)
  - [x] Update `README.md` with "Keyword Detection" subsection
  - [x] Document how keyword variants work
  - [x] Explain priority levels for missing keywords (high/medium/low)
  - [x] Add example keyword extraction output to docs
  - [x] Document how to add new keyword variants

## Dev Notes

### Architecture Context

**Story Dependencies:**
- **Depends On**: Story 4.2 (ATS Score Calculation) - extends analysis prompt to include keyword extraction
- **Depends On**: Story 4.1 (OpenAI Integration) - uses OpenAI client
- **Feeds Into**: Story 4.4+ (Section Scoring, Format Detection) - keyword data informs section analysis
- **Feeds Into**: Story 4.7 (Results Page) - displays keyword lists to user

**Why This Story Third:**
- Story 4.2 established analysis prompt pattern and response parsing
- This story reuses and extends that pattern for keyword extraction
- Builds on established error handling and OpenAI client patterns
- Provides actionable feedback to users ("add these keywords to improve")

**Integration Points:**
- Extends analysis prompt from Story 4.2
- Uses same OpenAI client and retry logic from Story 4.1
- Adds new database columns to `scans` table
- Keyword data persists alongside score data

### Technical Context

**Keyword Extraction Strategy:**
The prompt instructs OpenAI to:
1. Parse job description for keywords
2. Match resume text against those keywords
3. Categorize into found vs missing
4. Sort by importance/frequency
5. Handle variants (JS = JavaScript)

**Keyword Categories to Extract:**
- **Technical Skills**: Programming languages, frameworks, databases, tools
- **Soft Skills**: Communication, leadership, teamwork, problem-solving
- **Certifications**: AWS, GCP, Azure, Kubernetes, Docker
- **Experience Markers**: Years of experience, seniority level keywords
- **Industry Terms**: Domain-specific vocabulary

**Database Schema Update:**
```sql
ALTER TABLE scans
  ADD COLUMN keywords_found JSONB,
  ADD COLUMN keywords_missing JSONB;

-- Structure example:
-- keywords_found: [
--   { keyword: "React", frequency: 3, variant: null },
--   { keyword: "TypeScript", frequency: 2, variant: "TS" }
-- ]
-- keywords_missing: [
--   { keyword: "AWS", frequency: 2, priority: "high" },
--   { keyword: "Docker", frequency: 1, priority: "medium" }
-- ]
```

**Keyword Variant Matching:**
Common variants to support:
- JS/JavaScript, TS/TypeScript
- React/ReactJS, Node/NodeJS
- SQL/PostgreSQL, DB/Database
- API/REST API, HTTP
- AWS/Amazon Web Services, GCP/Google Cloud

**Performance Considerations:**
- Keyword arrays stored as JSONB for queryability
- Frequencies enable sorting (no additional processing)
- Top 10-15 keywords displayed (balance detail vs overwhelm)
- Keyword variant matching done by OpenAI (simpler than rule-based)

### Implementation Considerations

**Prompt Engineering Update:**
The extended prompt should:
```
System: You are an expert keyword extractor for resume optimization.

User: Here's a resume and job description. Extract and categorize keywords.

Instructions:
1. Extract all important keywords from the JD:
   - Technical skills (languages, frameworks, tools, databases)
   - Soft skills
   - Certifications
   - Experience requirements

2. For each keyword, determine:
   - How many times it appears in the JD (frequency)
   - Whether it appears in the resume (present/missing)

3. Handle variants:
   - "JS" matches "JavaScript"
   - "TS" matches "TypeScript"
   - [provide more examples]

4. Return JSON with:
   {
     "keywordsFound": [...],
     "keywordsMissing": [...],
     "majorKeywordsCoverage": number
   }

Resume:
[resume text]

Job Description:
[job description text]
```

**Testing Keyword Extraction:**
Mock response should include:
- Various keyword types (technical, soft skills, etc.)
- Frequency variations (1-10+)
- Variant matches (JS matching JavaScript)
- Empty cases (no keywords in certain category)

### Previous Story Learnings

**From Story 4.2 (ATS Score Calculation):**
- Analysis prompt structure and best practices
- Response parsing and error handling patterns
- Database migration patterns
- ActionResponse<T> pattern for Server Actions
- Few-shot prompting improves consistency

**From Story 4.1 (OpenAI Integration):**
- Client timeout and retry logic
- Token logging and cost tracking
- User-friendly error messages
- Configuration error handling

### Git Intelligence

**Related Implementation Patterns:**
- Prompt templates in `lib/openai/prompts/`
- Response parsing in `lib/openai/prompts/parseAnalysis.ts`
- Type definitions in `lib/types/analysis.ts`
- Database migrations in `supabase/migrations/`
- Server Actions in `actions/analysis.ts`

**Recent Commits (Story 4.2):**
- Analysis prompt established pattern for keyword extraction
- parseAnalysis response parsing can be extended for keywords
- Database migration pattern established

### References

- [OpenAI Keyword Extraction Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Keyword Extraction Best Practices](https://platform.openai.com/docs/guides/structured-outputs)
- Story 4.2: `_bmad-output/implementation-artifacts/4-2-ats-score-calculation.md`
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-openai-integration-setup.md`
- Project Context: `_bmad-output/project-context.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

Story analysis completed 2026-01-20 23:00 UTC

### Completion Notes List

- [x] Database migration: add keywords_found and keywords_missing columns (supabase/migrations/008_add_keywords_columns.sql)
- [x] Analysis prompt extended with keyword extraction section (lib/openai/prompts/scoring.ts updated with comprehensive keyword instructions)
- [x] Keyword parsing implemented with sorting and variant matching (lib/openai/prompts/parseKeywords.ts created)
- [x] runAnalysis Server Action updated to include keyword extraction (actions/analysis.ts parses and saves keyword data)
- [x] Type definitions created for Keyword and KeywordAnalysis types (lib/types/analysis.ts extended with 5 new interfaces)
- [x] Keyword variant mapping created (lib/utils/keywordVariants.ts with 20+ common variants)
- [x] Unit tests written for keyword parsing and extraction (26 tests in parseKeywords.test.ts, 100% passing)
- [x] Integration tests verify keyword data persistence (tests/e2e/analysis-flow.spec.ts updated with keyword verification)
- [x] ActionResponse parsing updated for keyword results (keywords included in AnalysisResult return type)
- [x] Error handling includes keyword extraction failures (graceful fallback to empty arrays on parsing errors)
- [x] Documentation updated with keyword detection details (README.md includes comprehensive Keyword Detection section)
- [x] "Great job!" message logic implemented (majorKeywordsCoverage >= 90% triggers allMajorKeywordsPresent flag)
- [x] Top 10-15 missing keywords guaranteed in results (parseKeywords.ts limits to top 15, sorted by priority + frequency)
- [x] Keyword frequency used for sorting importance (found keywords sorted by frequency desc, missing by priority then frequency)
- [x] Integration ready for Story 4.4 (keyword data persisted in database, available to all future stories)

**Implementation Summary:**
Story 4.3 successfully extends the ATS analysis engine with comprehensive keyword detection. The implementation adds database columns for storing keyword data, extends the OpenAI prompt with detailed keyword extraction instructions, and creates robust parsing logic with fallback handling. Keyword variant recognition supports 20+ common abbreviations (JS=JavaScript, TS=TypeScript, etc.), and all 73 tests pass (26 for parseKeywords + 47 for analysis including 3 new keyword tests). Documentation has been updated with examples and usage guidelines. The integration is seamless and ready for consumption by Story 4.7 (Results Page UI).

### File List

**Files Created:**
- `lib/openai/prompts/parseKeywords.ts` - Keyword extraction parsing logic with sorting, validation, and fallback handling (173 lines)
- `lib/utils/keywordVariants.ts` - Keyword variant mappings with 20+ common abbreviations (120 lines)
- `tests/unit/lib/openai/prompts/parseKeywords.test.ts` - Comprehensive unit tests (26 tests, 100% passing)
- `supabase/migrations/008_add_keywords_columns.sql` - Database migration for keywords_found and keywords_missing columns

**Files Updated:**
- `lib/types/analysis.ts` - Added 5 new interfaces: Keyword, MissingKeyword, KeywordExtractionResult, KeywordAnalysis, updated AnalysisResult and ScanRecord
- `lib/openai/prompts/scoring.ts` - Extended prompt with comprehensive keyword extraction instructions and examples (~100 lines added)
- `lib/openai/index.ts` - Added keyword parsing exports (parseKeywordsResponse, toKeywordAnalysis, isValidKeywordResult)
- `actions/analysis.ts` - Integrated keyword extraction: parses keyword data, saves to database, includes in response (~30 lines modified)
- `tests/unit/actions/analysis.test.ts` - Added 3 keyword-specific test cases + updated 2 existing tests with keyword mocks
- `tests/unit/lib/openai/prompts/parseKeywords.test.ts` - Added console mocking to reduce test noise
- `tests/e2e/analysis-flow.spec.ts` - Added keyword validation to E2E test flow
- `README.md` - Added "Keyword Detection" subsection (~40 lines) with variants, priority levels, and coverage explanation
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated 4-3-missing-keywords-detection to "in-progress" (will be "review" at story completion)
- `_bmad-output/implementation-artifacts/4-3-missing-keywords-detection.md` - Marked all tasks complete, updated status to "review"



## Change Log

**2026-01-20 (Code Review)**: Fixed 3 MEDIUM issues from adversarial code review:
- M1: Added keyword exports (parseKeywordsResponse, toKeywordAnalysis, isValidKeywordResult) to lib/openai/index.ts barrel file
- M2: Removed mutable addKeywordVariants() function from keywordVariants.ts to prevent race conditions; replaced with documentation comment showing immutable pattern
- M3: Added clarifying documentation to keywordVariants.ts explaining it serves as reference for OpenAI prompt engineering
- L2: Added console mocking to parseKeywords.test.ts to reduce test output noise
- L1: Updated File List to include lib/openai/index.ts

**2026-01-20**: Story 4.3 completed - Added keyword detection to ATS analysis engine. Database migration created for keywords_found and keywords_missing columns. OpenAI prompt extended with comprehensive keyword extraction instructions supporting 20+ variants (JS=JavaScript, etc.). Created parseKeywords parsing module with sorting by priority/frequency. Integrated keyword extraction into runAnalysis Server Action. All 73 tests passing (26 new parseKeywords tests + 3 new analysis tests). Documentation updated with Keyword Detection section in README. Ready for integration with Story 4.7 (Results Page UI).
