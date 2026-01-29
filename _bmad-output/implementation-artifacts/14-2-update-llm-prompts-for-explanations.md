# Story 14.2: Update LLM Prompts for Explanations

**Status:** done

**Epic:** Epic 14: Explanation Output (V0.5)

**Depends On:** Story 14.1 (Types - COMPLETED ✓)

---

## Story

As a developer,
I want the LLM prompts to request explanations alongside suggestions,
So that the AI provides reasoning for each change.

---

## Acceptance Criteria

1. **Given** the suggestion generation prompts
   **When** the LLM generates a suggestion
   **Then** the prompt instructs the LLM to include a 1-2 sentence explanation

2. **Given** the LLM response
   **When** the explanation is parsed
   **Then** the explanation must reference specific JD keywords or requirements (not generic)

3. **Given** the JSON response format
   **When** suggestions are generated
   **Then** the JSON response schema includes `explanation` field

4. **Given** a suggestion is received
   **When** it is parsed and stored
   **Then** explanations are parsed and stored with suggestions

5. **Given** the LLM returns incomplete data
   **When** an explanation is missing or empty
   **Then** empty or missing explanations are handled gracefully (don't fail)

---

## Tasks / Subtasks

- [x] Update Summary suggestion prompt to request explanation (AC: #1-5)
  - [x] Locate: `/lib/ai/generateSummarySuggestion.ts`
  - [x] Add instruction: "Include a 1-2 sentence explanation of why this summary change improves ATS alignment"
  - [x] Add to JSON schema: `"explanation": "Why this summary change helps align with JD requirements"`
  - [x] Update parsing to extract `explanation` field from JSON
  - [x] Make `explanation` optional to handle missing/empty values gracefully

- [x] Update Skills suggestion prompt to request explanation (AC: #1-5)
  - [x] Locate: `/lib/ai/generateSkillsSuggestion.ts`
  - [x] Add instruction: "Include a 1-2 sentence explanation of why these skills matter for this role"
  - [x] Explain how suggestion connects to specific JD keywords
  - [x] Update JSON schema to include `explanation` field
  - [x] Update parsing with graceful handling for missing explanation

- [x] Update Experience suggestion prompt to request explanation (AC: #1-5)
  - [x] Locate: `/lib/ai/generateExperienceSuggestion.ts`
  - [x] Add instruction: "For each bullet, include 1-2 sentence explanation of how it aligns with JD requirements"
  - [x] Note: Experience section has multiple bullets - each needs explanation
  - [x] Update JSON schema for `explanation` in each bullet
  - [x] Test parsing with varying explanation depths

- [x] Add validation logic to ensure explanation quality (AC: #2)
  - [x] Verify explanation references specific JD keywords (not generic phrases like "improves score")
  - [x] Log warnings if explanation is too generic (for QA)
  - [x] Keep UI-renderable even if explanation quality is suboptimal

- [x] Add graceful fallback handling (AC: #5)
  - [x] If LLM omits explanation field: Use empty string or undefined (preserves type safety)
  - [x] If LLM returns null/undefined for explanation: Convert to empty string
  - [x] If explanation is too long (>500 chars): Truncate gracefully with ellipsis
  - [x] Never fail the suggestion if explanation is missing - suggestion should still be usable

- [x] Test prompt changes end-to-end (AC: #1-5)
  - [x] Call each updated function (summary, skills, experience suggestions)
  - [x] Verify JSON response includes `explanation` field in all cases
  - [x] Verify suggestions still work when explanation is missing
  - [x] Verify explanation text is 1-2 sentences (~100-300 chars typically)

---

## Dev Notes

### Architecture Patterns & Constraints

**LLM Prompt Structure:**
- All three suggestion functions use similar pattern: model.invoke(prompt) → JSON.parse(response)
- Current JSON schemas: `{ suggested, keywords_added, point_value }`
- Add to schema: `{ suggested, keywords_added, point_value, explanation }`
- Explanation field: OPTIONAL (backward compat with story 14-1)

**Prompt Engineering Pattern:**
- Use clear instruction format: "Include a 1-2 sentence explanation..."
- Provide context: "Explanation must reference specific JD keywords or requirements"
- Constraint: "Keep explanation concise (1-2 sentences, max 300 chars)"
- Example in prompt helps LLM understand format

**Graceful Degradation:**
- If explanation missing: use empty string, don't fail
- If explanation too long: truncate with `...` suffix
- If explanation too generic: log warning but still return suggestion
- UI layer (story 14-3) will handle rendering missing explanations

[Source: project-context.md#Error-Handling-Flow, project-context.md#API-Patterns]

### File Structure Requirements

```
/lib/ai/
  ├─ generateSummarySuggestion.ts      ← Update prompt + JSON schema + parsing
  ├─ generateSkillsSuggestion.ts       ← Update prompt + JSON schema + parsing
  ├─ generateExperienceSuggestion.ts   ← Update prompt + JSON schema + parsing
  └─ [Optional: Create validation helper for explanation quality]
```

**JSON Response Examples:**

**Before (Current):**
```json
{
  "suggested": "AWS-experienced full-stack engineer...",
  "keywords_added": ["AWS", "full-stack", "microservices"],
  "point_value": 9
}
```

**After (Story 14.2):**
```json
{
  "suggested": "AWS-experienced full-stack engineer...",
  "keywords_added": ["AWS", "full-stack", "microservices"],
  "point_value": 9,
  "explanation": "Adding AWS highlights your infrastructure experience directly mentioned in JD's 'AWS expertise required' requirement."
}
```

[Source: project-context.md#Directory-Structure-Rules]

### Testing Standards

**Unit Tests Needed:**
- Test each LLM function returns explanation field (or graceful missing)
- Test parsing handles missing `explanation` key without error
- Test explanation parsing with various edge cases (null, empty string, very long)

**Integration Tests (from story 14-4):**
- Full end-to-end: resume → suggestions → explanations rendered
- Verify explanations reference JD keywords (not generic)
- Verify explanation format (1-2 sentences)

**No Breaking Changes:**
- Old code expecting `{ suggested, keywords_added, point_value }` still works
- New `explanation` field is optional

[Source: project-context.md#Critical-Rules]

---

## Previous Story Intelligence

**Story 14.1 (Add Types & Schema) - COMPLETED ✓:**
- Added `explanation?: string` field to all suggestion types
- Backward compatible: existing suggestions without explanation work fine
- Types updated: SummarySuggestion, SkillsSuggestion, ExperienceSuggestion, BulletSuggestion
- 1,140 unit tests pass with new field

**Learning from Story 14.1:**
- Types were straightforward addition (optional field)
- Backward compatibility verified before merging
- No Zod schemas exist - uses JSON directly with TypeScript types

**Pattern to Follow:** Types → Prompts → UI (stories 14-1, 14-2, 14-3 are sequential)

---

## Git Intelligence

**Recent Commits (Last 5):**
- **d733c97** `feat(story-13-5)`: Epic 13 integration - shows test-heavy approach for verification
- **f665c30** `feat(story-13-4)`: Prompt templates for preferences - DIRECTLY RELEVANT
  - Demonstrates how to modify prompts to accept new instruction parameters
  - Pattern: Add instruction → Update JSON schema → Parse new field
  - Git history shows exact pattern for prompt modifications

- **ec7173a** `feat(story-13-3)`: UI updates - shows how new fields render
- **cb22571** `feat(story-13-2)`: Database migration - not relevant to this story
- **d1f8160** `feat(story-13-1)`: Add types - similar to story 14-1

**Code Pattern Identified:**
Story 13-4 (prompt templates) is THE REFERENCE COMMIT for how to modify prompts:
1. Add new instruction section to prompt text
2. Update JSON schema with new field
3. Add parsing logic with `.optional()` or fallback handling
4. Test with old data that doesn't have new field

Examine commit f665c30 for exact pattern!

---

## Latest Tech Information

**Claude 3.5 Haiku (Current Model in Use):**
- Model: `claude-3-5-haiku-20241022` (already in code)
- JSON output quality: Excellent at following structured output formats
- Explanation capability: Haiku handles 1-2 sentence explanations well
- Cost: Using Haiku (most economical) vs Opus - good for API budget

**Best Practices for JSON with Explanations:**
- Include example in prompt: Shows expected explanation format
- Max tokens sufficient: 2000-2500 tokens handles current + explanation
- Temperature: Keep at 0.3 for factual explanations (avoid hallucination)
- Constraint in prompt: "Explanation must reference specific JD keywords"

---

## Project Context Reference

**Critical Rules:**
1. **ActionResponse Pattern:** Already wrapped all functions - no changes needed
2. **XML-wrapped user content:** Already in place (prompt injection defense) - maintain
3. **Error handling:** Use existing pattern - graceful fallback for missing field
4. **Naming:** camelCase for TypeScript - field name: `explanation`
5. **Security:** No new security concerns - explanations are generated from user data

**Constraints:**
- LLM timeout: 60 seconds max (unchanged)
- API cost: $0.10 per optimization (slight increase with longer prompts, minimal)
- Response quality: Depends on prompt clarity

[Source: _bmad-output/project-context.md]

---

## Story Completion Status

### Implementation Readiness
- ✅ Story is ready for dev implementation
- ✅ All acceptance criteria are clear and testable
- ✅ Three files to modify clearly identified
- ✅ Pattern established in commit f665c30 (story 13-4)
- ✅ Backward compatibility strategy clear
- ✅ No external dependencies needed

### Context Provided
- ✅ Existing prompt structure documented (3 examples shown)
- ✅ Current JSON schema baseline established
- ✅ New JSON schema with explanation documented
- ✅ Git reference commit identified (f665c30)
- ✅ Graceful fallback approach defined
- ✅ Testing strategy outlined

### Next Steps for Dev
1. Review git commit f665c30 for prompt modification pattern
2. Examine generateSummarySuggestion.ts prompt structure (lines 99-142)
3. Add explanation instruction to each of 3 suggestion functions
4. Update JSON schema parsing to extract `explanation` field
5. Add graceful handling for missing/empty explanations
6. Test each function returns valid JSON with explanation (or gracefully missing)
7. Commit and open PR for code review (with test results)

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### References for Implementation
- **Commit Reference:** f665c30 `feat(story-13-4)` - How to modify prompts
- **File Reference:** `/lib/ai/generateSummarySuggestion.ts:99-142` - Prompt template pattern
- **Story Reference:** Story 14-1 (completed) - Type definitions for `explanation` field

### Debug Log References
- None at this stage - prompting change should produce clean logs

### Completion Notes List
- [x] Summary suggestion prompt updated with explanation instruction
- [x] Skills suggestion prompt updated with explanation instruction
- [x] Experience suggestion prompt updated with explanation instruction
- [x] JSON schema parsing handles `explanation` field in all 3 functions
- [x] Graceful fallback for missing/empty/long explanations implemented
- [x] Tests pass - all suggestions return explanation (or gracefully empty)
- [x] Backward compatibility verified - old suggestions still work
- [x] Generic explanation detection implemented with console warnings
- [x] All 103 AI tests pass with new explanation handling

### File List
- `/lib/ai/generateSummarySuggestion.ts` (prompt + parsing + validation)
- `/lib/ai/generateSkillsSuggestion.ts` (prompt + parsing + validation)
- `/lib/ai/generateExperienceSuggestion.ts` (prompt + parsing + validation)
- `/tests/unit/ai/explanation-generation.test.ts` (new comprehensive test file)
- `/_bmad-output/implementation-artifacts/sprint-status.yaml` (sprint tracking update)

---

## Change Log

- **2026-01-29**: Story created with comprehensive analysis of prompt modification pattern from story 13-4. All 3 suggestion functions identified for update. Graceful degradation strategy documented for missing explanations.
- **2026-01-29**: Implemented explanation field in all three LLM prompt functions (Summary, Skills, Experience). Added comprehensive test suite with 8 new tests. All tests pass (103 AI tests + 12 type tests). Implemented validation logic for generic explanations with console warnings. Graceful fallback handling for missing/empty/long explanations. Backward compatible with Story 14.1 types.
- **2026-01-29**: Code review fixes applied:
  - Added 3 tests for `null` explanation handling (Summary, Skills, Experience)
  - Fixed logging consistency in generateExperienceSuggestion to log bullet explanation count
  - Updated File List to include sprint-status.yaml
  - Total tests: 11 in explanation-generation.test.ts (was 8)
