# Epic 18: Candidate-Type-Aware Resume Structure

**Status:** Backlog
**Knowledge Base:** `docs/ats-resume-structure-knowledge-base.md`
**Created:** February 2026

---

## Overview

SubmitSmart currently treats all resumes with a fixed 4-section model (Summary, Skills, Experience, Education) and hardcoded UI ordering. The knowledge base defines fundamentally different resume structures for three candidate types. This epic integrates candidate-type-aware section ordering, scoring, suggestions, and UI rendering.

### Three Candidate Types

| Type | Primary Asset | Summary | Resume Length | Section Order |
|------|--------------|---------|---------------|---------------|
| **Co-op/Intern** | Academic projects, coursework | NO (wastes space) | 1 page | Skills → Education → Projects → Experience (if any) → Certs |
| **Full-Time** | Professional experience | Conditional (tailored only) | 1-2 pages | Summary → Skills → Experience → Projects (mid) → Education → Certs |
| **Career Changer** | Master's degree + transferable skills | CRITICAL (bridges narrative) | 1-2 pages | Summary → Skills → Education → Projects → Experience → Certs |

### Current State vs Target

| Capability | Current | Target |
|-----------|---------|--------|
| Candidate types | Binary (coop/fulltime) | Ternary (coop/fulltime/career_changer) |
| Parsed sections | 4 (summary, skills, experience, education) | 6 (+projects, +certifications) |
| Section ordering | Hardcoded in UI | Dynamic per candidate type |
| Structural suggestions | None | Deterministic engine recommending section reordering |
| Summary handling | Always generated | Conditional (skip for co-op, critical for career changer) |
| Projects suggestions | None | Full generator with candidate-type framing |
| Career changer scoring | None | Dedicated weight profile |
| UI tab order | Fixed: Summary → Skills → Experience → Education | Dynamic per candidate type with Projects tab |

---

## Dependency Graph

```
18.1 (Types/Detection) ──┬──→ 18.3 (Ordering/Structural)
                         ├──→ 18.4 (Scoring)
                         ├──→ 18.6 (Suggestion Framing)
                         └──→ 18.7 (Store/DB)

18.2 (6-Section Parsing) ─┬──→ 18.3 (Ordering/Structural)
                          ├──→ 18.5 (Projects Generator)
                          └──→ 18.7 (Store/DB)

18.3 (Ordering/Structural) ──→ 18.8 (UI)
18.4 (Scoring) ──────────────→ 18.9 (Integration)
18.5 (Projects Generator) ───→ 18.8 (UI)
18.6 (Suggestion Framing) ───→ 18.9 (Integration)
18.7 (Store/DB) ─────────────→ 18.8 (UI)
18.8 (UI) ───────────────────→ 18.9 (Integration)
18.9 (Integration) ──────────→ 18.10 (Testing)
```

**Parallel work**: 18.1 + 18.2 can be built simultaneously. 18.4 + 18.5 + 18.6 can be built in parallel once 18.1 is done.

---

## Story 18.1: Candidate Type Detection & Classification

**Goal**: Introduce `CandidateType = 'coop' | 'fulltime' | 'career_changer'` and a multi-signal detection function.

### What Changes
- New file `/lib/scoring/candidateTypeDetection.ts` with `detectCandidateType()`
- Add `CandidateType` type to `/lib/scoring/types.ts`
- Export from `/types/preferences.ts`

### Detection Priority (KB Section 14)
1. User selected `coop` → `'coop'`
2. User selected `fulltime` + onboarding `careerGoal === 'switching-careers'` → `'career_changer'`
3. User selected `fulltime` + resume has active education + < 3 professional roles → potential `'career_changer'`
4. Auto-detect: < 2 roles + active education with expected grad date → `'coop'`
5. Auto-detect: 3+ roles with 3+ years → `'fulltime'`
6. Default: `'fulltime'`

### Interface
```typescript
type CandidateType = 'coop' | 'fulltime' | 'career_changer';

interface CandidateTypeInput {
  userJobType?: JobTypePreference;
  careerGoal?: string;
  resumeRoleCount?: number;
  hasActiveEducation?: boolean;
  totalExperienceYears?: number;
  jdText?: string;
}

interface CandidateTypeResult {
  candidateType: CandidateType;
  confidence: number;
  detectedFrom: 'user_selection' | 'onboarding' | 'resume_analysis' | 'jd_detection' | 'default';
}
```

### Files
- `/lib/scoring/candidateTypeDetection.ts` (NEW)
- `/lib/scoring/types.ts` (MODIFY)
- `/types/preferences.ts` (MODIFY)

### Acceptance Criteria
- [ ] `CandidateType` union type with 3 values exported
- [ ] `detectCandidateType()` handles all 6 priority paths
- [ ] `switching-careers` + `fulltime` = `career_changer`
- [ ] User selection always takes priority over auto-detection
- [ ] Unit tests for all detection paths

### Dependencies
None

---

## Story 18.2: Expand Resume Parsing to 6 Sections

**Goal**: Update the LLM-based parser to extract `projects` and `certifications` alongside the existing 4 sections.

### What Changes
- Expand `ParseResult` and LLM prompt in `/actions/parseResumeText.ts`
- Add `projects?: string` and `certifications?: string` to `Resume` interface
- Expand `ResumeSection` union type

### Parser Prompt Updates
Instruct Claude to recognize:
- **projects**: "Project Experience", "Projects", "Technical Projects", "Academic Projects"
- **certifications**: "Certifications", "Awards", "Awards & Certifications", "Licenses", "Honors"

Key: "Project Experience" entries have project titles + technologies but NO company names (unlike Work Experience).

### Files
- `/actions/parseResumeText.ts` (MODIFY - expand prompt + ParseResult to 6 sections)
- `/types/optimization.ts` (MODIFY - add `projects?`, `certifications?` to Resume; expand `ResumeSection`)

### Acceptance Criteria
- [ ] Parser extracts 6 sections when present
- [ ] "Project Experience" heading parses into `projects` (not `experience`)
- [ ] Resumes without projects/certifications return `null` (no regression)
- [ ] `ResumeSection` includes `'projects'` and `'certifications'`
- [ ] Unit tests with sample resumes containing 6 sections
- [ ] Existing 4-section resumes parse identically (backward compat)

### Dependencies
None (independent of 18.1)

---

## Story 18.3: Section Ordering Engine & Structural Suggestions

**Goal**: Deterministic engine that validates resume section ordering against recommended structure per candidate type and generates structural suggestions.

### What Changes
- New `/lib/scoring/sectionOrdering.ts` with recommended orders + validation
- New `/lib/scoring/structuralSuggestions.ts` for actionable suggestions
- New `StructuralSuggestion` type

### Section Order Definitions (KB Sections 3-4)
```typescript
const RECOMMENDED_ORDER: Record<CandidateType, string[]> = {
  coop: ['skills', 'education', 'projects', 'experience', 'certifications'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience', 'certifications'],
};
```

### Structural Rules

| Rule | Candidate Type | Priority |
|------|---------------|----------|
| Co-op with Experience before Education | coop | high |
| Co-op with no Skills at top | coop | critical |
| Co-op with generic summary present | coop | high |
| "Projects" heading → rename to "Project Experience" | coop | moderate |
| Full-time with Education before Experience | fulltime | high |
| Career changer without summary | career_changer | critical |
| Career changer with Education below Experience | career_changer | high |
| Non-standard section headers | all | moderate |

### Type
```typescript
interface StructuralSuggestion {
  id: string;
  priority: 'critical' | 'high' | 'moderate';
  category: 'section_order' | 'section_heading' | 'section_presence';
  message: string;
  currentState: string;
  recommendedAction: string;
}
```

### Files
- `/lib/scoring/sectionOrdering.ts` (NEW)
- `/lib/scoring/structuralSuggestions.ts` (NEW)
- `/types/suggestions.ts` (MODIFY - add StructuralSuggestion)

### Acceptance Criteria
- [ ] `RECOMMENDED_ORDER` defined for all 3 candidate types
- [ ] `validateSectionOrder()` detects out-of-order sections
- [ ] `generateStructuralSuggestions()` returns actionable suggestions
- [ ] All 8 rules implemented
- [ ] Fully deterministic (no LLM, no network)
- [ ] Unit tests for each rule across all 3 candidate types

### Dependencies
Story 18.1, Story 18.2

---

## Story 18.4: Scoring Weight Alignment & Career Changer Profile

**Goal**: Add career changer weight profile and refine section scoring per knowledge base.

### What Changes
- Add `career_changer` to `ROLE_WEIGHT_ADJUSTMENTS` and `SECTION_CONFIG_V21`
- Wire `CandidateType` through `getComponentWeightsV21()`
- Co-op: don't penalize missing experience when projects are strong; summary `required: false`

### Career Changer Weights (KB Section 6)
```typescript
career_changer: {
  keywords: 0.40,
  qualificationFit: 0.14,
  contentQuality: 0.18,
  sections: 0.18,
  format: 0.10,
}
```

### Career Changer Section Config
```typescript
career_changer: {
  summary: { required: true, minLength: 80, maxPoints: 20 },   // CRITICAL
  skills: { required: true, minItems: 8, maxPoints: 25 },
  experience: { required: true, minBullets: 4, maxPoints: 20 }, // Lower than fulltime (30)
  education: { required: true, minLength: 30, maxPoints: 20 },  // Higher than fulltime (15)
  projects: { required: true, minBullets: 2, maxPoints: 15 },   // Higher than fulltime (10)
  certifications: { required: false, minItems: 1, maxPoints: 10 },
}
```

### Co-op Refinements
- `summary.required` → `false` (KB: "no summary needed")
- Missing experience NOT penalized when `projects` has 3+ bullets

### Files
- `/lib/scoring/constants.ts` (MODIFY - add career_changer, fix co-op summary)
- `/lib/scoring/atsScore.ts` (MODIFY - getComponentWeightsV21 accepts CandidateType)
- `/lib/scoring/sectionScore.ts` (MODIFY - co-op experience waiver, career changer education boost)

### Acceptance Criteria
- [ ] `ROLE_WEIGHT_ADJUSTMENTS.career_changer` weights sum to 1.0
- [ ] `SECTION_CONFIG_V21.career_changer` defined
- [ ] Co-op `summary.required = false`
- [ ] Co-op with no experience but strong projects not penalized
- [ ] Same resume scores differently across all 3 candidate types
- [ ] Unit tests for all weight profiles

### Dependencies
Story 18.1

---

## Story 18.5: Projects Suggestion Generator

**Goal**: New LLM suggestion generator for Projects section, following LCEL chain pattern. Candidate-type-aware.

### What Changes
- New `/lib/ai/generateProjectsSuggestion.ts`
- New `ProjectsSuggestion` type
- Add to parallel generation in `generateAllSuggestions.ts`
- New API route for regeneration

### Types
```typescript
interface ProjectEntry {
  title: string;
  technologies: string[];
  dates?: string;
  original_bullets: string[];
  suggested_bullets: BulletSuggestion[];
}

interface ProjectsSuggestion {
  original: string;
  project_entries: ProjectEntry[];
  total_point_value?: number;
  explanation?: string;
  heading_suggestion?: string;
  judge_score?: JudgeResult;
}
```

### Candidate-Type Framing
- **Co-op**: "Primary experience section. Format like job entries. Title 'Project Experience'. Emphasize individual role."
- **Full-time mid**: "Highlight standalone significant projects."
- **Full-time senior**: "Consider folding into Experience section."
- **Career changer**: "Emphasize master's capstone and new-career skill demos."

### Files
- `/lib/ai/generateProjectsSuggestion.ts` (NEW)
- `/types/suggestions.ts` (MODIFY - add ProjectEntry, ProjectsSuggestion)
- `/actions/generateAllSuggestions.ts` (MODIFY - add to parallel pipeline)
- `/app/api/suggestions/projects/route.ts` (NEW)

### Acceptance Criteria
- [ ] `generateProjectsSuggestion()` returns `ActionResponse<ProjectsSuggestion>`
- [ ] Uses LCEL chain pattern
- [ ] Candidate-type-specific framing
- [ ] Co-op gets "Project Experience" heading suggestion
- [ ] Included in `Promise.allSettled()` parallel generation
- [ ] API route supports regeneration
- [ ] LLM-as-Judge applied

### Dependencies
Story 18.1, 18.2, 18.7

---

## Story 18.6: Conditional Summary & Candidate-Type Suggestion Framing

**Goal**: Update all suggestion generators for three-tier candidate-type framing. Handle summary conditionally.

### What Changes
- Add `getCandidateTypeGuidance()` to preferences.ts
- Summary: co-op = suggest removal/skip; career changer = critical bridging narrative
- Experience: career changer = reframe with transferable skills
- Education: career changer = coursework + primary credential treatment
- Skills: career changer = new skills + transferable

### Summary Logic
- **Co-op without summary**: Skip generation entirely
- **Co-op with generic summary**: Generate "consider removing" suggestion
- **Co-op with keyword-rich summary**: Suggest keeping but condensing
- **Career changer**: ALWAYS generate; bridge old career to new
- **Full-time**: Current conditional logic (tailored = good, generic = harmful)

### Files
- `/lib/ai/preferences.ts` (MODIFY - getCandidateTypeGuidance for 3 types x 5 sections)
- `/lib/ai/generateSummarySuggestion.ts` (MODIFY - conditional co-op/career changer)
- `/lib/ai/generateExperienceSuggestion.ts` (MODIFY - career changer reframing)
- `/lib/ai/generateEducationSuggestion.ts` (MODIFY - career changer coursework)
- `/lib/ai/generateSkillsSuggestion.ts` (MODIFY - career changer transferable)
- `/actions/generateAllSuggestions.ts` (MODIFY - skip summary for co-op when no summary)

### Acceptance Criteria
- [ ] `getCandidateTypeGuidance()` returns distinct guidance for 3 types x 5 sections
- [ ] Co-op without summary: generation skipped
- [ ] Co-op with generic summary: "consider removing" suggestion
- [ ] Career changer: summary always generated with bridging focus
- [ ] All generators receive `candidateType` parameter
- [ ] Unit tests verify prompt differences across 3 types

### Dependencies
Story 18.1

---

## Story 18.7: Store, Session & Database Updates

**Goal**: Extend Zustand store, session types, and database for `projectsSuggestion`, `candidateType`, and `structuralSuggestions`.

### What Changes
- Store: add `projectsSuggestion`, `candidateType`, `structuralSuggestions` + setters
- Update `reset()`, `loadFromSession()`, `isRegeneratingSection`
- Database migration: `projects_suggestion` JSONB + `candidate_type` TEXT columns
- Session CRUD: handle new columns

### Migration
```sql
ALTER TABLE sessions ADD COLUMN projects_suggestion JSONB;
ALTER TABLE sessions ADD COLUMN candidate_type TEXT;
```

### Files
- `/store/useOptimizationStore.ts` (MODIFY)
- `/types/optimization.ts` (MODIFY - add to OptimizationSession)
- `/lib/supabase/sessions.ts` (MODIFY - handle new columns)
- `/supabase/migrations/YYYYMMDD_add_projects_and_candidate_type.sql` (NEW)

### Acceptance Criteria
- [ ] Store has `projectsSuggestion`, `candidateType`, `structuralSuggestions`
- [ ] `reset()` clears all new fields
- [ ] `loadFromSession()` hydrates from session
- [ ] `isRegeneratingSection` includes `projects`
- [ ] Migration runs cleanly (nullable columns, backward compat)
- [ ] Session read/write handles new columns

### Dependencies
Story 18.1, 18.2, 18.3

---

## Story 18.8: UI - Dynamic Tab Ordering, Projects Tab & Structural Banner

**Goal**: Suggestions page dynamically orders tabs by candidate type, shows Projects tab, displays structural suggestions banner.

### Tab Order Config
```typescript
const TAB_ORDER: Record<CandidateType, SectionType[]> = {
  coop: ['skills', 'education', 'projects', 'experience'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience'],
};
```

### Components
- `StructuralSuggestionsBanner.tsx` (NEW) - renders above tabs, collapsible if > 3
- Summary tab for co-op: muted with "Optional for co-op" badge
- Projects tab: follows Education tab component pattern

### Files
- `/app/(authenticated)/(dashboard)/scan/[sessionId]/suggestions/ClientSuggestionsPage.tsx` (MODIFY)
- `/components/shared/SuggestionDisplay.tsx` (MODIFY - projects section rendering)
- `/components/shared/SuggestionSection.tsx` (MODIFY - ProjectsBody renderer)
- `/components/shared/StructuralSuggestionsBanner.tsx` (NEW)

### Acceptance Criteria
- [ ] Projects tab appears when data exists
- [ ] Tab order changes by candidateType
- [ ] Co-op: Skills first, Summary last/muted
- [ ] Full-time: Summary first, Experience prominent
- [ ] Career changer: Summary first, Education elevated
- [ ] Structural suggestions banner renders above tabs
- [ ] Default fulltime ordering when candidateType is null
- [ ] No regressions for existing sessions

### Dependencies
Story 18.5, 18.7, 18.3

---

## Story 18.9: Pipeline Integration & End-to-End Wiring

**Goal**: Wire candidateType detection into the optimization and suggestion pipelines end-to-end.

### Pipeline Flow
```
1. User uploads resume + JD, selects jobType
2. /api/optimize:
   a. Parse resume (6 sections)
   b. Extract keywords
   c. detectCandidateType() → candidateType
   d. calculateATSScoreV21() with candidateType weights
   e. generateStructuralSuggestions() (deterministic)
   f. Save candidateType + structural suggestions to session
3. generateAllSuggestions:
   a. Receives candidateType
   b. Conditionally skips summary for co-op
   c. Includes projects in parallel generation
   d. Passes candidateType to all generators
4. UI loads session → candidateType → renders accordingly
```

### Files
- `/app/api/optimize/route.ts` (MODIFY - add detection + structural suggestions)
- `/actions/generateAllSuggestions.ts` (MODIFY - wire candidateType)
- `/actions/analyzeResume.ts` (MODIFY if used in flow)

### Acceptance Criteria
- [ ] candidateType detected and saved during optimization
- [ ] Structural suggestions generated and saved
- [ ] candidateType passed to scoring + all generators
- [ ] Co-op skips summary when resume has no summary
- [ ] Projects suggestion generated when section exists
- [ ] Full flow works for all 3 candidate types
- [ ] Existing scans without candidateType work (null = fulltime)

### Dependencies
All previous stories (18.1-18.8)

---

## Story 18.10: Comprehensive Testing

**Goal**: Unit, integration, and E2E tests for the complete candidate-type pipeline.

### Test Files
- `tests/unit/candidateTypeDetection.test.ts` (NEW) - All 6 detection paths
- `tests/unit/structuralSuggestions.test.ts` (NEW) - All 8 structural rules
- `tests/unit/sectionOrdering.test.ts` (NEW) - Order validation for 3 types
- `tests/unit/careerChangerScoring.test.ts` (NEW) - Weight profiles + scoring
- `tests/unit/parseResumeText.test.ts` (UPDATE) - 6-section parsing
- `tests/integration/candidate-type-pipeline.test.ts` (NEW) - Full pipeline per type
- `tests/e2e/candidate-type-suggestions.spec.ts` (NEW) - Tab ordering, projects tab

### Priority Tags
- `[P0]` switching-careers + fulltime = career_changer
- `[P0]` coop preference = coop regardless of resume signals
- `[P0]` co-op with exp before edu → reorder suggestion
- `[P0]` career_changer weights sum to 1.0
- `[P1]` auto-detect from resume signals
- `[P1]` Projects tab + dynamic tab ordering E2E

### Acceptance Criteria
- [ ] All P0 unit tests pass
- [ ] Integration test for each candidate type
- [ ] E2E test for Projects tab + dynamic ordering
- [ ] `npm run build && npm run test:all` passes
- [ ] No regressions in existing suite

### Dependencies
All previous stories

---

## Verification Plan

1. **Build**: `npm run build` - no type errors
2. **Unit tests**: `npm run test:unit:run` - all pass
3. **Manual smoke test** (3 scenarios):
   - Student resume (no experience) + co-op JD → Skills first, no Summary, Projects prominent
   - Experienced resume (5+ years) + full-time JD → Summary first, Experience prominent
   - Career-changer resume (switching-careers onboarding) + full-time JD → Summary critical, Education elevated
4. **Score comparison**: Same resume, 3 types → different scores
5. **Full suite**: `npm run build && npm run test:all`
