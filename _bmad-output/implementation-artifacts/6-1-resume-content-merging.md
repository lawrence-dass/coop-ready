# Story 6.1: Resume Content Merging

**Status:** ready-for-dev
**Epic:** 6 - Resume Export & Download
**Dependencies:** Epic 5 complete (suggestions exist and can be accepted/rejected)
**Blocking:** Stories 6-2 (PDF generation), 6-3 (DOCX generation), 6-4 (Download UI)
**Related Components:** `suggestions` table, `scan_suggestions` table

---

## Problem Statement

Users can accept/reject suggestions on the Suggestions page (Story 5-9), but there's no mechanism to merge accepted suggestions back into the resume content for export. The parsed resume data exists (`resume_data` column in `scans` table), and suggestions are tracked (`scan_suggestions` table), but the merge operation that combines them into a final exportable document doesn't exist. Without this, PDF/DOCX generation will have nothing to export.

---

## User Story

As a **system**,
I want **to merge accepted suggestions into the final resume content**,
So that **the exported document reflects all user-approved changes**.

---

## Acceptance Criteria

### AC1: Merge Logic Processes Accepted Suggestions
**Given** a user has accepted suggestions for their scan
**When** the merge process runs
**Then** each accepted suggestion is applied to the corresponding resume section
**And** the merged content maintains the original resume structure
**And** rejected suggestions are ignored (original content preserved)

### AC2: Bullet Point Rewrites Are Applied Correctly
**Given** a bullet rewrite suggestion was accepted
**When** merging occurs
**Then** the original bullet text is replaced with the suggested text
**And** the bullet's position within the experience entry remains unchanged
**And** surrounding bullets in the same entry are unaffected

### AC3: Skill Expansions Are Applied Correctly
**Given** a skill expansion suggestion was accepted (e.g., "Python" → "Python (FastAPI, Django, Flask)")
**When** merging occurs
**Then** the original skill is replaced with the expanded version
**And** other skills in the list maintain their original form and order

### AC4: Removals Are Applied Correctly
**Given** a removal suggestion was accepted (flags outdated content)
**When** merging occurs
**Then** the flagged content is removed from the merged result
**And** surrounding content flows naturally (no orphaned bullets, blank sections)
**And** formatting remains clean

### AC5: Rejected Suggestions Are Preserved
**Given** a suggestion was rejected
**When** merging occurs
**Then** the original content is preserved unchanged
**And** it appears in the final exported resume

### AC6: No Changes When No Suggestions Accepted
**Given** no suggestions were accepted
**When** merging occurs
**Then** the original parsed resume content is returned unchanged

### AC7: Merged Content Is Structured for Document Generation
**Given** merging completes successfully
**When** the result is prepared
**Then** the merged content is structured for downstream generators (PDF, DOCX)
**And** section order follows standard resume conventions (Contact, Summary, Experience, Education, Skills, Projects)
**And** all data types are properly formatted for export

### AC8: Edge Cases Are Handled Gracefully
**Given** overlapping or conflicting suggestions exist
**When** merging occurs
**Then** the system applies them in deterministic order (by suggestion creation time)
**And** logs any conflicts for debugging

**Given** a suggestion references a section or bullet that no longer exists
**When** merging occurs
**Then** the suggestion is safely skipped
**And** a warning is logged (not an error)

---

## Technical Implementation

### Architecture Context

**Input Data Sources:**
- `scans` table: `resume_data` column (parsed resume as JSON)
- `scan_suggestions` table: `suggestion_data`, `status` (accepted/rejected)
- `suggestions` table: `type`, `metadata` (for context)

**Output:**
- Merged resume data structure (same format as `resume_data`, but with accepted changes applied)
- Not persisted to database—generated on-demand when needed (AC7 requirement: "do not persist merged content")

**Suggestion Types to Handle:**
- `bullet_rewrite`: Replace original bullet with suggested text
- `skill_expansion`: Replace skill with expanded version
- `action_verb_suggestion`: Replace verb in bullet point
- `removal`: Remove section/bullet entirely
- Other types: Apply to relevant sections

### New Files to Create

#### 1. Core Merge Logic: `lib/generators/merge.ts`

```typescript
// Main entry point for merge operation
export async function mergeResumeContent(
  scanId: string,
  resumeData: ParsedResume,
  suggestions: ScanSuggestion[]
): Promise<ParsedResume>

// Type definitions
export interface MergeResult {
  mergedContent: ParsedResume
  appliedCount: number
  skippedCount: number
  warnings: MergeWarning[]
}

export interface MergeWarning {
  suggestionId: string
  reason: string // e.g., "Target section not found"
}
```

**Responsibilities:**
- Load parsed resume data from scan
- Fetch all suggestions for the scan
- Filter for `status = 'accepted'`
- Apply each suggestion in order (by `created_at`)
- Handle edge cases (missing targets, conflicts)
- Return merged resume structure ready for PDF/DOCX generation

#### 2. Merge Operations Module: `lib/generators/merge-operations.ts`

**Helper functions for each suggestion type:**

```typescript
// Bullet point rewrite
export function applyBulletRewrite(
  resumeData: ParsedResume,
  bulletId: string,
  newText: string
): ParsedResume

// Skill expansion
export function applySkillExpansion(
  resumeData: ParsedResume,
  skillId: string,
  expandedText: string
): ParsedResume

// Removal
export function applyRemoval(
  resumeData: ParsedResume,
  targetPath: string // e.g., "experience[0].bullets[2]"
): ParsedResume

// Action verb suggestion
export function applyActionVerbChange(
  resumeData: ParsedResume,
  bulletId: string,
  oldVerb: string,
  newVerb: string
): ParsedResume
```

**Each function:**
- Takes immutable input (returns new copy)
- Validates target exists before applying
- Returns modified structure or throws specific error with context
- Maintains all other data unchanged

#### 3. Server Action: `actions/export.ts`

Add function to coordinate merge:

```typescript
export async function generateMergedResume(
  scanId: string
): Promise<ActionResponse<ParsedResume>> {
  // 1. Fetch scan with resume_data
  // 2. Fetch all suggestions for scan
  // 3. Call mergeResumeContent()
  // 4. Return merged content or error
}
```

**This action is called by:**
- Story 6-2 (PDF generation): `generateMergedResume()` → feed to PDF generator
- Story 6-3 (DOCX generation): `generateMergedResume()` → feed to DOCX generator
- Story 6-4 (Download UI): Triggers merge before format selection

### Implementation Steps (for dev-story workflow)

1. **Create `lib/generators/merge.ts`**
   - Define types and main `mergeResumeContent()` function
   - Implement orchestration logic: fetch scan + suggestions → filter accepted → apply in order

2. **Create `lib/generators/merge-operations.ts`**
   - Implement helper functions for each suggestion type
   - Add immutable update logic (spread operators, array manipulations)
   - Add validation and error handling per operation

3. **Add merge coordination to `actions/export.ts`**
   - Create `generateMergedResume()` server action
   - Validate scanId, fetch data, call merge, return result

4. **Add Tests**
   - Unit tests for each merge operation (bullet rewrite, skill expansion, removal)
   - Integration test: Full merge with mixed accepted/rejected suggestions
   - Edge case: Missing targets, conflicting suggestions, empty suggestion list

5. **Validation**
   - Ensure merged data maintains structure of original `ParsedResume`
   - Verify no data loss (all sections preserved except explicitly removed)
   - Check that rejected suggestions don't appear in output

---

## Data Model Reference

### Resume Data Structure (from `resume_data` column)

```typescript
interface ParsedResume {
  contact: {
    name: string
    email: string
    phone?: string
    location?: string
    website?: string
  }
  summary?: string
  experience: {
    company: string
    title: string
    startDate: string
    endDate?: string
    bullets: {
      id: string
      text: string
    }[]
  }[]
  education: {
    school: string
    degree: string
    field: string
    graduationDate: string
  }[]
  skills: {
    id: string
    category?: string
    items: string[]
  }[]
  projects?: {
    name: string
    description: string
    link?: string
  }[]
}
```

### Suggestions Table Structure

```typescript
interface ScanSuggestion {
  id: string
  scan_id: string
  suggestion_id: string // References suggestions table
  suggestion_data: {
    type: 'bullet_rewrite' | 'skill_expansion' | 'action_verb_suggestion' | 'removal'
    targetId: string // e.g., "bullet_123", "skill_45"
    beforeText: string
    afterText: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
```

---

## Project Context & Constraints

**From project-context.md:**
- Server Actions: Always return `{ data: T, error: null }` or `{ data: null, error: {...} }`
- Never throw from Server Actions
- Use Zod validation for inputs
- Immutable data operations (functional patterns preferred)
- All Supabase access through `lib/supabase/server.ts` in server context

**From Architecture:**
- Resume data flows: Parse → Analyze → Suggest → Merge → Export
- Merge is the gateway between suggestion system and export system
- Performance: Merge should be fast (<500ms) for responsive UI

**From Previous Stories (Epic 5):**
- Suggestions are stored with `beforeText`, `afterText`, `type`
- Suggestions UI (Story 5-9) allows accept/reject
- Database schema: `scan_suggestions.status` tracks user decisions
- No validation needed on merge—trust that parsed data is valid from Story 3-3

---

## Testing Strategy

### Unit Tests: `__tests__/lib/generators/merge-operations.test.ts`

```typescript
describe('Merge Operations', () => {
  describe('applyBulletRewrite', () => {
    it('replaces bullet text at correct position', () => { ... })
    it('preserves surrounding bullets', () => { ... })
    it('throws when target bullet not found', () => { ... })
  })

  describe('applySkillExpansion', () => {
    it('expands skill while preserving others', () => { ... })
    it('maintains skill list order', () => { ... })
  })

  describe('applyRemoval', () => {
    it('removes specified content', () => { ... })
    it('cleans up empty sections', () => { ... })
  })
})
```

### Integration Tests: `__tests__/actions/export.test.ts`

```typescript
describe('generateMergedResume', () => {
  it('merges all accepted suggestions into output', () => { ... })
  it('ignores rejected suggestions', () => { ... })
  it('returns original data when no accepted suggestions', () => { ... })
  it('handles mixed accepted/rejected suggestions', () => { ... })
})
```

### Manual QA Checklist

- [ ] Create scan with multiple suggestions of different types
- [ ] Accept mix of suggestion types (bullet rewrites, skills, removals)
- [ ] Reject some suggestions
- [ ] Call `generateMergedResume()` and verify merged output
- [ ] Compare merged output with manual expectation
- [ ] Verify original parsed data unchanged (immutability)
- [ ] Test edge case: No suggestions accepted (should return original)

---

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `lib/generators/merge.ts` | NEW | Core merge orchestration |
| `lib/generators/merge-operations.ts` | NEW | Suggestion type handlers |
| `actions/export.ts` | ADD | `generateMergedResume()` function |
| `__tests__/lib/generators/merge-operations.test.ts` | NEW | Unit tests |
| `__tests__/actions/export.test.ts` | NEW | Integration tests |

---

## Dev Notes

### Key Points to Remember

1. **Immutability First:** Every merge operation returns a new copy of resume data. Never mutate original.

2. **Deterministic Ordering:** Apply suggestions by `created_at` timestamp. This ensures consistent results and predictable conflict resolution.

3. **Error Handling:** If a suggestion target doesn't exist (e.g., bullet was deleted), skip it gracefully with a warning log. Don't fail the entire merge.

4. **No Persistence:** The merge result is generated on-demand. Don't save it to the database. It's a transient computed value.

5. **Downstream Consumers:** Stories 6-2 and 6-3 will call `generateMergedResume()` to get export-ready data. Ensure output format is stable.

6. **Type Safety:** Use TypeScript strictly. Define clear types for merged resume and suggestion application results.

### Common Pitfalls to Avoid

- ❌ Mutating the input `resumeData`
- ❌ Throwing errors instead of returning structured errors
- ❌ Persisting merged data to database
- ❌ Not validating that suggestion targets exist
- ❌ Forgetting to handle rejected suggestions (must exclude them)
- ❌ Losing original formatting or structure

### References

- **Parsing Logic:** `lib/parsers/resume.ts` (from Story 3-2)
- **Suggestion Schema:** `lib/validations/suggestions.ts`
- **Previous Story Context:** Story 5-9 (Suggestions Page) shows how suggestions are tracked
- **Export Integration:** See design notes in Stories 6-2, 6-3 for downstream consumption
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md#Data Flow: Parse → Analyze → Suggest → Merge → Export`

---

## Completion Checklist

- [ ] `lib/generators/merge.ts` created with main orchestration
- [ ] `lib/generators/merge-operations.ts` created with all operation handlers
- [ ] `actions/export.ts` updated with `generateMergedResume()` action
- [ ] All suggestion types correctly handled (bullet, skill, removal, action verb)
- [ ] Edge cases handled (missing targets, conflicts, empty suggestions)
- [ ] Immutability verified (original data unchanged)
- [ ] Unit tests pass (merge operations)
- [ ] Integration tests pass (full merge workflow)
- [ ] Manual QA complete (various suggestion combinations tested)
- [ ] No TypeScript errors
- [ ] Story file linked to Stories 6-2, 6-3 for reference

---

**Created:** 2026-01-21
**Ready for Development:** Yes
