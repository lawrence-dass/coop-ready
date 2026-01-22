# Story 9.2: Inference-Based Suggestion Calibration

**Epic:** Epic 9 - Logic Refinement & Scoring Enhancement
**Story Key:** 9-2-inference-based-suggestion-calibration
**Status:** in-progress
**Created:** 2026-01-22
**Priority:** High
**Dependencies:** Story 9.1 (ATS Scoring Recalibration) - COMPLETED ✓

## Development Progress

### Completed Tasks
✅ **Task 1: Create Suggestion Calibrator Utility**
- Created `lib/utils/suggestionCalibrator.ts` with full calibration logic
- 35 unit tests passing (getSuggestionMode, getTargetSuggestionCount, getFocusAreas, urgency boosts, etc.)
- Supports all 4 modes: Transformation, Improvement, Optimization, Validation
- Includes validation, descriptions, and reasoning generation

✅ **Task 4: Update Suggestion Type Definitions**
- Created `lib/types/suggestions.ts` with V1 & V2 suggestion structures
- Type guards for backward compatibility (isCalibrationSuggestion, isLegacySuggestion)
- 14 unit tests passing
- Complete validation functions for urgency, types, and sections

### In Progress
🔄 **Task 2: Update Suggestion Generation Action**
- Next: Integrate calibrator into actions/suggestions.ts
- Will pass calibration context to all suggestion generators

### Pending Tasks
⏳ **Task 3: Update Suggestion Prompts** - Will use calibration context
⏳ **Task 5: Update UI** - Display calibration info to user
⏳ **Task 6: Integration Tests** - End-to-end scenarios

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

## Technical Tasks

### Task 1: Create Suggestion Calibrator Utility
**File:** `lib/utils/suggestionCalibrator.ts`

Create a utility that infers calibration from available signals:

```typescript
type SuggestionMode = 'Transformation' | 'Improvement' | 'Optimization' | 'Validation';
type ExperienceLevel = 'student' | 'career_changer' | 'experienced';

interface CalibrationSignals {
  atsScore: number; // 0-100
  experienceLevel: ExperienceLevel;
  missingKeywordsCount: number;
  quantificationDensity: number; // 0-100
  totalBullets: number;
}

interface CalibrationResult {
  mode: SuggestionMode;
  suggestionsTargetCount: number; // How many suggestions to aim for
  priorityBoosts: {
    keyword: number;     // +/- urgency boost for keyword suggestions
    quantification: number;
    experience: number;
  };
  focusAreas: string[]; // ['keywords', 'quantification', 'leadership', etc]
}

export function calibrateSuggestions(signals: CalibrationSignals): CalibrationResult { }
export function getSuggestionModeDescription(mode: SuggestionMode): string { }
```

**Implementation Notes:**
- Mode determination: Based primarily on ATS score
- Target count: Transformation (8-12), Improvement (5-8), Optimization (3-5), Validation (1-2)
- Priority boosts: +1 to +3 for high-priority, -1 for low-priority
- Focus areas: Based on experience level + gaps identified

**Tests Required:**
- Low ATS (25) → Transformation mode, 8+ target suggestions
- Fair ATS (40) → Improvement mode, 5-8 target suggestions
- Good ATS (60) → Optimization mode, 3-5 target suggestions
- Excellent ATS (80) → Validation mode, 1-2 target suggestions
- Student level → includes project/GPA focus areas
- Career changer → includes skill mapping focus areas
- Experienced → includes leadership focus areas

### Task 2: Update Suggestion Generation Action
**File:** `actions/suggestions.ts` (or location where suggestions are generated)

Integrate calibration into the suggestion generation flow:

```typescript
// In the suggestion generation action:
1. Receive: analysisResult (includes scoreBreakdown from 9.1)
2. Get: userProfile (experience level)
3. Extract: missingKeywordsCount from analysis
4. Calculate: quantificationDensity from scoreBreakdown
5. Call: calibrateSuggestions(signals) → CalibrationResult
6. Pass calibration context to suggestion-generating prompts
7. Apply priority boosters to suggestion urgencies
8. Add suggestionMode and inferenceSignals to each suggestion
9. Filter/order suggestions by calibration.focusAreas
10. Limit total suggestions to calibration.suggestionsTargetCount
```

**Integration Points:**
- Called after analysis is complete (depends on 9.1)
- Passes calibration context to existing suggestion prompts
- Modifies suggestion ordering/filtering
- Adds metadata fields to suggestion output

**Tests Required:**
- Suggestions generated with correct mode metadata
- Suggestion count matches calibration target
- Priority order respects boosters
- Correct focus areas applied per experience level

### Task 3: Update Suggestion Prompts
**Files:**
- `lib/openai/prompts/action-verbs.ts`
- `lib/openai/prompts/bullet-rewrites.ts`
- `lib/openai/prompts/skills-expansion.ts`
- (Other suggestion prompt files)

Each suggestion prompt should accept and use calibration context:

```typescript
// Add to prompt parameters
interface SuggestionPromptContext {
  calibrationMode: SuggestionMode;
  focusAreas: string[];
  userExperienceLevel: ExperienceLevel;
  atsScore: number;
}

// In prompts, e.g., for action verbs:
export function buildActionVerbPrompt(
  bullets: string[],
  jobDescription: string,
  calibrationContext: SuggestionPromptContext
): string {
  // If mode is "Transformation", be more aggressive about changes
  // If mode is "Validation", focus on excellence not correction
  // If experienceLevel is "student", focus on learning/project language
  // If experienceLevel is "experienced", focus on leadership/scope
}
```

**Changes per Prompt:**
- **Action Verbs:** Intensity of suggestions varies by mode; language style varies by experience level
- **Bullet Rewrites:** Transformation mode rewrites more aggressively; Validation mode focuses on polish
- **Skills Expansion:** Student mode emphasizes "learn these"; Experienced mode emphasizes "deepen these"
- **Quantification:** Priority varies based on missing keywords and quantification density
- **Format/Content Removal:** Transformation mode more aggressive; Validation mode conservative

**Tests Required:**
- Prompts use calibration context correctly
- Output varies appropriately by mode
- Output reflects experience level appropriately

### Task 4: Update Suggestion Type Definition
**File:** `lib/types/suggestions.ts`

Add new fields to suggestion types:

```typescript
interface Suggestion {
  // ... existing fields ...
  id: string;
  type: string; // 'action_verb', 'bullet_rewrite', etc
  section: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';

  // NEW FIELDS:
  suggestionMode: SuggestionMode;
  inferenceSignals: {
    atsScore: number;
    experienceLevel: ExperienceLevel;
    missingKeywordsCount: number;
    quantificationDensity: number;
  };
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
  calibration: {
    mode: SuggestionMode;
    targetCount: number;
    focusAreas: string[];
  };
}
```

**Tests Required:**
- Type validation for new fields
- Serialization/deserialization works
- Database schema supports new fields if persisting

### Task 5: Update UI to Display Calibration Info
**File:** `app/(dashboard)/scan/[scanId]/suggestions/page.tsx` (or relevant suggestions display component)

Optionally surface calibration information to user:

```typescript
// Display:
- "We identified [X] key areas for improvement" (based on mode)
- "Your resume would benefit from: [focus areas]" (based on inferenceSignals)
- Visual indicator of suggestion intensity (mode: Transformation/Improvement/Optimization/Validation)
- Explanation: "Suggestions calibrated based on your ATS score, experience level, and resume gaps"
```

**UI Changes (Optional but Recommended):**
- Add calibration summary card at top of suggestions
- Show "Suggestion Focus" indicator (what the system is prioritizing)
- Display mode as badge or text
- Explain why certain suggestions are prioritized

**Tests Required:**
- Calibration info displays correctly
- No console errors
- Responsive on mobile

### Task 6: Integration Testing
**File:** `tests/integration/suggestionCalibration.test.ts`

End-to-end tests for complete calibration flow:

```typescript
// Test scenarios:
1. Low ATS + Student → Transformation mode, project-focused suggestions
2. Fair ATS + Career Changer → Improvement mode, skill-mapping-focused
3. Good ATS + Experienced → Optimization mode, leadership-focused
4. Excellent ATS + Any level → Validation mode, minimal suggestions
5. Low ATS + High keyword gaps → Keyword suggestions prioritized
6. High quantification density + Low ATS → Fewer quantification prompts
```

**Coverage:**
- End-to-end flow from analysis → calibration → suggestions
- All mode transitions
- All experience level combinations
- Edge cases (very low/high ATS, extreme keyword gaps)

---

## Definition of Done

- [ ] Suggestion Calibrator utility created and tested
- [ ] Suggestion generation action updated to use calibration
- [ ] All suggestion prompts updated to accept calibration context
- [ ] Suggestion type includes new metadata fields
- [ ] UI optionally displays calibration information
- [ ] Integration tests cover all calibration scenarios
- [ ] All acceptance criteria pass
- [ ] No TypeScript errors or console warnings
- [ ] Code review approved (via `/bmad:bmm:workflows:code-review`)
- [ ] Story status updated to "done" in sprint-status.yaml
- [ ] Changes committed to `9-2-inference-based-suggestion-calibration` branch

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

**Tasks 1-2:** Foundation & Integration - ~4-5 hours
**Task 3:** Prompt Updates - ~3-4 hours (depends on number of prompts)
**Task 4:** Type Updates - ~1-2 hours
**Task 5:** UI (optional) - ~2-3 hours
**Task 6:** Integration Tests - ~2-3 hours

**Total:** ~12-17 hours

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
