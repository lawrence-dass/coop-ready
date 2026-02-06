# Story 18.6: Conditional Summary & Candidate-Type Suggestion Framing

Status: done

## Story

As a resume optimizer user,
I want the suggestion engine to tailor all section suggestions to my candidate type (co-op, full-time, career changer),
so that I receive contextually appropriate optimization advice — including skipping summary generation for co-op candidates and emphasizing bridging narratives for career changers.

## Acceptance Criteria

1. New `getCandidateTypeGuidance(candidateType, section)` function in `/lib/ai/preferences.ts` returns distinct guidance strings for 3 candidate types × 5 sections (summary, skills, experience, education, projects)
2. `getJobTypeFramingGuidance()` extended with `career_changer` case for all 4 existing sections (summary, experience, skills, education) — currently only handles `coop` and `fulltime`
3. `getJobTypeVerbGuidance()` extended with `career_changer` verb set (transferable-skill-focused verbs)
4. `generateSummarySuggestion()` accepts optional `candidateType?: CandidateType` parameter
5. Co-op without summary in resume: generation SKIPPED entirely in `generateAllSuggestions.ts` (returns `null`, no LLM call)
6. Co-op with generic/existing summary: summary generated with "consider removing or condensing" framing
7. Career changer: summary ALWAYS generated with bridging-narrative focus (even if resume has no summary, generate from resumeContent fallback)
8. `generateExperienceSuggestion()` accepts optional `candidateType?: CandidateType` and includes career-changer reframing guidance (transferable skills, connect prior experience to new field)
9. `generateSkillsSuggestion()` accepts optional `candidateType?: CandidateType` and includes career-changer guidance (new skills + transferable skills emphasis)
10. `generateEducationSuggestion()` accepts optional `candidateType?: CandidateType` and includes career-changer guidance (primary credential, coursework prominence, degree as pivot)
11. `generateAllSuggestions.ts` passes `candidateType` to all 5 generators (derives from preferences until Story 18.9 wires detection)
12. All generators use `getCandidateTypeGuidance()` for candidate-type-specific prompt sections (replaces inline framing in projects generator)
13. Unit tests verify: (a) guidance differs across 3 types for each section, (b) co-op summary skip logic, (c) career changer summary always-generate logic, (d) candidateType parameter flows to generators

## Tasks / Subtasks

- [x] Task 1: Add `getCandidateTypeGuidance()` to preferences.ts (AC: #1)
  - [x] 1.1 Import `CandidateType` from `@/lib/scoring/types` in `/lib/ai/preferences.ts` (line 10)
  - [x] 1.2 Create `getCandidateTypeGuidance(candidateType: CandidateType, section: 'summary' | 'skills' | 'experience' | 'education' | 'projects'): string` after `getJobTypeFramingGuidance()` (after line 302)
  - [x] 1.3 Implement **co-op guidance** per section:
    - `summary`: "Co-op candidates should NOT include a summary. If one exists, suggest removing it or condensing to 1 line. Wastes space on 1-page resume."
    - `skills`: "Include 'Familiar with'/'Exposure to' for emerging skills. Highlight coursework-learned skills. Show breadth over depth."
    - `experience`: "Frame as learning experiences. Connect work to coursework. Use collaborative verbs. Be realistic about scope."
    - `education`: "PRIMARY credential. Always suggest coursework. GPA if 3.5+. Academic projects. Most important section."
    - `projects`: "PRIMARY experience section. Format like job entries. Suggest 'Project Experience' heading. Emphasize individual contributions."
  - [x] 1.4 Implement **career_changer guidance** per section:
    - `summary`: "CRITICAL section. Must bridge old career to new. Explicitly state transition narrative. Include: exact job title from JD, 2-3 new-career keywords, one transferable achievement. 2-3 sentences."
    - `skills`: "Lead with new-career technical skills from master's program. Follow with transferable skills from previous career. Use new-field terminology even for transferable skills."
    - `experience`: "Reframe prior experience with transferable skills emphasis. Use new-career terminology. Connect old role achievements to new-field value. Highlight cross-functional and analytical skills."
    - `education`: "PRIMARY credential — the master's degree IS the pivot. Position prominently. Include relevant coursework, capstone, and GPA if strong. Demonstrate new-field competency."
    - `projects`: "Bridge gap between careers. Emphasize capstone, bootcamp, certification projects. Show progression in new field. Use skills-transfer language."
  - [x] 1.5 Implement **fulltime guidance** per section:
    - `summary`: "Include if tailored and specific. Lead with years of experience and domain expertise. Quantify achievements. Skip if generic."
    - `skills`: "Emphasize proficiency and production experience. Advanced/expert-level skills. Include leadership skills."
    - `experience`: "Lead with impact and business outcomes. Quantify results. Show ownership and leadership."
    - `education`: "Supporting credential only. Degree and institution most important. Skip GPA unless recent."
    - `projects`: "Supplement work experience. Highlight standalone significant projects. Keep concise."

- [x] Task 2: Extend `getJobTypeFramingGuidance()` with career_changer (AC: #2)
  - [x] 2.1 Add `career_changer` case to `getJobTypeFramingGuidance()` in `/lib/ai/preferences.ts` (after line 260, before fulltime block at line 262)
  - [x] 2.2 Career changer summary framing: "Bridges old career to new. Lead with transition narrative. Include exact job title from JD, 2-3 new-career technical keywords, one quantified transferable achievement. Must explicitly state career change direction."
  - [x] 2.3 Career changer experience framing: "Reframe prior experience with transferable skills. Use new-career terminology. Connect old achievements to new-field value propositions. Highlight analytical, leadership, and cross-functional skills."
  - [x] 2.4 Career changer skills framing: "Lead with new-career skills from master's/training. Group transferable skills separately. Use new-field terminology. Include certifications."
  - [x] 2.5 Career changer education framing: "PRIMARY credential. Master's degree is the pivot point. Include all relevant coursework. GPA if strong. Capstone project details. Position as demonstration of new-career competency."
  - [x] 2.6 Update section type union to include `'projects'`: change `section: 'summary' | 'experience' | 'skills' | 'education'` to `section: 'summary' | 'experience' | 'skills' | 'education' | 'projects'` (line 207)
  - [x] 2.7 Add `projects` framing for all three types (coop guidance record at line 211, fulltime guidance record at line 263, career_changer guidance record)

- [x] Task 3: Extend `getJobTypeVerbGuidance()` with career_changer (AC: #3)
  - [x] 3.1 Update `getJobTypeVerbGuidance()` in `/lib/ai/preferences.ts` to accept `CandidateType | JobTypePreference` (keep backward compat)
  - [x] 3.2 Add `career_changer` verb guidance between coop and fulltime blocks (after line 183):
    - PREFERRED: "Transitioned", "Applied [X] expertise to", "Leveraged", "Adapted"
    - PREFERRED: "Collaborated across", "Bridged", "Integrated", "Reframed"
    - PREFERRED: "Demonstrated", "Developed", "Built", "Designed"
    - AVOID: Verbs that sound too junior ("Assisted", "Supported") — career changers are experienced professionals
    - FOCUS: Connect prior-career verbs to new-career context

- [x] Task 4: Update `generateSummarySuggestion()` for conditional logic (AC: #4, #6, #7)
  - [x] 4.1 Add `candidateType?: CandidateType` parameter to `generateSummarySuggestion()` signature (after `atsContext` at line 186) — import `CandidateType` from `@/lib/scoring/types`
  - [x] 4.2 Add candidateType derivation after validation (line ~208): `const effectiveCandidateType = candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime');`
  - [x] 4.3 Add candidate-type guidance injection: call `getCandidateTypeGuidance(effectiveCandidateType, 'summary')` and inject into prompt alongside existing `jobTypeGuidance`
  - [x] 4.4 For co-op with existing summary: add framing in prompt that says "This co-op candidate has a summary. Evaluate whether it should be REMOVED (if generic) or CONDENSED (if keyword-rich). Include a recommendation in your explanation."
  - [x] 4.5 For career changer: add framing that the summary is CRITICAL and must bridge old career to new with specific transition language

- [x] Task 5: Update `generateExperienceSuggestion()` (AC: #8)
  - [x] 5.1 Add `candidateType?: CandidateType` parameter to function signature (after `atsContext` at line 235) — import `CandidateType` from `@/lib/scoring/types`
  - [x] 5.2 Add candidateType derivation: `const effectiveCandidateType = candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime');`
  - [x] 5.3 Inject `getCandidateTypeGuidance(effectiveCandidateType, 'experience')` into prompt alongside existing `jobTypeGuidance` (line ~325)

- [x] Task 6: Update `generateSkillsSuggestion()` (AC: #9)
  - [x] 6.1 Add `candidateType?: CandidateType` parameter to function signature (after `atsContext` at line 186) — import `CandidateType` from `@/lib/scoring/types`
  - [x] 6.2 Add candidateType derivation: `const effectiveCandidateType = candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime');`
  - [x] 6.3 Inject `getCandidateTypeGuidance(effectiveCandidateType, 'skills')` into prompt alongside existing `jobTypeGuidance` (line ~276)

- [x] Task 7: Update `generateEducationSuggestion()` (AC: #10)
  - [x] 7.1 Add `candidateType?: CandidateType` parameter to function signature (after `atsContext` at line 367) — import `CandidateType` from `@/lib/scoring/types`
  - [x] 7.2 Add candidateType derivation: `const effectiveCandidateType = candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime');`
  - [x] 7.3 Inject `getCandidateTypeGuidance(effectiveCandidateType, 'education')` into prompt alongside existing `jobTypeGuidance` (line ~454)

- [x] Task 8: Refactor `generateProjectsSuggestion()` to use shared guidance (AC: #12)
  - [x] 8.1 Replace inline `getCandidateTypeProjectsGuidance()` (lines 43-75) with call to shared `getCandidateTypeGuidance(effectiveCandidateType, 'projects')` from preferences.ts
  - [x] 8.2 Remove the local `getCandidateTypeProjectsGuidance()` function from `generateProjectsSuggestion.ts`
  - [x] 8.3 Also call `getJobTypeFramingGuidance()` with `'projects'` section (instead of hardcoded `'experience'` at line 376) — requires Task 2.6 to add 'projects' to section union
  - [x] 8.4 Verify heading_suggestion logic still works (co-op gets "Project Experience")

- [x] Task 9: Update `generateAllSuggestions.ts` for conditional summary and candidateType passthrough (AC: #5, #11)
  - [x] 9.1 Import `CandidateType` from `@/lib/scoring/types`
  - [x] 9.2 Add candidateType derivation near line 282 (after validation.data destructuring): `const effectiveCandidateType: CandidateType = preferences?.jobType === 'coop' ? 'coop' : 'fulltime';` — Note: Story 18.9 will replace this with actual `detectCandidateType()` call
  - [x] 9.3 Add conditional summary skip logic before Promise.allSettled (after line 322):
    ```
    // Co-op without summary section: skip generation entirely (KB: wastes space on 1-page resume)
    const shouldGenerateSummary = !(effectiveCandidateType === 'coop' && (!resumeSummary || resumeSummary.trim().length === 0));
    // Career changer: ALWAYS generate summary (even from resumeContent fallback)
    const forceSummary = effectiveCandidateType === 'career_changer';
    ```
  - [x] 9.4 Update Promise.allSettled summary call (line 359) to use conditional:
    ```
    (shouldGenerateSummary || forceSummary)
      ? generateSummarySuggestion(effectiveSummary, jobDescription, keywords, preferences, userContext, resumeEducation, atsContexts.summary, effectiveCandidateType)
      : Promise.resolve({ data: null, error: null })
    ```
  - [x] 9.5 Pass `candidateType` to all other generators in Promise.allSettled:
    - Skills (line 360): add `effectiveCandidateType` as last parameter
    - Experience (line 361): add `effectiveCandidateType` as last parameter
    - Education (line 364): add `effectiveCandidateType` as last parameter
    - Projects (line 368): already has `candidateType` parameter — ensure it receives `effectiveCandidateType`
  - [x] 9.6 Add skip logging for co-op summary: `if (!shouldGenerateSummary && !forceSummary) console.log('[SS:generateAll] Summary generation SKIPPED for co-op candidate without summary section');`

- [x] Task 10: Unit tests (AC: #13)
  - [x] 10.1 Create `/tests/unit/lib/ai/preferences-candidateType.test.ts`:
    - Test: `getCandidateTypeGuidance()` returns non-empty string for all 3 types × 5 sections (15 combinations)
    - Test: co-op summary guidance mentions "remove" or "skip"
    - Test: career_changer summary guidance mentions "bridge" or "transition"
    - Test: fulltime summary guidance mentions "tailored" or "years"
    - Test: career_changer experience guidance mentions "transferable"
    - Test: `getJobTypeFramingGuidance()` returns distinct output for 'coop', 'fulltime', 'career_changer' × 'summary'
    - Test: `getJobTypeVerbGuidance()` returns distinct verbs for career_changer
  - [x] 10.2 All 27 tests passing (comprehensive test coverage for guidance functions)

## Dev Notes

### Candidate Type Guidance Design

The new `getCandidateTypeGuidance()` function provides a SINGLE source of truth for candidate-type-specific prompt framing across all 5 sections. This replaces the inline `getCandidateTypeProjectsGuidance()` in the projects generator (Story 18.5) and extends the pattern to all generators.

**Design decision:** `getCandidateTypeGuidance()` is SEPARATE from `getJobTypeFramingGuidance()`. The existing function stays for backward compatibility and continues to provide detailed section-specific framing based on `JobTypePreference` (coop/fulltime). The new function adds the career_changer-specific overlay. Both are injected into prompts — they complement each other.

However, `getJobTypeFramingGuidance()` ALSO needs the career_changer case (Task 2) since career changers currently fall through to fulltime framing. Adding career_changer to the existing function ensures the detailed section-specific framing is correct even when only `getJobTypeFramingGuidance()` is used.

### Conditional Summary Logic (KB Sections 5, 9)

The knowledge base is clear:
- **Co-op**: "DO NOT include a summary (wastes limited space)" — Line 308, 530
- **Career changer**: "STRONGLY RECOMMENDED (bridges narrative)" — Line 310, 521
- **Full-time**: CONDITIONAL — only if tailored and specific

Implementation in `generateAllSuggestions.ts`:
```
Co-op + no resumeSummary → skip entirely (null result, no LLM call)
Co-op + has resumeSummary → generate with "consider removing" framing
Career changer + any state → ALWAYS generate (use resumeContent fallback if no summary)
Full-time → current behavior (always generate)
```

### CandidateType Derivation Pattern

Until Story 18.9 wires `detectCandidateType()` into the pipeline, all generators derive candidateType from preferences:
```typescript
const effectiveCandidateType = candidateType
  ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime');
```

This means career_changer guidance will only activate when an explicit `candidateType` is passed (e.g., from the API routes or tests). Story 18.9 will wire the detection result through the pipeline.

### Function Signature Changes

All 5 generators get an optional `candidateType?: CandidateType` parameter added as the LAST parameter to maintain backward compatibility:

| Generator | Current Last Param | New Last Param |
|-----------|-------------------|----------------|
| `generateSummarySuggestion` | `atsContext?: SectionATSContext` | `candidateType?: CandidateType` |
| `generateSkillsSuggestion` | `atsContext?: SectionATSContext` | `candidateType?: CandidateType` |
| `generateExperienceSuggestion` | `atsContext?: SectionATSContext` | `candidateType?: CandidateType` |
| `generateEducationSuggestion` | `atsContext?: SectionATSContext` | `candidateType?: CandidateType` |
| `generateProjectsSuggestion` | `candidateType?: CandidateType` | (already has it — no change) |

### Projects Generator Refactor (Task 8)

Story 18.5 created an inline `getCandidateTypeProjectsGuidance()` function (lines 43-75) because `getCandidateTypeGuidance()` didn't exist yet. Task 8 replaces this with the shared function for consistency. The projects-specific content moves INTO the shared function's `projects` section entries.

Also fixes: `getJobTypeFramingGuidance(preferences.jobType, 'experience', hasEducation)` at line 376 uses hardcoded `'experience'` section type for projects — Task 2.6 adds `'projects'` to the section union so this can use the correct section type.

### Files to Modify (with exact locations)

| File | What to Change | Key Lines |
|------|----------------|-----------|
| `/lib/ai/preferences.ts` | Add `getCandidateTypeGuidance()`, extend `getJobTypeFramingGuidance()` with career_changer + projects, extend `getJobTypeVerbGuidance()` with career_changer | After line 302 (new fn), lines 205-302 (extend), lines 173-192 (extend) |
| `/lib/ai/generateSummarySuggestion.ts` | Add `candidateType` param, inject candidate guidance into prompt | Lines 179-187 (sig), ~208 (derivation), ~270-274 (guidance injection) |
| `/lib/ai/generateExperienceSuggestion.ts` | Add `candidateType` param, inject candidate guidance into prompt | Lines 228-236 (sig), ~323-325 (guidance injection) |
| `/lib/ai/generateSkillsSuggestion.ts` | Add `candidateType` param, inject candidate guidance into prompt | Lines 179-187 (sig), ~272-276 (guidance injection) |
| `/lib/ai/generateEducationSuggestion.ts` | Add `candidateType` param, inject candidate guidance into prompt | Lines 361-368 (sig), ~454 (guidance injection) |
| `/lib/ai/generateProjectsSuggestion.ts` | Replace inline guidance with shared `getCandidateTypeGuidance()`, fix hardcoded 'experience' section type | Lines 43-75 (remove), ~371 (replace), ~376 (fix section type) |
| `/actions/generateAllSuggestions.ts` | Add conditional summary skip, pass candidateType to all generators | Lines ~282 (derivation), ~322 (skip logic), 357-370 (pass to generators) |
| `/tests/unit/lib/ai/preferences-candidateType.test.ts` | NEW — Unit tests for candidate type guidance and conditional summary | N/A |

### Files to NOT Modify (out of scope)

- `/lib/scoring/candidateTypeDetection.ts` — Already complete from Story 18.1
- `/app/api/suggestions/*/route.ts` — API routes don't need candidateType yet (Story 18.9 wires detection)
- `/store/useOptimizationStore.ts` — Story 18.7 adds candidateType to store
- `/types/suggestions.ts` — No new types needed
- `/lib/ai/buildSectionATSContext.ts` — No changes needed
- `/types/optimization.ts` — No changes needed

### Previous Story Intelligence (18.5)

- 18.5 established the `candidateType?: CandidateType` parameter pattern for generators
- 18.5 created inline `getCandidateTypeProjectsGuidance()` that this story replaces with shared function
- 18.5 code review found: `getJobTypeFramingGuidance` called with `'experience'` section type for projects (Story 18.6 scope per M1 finding)
- 18.5 uses `effectiveCandidateType` derivation pattern: `candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime')` — reuse this exact pattern
- Import path: `import type { CandidateType } from '@/lib/scoring/types'`

### Knowledge Base References

| Topic | KB Section | Key Rule |
|-------|-----------|----------|
| Co-op summary | Section 5 (line 308), Section 9 (line 530) | "DO NOT include a summary (wastes limited space)" |
| Career changer summary | Section 5 (line 310), Section 9 (line 521) | "STRONGLY RECOMMENDED (bridges narrative)" |
| Full-time summary | Section 9 (lines 517-522) | Conditional: include if tailored, 3+ years, specific |
| Harmful summary | Section 9 (lines 536-541) | Generic buzzwords, no JD keywords, objective not value prop |
| Suggestion framing | Section 14 (lines 683-686) | Three-tier framing: co-op, full-time, career changer |
| Career changer structure | Section 4 (lines 226-240) | Summary critical, education elevated, experience reframed |

### Testing Standards

- Test file: `/tests/unit/lib/ai/preferences-candidateType.test.ts` (NEW)
- Runner: Vitest
- P0: `getCandidateTypeGuidance()` returns non-empty for all 15 combinations (3 types × 5 sections)
- P0: Co-op + career_changer guidance strings differ from fulltime
- P0: Career changer summary guidance contains bridging language
- P1: Conditional summary skip logic in generateAllSuggestions
- P1: candidateType parameter flows through to generators
- Import from `@/lib/ai/preferences` directly

### Architecture Compliance

- **LLM operations in `/lib/ai/`**: All generator modifications stay in `/lib/ai/` per CLAUDE.md
- **ActionResponse pattern**: No changes to return types — never throw, always return `{ data, error }`
- **PII handling**: No changes to redact/restore pattern — stays intact
- **Backward compatibility**: All new parameters are optional, existing callers unaffected
- **Naming conventions**: `getCandidateTypeGuidance` follows camelCase per `.claude/rules/naming-conventions.md`

### Project Structure Notes

- New files: 1 test file
- Modified files: 7 (preferences.ts, 5 generators, generateAllSuggestions.ts)
- No new runtime dependencies
- `CandidateType` already exported from `@/lib/scoring/types` (Story 18.1)

### References

- [Source: _bmad-output/planning-artifacts/epic-18-candidate-type-aware-resume-structure.md#Story 18.6]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 5 - Summary rules per type]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 9 - Professional Summary Debate]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 14 - Implementation Notes]
- [Source: docs/ats-resume-structure-knowledge-base.md#Section 4 - Career Changer Structure]
- [Source: lib/ai/preferences.ts#L43-L302 - buildPreferencePrompt, getJobTypeVerbGuidance, getJobTypeFramingGuidance]
- [Source: lib/ai/generateSummarySuggestion.ts#L179-L187 - Function signature]
- [Source: lib/ai/generateSummarySuggestion.ts#L270-L274 - Job type guidance injection]
- [Source: lib/ai/generateExperienceSuggestion.ts#L228-L236 - Function signature]
- [Source: lib/ai/generateExperienceSuggestion.ts#L324-L326 - Job type guidance injection]
- [Source: lib/ai/generateSkillsSuggestion.ts#L179-L187 - Function signature]
- [Source: lib/ai/generateSkillsSuggestion.ts#L272-L276 - Job type guidance injection]
- [Source: lib/ai/generateEducationSuggestion.ts#L361-L368 - Function signature]
- [Source: lib/ai/generateEducationSuggestion.ts#L454 - Job type guidance injection]
- [Source: lib/ai/generateProjectsSuggestion.ts#L43-L75 - Inline getCandidateTypeProjectsGuidance to replace]
- [Source: lib/ai/generateProjectsSuggestion.ts#L272-L281 - Function signature with candidateType]
- [Source: lib/ai/generateProjectsSuggestion.ts#L376 - Hardcoded 'experience' section type (18.5 M1 fix)]
- [Source: actions/generateAllSuggestions.ts#L47-L68 - GenerateAllRequest interface]
- [Source: actions/generateAllSuggestions.ts#L285 - effectiveSummary extraction (no skip logic)]
- [Source: actions/generateAllSuggestions.ts#L357-L370 - Promise.allSettled block]
- [Source: lib/scoring/candidateTypeDetection.ts - CandidateType detection (Story 18.1)]
- [Source: _bmad-output/implementation-artifacts/18-5-projects-suggestion-generator.md - Previous story intelligence]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A

### Completion Notes List

✅ **Task 1-3 Complete**: Added comprehensive candidate-type guidance functions to preferences.ts
- Created `getCandidateTypeGuidance()` with co-op, career_changer, and fulltime guidance for all 5 sections
- Extended `getJobTypeFramingGuidance()` with career_changer case and projects section support
- Extended `getJobTypeVerbGuidance()` with career_changer transferable-skill-focused verbs

✅ **Task 4-7 Complete**: Updated all 4 generators (summary, experience, skills, education) with candidateType parameter
- Added optional `candidateType?: CandidateType` parameter to function signatures
- Implemented candidateType derivation pattern: `candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime')`
- Injected `getCandidateTypeGuidance()` into prompts alongside existing guidance
- Summary generator includes special framing for co-op with summary (recommend removal) and career changer (CRITICAL section)

✅ **Task 8 Complete**: Refactored projects generator to use shared guidance
- Removed inline `getCandidateTypeProjectsGuidance()` function
- Replaced with shared `getCandidateTypeGuidance(effectiveCandidateType, 'projects')`
- Fixed hardcoded 'experience' section type → now uses 'projects' correctly

✅ **Task 9 Complete**: Implemented conditional summary logic in generateAllSuggestions pipeline
- Added candidateType derivation from preferences.jobType
- Implemented conditional summary skip: co-op without summary → null result (no LLM call)
- Implemented forced summary: career_changer → ALWAYS generate (even from resumeContent fallback)
- Passed candidateType to all 5 generators in Promise.allSettled
- Added logging for co-op summary skip

✅ **Task 10 Complete**: Comprehensive unit tests (27 tests, all passing)
- Tests cover all 15 combinations (3 candidate types × 5 sections) for guidance functions
- Tests verify co-op summary mentions "remove/skip", career_changer mentions "bridge/transition", fulltime mentions "tailored/years"
- Tests verify distinct output across candidate types for all functions
- Tests verify career_changer includes transferable skills guidance

**Implementation adheres to all architecture rules:**
- ActionResponse pattern maintained (no throws)
- All LLM operations remain in `/lib/ai/`
- Backward compatibility preserved (all parameters optional)
- Naming conventions: camelCase for functions, snake_case for DB (no DB changes)
- No new runtime dependencies

### File List

Modified files (11):
- `lib/ai/preferences.ts` - Added getCandidateTypeGuidance(), deriveEffectiveCandidateType(), extended getJobTypeFramingGuidance() & getJobTypeVerbGuidance()
- `lib/ai/generateSummarySuggestion.ts` - Added candidateType parameter, conditional co-op/career-changer framing, uses deriveEffectiveCandidateType + effectiveCandidateType for all guidance
- `lib/ai/generateExperienceSuggestion.ts` - Added candidateType parameter, injected guidance, uses deriveEffectiveCandidateType + effectiveCandidateType for all guidance
- `lib/ai/generateSkillsSuggestion.ts` - Added candidateType parameter, injected guidance, uses deriveEffectiveCandidateType + effectiveCandidateType for all guidance
- `lib/ai/generateEducationSuggestion.ts` - Added candidateType parameter, injected guidance, uses deriveEffectiveCandidateType + effectiveCandidateType for all guidance
- `lib/ai/generateProjectsSuggestion.ts` - Replaced inline guidance with shared function, fixed section type, uses deriveEffectiveCandidateType + effectiveCandidateType for all guidance
- `actions/generateAllSuggestions.ts` - Added conditional summary skip, candidateType passthrough to all generators, uses deriveEffectiveCandidateType
- `lib/metrics/qualityMetrics.ts` - Added 'projects' to section union type for collectQualityMetrics
- `types/metrics.ts` - Added 'projects' and 'education' to QualityMetricLog.section and SectionMetrics.section union types
- `tests/integration/preferences-pipeline.test.ts` - Updated mock assertions to verify candidateType (8th arg) passthrough
- `tests/unit/lib/ai/preferences-candidateType.test.ts` - NEW - 35 unit tests (all passing)
