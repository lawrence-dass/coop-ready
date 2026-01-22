# Story 10.1: Fix Suggestion Generation Flow (CRITICAL)

**Epic:** Epic 10 - Quality Fixes & Claude Migration
**Story Key:** 10-1-fix-suggestion-generation-flow
**Status:** ready-for-dev
**Created:** 2026-01-22
**Priority:** Critical
**Dependencies:** None (blocking issue)

---

## Story Summary

As a **user with a 62% ATS score**,
I want **to see actionable suggestions for improving my resume**,
So that **I can optimize my resume to increase my ATS score**.

---

## Problem Statement

**Current Behavior:**
- User uploads resume → Analysis runs → ATS score = 62%
- User navigates to suggestions page
- Message shows: "No suggestions found! Your resume is already optimized"
- Zero suggestions displayed (0 pending, 0 accepted, 0 rejected)

**Expected Behavior:**
- For ATS score 62% (mode: "Optimization"), 3-5 targeted suggestions should appear
- Suggestions should focus on polish and refinement
- User should see actionable improvement recommendations

**Root Cause:**
The suggestion generation functions in `actions/suggestions.ts` exist and work correctly, but are **never called** anywhere in the application flow. Analysis completes, but no code triggers `generateAllSuggestionsWithCalibration()`.

---

## Acceptance Criteria

### AC1: Automatic Suggestion Generation After Analysis
**Given** an analysis completes successfully
**When** the scan status changes to 'completed'
**Then** suggestion generation is triggered automatically
**And** suggestions are saved to the database
**And** log shows suggestion count generated

**Test:** Run analysis → Check suggestions table has rows for that scan_id

---

### AC2: Calibrated Suggestions Based on ATS Score
**Given** ATS score is 62% (Optimization mode)
**When** suggestions are generated
**Then** 3-5 targeted suggestions appear
**And** suggestions have appropriate urgency (mostly "medium")
**And** focus areas match experience level

**Test:** 62% score → Suggestions page shows 3-5 items

---

### AC3: High Score Validation Mode
**Given** ATS score is 90%+
**When** suggestions are generated
**Then** minimal suggestions (0-2) appear
**And** message accurately reflects "well-optimized" status

**Test:** 90% score → 0-2 suggestions, positive messaging

---

### AC4: Low Score Transformation Mode
**Given** ATS score is below 30%
**When** suggestions are generated
**Then** more aggressive suggestions (8-12) appear
**And** urgency flags are higher
**And** comprehensive rewrites included

**Test:** 25% score → 8+ suggestions with "high" urgency

---

### AC5: Error Handling
**Given** suggestion generation fails
**When** user visits suggestions page
**Then** a helpful error message appears (not "already optimized")
**And** retry option is available

**Test:** Simulate failure → User sees "Error generating suggestions. Retry?"

---

### AC6: Fix Misleading Empty State Message
**Given** suggestions were never generated (not just empty)
**When** user visits suggestions page with 0 suggestions
**Then** message does NOT say "already optimized"
**And** message indicates generation in progress or error

**Test:** Empty DB + <90% score → Message is NOT "optimized"

---

## Tasks & Subtasks

- [ ] **Task 1: Add Suggestion Generation to Analysis Flow** (AC: 1, 2, 3, 4)
  - [ ] 1.1 In `actions/analysis.ts`, after line 470 (successful completion)
  - [ ] 1.2 Extract bullet points from `bullets` variable (already extracted)
  - [ ] 1.3 Extract skills from `resume.parsed_sections`
  - [ ] 1.4 Extract JD keywords from `keywordAnalysis.keywordsFound/Missing`
  - [ ] 1.5 Map `profile.experienceLevel` to suggestion calibration
  - [ ] 1.6 Call `generateAllSuggestionsWithCalibration()` with context
  - [ ] 1.7 Call `saveSuggestions()` to persist results
  - [ ] 1.8 Add error handling (log but don't fail analysis)
  - [ ] 1.9 Add console logging for debugging

- [ ] **Task 2: Create Helper Function for Context Extraction** (AC: 1, 2)
  - [ ] 2.1 Create `extractSuggestionContext()` helper in analysis.ts
  - [ ] 2.2 Extract skills array from parsed_sections
  - [ ] 2.3 Extract detected fields for format suggestions
  - [ ] 2.4 Calculate experience years from profile
  - [ ] 2.5 Build complete context object for suggestion generator

- [ ] **Task 3: Fix Empty State Messaging** (AC: 5, 6)
  - [ ] 3.1 Find suggestions page component showing "already optimized"
  - [ ] 3.2 Add check: if ATS score < 90% AND suggestions = 0, don't show "optimized"
  - [ ] 3.3 Add loading/generating state message
  - [ ] 3.4 Add error state with retry button
  - [ ] 3.5 Keep "optimized" message only for genuinely high scores

- [ ] **Task 4: Add Retry Mechanism** (AC: 5)
  - [ ] 4.1 Add "Retry Generation" button to empty state
  - [ ] 4.2 Create client action to trigger regeneration
  - [ ] 4.3 Show loading state during regeneration
  - [ ] 4.4 Refresh suggestions after completion

- [ ] **Task 5: Testing** (AC: 1-6)
  - [ ] 5.1 Unit test: extractSuggestionContext helper
  - [ ] 5.2 Integration test: analysis → suggestions generated
  - [ ] 5.3 Test various ATS score ranges (30%, 50%, 70%, 90%)
  - [ ] 5.4 Test error handling when generation fails
  - [ ] 5.5 E2E: Upload resume → Analysis → Suggestions appear

---

## Technical Reference

### Files to Modify

**Primary:**
- `actions/analysis.ts` - Add suggestion generation after line 470
- `app/(dashboard)/analysis/[scanId]/suggestions/page.tsx` - Fix empty state

**Reference (no changes needed):**
- `actions/suggestions.ts` - Contains `generateAllSuggestionsWithCalibration()`
- `lib/utils/suggestionCalibrator.ts` - Calibration logic works correctly

### Context Extraction Mapping

```typescript
// Available in runAnalysis() after line 470:
const suggestionContext = {
  scanId: parsed.data.scanId,
  resumeText: resume.extracted_text,
  bulletPoints: bullets, // Already extracted at line 321
  skills: extractSkillsFromParsedSections(resume.parsed_sections),
  experienceLevel: profile.experienceLevel,
  targetRole: profile.targetRole,
  isStudent: profile.experienceLevel === 'student',
  jdKeywords: [...keywordAnalysis.keywordsFound, ...keywordAnalysis.keywordsMissing],
  jdContent: scan.job_description,
  detectedFields: extractDetectedFields(resume.parsed_sections),
  experienceYears: mapExperienceLevelToYears(profile.experienceLevel),
  isInternationalStudent: false, // From profile if available
  resumePages: 1, // Estimate or calculate
}
```

### Calibration Reference (from Story 9.2)

| ATS Score | Mode | Suggestion Count | Focus |
|-----------|------|------------------|-------|
| 0-30 | Transformation | 8-12 | Aggressive rewrites |
| 30-50 | Improvement | 5-8 | Gap-focused |
| 50-70 | Optimization | 3-5 | Polish & refinement |
| 70+ | Validation | 0-2 | Minimal tweaks |

---

## Definition of Done

- [ ] Suggestions generated automatically after analysis completes
- [ ] 62% ATS score shows 3-5 suggestions (not zero)
- [ ] 90%+ ATS score shows "optimized" message correctly
- [ ] <30% ATS score shows 8+ aggressive suggestions
- [ ] Empty state message fixed (no false "optimized")
- [ ] Error handling with retry option
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual QA: upload → analyze → suggestions appear

---

## Implementation Notes

**Why integrate in `actions/analysis.ts`?**
- All required context (bullets, keywords, profile) is already available
- Single transaction: analysis + suggestions together
- No extra page load or API call needed
- Suggestions ready when user navigates

**Alternative considered (lazy generation in suggestions page):**
- Rejected because: slower UX, user sees empty state first
- Could add as fallback for edge cases

---
