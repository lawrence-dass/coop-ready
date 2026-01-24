# Story 6.8: Epic 6 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 6 stories (LLM suggestions, quality checks, and UI) work correctly end-to-end,
So that users can receive high-quality, authentic content optimization suggestions.

## Acceptance Criteria

1. **Given** resume and analysis are available
   **When** I request suggestions
   **Then** the LLM pipeline generates suggestions for Summary, Skills, and Experience sections

2. **Given** suggestions are generated
   **When** quality checks run
   **Then** suggestions are verified for authenticity and AI-tell phrases are removed

3. **Given** suggestions are generated
   **When** I view the suggestion UI
   **Then** I can see original text, suggestions, copy to clipboard, and regenerate options

4. **Given** Epic 6 is complete
   **When** I execute the verification checklist
   **Then** LLM suggestion pipeline works end-to-end and Epic 7 (error handling) is unblocked

## Tasks / Subtasks

- [ ] **Task 1: LLM Pipeline Verification** (AC: #1)
  - [ ] Trigger suggestion generation
  - [ ] Verify API route calls Anthropic Claude
  - [ ] Verify suggestions received for Summary section
  - [ ] Verify suggestions received for Skills section
  - [ ] Verify suggestions received for Experience section
  - [ ] Verify suggestions complete within 60 seconds (timeout limit)

- [ ] **Task 2: Quality Checks Verification** (AC: #2)
  - [ ] Verify AI-tell phrase detection works
  - [ ] Verify suggestions with AI-tell phrases are rewritten
  - [ ] Verify authenticity check (no fabrication) enforced
  - [ ] Verify suggestions follow ActionResponse pattern
  - [ ] Verify error handling if quality check fails

- [ ] **Task 3: Suggestion UI Verification** (AC: #3)
  - [ ] Verify suggestion cards display correctly
  - [ ] Verify original text vs suggestion shown side-by-side
  - [ ] Verify copy-to-clipboard button works
  - [ ] Verify regenerate button triggers new suggestions
  - [ ] Verify loading states during generation

- [ ] **Task 4: Integration Verification** (AC: #4)
  - [ ] Verify environment vars for Anthropic API loaded
  - [ ] Verify Resume type used in prompt
  - [ ] Verify Suggestion type matches output
  - [ ] Verify session stores suggestions
  - [ ] Verify API key NOT exposed to client

- [ ] **Task 5: Create Verification Checklist** (AC: #4)
  - [ ] Create `/docs/EPIC-6-VERIFICATION.md`
  - [ ] Include quality check test cases
  - [ ] Include UI interaction tests
  - [ ] Include prompt security verification
  - [ ] Update README with reference

## Dev Notes

### What Epic 6 Delivers

- **Story 6.1:** LLM Pipeline API Route - Server-side Claude integration
- **Story 6.2:** Summary Section Suggestions - LLM-generated suggestions
- **Story 6.3:** Skills Section Suggestions - LLM-generated suggestions
- **Story 6.4:** Experience Section Suggestions - LLM-generated suggestions
- **Story 6.5:** Suggestion Display UI - Card-based visualization
- **Story 6.6:** Copy to Clipboard - One-click suggestion copying
- **Story 6.7:** Regenerate Suggestions - Request new suggestions

### Critical Security

- API key server-side ONLY
- User content wrapped in XML tags (injection defense)
- No sensitive data in logs
- 60-second timeout enforced

### Dependencies

- Epic 5: AnalysisResult for context
- Types: Suggestion type from `/types`
- Environment: ANTHROPIC_API_KEY configured

### Verification Success Criteria

✅ Suggestions generated for all sections
✅ Quality checks pass (no AI-tell, authentic)
✅ Suggestions display correctly
✅ Copy-to-clipboard works
✅ Regenerate produces different suggestions
✅ API key never exposed to client
✅ Timeout handled gracefully
✅ No console errors
✅ Ready for error handling in Epic 7
