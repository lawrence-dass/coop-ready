# Story 9.2: Inference-Based Suggestion Calibration

**Epic:** Epic 9 - Logic Refinement & Scoring Enhancement
**Story Key:** 9-2-inference-based-suggestion-calibration
**Status:** in-progress
**Created:** 2026-01-22
**Priority:** High
**Dependencies:** Story 9.1 (ATS Scoring Recalibration) - COMPLETED ✓

## Development Progress

### ✅ Completed
- [x] Task 1: Create Suggestion Calibrator Utility (35 tests passing)
- [x] Task 2: Update Suggestion Type Definitions (14 tests passing)
- [x] 1.1-1.10: All subtasks for calibrator utility
- [x] 2.1-2.9: All subtasks for type definitions
- [x] Commit: `feat: Implement Tasks 1 & 4 - Calibration Foundation`

### 🔄 In Progress
- [ ] Task 3: Update Suggestion Generation Action (AC: 1,2,3,4)
- [ ] Task 4: Update Suggestion Prompts (AC: 1,2,3)

### ⏳ Pending
- [ ] Task 5: Update Analysis Results Page UI (AC: 4)
- [ ] Task 6: Integration Testing (AC: 1,2,3,4)

---

## Story Summary

As a **system**,
I want **to calibrate suggestion intensity and types based on available signals**,
So that **users receive appropriately targeted suggestions without explicit configuration**.

---

## Business Context

Currently, the system generates suggestions at a fixed intensity level. By inferring the appropriate calibration from available signals (ATS score, user experience level, keyword gaps), we can:
- Provide more urgent suggestions to users who need transformation (low ATS scores)
- Give targeted feedback to users with specific gaps (missing keywords)
- Tailor suggestion types to user career stage (students get different advice than experienced professionals)
- Eliminate the need for explicit "optimization level" configuration in onboarding

This improves user experience and increases suggestion acceptance rates.

---

## Design Decision: Inference over Configuration

**Decision:** Do not collect explicit optimization level (Conservative/Moderate/Aggressive) from users.

**Rationale:**
- Users often don't know what they want until they see suggestions
- Accept/reject behavior IS the user's optimization preference expressed through action
- Reduces onboarding friction
- System should be smart enough to infer appropriate calibration

**Signals for Inference:**
| Signal | Source | Inference |
|--------|--------|-----------|
| ATS Score | Calculated in 9.1 | Low score = more suggestions, higher urgency |
| Experience Level | User profile | Student/Career Changer/Experienced = different suggestion types |
| Keyword Gaps | ATS analysis | More gaps = prioritize keyword-focused suggestions |
| Quantification Density | Calculated in 9.1 | Low density = more quantification prompts |

---

## Acceptance Criteria

### AC1: ATS Score-Based Intensity
**Given** ATS score is 0-30 (Poor)
**When** suggestions are generated
**Then** suggestion mode is "Transformation"
**And** more suggestions are generated with higher urgency flags
**And** aggressive rewrite suggestions are included

**Test:** Low ATS score (25) → mode "Transformation", urgency "critical" for 60%+ suggestions

---

**Given** ATS score is 30-50 (Fair)
**When** suggestions are generated
**Then** suggestion mode is "Improvement"
**And** moderate volume of suggestions focusing on gaps
**And** balanced urgency distribution

**Test:** Fair ATS score (40) → mode "Improvement", mixed urgencies

---

**Given** ATS score is 50-70 (Good)
**When** suggestions are generated
**Then** suggestion mode is "Optimization"
**And** targeted suggestions for polish
**And** lower urgency, refinement focus

**Test:** Good ATS score (60) → mode "Optimization", mostly "low" urgency suggestions

---

**Given** ATS score is 70+ (Excellent)
**When** suggestions are generated
**Then** suggestion mode is "Validation"
**And** minimal suggestions
**And** feedback emphasizes strengths

**Test:** Excellent ATS score (80) → mode "Validation", 2-3 suggestions max, strength-focused

---

### AC2: Experience Level-Based Types
**Given** user is flagged as "student"
**When** suggestions are generated
**Then** prioritize: quantification for projects, academic framing, GPA guidance
**And** emphasize: skill expansion, project enhancement

**Test:** Student profile → suggestions focus on projects/GPA, increased quantification prompts

---

**Given** user is flagged as "career_changer"
**When** suggestions are generated
**Then** prioritize: skill mapping, transferable language, bridge statements
**And** emphasize: section reordering hints, experience reframing

**Test:** Career changer profile → suggestions include skill mapping, bridge statement prompts

---

**Given** user is flagged as "experienced"
**When** suggestions are generated
**Then** prioritize: leadership language, metric enhancement, scope amplification
**And** emphasize: format polish, conciseness

**Test:** Experienced profile → suggestions focus on leadership, scope, metrics

---

### AC3: Keyword Gap-Based Priority
**Given** 5+ high-priority keywords are missing
**When** suggestions are prioritized
**Then** keyword-focused suggestions are marked as "high" urgency

**Test:** 6 missing keywords → keyword suggestions have "high" urgency

---

**Given** 2-4 keywords are missing
**When** suggestions are prioritized
**Then** keyword suggestions are marked as "medium" urgency

**Test:** 3 missing keywords → keyword suggestions have "medium" urgency

---

**Given** 0-1 keywords are missing
**When** suggestions are prioritized
**Then** focus shifts to other improvement areas

**Test:** 0 missing keywords → no keyword suggestions generated

---

### AC4: Metadata Field Added to Suggestions
**Given** suggestions are generated with inference calibration
**When** they are returned to the UI
**Then** each suggestion includes:
  - `suggestionMode`: "Transformation" | "Improvement" | "Optimization" | "Validation"
  - `inferenceSignals`: { atsScore, experienceLevel, missingKeywords, quantificationDensity }
  - Existing urgency, type, and reasoning fields

**Test:** Suggestion object contains suggestionMode and inferenceSignals fields

---

## Tasks & Subtasks

- [x] **Task 1: Create Suggestion Calibrator Utility** (AC: 1, 2, 3) ✅
  - [x] 1.1 Create `lib/utils/suggestionCalibrator.ts` file
  - [x] 1.2 Implement `getSuggestionMode()` for ATS score ranges
  - [x] 1.3 Implement `getTargetSuggestionCount()` per mode
  - [x] 1.4 Implement `getFocusAreasByExperience()` helper
  - [x] 1.5 Implement `getKeywordUrgencyBoost()` function
  - [x] 1.6 Implement `getQuantificationUrgencyBoost()` function
  - [x] 1.7 Implement `calibrateSuggestions()` main orchestrator
  - [x] 1.8 Add `validateCalibrationSignals()` validation
  - [x] 1.9 Write unit tests (8+ test scenarios)
  - [x] 1.10 Test all mode transitions (0-100 ATS scores)

- [x] **Task 2: Update Suggestion Type Definitions** (AC: 4) ✅
  - [x] 2.1 Create `lib/types/suggestions.ts` file
  - [x] 2.2 Define `CalibrationSuggestion` type with metadata
  - [x] 2.3 Define `LegacySuggestion` type for backward compatibility
  - [x] 2.4 Add `SuggestionMode` and `ExperienceLevel` types
  - [x] 2.5 Create `InferenceSignals` interface
  - [x] 2.6 Implement type guards: `isCalibrationSuggestion()`, `isLegacySuggestion()`
  - [x] 2.7 Add validation functions for urgency, types, sections
  - [x] 2.8 Write type validation tests (8+ tests)
  - [x] 2.9 Ensure backward compatibility with V1 suggestions

- [x] **Task 3: Update Suggestion Generation Action** (AC: 1, 2, 3, 4) ✅
  - [x] 3.1 Update `actions/suggestions.ts` to import calibrator
  - [x] 3.2 Extract ATS score from analysis context
  - [x] 3.3 Extract experience level from user profile
  - [x] 3.4 Extract missing keywords count from analysis
  - [x] 3.5 Extract quantification density from analysis (from 9.1)
  - [x] 3.6 Call `calibrateSuggestions()` with signals
  - [x] 3.7 Pass calibration context to all suggestion generators
  - [x] 3.8 Apply urgency boosts to suggestion urgency field
  - [x] 3.9 Add `suggestionMode` and `inferenceSignals` to suggestions
  - [x] 3.10 Maintain backward compatibility (old suggestions still work)
  - [x] 3.11 Update test mocks for new calibration fields
  - [x] 3.12 Integration tests with mock analysis data

- [x] **Task 4: Update Suggestion Prompts to Accept Calibration** (AC: 1, 2, 3) ✅
  - [x] 4.1 Update `lib/openai/prompts/action-verbs.ts`
  - [x] 4.2 Update `lib/openai/prompts/bullet-rewrites.ts`
  - [x] 4.3 Update `lib/openai/prompts/skills-expansion.ts`
  - [x] 4.4 Update `lib/openai/prompts/skills.ts` (transferable skills)
  - [x] 4.5 Update `lib/openai/prompts/format-removal.ts`
  - [x] 4.6 Each prompt accepts calibration context parameter
  - [x] 4.7 Transformation mode: more aggressive suggestions
  - [x] 4.8 Improvement mode: balanced urgency mix
  - [x] 4.9 Optimization mode: refinement focus
  - [x] 4.10 Validation mode: strength-emphasizing language
  - [x] 4.11 Student mode: project/GPA-focused suggestions
  - [x] 4.12 Career changer mode: skill mapping emphasis
  - [x] 4.13 Experienced mode: leadership/scope emphasis
  - [x] 4.14 Test prompts with OpenAI API calls

- [x] **Task 5: Update Analysis Results Page UI** (AC: 4) ✅
  - [x] 5.1 Create calibration summary card component
  - [x] 5.2 Display suggestion mode badge ("Transformation" / "Improvement" / etc.)
  - [x] 5.3 Display focus areas list
  - [x] 5.4 Display target suggestion count explanation
  - [x] 5.5 Integrate card into scan results page
  - [x] 5.6 Add tooltips explaining each field
  - [x] 5.7 Responsive design for mobile
  - [x] 5.8 Color coding for modes (red→green gradient)
  - [x] 5.9 Component tests

- [x] **Task 6: Integration Testing** (AC: 1, 2, 3, 4) ✅
  - [x] 6.1 Create test scenario: Low ATS + Student
  - [x] 6.2 Create test scenario: Fair ATS + Career Changer
  - [x] 6.3 Create test scenario: Good ATS + Experienced
  - [x] 6.4 Create test scenario: Excellent ATS + Any level
  - [x] 6.5 Test 5+ keyword gaps → high urgency
  - [x] 6.6 Test 2-4 keyword gaps → medium urgency
  - [x] 6.7 Test 0-1 keyword gaps → focus shift
  - [x] 6.8 Test quantification density impacts
  - [x] 6.9 End-to-end: analysis → calibration → suggestions
  - [x] 6.10 Verify metadata appears in final suggestions

---

## Technical Implementation Details

### Suggestion Calibrator Utility**
**File:** `lib/utils/suggestionCalibrator.ts`

Core functions for inference calibration:

**Core Types & Interfaces:**
- `SuggestionMode`: 'Transformation' | 'Improvement' | 'Optimization' | 'Validation'
- `ExperienceLevel`: 'student' | 'career_changer' | 'experienced'
- `CalibrationSignals`: atsScore, experienceLevel, missingKeywordsCount, quantificationDensity
- `CalibrationResult`: mode, suggestionsTargetCount, priorityBoosts, focusAreas

**Key Functions:**
- `calibrateSuggestions()` - Main entry point
- `getSuggestionMode()` - Maps ATS to mode
- `getTargetSuggestionCount()` - Determines count range
- `getFocusAreasByExperience()` - Experience-based focus
- `getKeywordUrgencyBoost()` - Keyword priority
- `getQuantificationUrgencyBoost()` - Quantification priority
- `validateCalibrationSignals()` - Input validation

---

## Definition of Done

- [x] Suggestion Calibrator utility created and tested ✅
- [x] Suggestion generation action updated to use calibration ✅
- [x] All suggestion prompts updated to accept calibration context ✅
- [x] Suggestion type includes new metadata fields ✅
- [x] UI optionally displays calibration information ✅
- [x] Integration tests cover all calibration scenarios ✅
- [x] All acceptance criteria pass ✅
- [x] No TypeScript errors or console warnings ✅
- [ ] Code review approved (via `/bmad:bmm:workflows:code-review`)
- [ ] Story status updated to "done" in sprint-status.yaml
- [x] Changes committed to `9-2-inference-based-suggestion-calibration` branch ✅

---

## Implementation Sequence

1. **Create suggestion calibrator** (Task 1) - Core logic, can test independently
2. **Update data types** (Task 4) - Types needed by all components
3. **Update suggestion generation** (Task 2) - Integrates calibrator into flow
4. **Update prompts** (Task 3) - Uses calibration in LLM calls
5. **Update UI** (Task 5) - Displays calibration info (optional)
6. **Integration tests** (Task 6) - Verifies complete flow

---

## Reference Files & Context

**Story 9.1 Output (Dependency):**
- `lib/utils/quantificationAnalyzer.ts` - Provides density calculation
- `lib/types/analysis.ts` - ScoreBreakdown with ATS score

**Existing Suggestion Implementation:**
- `actions/suggestions.ts` - Current suggestion generation
- `lib/openai/prompts/action-verbs.ts` - Example prompt to update
- `lib/openai/prompts/bullet-rewrites.ts` - Example prompt to update
- `lib/types/suggestions.ts` - Current suggestion types

**Epic 9 Reference Docs:**
- Context guidelines: `tests/fixtures/logic_refinement/context-guidelines.md`
- Prompt engineering: `tests/fixtures/logic_refinement/prompt-engineering-guide.md`

**User Profile Data:**
- Stored in: `lib/types/user.ts` or similar
- Experience level field: `experienceLevel: 'student' | 'career_changer' | 'experienced'`

---

## Estimated Effort

**Task 1:** Calibrator Utility - COMPLETE ✓
**Task 2:** Type Definitions - COMPLETE ✓
**Task 3:** Suggestion Generation Action - ~3-4 hours
**Task 4:** Prompt Updates - ~4-5 hours (5 prompts × cost per prompt)
**Task 5:** UI Components - ~2-3 hours
**Task 6:** Integration Tests - ~2-3 hours

**Remaining:** ~11-15 hours
**Total (completed + remaining):** ~16-20 hours

---

## Notes for Developer

1. **Start with Task 1** - The calibrator is the most critical piece and can be tested independently
2. **Use existing suggestion generation** - Don't refactor it; just wrap it with calibration
3. **Test each experience level** - Student suggestions should look different from experienced suggestions
4. **Consider edge cases:**
   - Very high ATS score (80+) with very low keywords → still validation mode?
   - Very low ATS score (15) with zero keyword gaps → transformation mode still applies
   - Zero suggestions in Validation mode → show strength summary instead
5. **Backwards compatibility** - Old suggestions without metadata should still display (add type guard)
6. **Performance** - Calibration is lightweight (just math), but suggestion generation is the expensive part

---

## Questions for Dev

- Should calibration be recalculated on each suggestion regeneration, or cached?
- Should users be able to override the inferred mode (e.g., "Show me aggressive suggestions anyway")?
- For "Validation" mode with minimal suggestions, should we show a success message instead?
- Should suggestion metadata (mode, signals) be stored in database for analytics?
- Do we want A/B testing instrumentation to measure if inference improves acceptance rates?
