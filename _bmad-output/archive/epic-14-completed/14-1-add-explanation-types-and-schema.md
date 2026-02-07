# Story 14.1: Add Explanation Types and Schema

**Status:** done

**Epic:** Epic 14: Explanation Output (V0.5)

---

## Story

As a developer,
I want the type definitions updated to include explanation fields,
So that suggestions can carry reasoning information.

---

## Acceptance Criteria

1. **Given** the existing suggestion types (`SummarySuggestion`, `SkillsSuggestion`, `ExperienceSuggestion`, `BulletSuggestion`)
   **When** I need to access explanation data
   **Then** each suggestion type includes an optional `explanation?: string` field

2. **Given** the updated types
   **When** I create a suggestion with an explanation
   **Then** the explanation is a 1-2 sentence string explaining why the change helps

3. **Given** the session storage schema
   **When** I save suggestions to session
   **Then** the session storage schema accepts the new field

4. **Given** the existing suggestion handling
   **When** the types are updated
   **Then** no breaking changes to existing suggestion handling

---

## Tasks / Subtasks

- [x] Update SummarySuggestion type to include optional explanation field (AC: #1)
  - [x] Locate definition in `/types` (likely `types/index.ts` or `types/suggestions.ts`)
  - [x] Add `explanation?: string` to type definition
  - [x] Verify TypeScript compiles without errors

- [x] Update SkillsSuggestion type (AC: #1)
  - [x] Add `explanation?: string` field
  - [x] Verify consistency with other suggestion types

- [x] Update ExperienceSuggestion type (AC: #1)
  - [x] Add `explanation?: string` field
  - [x] Consider if individual BulletSuggestion items also need explanation

- [x] Update BulletSuggestion type if applicable (AC: #1)
  - [x] Determine if bullets need individual explanations or parent role explanation
  - [x] Update accordingly

- [x] Update session storage Zod schemas (AC: #3)
  - [x] Locate session schema validation (likely in `/lib/validations/`)
  - [x] Update schema to accept optional `explanation` field for each suggestion type
  - [x] Test schema validation with and without explanation field
  - Note: No Zod schemas exist - session storage uses JSON directly with TypeScript types

- [x] Test backward compatibility (AC: #4)
  - [x] Verify existing suggestions without explanation field still parse correctly
  - [x] Test that omitted explanation field doesn't break UI rendering
  - [x] Verify session reload handles suggestions without explanations

- [x] Create migration test (optional but recommended)
  - [x] Add unit test to verify old session data (without explanations) migrates correctly
  - [x] Test new session data saves with explanations

---

## Dev Notes

### Architecture Patterns & Constraints

**Type System:**
- All suggestion types MUST extend or follow common interface pattern (check existing `SummarySuggestion` etc.)
- Use TypeScript strict mode (already enabled in project)
- Explanation field should be OPTIONAL to maintain backward compatibility
- Field naming: camelCase for TypeScript types

**Validation:**
- Use Zod schemas from `/lib/validations/` for runtime validation
- Explanation field validation: `z.string().optional()` or `z.string().max(500).optional()`
- Session schema must validate new field but NOT require it (backward compat)

**State Management:**
- Zustand store in `/store/` already persists suggestions
- Store action setters should accept new explanation field
- No changes needed to store actions—they accept full suggestion objects

[Source: project-context.md#API-Patterns, project-context.md#Zustand-Store-Pattern]

### File Structure Requirements

```
/types/
  └─ index.ts (or suggestions.ts)        ← Update SummarySuggestion, SkillsSuggestion, ExperienceSuggestion, BulletSuggestion
/lib/validations/
  └─ session.ts (or similar)             ← Update session schema Zod validators
```

Check git for exact file locations in recent commits (story-13-*, story-12-*).

[Source: project-context.md#Directory-Structure-Rules]

### Testing Standards

- TypeScript compilation must succeed (`npm run build`)
- No breaking changes to existing suggestion handling
- Session validation must accept both old (no explanation) and new (with explanation) data
- Unit test: Verify Zod schema accepts optional explanation field

[Source: project-context.md#Critical-Rules]

---

## Previous Story Intelligence

**Story 13.5 (Epic 13 Integration & Verification Testing)** - Most recent completed story:
- All Epic 13 features (jobType, modificationLevel preferences) tested and working
- Preferences dialog persists correctly
- Prompt templates updated for preferences
- No regression in existing optimization flow

**Learning:** Type system and Zod validation are working well. Follow the same pattern for explanation field.

**Git Pattern from Story 13:** Type definitions updated first, then validation schemas, then UI rendering.

---

## Git Intelligence

**Recent Commits Analysis:**
- **d733c97** `feat(story-13-5)`: Integration testing - suggests types+schema changes work when modular
- **f665c30** `feat(story-13-4)`: Prompt templates - shows API/LLM structure is solid
- **ec7173a** `feat(story-13-3)`: UI updates - demonstrates UI rendering of new fields works
- **cb22571** `feat(story-13-2)`: Database migration - shows migration pattern for adding fields

**Code Pattern Identified:** Changes follow pattern: Types → Validation → State → UI. This story is the **Types** phase.

---

## Latest Tech Information

**TypeScript 5.x Best Practices:**
- Use `satisfies` keyword for type checking complex objects (if schema inference needed)
- Optional fields: `explanation?: string` is standard pattern
- No breaking changes needed for existing code using old types (backward compat built-in)

**Zod Schema Best Practices (Latest):**
- Use `.optional()` for optional fields that might not exist in older data
- `.z.string().max(500)` to enforce explanation length (1-2 sentences ~200-500 chars)
- Schema composition: If creating new schema, can extend existing with `.extend()`

---

## Project Context Reference

**Critical Rules to Follow:**
1. **ActionResponse Pattern:** Not directly needed for types, but suggestions flow through this pattern in API
2. **Error Codes:** No new error codes needed for this story
3. **Naming Conventions:** `explanation` (camelCase), suggestion types PascalCase
4. **Directory Structure:** Types in `/types/`, Validation in `/lib/validations/`
5. **TypeScript:** Strict mode enabled - all types must be complete

[Source: _bmad-output/project-context.md]

---

## Story Completion Status

### Implementation Readiness
- ✅ Story is ready for dev implementation
- ✅ All acceptance criteria are clear and testable
- ✅ Architecture patterns established (follow story-13-* for reference)
- ✅ File locations identified
- ✅ Dependencies: None (pure types)
- ✅ Testing approach: TypeScript compilation + Zod schema validation

### Context Provided
- ✅ Project patterns established
- ✅ Type system patterns from recent stories
- ✅ Git history analyzed
- ✅ Validation framework identified
- ✅ Backward compatibility concerns documented

### Next Steps for Dev
1. Review existing suggestion types in `/types/index.ts`
2. Add `explanation?: string` to each type
3. Update Zod schema in `/lib/validations/` to match
4. Run `npm run build` to verify TypeScript
5. Run tests to verify backward compat
6. Commit and open PR for code review

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Plan
Following red-green-refactor TDD cycle:
1. RED: Created failing tests for explanation field backward compatibility
2. GREEN: Added optional `explanation?: string` to all suggestion types
3. REFACTOR: Verified TypeScript compilation and all tests pass

### Debug Log References
- None required - straightforward type addition

### Completion Notes
- ✅ Added `explanation?: string` field to SummarySuggestion, SkillsSuggestion, ExperienceSuggestion, and BulletSuggestion
- ✅ All suggestion types now support optional explanation field
- ✅ TypeScript build passes without errors
- ✅ 1140 unit tests pass; 4 pre-existing failures unrelated to this story (SignOutButton, OAuth callback)
- ✅ Backward compatibility verified - old suggestions without explanation work correctly
- ✅ No Zod schemas needed - session storage uses JSON directly with TypeScript types
- ✅ File header and JSDoc comments standardized during code review

### File List
- `/types/suggestions.ts` (updated all suggestion types + header comment)
- `/tests/unit/types/explanation-field.test.ts` (new test file)
- `/_bmad-output/implementation-artifacts/sprint-status.yaml` (status update)

---

## Change Log

- **2026-01-29**: Added optional `explanation?: string` field to all suggestion types (SummarySuggestion, SkillsSuggestion, ExperienceSuggestion, BulletSuggestion). Created comprehensive backward compatibility tests. All acceptance criteria met.
