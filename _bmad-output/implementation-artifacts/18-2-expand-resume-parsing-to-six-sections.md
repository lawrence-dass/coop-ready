# Story 18.2: Expand Resume Parsing to 6 Sections

Status: done

## Change Log
- **2026-02-06**: Story implementation complete - Expanded resume parsing from 4 to 6 sections (Projects + Certifications). Updated LLM prompt with heading disambiguation rules, added PII restoration for new sections, updated all downstream display helpers, and added comprehensive test coverage (14 tests passing). All acceptance criteria satisfied.

## Story

As a resume optimizer user,
I want the system to extract Projects and Certifications sections from my resume alongside the existing 4 sections,
so that the optimizer can analyze and generate suggestions for all 6 resume sections.

## Acceptance Criteria

1. `ParseResult` interface includes `projects: string | null` and `certifications: string | null`
2. LLM prompt instructs Claude to extract 6 sections, recognizing common headings for each
3. "Project Experience" heading parses into `projects` (NOT `experience`)
4. "Awards & Certifications", "Honors", "Licenses" headings parse into `certifications`
5. Resumes without projects/certifications return `null` for those fields (no regression)
6. `Resume` interface in `types/optimization.ts` includes `projects?: string` and `certifications?: string`
7. `ResumeSection` union type includes `'projects'` and `'certifications'`
8. `ATSScoreV2Input.parsedResume` includes `projects?` and `certifications?` fields
9. Existing 4-section resumes parse identically to before (backward compatibility)
10. PII redaction/restoration applies to all 6 sections
11. `formatParsedSections()` in hooks shows Projects and Certifications when present
12. Unit tests cover 6-section parsing, 4-section backward compat, and heading disambiguation

## Tasks / Subtasks

- [x] Task 1: Expand type definitions (AC: #1, #6, #7, #8)
  - [x] 1.1 Add `projects: string | null` and `certifications: string | null` to `ParseResult` interface in `/actions/parseResumeText.ts:12-17`
  - [x] 1.2 Add `projects?: string` and `certifications?: string` to `Resume` interface in `/types/optimization.ts:26-50`
  - [x] 1.3 Expand `ResumeSection` union in `/types/optimization.ts:274` to include `'projects' | 'certifications'`
  - [x] 1.4 Add `projects?: string` and `certifications?: string` to `ATSScoreV2Input.parsedResume` in `/lib/scoring/types.ts:566-571`

- [x] Task 2: Update LLM prompt and response handling (AC: #2, #3, #4, #5, #10)
  - [x] 2.1 Update the LLM prompt in `/actions/parseResumeText.ts:69-81` to instruct 6-section extraction with heading recognition
  - [x] 2.2 Update JSON format in prompt to include `"projects"` and `"certifications"` fields
  - [x] 2.3 Add explicit disambiguation rule: "Project Experience" → `projects` (NOT `experience`)
  - [x] 2.4 Add heading recognition list for certifications: "Certifications", "Awards", "Awards & Certifications", "Licenses", "Honors"
  - [x] 2.5 Add PII restore calls for `projects` and `certifications` at `/actions/parseResumeText.ts:118-121`
  - [x] 2.6 Add `projects` and `certifications` to Resume object construction at `/actions/parseResumeText.ts:124-133`
  - [x] 2.7 Update log statement at line 110-115 to include `projects` and `certifications` booleans

- [x] Task 3: Update downstream display helpers (AC: #11)
  - [x] 3.1 Update `formatParsedSections()` in `/hooks/useResumeExtraction.ts:27-37` to include Projects and Certifications
  - [x] 3.2 Update section list in `/hooks/useResumeParser.ts:70-75` to include Projects and Certifications

- [x] Task 4: Update and add unit tests (AC: #9, #12)
  - [x] 4.1 Update existing test "should parse resume with all sections present" in `/tests/unit/actions/parseResumeText.test.ts` to return 6 fields from mock (projects + certifications as null to verify backward compat)
  - [x] 4.2 Add test: "should parse resume with all 6 sections" - mock returns all 6 with content
  - [x] 4.3 Add test: "should handle projects section with null certifications" - verify mixed presence
  - [x] 4.4 Add test: "should include projects and certifications in prompt" - verify prompt content
  - [x] 4.5 Add test: "should set projects and certifications to undefined when null" - backward compat
  - [x] 4.6 Verify all existing tests still pass unchanged (only mock responses may need `projects: null, certifications: null` additions)

## Dev Notes

### Prompt Update Guidance

The current prompt at `/actions/parseResumeText.ts:69-81` sends:
```
Parse the following resume into structured sections. Identify and extract: Summary, Skills, Experience, and Education.
```

Update to:
```
Parse the following resume into structured sections. Identify and extract these 6 sections:
- Summary: Professional summary or objective statement
- Skills: Technical and soft skills listing
- Experience: Work history and employment
- Education: Degrees, institutions, dates
- Projects: Technical projects, academic projects, "Project Experience" (NOT work experience - these have project titles + technologies but NO company names)
- Certifications: Certifications, awards, honors, licenses

IMPORTANT: "Project Experience" or "Technical Projects" entries that list project titles with technologies should go in "projects", NOT "experience". Work experience with company names goes in "experience".

If a section is not present or empty, set it to null.
```

Update JSON format to:
```json
{
  "summary": "text or null",
  "skills": "text or null",
  "experience": "text or null",
  "education": "text or null",
  "projects": "text or null",
  "certifications": "text or null"
}
```

### Files to Modify (with exact locations)

| File | What to Change | Lines |
|------|----------------|-------|
| `/actions/parseResumeText.ts` | Add `projects`, `certifications` to `ParseResult`; update prompt; add PII restore; update Resume construction + logs | 12-17, 69-81, 110-115, 118-133 |
| `/types/optimization.ts` | Add `projects?`, `certifications?` to `Resume`; expand `ResumeSection` | 26-50, 274 |
| `/lib/scoring/types.ts` | Add `projects?`, `certifications?` to `ATSScoreV2Input.parsedResume` | 566-571 |
| `/hooks/useResumeExtraction.ts` | Add Projects/Certifications to `formatParsedSections()` | 27-37 |
| `/hooks/useResumeParser.ts` | Add Projects/Certifications to section list in toast | 70-75 |
| `/tests/unit/actions/parseResumeText.test.ts` | Update existing mocks, add new 6-section tests | various |

### Files to NOT Modify (out of scope)

- `Suggestion.section` union (`types/optimization.ts:128`) - stays 4 values (Story 18.5 adds projects)
- `SuggestionFeedback.sectionType` (`types/optimization.ts:177`) - stays 4 values
- `SuggestionSet` (`types/optimization.ts:151-156`) - stays 4 sections
- `calculateSectionScore()` (`lib/scoring/sectionScore.ts:194`) - Story 18.4 handles scoring changes
- `lib/ai/calculateATSScore.ts` - passes `parsedResume` through, new fields are optional and harmless

### Backward Compatibility Rules

- All new fields are OPTIONAL (`?` in interfaces, `| null` in ParseResult)
- Existing 4-section resumes: `projects` and `certifications` will be `null` from LLM → `undefined` in Resume
- `calculateSectionScore()` only reads `summary`, `skills`, `experience` - won't break
- `calculateATSScoreV2()` passes `parsedResume` through - optional fields are ignored
- Existing test mocks returning 4 fields will continue to work since new fields default to undefined

### Architecture Compliance

- **ActionResponse Pattern**: `parseResumeText` already returns `ActionResponse<Resume>` - no change needed
- **File Location**: Parser stays in `/actions/` (server action, uses LLM with 10s timeout)
- **Naming**: camelCase for fields (`projects`, `certifications`), PascalCase for types
- **No new files**: Only modifying existing files
- **LLM Model**: Keep `claude-sonnet-4-20250514` and `max_tokens: 2000` unchanged (6 sections won't exceed token limit)
- **PII**: Must apply `restorePII()` to all 6 sections, matching existing pattern

### Testing Standards

- Test file: `/tests/unit/actions/parseResumeText.test.ts` (UPDATE existing)
- Runner: Vitest
- P0: Backward compat (existing 4-section resumes parse identically)
- P0: "Project Experience" → `projects` (not `experience`)
- P1: All 6 sections extracted correctly
- P1: Mixed presence (some sections null)
- Mock pattern: Mock `Anthropic.messages.create` return value (existing pattern in file)

### Previous Story Intelligence (18.1)

- 18.1 added `CandidateType` to `/lib/scoring/types.ts` at line 285-308
- 18.1 added barrel exports to `/lib/scoring/index.ts` - check if any new exports needed here
- Code review found missing barrel exports in 18.1 - verify no exports are needed for the types we modify
- TDD approach (tests first) worked well in 18.1

### Project Structure Notes

- No new files created - all changes are to existing files
- `Resume` interface is the primary data contract consumed by store, hooks, actions, scoring
- Adding optional fields to `Resume` is safe - TypeScript won't break existing destructuring
- `ResumeSection` expansion may surface compile errors in switch/case statements - check and handle

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.2]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 3 - Projects]
- [Source: actions/parseResumeText.ts - Current 4-section parser implementation]
- [Source: types/optimization.ts#L26-L50 - Resume interface]
- [Source: types/optimization.ts#L274 - ResumeSection type]
- [Source: lib/scoring/types.ts#L558-L574 - ATSScoreV2Input]
- [Source: hooks/useResumeExtraction.ts#L27-L37 - formatParsedSections helper]
- [Source: hooks/useResumeParser.ts#L70-L75 - section toast display]
- [Source: tests/unit/actions/parseResumeText.test.ts - Existing test patterns]

## Dev Agent Record

### Agent Model Used
- claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References
- N/A - Implementation completed without debugging required

### Completion Notes List
- ✅ **Task 1 Complete**: Expanded all type definitions to include `projects` and `certifications` fields
  - Updated `ParseResult` interface in `/actions/parseResumeText.ts` (lines 12-18)
  - Updated `Resume` interface in `/types/optimization.ts` (lines 26-52)
  - Expanded `ResumeSection` union type in `/types/optimization.ts` (line 274)
  - Updated `ATSScoreV2Input.parsedResume` in `/lib/scoring/types.ts` (lines 566-573)
- ✅ **Task 2 Complete**: Updated LLM prompt and response handling for 6-section parsing
  - Enhanced prompt with explicit instructions for Projects and Certifications sections
  - Added disambiguation rules: "Project Experience" → projects (NOT experience)
  - Added heading recognition for certifications: "Certifications", "Awards", "Awards & Certifications", "Licenses", "Honors"
  - Updated JSON format to include 6 fields in response
  - Added PII restoration for projects and certifications
  - Updated Resume object construction to include new fields
  - Updated logging to show all 6 sections
- ✅ **Task 3 Complete**: Updated downstream display helpers
  - Updated `formatParsedSections()` in `/hooks/useResumeExtraction.ts` to show Projects and Certifications
  - Updated section list in `/hooks/useResumeParser.ts` toast to include new sections
- ✅ **Task 4 Complete**: Updated and added comprehensive unit tests
  - Updated all 9 existing tests to include `projects: null, certifications: null` in mocks
  - Added 5 new test cases covering 6-section parsing, mixed presence, prompt validation, and backward compatibility
  - All 14 tests passing in `parseResumeText.test.ts`
  - Build successful with no TypeScript errors
  - No regressions introduced (pre-existing test failures remain unchanged)

**Implementation Approach:**
- Followed consistent pattern from existing 4-section implementation
- Used optional fields (`?` in TypeScript, `| null` in ParseResult) for backward compatibility
- Maintained existing null → undefined transformation pattern (null from LLM becomes undefined in Resume object)
- Updated all relevant mocks in tests to include new fields for consistency

**Technical Decisions:**
- Kept same LLM model (`claude-sonnet-4-20250514`) and token limit (`max_tokens: 2000`) - 6 sections won't exceed limit
- Followed existing PII redaction/restoration pattern for all 6 sections
- Made all new fields optional to maintain backward compatibility with existing 4-section resumes
- Updated display helpers proactively so sections show when present

### File List
- `actions/parseResumeText.ts` (modified) - Updated ParseResult interface, LLM prompt, PII restoration, Resume construction, and logging
- `types/optimization.ts` (modified) - Added projects and certifications fields to Resume interface, expanded ResumeSection union
- `lib/scoring/types.ts` (modified) - Added projects and certifications to ATSScoreV2Input.parsedResume
- `hooks/useResumeExtraction.ts` (modified) - Updated formatParsedSections() to include Projects and Certifications; exported for reuse
- `hooks/useResumeParser.ts` (modified) - Replaced duplicated section list logic with shared formatParsedSections() import
- `tests/unit/actions/parseResumeText.test.ts` (modified) - Updated all existing tests, added 6 new test cases (15 tests total, all passing)

### Code Review Record
- **Reviewer**: Adversarial Senior Dev Review (Claude Opus 4.6)
- **Date**: 2026-02-06
- **Issues Found**: 0 HIGH, 3 MEDIUM, 1 LOW (4 total)
- **Issues Fixed**: 0 HIGH, 3 MEDIUM, 0 LOW (3 fixed)
- **Fixes Applied**:
  - M1: Updated console.log in `useResumeExtraction.ts:84` to include projects and certifications in debug output
  - M2: Exported `formatParsedSections()` from `useResumeExtraction.ts` and replaced duplicated inline logic in `useResumeParser.ts` with shared import
  - M3: Added certifications-only test case (certifications present, projects null) to cover mixed-presence gap
- **Not Fixed (LOW)**:
  - L1: No test for PII restoration on new sections - pre-existing pattern (PII tested separately in `redactPII.test.ts`)
