# Epic 10: Quality Fixes & Claude Migration

**Status:** In Progress
**Priority:** Critical (blocking issues)
**Dependencies:** Epic 9 (Logic Refinement) - Completed
**Estimated Stories:** 5

## Epic Overview

Address critical bugs, UX issues, and migrate from OpenAI to Claude API. This epic consolidates quality improvements identified during user testing and the strategic decision to use Claude for AI analysis.

### Business Value

- **Critical bug fix**: Users currently see "no suggestions" despite low ATS scores - this breaks the core value proposition
- **UX improvements**: Better button placement and flow corrections improve user conversion
- **Claude migration**: Better prompt quality, cost optimization, and alignment with Anthropic ecosystem

---

## Issues Identified

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | 62% ATS score shows "No suggestions found" | **Critical** | Bug |
| 2 | Suggestion/Download buttons not visible | Medium | UX |
| 3 | Download resume throwing error | High | Bug |
| 4 | "No Changes Accepted" message on wrong page | Medium | UX/Flow |
| 5 | OpenAI → Claude API migration | Medium | Enhancement |

---

## Story 10.1: Fix Suggestion Generation Flow (CRITICAL)

As a **user with a 62% ATS score**,
I want **to see actionable suggestions for improving my resume**,
So that **I can optimize my resume to increase my ATS score**.

### Root Cause Analysis

The suggestion generation functions exist (`actions/suggestions.ts`) but are **never called**:
- Analysis completes → scan status = 'completed'
- User visits suggestions page → fetches from empty database
- No suggestions displayed despite valid analysis data

### Acceptance Criteria

**Given** an analysis completes with ATS score < 90%
**When** the scan status changes to 'completed'
**Then** suggestion generation is triggered automatically
**And** suggestions are saved to the database
**And** user sees relevant suggestions on the suggestions page

**Given** an analysis completes with ATS score >= 90%
**When** the scan status changes to 'completed'
**Then** minimal suggestions are generated (validation mode)
**And** message reflects truly optimized status

**Given** suggestion generation fails
**When** user visits suggestions page
**Then** a fallback message shows "Suggestions being generated..."
**And** retry mechanism attempts generation

### Technical Implementation

1. In `actions/analysis.ts` after line 470 (successful completion):
   - Extract required context from available data
   - Call `generateAllSuggestionsWithCalibration()`
   - Save suggestions via `saveSuggestions()`
2. Update suggestions page to handle edge cases
3. Fix misleading "already optimized" message

---

## Story 10.2: Fix Download Resume Error

As a **user who has accepted suggestions**,
I want **to download my updated resume**,
So that **I can use the optimized version for job applications**.

### Acceptance Criteria

**Given** user clicks download button
**When** resume generation runs
**Then** PDF/DOCX file downloads without error
**And** file contains merged content (accepted suggestions applied)

### Technical Notes

- Investigate specific error message
- Check PDF/DOCX generation pipeline
- Verify content merging logic

---

## Story 10.3: Improve Button Visibility

As a **user viewing analysis results**,
I want **to easily find the suggestions and download buttons**,
So that **I can take action without scrolling**.

### Acceptance Criteria

**Given** user is on analysis page
**When** page loads
**Then** primary action buttons are visible above the fold
**And** buttons have clear visual hierarchy (primary/secondary)

### Design Considerations

- Sticky header or floating action bar
- Button placement near score display
- Mobile-responsive positioning

---

## Story 10.4: Fix Page Flow Issues

As a **user navigating the optimization flow**,
I want **to see context-appropriate messages**,
So that **I understand my progress and next steps**.

### Acceptance Criteria

**Given** user has not visited suggestions page
**When** on analysis page
**Then** "No Changes Accepted" message does NOT appear

**Given** user has accepted some suggestions
**When** on download page
**Then** summary shows accepted changes count

---

## Story 10.5: Migrate from OpenAI to Claude API

As a **system**,
I want **to use Claude API instead of OpenAI**,
So that **we have better prompt quality and ecosystem alignment**.

### Acceptance Criteria

**Given** analysis or suggestion generation runs
**When** AI is called
**Then** Claude API (claude-3.5-sonnet or claude-3-haiku) is used
**And** prompts are optimized for Claude's strengths
**And** response parsing handles Claude's output format

### Technical Notes

- Update `lib/openai/` to `lib/claude/` or make configurable
- Update all prompts for Claude optimization
- Test output format compatibility
- Update retry logic for Claude rate limits

---

## Implementation Sequence

**Recommended Order:**

1. **Story 10.1** (Critical) - Fix suggestion generation
2. **Story 10.2** (High) - Fix download error
3. **Story 10.5** (Medium) - Claude migration (can be parallel with UX)
4. **Story 10.3** (Medium) - Button visibility
5. **Story 10.4** (Medium) - Flow fixes

**Parallel Opportunities:**
- Stories 10.3 & 10.4 (UX) can run in parallel
- Story 10.5 (Claude) can run in parallel with UX fixes

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Suggestions shown for <90% scores | 0% | 100% |
| Download success rate | Unknown (error) | 100% |
| Button visibility (above fold) | No | Yes |
| API: OpenAI → Claude | OpenAI | Claude |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-22 | Initial epic from user testing feedback |
