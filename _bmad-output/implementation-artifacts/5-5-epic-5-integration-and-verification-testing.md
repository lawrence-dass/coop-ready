# Story 5.5: Epic 5 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 5 stories (keyword analysis, ATS scoring, and gap analysis) work correctly,
So that users can see their resume's alignment with the job description and understand gaps.

## Acceptance Criteria

1. **Given** resume and JD are available
   **When** I trigger keyword analysis
   **Then** the system identifies keywords in JD and finds matches in resume

2. **Given** keyword analysis is complete
   **When** ATS score is calculated
   **Then** I see a score 0-100 reflecting alignment quality

3. **Given** ATS score is calculated
   **When** I view the score breakdown
   **Then** I see category-wise breakdown and identified keyword gaps

4. **Given** Epic 5 is complete
   **When** I execute the verification checklist
   **Then** ATS analysis works end-to-end and Epic 6 (LLM suggestions) is unblocked

## Tasks / Subtasks

- [ ] **Task 1: Keyword Analysis Verification** (AC: #1)
  - [ ] Upload resume and enter JD
  - [ ] Trigger analysis and verify keywords extracted from JD
  - [ ] Verify matching keywords found in resume
  - [ ] Verify gap keywords identified
  - [ ] Verify AnalysisResult type populated correctly

- [ ] **Task 2: ATS Score Calculation Verification** (AC: #2)
  - [ ] Verify score is between 0-100
  - [ ] Verify score reflects actual alignment (test with perfect match)
  - [ ] Verify score is consistent/reproducible
  - [ ] Verify calculation completes within 5 seconds

- [ ] **Task 3: Score Display Verification** (AC: #3)
  - [ ] Verify score displays prominently
  - [ ] Verify category breakdown is visible (e.g., Skills: 85%, Experience: 70%)
  - [ ] Verify gap analysis shows missing keywords
  - [ ] Verify UI is user-friendly and clear

- [ ] **Task 4: Integration Verification** (AC: #4)
  - [ ] Verify Epic 2 session stores analysis results
  - [ ] Verify Epic 3 resume data used in analysis
  - [ ] Verify Epic 4 JD data used in analysis
  - [ ] Verify Epic 6 will receive analysis for suggestions

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-5-VERIFICATION.md`
  - [ ] Include test cases for various resume/JD combinations
  - [ ] Include edge cases (empty resume, very short JD, etc.)
  - [ ] Update README with reference

## Dev Notes

### What Epic 5 Delivers

- **Story 5.1:** Keyword Analysis - Identify keywords and matches
- **Story 5.2:** ATS Score Calculation - Compute 0-100 score
- **Story 5.3:** Score Display with Breakdown - Show categories
- **Story 5.4:** Gap Analysis Display - Show missing keywords

### Dependencies

- Epic 2: Session to store results
- Epic 3: Resume parsed into sections
- Epic 4: Job description text
- Types: AnalysisResult from `/types`

### Verification Success Criteria

✅ Keyword analysis identifies JD keywords
✅ Matching keywords found in resume
✅ ATS score calculated correctly (0-100)
✅ Score breakdown by category visible
✅ Gap keywords identified
✅ Results save to session
✅ No console errors
✅ Ready for suggestions in Epic 6
