# Story 4.4: Section-Level Score Breakdown

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**, I want **to see how each section of my resume scores** so that **I know which areas need the most improvement**.

## Acceptance Criteria

1. ✓ Analysis completes and generates individual scores for resume sections
2. ✓ Sections scored: Experience, Education, Skills, Projects, Summary/Objective
3. ✓ Each section score is 0-100
4. ✓ Section score includes brief explanation of why it scored that way
5. ✓ Explanations highlight specific strengths (e.g., "Strong match for technical requirements")
6. ✓ Explanations highlight specific weaknesses (e.g., "Missing quantified achievements")
7. ✓ Only sections that exist in parsed resume are scored
8. ✓ `scans` table updated with `section_scores` (JSONB)
9. ✓ Format: `{ experience: { score: 75, explanation: "..." }, education: {...}, ... }`
10. ✓ Section explanations are actionable and specific to section type

## Tasks / Subtasks

- [x] **Task 1: Add Database Column** (AC: 8, 9)
  - [x]Create migration: add `section_scores` (JSONB) to `scans` table
  - [x]Column nullable initially (set during analysis)
  - [x]Verify RLS policies allow users to see own section scores
  - [x]Add comments documenting section_scores data structure
  - [x]Schema example: `{ experience: { score: 75, explanation: "..." }, skills: {...} }`

- [x] **Task 2: Detect Resume Sections** (AC: 7)
  - [x]Create `lib/utils/resumeSectionDetector.ts`
  - [x]Export `detectSections(parsedResume: ParsedResume): string[]` function
  - [x]Detect which sections exist in parsed resume data from Story 3-3
  - [x]Support sections: experience, education, skills, projects, summary/objective
  - [x]Return array of detected section names (lowercase)
  - [x]Handle variations in section naming (e.g., "Work Experience" = "experience")

- [x] **Task 3: Extend Analysis Prompt** (AC: 1, 2, 3, 4, 5, 6)
  - [x]Update `lib/openai/prompts/scoring.ts` to include section-level scoring
  - [x]Add instruction to score each section individually (0-100)
  - [x]Add instruction to generate specific explanation for each section
  - [x]Prompt includes which sections exist (from resume parser)
  - [x]For each existing section, provide:
    - `score: number` (0-100)
    - `explanation: string` (2-3 sentences with specific examples)
    - `strengths: string[]` (what's working well in this section)
    - `weaknesses: string[]` (specific issues to address)
  - [x]Scoring guidelines per section:
    - **Experience**: Relevance of roles, quantified achievements, keyword match, progression
    - **Education**: Relevance of degree, GPA (if strong), certifications, school prestige
    - **Skills**: Alignment with JD, breadth, technical depth, categorization
    - **Projects**: Relevance to target role, complexity, technical skills demonstrated
    - **Summary/Objective**: Personalization, keyword density, clarity of intent
  - [x]Add examples of good/poor section explanations to prompt

- [x] **Task 4: Implement Section Scoring Parsing** (AC: 1-10)
  - [x]Create `lib/openai/prompts/parseSectionScores.ts`
  - [x]Export `parseSectionScoresResponse(response: string): SectionScoresResult` function
  - [x]Parse JSON response from OpenAI with section scores
  - [x]Validate each section score is 0-100 (clamp if out of range)
  - [x]Ensure explanation exists for each section
  - [x]Handle missing sections (not scored if not in resume)
  - [x]Return structured `SectionScoresResult` type
  - [x]Handle malformed responses with fallback (default 50/50/50 scores)
  - [x]Log parsed section scores at DEBUG level

- [x] **Task 5: Update runAnalysis Action** (AC: All)
  - [x]Modify `actions/analysis.ts`:
    - Detect which sections exist in parsed resume
    - Pass detected sections to analysis prompt
    - Parse section scores from OpenAI response
    - Update scan record with `section_scores` JSONB
    - Include section scores in returned `AnalysisResult`
  - [x]Ensure backward compatibility (if section_scores missing, return empty object)
  - [x]Add section scores to existing error handling

- [x] **Task 6: Create Type Definitions** (AC: All)
  - [x]Update `lib/types/analysis.ts` with section types
  - [x]Export `SectionScore` type: `{ score: number, explanation: string, strengths: string[], weaknesses: string[] }`
  - [x]Export `SectionScores` type: `{ [sectionName: string]: SectionScore }`
  - [x]Export `SectionScoresResult` type with all section data
  - [x]Update `AnalysisResult` type to include sectionScores
  - [x]Update `ScanRecord` type with section_scores column

- [x] **Task 7: Unit Tests** (AC: All)
  - [x]Create `tests/unit/lib/utils/resumeSectionDetector.test.ts`
    - Test detection of each section type
    - Test multiple sections detected
    - Test only existing sections returned
    - Test section name variations (Work Experience → experience)
  - [x]Create `tests/unit/lib/openai/prompts/parseSectionScores.test.ts`
    - Test parsing section scores from OpenAI response
    - Test score boundaries (0, 50, 100)
    - Test all section types parsed correctly
    - Test malformed response handling
    - Test missing sections handled gracefully
    - Test explanation validation
  - [x]Update `tests/unit/actions/analysis.test.ts`
    - Mock OpenAI response with section scores
    - Test database update includes section_scores
    - Test section scores in returned AnalysisResult
    - Test with different section combinations

- [x] **Task 8: Integration Tests** (AC: All)
  - [x]Update `tests/e2e/analysis-flow.spec.ts`:
    - Test full flow: analysis → section scores calculated
    - Verify section scores structure in database
    - Test user can query own scan section scores
    - Test all sections present in results
  - [x]Test with resumes of different section variations

- [x] **Task 9: Documentation** (AC: All)
  - [x]Update `README.md` with "Section-Level Scoring" subsection
  - [x]Document which sections are scored
  - [x]Document scoring guidelines per section
  - [x]Explain what makes each section score high/low
  - [x]Add example section scores output
  - [x]Document how sections are detected from parsed resume

## Dev Notes

### Architecture Context

**Story Dependencies:**
- **Depends On**: Story 4.2 (ATS Score Calculation) - extends analysis prompt for section scoring
- **Depends On**: Story 4.1 (OpenAI Integration) - uses OpenAI client with retry logic
- **Depends On**: Story 3.3 (Resume Section Parsing) - uses parsed resume sections
- **Feeds Into**: Story 4.7 (Results Page) - displays section scores to user

**Why This Story Fourth:**
- Stories 4.1-4.3 established analysis patterns (prompt design, parsing, error handling)
- This story reuses those patterns for section-level analysis
- Builds on resume parsing from Epic 3 to detect which sections exist
- Section scores complement overall score (provides actionable granularity)
- Prerequisite for Stories 4.5-4.6 which refine section scoring

**Integration Points:**
- Extends analysis prompt from Stories 4.1-4.2
- Uses resume sections detected in Story 3.3
- Adds section_scores column to scans table
- Section scores work alongside keywords and overall score

### Technical Context

**Resume Section Structure** (from Story 3.3):
The parsed resume from Story 3.3 contains sections:
```typescript
interface ParsedResume {
  summary?: string          // Summary/Objective section
  experience: Experience[]  // Work experience
  education: Education[]    // Education history
  skills: Skill[]          // Skills section
  projects?: Project[]     // Projects section (optional)
  // ... other sections
}
```

**Section Detection Logic:**
```typescript
function detectSections(parsedResume: ParsedResume): string[] {
  const sections: string[] = []
  if (parsedResume.summary) sections.push('summary')
  if (parsedResume.experience?.length > 0) sections.push('experience')
  if (parsedResume.education?.length > 0) sections.push('education')
  if (parsedResume.skills?.length > 0) sections.push('skills')
  if (parsedResume.projects?.length > 0) sections.push('projects')
  return sections
}
```

**Section Scoring Guidelines:**

| Section | What to Score | Key Factors |
|---------|---------------|------------|
| Experience | Relevance of roles to JD | Keywords, quantified achievements, progression, recency |
| Education | Relevance of degree | Degree type, school prestige, GPA (if strong), relevance |
| Skills | Alignment with JD | Keyword match, breadth, technical depth, categorization |
| Projects | Relevance to target role | Complexity, technical skills, relevance, impact |
| Summary | Clarity and personalization | Keyword density, personal touch, clarity of intent |

**Database Schema Update:**
```sql
ALTER TABLE scans
  ADD COLUMN section_scores JSONB;

-- Structure example:
-- {
--   "experience": {
--     "score": 75,
--     "explanation": "Good experience relevance with 3 relevant keywords. Missing quantified achievements.",
--     "strengths": ["Relevant roles", "Good keyword match"],
--     "weaknesses": ["No quantified metrics", "Gaps in recent experience"]
--   },
--   "skills": {
--     "score": 85,
--     "explanation": "Strong technical skills section with good coverage of JD requirements.",
--     "strengths": ["Comprehensive technical skills", "Well-categorized"],
--     "weaknesses": ["Could include more soft skills"]
--   }
-- }
```

**Prompt Engineering Update:**
The extended prompt includes:
1. Resume sections detected (passed from runAnalysis)
2. Scoring guidelines for each section type
3. Few-shot examples of good/poor section explanations
4. Temperature 0.3 for consistency in scoring
5. Instruction to provide specific, actionable feedback

### Implementation Considerations

**Section Detection Timing:**
- Call `detectSections()` in runAnalysis before calling OpenAI
- Pass detected sections to prompt so it knows which sections to score
- Only score sections that exist (reduces unnecessary analysis)

**Explanation Quality:**
- Explanations should be 2-3 sentences (not too verbose)
- Must include specific examples or issues
- Should be actionable (user understands what to fix)
- Focus on resume-JD alignment

**Error Handling:**
- If section scoring fails: fallback to empty section_scores
- If specific section fails to parse: omit from results (don't fail entire analysis)
- Log parse errors for debugging

**Performance:**
- Section scoring happens in same OpenAI call as overall score and keywords (no additional API calls)
- JSONB database column enables future querying/filtering by section

### Testing Strategy

**Unit Tests Priority:**
1. Section detection (all section types, variations)
2. Section score parsing (various score combinations)
3. Database operations (insert, update, verify structure)
4. Error paths (malformed responses, missing sections)

**Integration Test Priority:**
1. Full flow: resume → sections detected → scores calculated
2. Section scores persisted correctly
3. Different resume section combinations
4. Validation of section data structure

### Previous Story Learnings

**From Story 4.3 (Missing Keywords Detection):**
- Extended prompt patterns for additional analysis
- Parsing and sorting complex response data
- Fallback handling for edge cases
- Section detection relevant (which sections have keywords)

**From Story 4.2 (ATS Score Calculation):**
- Analysis prompt structure and best practices
- Few-shot prompting improves consistency
- Response parsing and error handling patterns
- Database migration and persistence patterns

**From Story 3.3 (Resume Section Parsing):**
- Resume structure and section detection
- Parsed resume format available in analysis
- Section-based scoring more actionable than overall

### Git Intelligence

**Related Implementation Patterns:**
- Prompt extensions in `lib/openai/prompts/scoring.ts`
- Response parsing in `lib/openai/prompts/` directory
- Type definitions in `lib/types/analysis.ts`
- Database migrations in `supabase/migrations/`
- Section detection utility in `lib/utils/`

**Recent Epic 3 Commits:**
- Story 3.3 established resume parsing with section detection
- Section structure available for this analysis

### References

- Story 4.3: `_bmad-output/implementation-artifacts/4-3-missing-keywords-detection.md`
- Story 4.2: `_bmad-output/implementation-artifacts/4-2-ats-score-calculation.md`
- Story 4.1: `_bmad-output/implementation-artifacts/4-1-openai-integration-setup.md`
- Story 3.3: Resume Section Parsing (resume structure reference)
- Project Context: `_bmad-output/project-context.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

Story analysis completed 2026-01-20 23:15 UTC

### Completion Notes List

- [x] Database migration: add section_scores JSONB column (supabase/migrations/009_add_section_scores_column.sql)
- [x] Resume section detector utility created (lib/utils/resumeSectionDetector.ts with 12/12 tests passing)
- [x] Analysis prompt extended with section-level scoring (comprehensive scoring guidelines for 5 section types)
- [x] Section score parsing implemented with validation (lib/openai/prompts/parseSectionScores.ts with 20/20 tests passing)
- [x] runAnalysis Server Action updated to detect and score sections (detects sections from parsed resume before analysis)
- [x] Type definitions created for SectionScore and SectionScores (lib/types/analysis.ts with 4 new interfaces)
- [x] Unit tests for section detection and parsing (32 total tests: 12 detector + 20 parser, all passing)
- [x] Integration tests verify section scores in database (tests/e2e/analysis-flow.spec.ts updated with section validation)
- [x] Documentation updated with section-level scoring details (README.md with comprehensive section scoring section)
- [x] Error handling includes section score failures (graceful degradation with empty section scores on failure)
- [x] Section explanations are specific and actionable (prompt requires 2-3 sentences with examples)
- [x] Only existing sections scored (detectSections() determines which sections to score)
- [x] Integration ready for Story 4.5 (section scores persisted in database, available to all future stories)

**Implementation Summary:**

Story 4.4 successfully extends the ATS analysis engine with section-level scoring. The implementation:
- Detects which resume sections exist (experience, education, skills, projects, summary)
- Passes detected sections to OpenAI prompt for targeted scoring
- Parses section scores with validation (score 0-100, explanation, strengths, weaknesses)
- Persists section scores to database as JSONB
- Provides actionable, specific feedback for each section
- All 50 analysis tests passing (including 3 new section score tests)
- Build successful with no TypeScript errors
- E2E tests verify section scores in full analysis flow

The section-level scoring provides granular, actionable feedback to users, complementing the overall score and keyword detection from Stories 4.2 and 4.3.

### File List

**Files Created:**
- `lib/utils/resumeSectionDetector.ts` - Section detection from parsed resume (exports detectSections function)
- `lib/openai/prompts/parseSectionScores.ts` - Section score parsing (exports parseSectionScoresResponse + validation)
- `tests/unit/lib/utils/` - New test directory for lib/utils tests
- `tests/unit/lib/utils/resumeSectionDetector.test.ts` - Section detection tests (12 tests, 100% passing)
- `tests/unit/lib/openai/prompts/parseSectionScores.test.ts` - Section score parsing tests (20 tests, 100% passing)
- `supabase/migrations/009_add_section_scores_column.sql` - Database migration (adds section_scores JSONB column)

**Files Updated:**
- `lib/openai/prompts/scoring.ts` - Extended with section scoring instructions (+150 lines: section guidelines, examples, instructions)
- `lib/types/analysis.ts` - Added ScoredSection type + 4 new interfaces: SectionScore, SectionScores, SectionScoresResult, updated AnalysisResult + ScanRecord
- `lib/openai/index.ts` - Exported section scoring functions (parseSectionScoresResponse, isValidSectionScoresResult)
- `actions/analysis.ts` - Integrated section detection and scoring (~50 lines: detect sections, parse scores, save to DB)
- `tests/unit/actions/analysis.test.ts` - Added 3 section score test cases + setupDefaultMocks helper function
- `tests/e2e/analysis-flow.spec.ts` - Added section scores validation to E2E analysis flow
- `README.md` - Added comprehensive "Section-Level Scoring" section (~60 lines: sections scored, scoring criteria, examples)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated 4-4-section-level-score-breakdown status
- `_bmad-output/implementation-artifacts/4-4-section-level-score-breakdown.md` - Marked all tasks complete, updated status

## Change Log

**2026-01-21 (Code Review)**: Fixed 3 MEDIUM and 1 LOW issue from adversarial code review:
- M1: Removed `detectSections` re-export from lib/openai/index.ts (utility shouldn't be in OpenAI barrel)
- M2: Updated File List to document tests/unit/lib/utils/ directory creation
- M3: Moved ScoredSection type to lib/types/analysis.ts for consistency with other types; added re-export from resumeSectionDetector.ts for backward compatibility
- L1: Added console mocking to parseSectionScores.test.ts to reduce test output noise
- All 54 tests passing, build successful

**2026-01-20**: Story 4.4 completed - Added section-level scoring to ATS analysis engine. Database migration created for section_scores JSONB column. Resume section detector utility created to identify which sections exist (experience, education, skills, projects, summary). OpenAI prompt extended with comprehensive section scoring guidelines and examples. Section score parser created with validation, score clamping, and graceful fallback. Integrated section detection and scoring into runAnalysis Server Action. All 50 analysis tests passing (including 3 new section score tests). 32 new tests created (12 section detector + 20 section score parser, all passing). E2E tests verify section scores in full analysis flow. Documentation updated with comprehensive section-level scoring section in README. Build successful with no TypeScript errors. Ready for integration with Story 4.7 (Results Page UI to display section scores).

