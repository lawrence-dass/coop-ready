---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/epics.md
epicNumber: 17
version: V1.5
---

# submit_smart - Epic 17: Resume Compare & Dashboard Stats

## Overview

This document provides the epic and story breakdown for Epic 17, which extends the existing comparison functionality to support actual resume re-scanning and implements real dashboard statistics.

## Requirements Inventory

### Functional Requirements

**Existing (Partially Implemented):**
- FR33: Users can compare original resume score with optimized score (V1.0) - *Currently shows projected score, not actual re-scanned score*
- FR34: Users can view before/after text comparison (V1.0) - *Implemented for suggestions, not for re-uploaded resume*

**New Requirements (This Epic):**
- FR17-1: Users can upload an updated resume after applying suggestions to compare actual improvement
- FR17-2: System can re-analyze the updated resume and calculate a new ATS score
- FR17-3: Users can view actual score improvement (new score - original score)
- FR17-4: Dashboard displays average ATS score calculated from all user sessions
- FR17-5: Dashboard displays improvement rate calculated from comparison sessions
- FR17-6: Dashboard removes redundant UI elements (New Scan/View History cards, email display)

### Non-Functional Requirements

**Applicable from existing NFRs:**
- NFR4: Full optimization pipeline completion < 60 seconds
- NFR10: Row-level security policies for user data isolation
- NFR16: Session persistence across refresh (100%)
- NFR6: UI interactions (clicks, toggles) < 200ms

### Additional Requirements

**Database Schema:**
- Add `compared_ats_score` JSONB column to sessions table OR
- Create session linking mechanism (parent_session_id) for original vs comparison
- Ensure RLS policies cover new columns/relationships

**From Architecture Patterns:**
- ActionResponse<T> pattern for all new server actions
- Transform snake_case (DB) to camelCase (TypeScript) at boundaries
- All LLM operations in `/lib/ai/`

**UI/UX Requirements:**
- Compare button on suggestions page after user has copied suggestions
- Upload flow similar to existing resume upload
- Score comparison visualization (original → new with delta)
- Dashboard stats calculated from real data, not placeholders
- Remove redundant navigation cards from dashboard

### FR Coverage Map

| FR | Story | Description |
|----|-------|-------------|
| FR17-1 | 17.2 | Compare upload UI component |
| FR17-2 | 17.3 | Re-analyze updated resume (server action) |
| FR17-3 | 17.4 | Display comparison results with improvement |
| FR17-4 | 17.5 | Dashboard stats calculation + display |
| FR17-5 | 17.5 | Dashboard improvement rate |
| FR17-6 | 17.6 | Dashboard UI cleanup |

### Story Summary

| Story | Title | FRs |
|-------|-------|-----|
| 17.1 | Add compared_ats_score database column | Infrastructure |
| 17.2 | Implement compare upload UI | FR17-1 |
| 17.3 | Implement comparison analysis server action | FR17-2 |
| 17.4 | Implement comparison results display | FR17-3 |
| 17.5 | Implement dashboard stats calculation | FR17-4, FR17-5 |
| 17.6 | Dashboard UI cleanup | FR17-6 |
| 17.7 | Epic 17 integration and verification testing | All |

## Epic List

### Epic 17: Resume Compare & Dashboard Stats

Users can upload an updated resume to see actual improvement after applying suggestions, and the dashboard displays real statistics (average ATS score, improvement rate) instead of placeholder values.

**Version:** V1.5
**Dependencies:** Epic 11 (Compare & Enhanced Suggestions), Epic 16 (Dashboard UI)

---

## Story 17.1: Add Comparison Database Schema

As a **developer**,
I want the database schema updated to support comparison tracking,
So that we can store and query comparison ATS scores.

**Acceptance Criteria:**

**Given** the existing sessions table
**When** the migration is applied
**Then** a `compared_ats_score` JSONB column is added to the sessions table
**And** the column allows NULL values (comparison is optional)
**And** the JSONB structure matches `ats_score` format: `{overall: number, breakdown: {...}, calculatedAt: string}`
**And** existing RLS policies continue to work with the new column
**And** a GIN index is created for the new column for query performance

---

## Story 17.2: Implement Compare Upload UI

As a **user**,
I want to upload my updated resume after applying suggestions,
So that I can see my actual improvement.

**Acceptance Criteria:**

**Given** I am on the suggestions page with completed suggestions
**When** I have copied at least one suggestion
**Then** a "Compare with Updated Resume" button becomes visible

**Given** I click the "Compare with Updated Resume" button
**When** the compare upload dialog opens
**Then** I see an upload zone similar to the original resume upload
**And** I see encouraging copy like "Ready to see your improvement?"
**And** the dialog explains the comparison process

**Given** I drag-drop or select a file
**When** the file is valid (PDF/DOCX, < 5MB)
**Then** the file is accepted and the comparison process begins
**And** I see a loading state with progress indication

**Given** I upload an invalid file
**When** validation fails
**Then** I see the appropriate error message (INVALID_FILE_TYPE or FILE_TOO_LARGE)

---

## Story 17.3: Implement Comparison Analysis Server Action

As a **user**,
I want my updated resume analyzed against the same job description,
So that I can see my new ATS score.

**Acceptance Criteria:**

**Given** a valid updated resume file is uploaded for comparison
**When** the comparison analysis server action is called
**Then** the file is parsed using the existing PDF/DOCX parsers
**And** the ATS analysis pipeline runs with the original job description
**And** a new ATS score is calculated

**Given** the comparison analysis completes successfully
**When** the score is returned
**Then** the `compared_ats_score` column is updated in the session
**And** the response follows ActionResponse<T> pattern
**And** the operation completes within 60 seconds

**Given** the comparison analysis fails
**When** an error occurs (timeout, parse error, LLM error)
**Then** appropriate error codes are returned (LLM_TIMEOUT, PARSE_ERROR, LLM_ERROR)
**And** the user sees a helpful error message with retry option

---

## Story 17.4: Implement Comparison Results Display

As a **user**,
I want to see my score improvement after uploading my updated resume,
So that I can celebrate my progress and understand my gains.

**Acceptance Criteria:**

**Given** the comparison analysis completes successfully
**When** results are displayed
**Then** I see my original ATS score prominently
**And** I see my new ATS score prominently
**And** I see the improvement delta (new - original) with visual emphasis
**And** I see the percentage improvement

**Given** my score improved
**When** results are displayed
**Then** the delta is shown in green with a positive indicator (+)
**And** the display feels celebratory (animation, encouraging message)

**Given** my score decreased or stayed the same
**When** results are displayed
**Then** the display handles this gracefully with appropriate messaging
**And** suggestions for further improvement are shown

**Given** I am viewing comparison results
**When** I want to compare text changes
**Then** I can see a before/after comparison of my resume content

---

## Story 17.5: Implement Dashboard Stats Calculation

As a **user**,
I want to see my actual average ATS score and improvement rate on the dashboard,
So that I can track my progress over time.

**Acceptance Criteria:**

**Given** I have completed at least one optimization session
**When** I view the dashboard
**Then** the "Average ATS Score" displays the calculated average from all my sessions with `ats_score` data
**And** the calculation uses `AVG(ats_score->>'overall')` from my sessions

**Given** I have completed at least one comparison (uploaded updated resume)
**When** I view the dashboard
**Then** the "Improvement Rate" displays the average improvement across all comparison sessions
**And** the calculation is: `AVG(compared_ats_score->>'overall' - ats_score->>'overall')`

**Given** I have no sessions with ATS scores
**When** I view the dashboard
**Then** "Average ATS Score" displays "--" or "No data yet"

**Given** I have no comparison sessions
**When** I view the dashboard
**Then** "Improvement Rate" displays "--" or "Complete a comparison to track"

**Given** the dashboard loads
**When** stats are fetched
**Then** the query uses proper RLS filtering for my user_id
**And** the stats update when I complete new optimizations or comparisons

---

## Story 17.6: Dashboard UI Cleanup

As a **user**,
I want a cleaner dashboard without redundant elements,
So that I can focus on my progress and key actions.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** the page loads
**Then** the "New Scan" quick action card is NOT displayed (available in sidebar)
**And** the "View History" quick action card is NOT displayed (available in sidebar)

**Given** I am viewing the dashboard welcome section
**When** the page loads
**Then** I see "Welcome, [First Name]!" (not "Welcome, User!")
**And** the email address is NOT displayed below the welcome message

**Given** I am viewing the dashboard
**When** the page loads
**Then** the dashboard starts with the "Your Progress" stats section
**And** the layout flows: Welcome → Your Progress → Getting Started/Recent Scans

---

## Story 17.7: Epic 17 Integration and Verification Testing

As a **developer**,
I want comprehensive integration tests for Epic 17,
So that we can verify all features work together correctly.

**Acceptance Criteria:**

**Given** Epic 17 features are implemented
**When** integration tests run
**Then** the full compare flow works end-to-end (upload → analyze → display results)
**And** dashboard stats calculate correctly from real session data
**And** dashboard UI shows cleaned up layout without redundant elements

**Given** existing functionality
**When** integration tests run
**Then** all previous Epic 16 tests continue to pass
**And** existing scan and suggestions flows are not broken

**Given** edge cases
**When** tested
**Then** comparison with same resume shows minimal/no improvement gracefully
**And** comparison with empty sessions handles correctly
**And** dashboard with no data shows appropriate placeholder messages

