# Epic 9: Resume Library - Verification Checklist

**Epic:** 9 - Resume Library
**Version:** V1.0
**Status:** ✅ Complete
**Date:** 2026-01-27

## Overview

This document provides the complete verification checklist for Epic 9 (Resume Library). Use this checklist to validate that all resume library features work correctly before deployment.

## Prerequisites

- ✅ User authentication (Epic 8) must be working
- ✅ Supabase database with `resumes` table
- ✅ User must be authenticated (not anonymous)
- ✅ Test environment with clean database state

## Test Environment Setup

```bash
# 1. Start development server
npm run dev

# 2. Clear browser storage (optional - for clean state)
# In browser console:
localStorage.clear()
sessionStorage.clear()

# 3. Create test user account
# - Navigate to /auth/signup
# - Create account with test credentials
# - Complete onboarding flow
```

## Verification Checklist

### Task 1: Save Resume Verification (AC #1)

**Objective:** Verify users can save up to 3 resumes to their library

#### Test Case 1.1: Save First Resume
- [ ] **Given** I am authenticated and have optimized a resume
- [ ] **When** I click "Save to Library" button
- [ ] **Then** Resume is saved successfully
- [ ] **And** Success toast notification appears
- [ ] **And** Save button shows "Saved" state or confirmation

**Expected Behavior:**
- Resume stored in database with `user_id` foreign key
- Resume name can be edited (default: "Resume {date}")
- Database record includes: `user_id`, `file_name`, `file_type`, `raw_text`, `parsed_content`, `created_at`

#### Test Case 1.2: Save Second Resume
- [ ] **Given** I have 1 resume in library
- [ ] **When** I upload and optimize a different resume
- [ ] **And** I click "Save to Library"
- [ ] **Then** Second resume is saved successfully
- [ ] **And** Library count shows 2 resumes

#### Test Case 1.3: Save Third Resume
- [ ] **Given** I have 2 resumes in library
- [ ] **When** I upload and optimize a third resume
- [ ] **And** I click "Save to Library"
- [ ] **Then** Third resume is saved successfully
- [ ] **And** Library count shows 3 resumes (maximum)

#### Test Case 1.4: Attempt Fourth Resume (Limit Enforcement)
- [ ] **Given** I have 3 resumes in library (at maximum)
- [ ] **When** I attempt to save a fourth resume
- [ ] **Then** Error message appears: "Library full. Maximum 3 resumes allowed."
- [ ] **And** Save is prevented
- [ ] **Or** User is prompted to delete an existing resume first

**Database Validation:**
```sql
-- Verify resumes stored correctly
SELECT id, user_id, file_name, file_type, created_at
FROM resumes
WHERE user_id = '<test_user_id>'
ORDER BY created_at DESC;

-- Expected: 3 records for test user
```

---

### Task 2: Resume Selection Verification (AC #2)

**Objective:** Verify users can select saved resumes from library

#### Test Case 2.1: View Resume Library
- [ ] **Given** I have resumes saved in library
- [ ] **When** I navigate to the optimization page
- [ ] **Then** I see a "Load from Library" or "Select Resume" option
- [ ] **And** Clicking shows dropdown/modal with saved resumes

#### Test Case 2.2: Select Resume from Library
- [ ] **Given** Library dropdown/modal is open
- [ ] **When** I view my saved resumes
- [ ] **Then** Each resume shows: name, file type, date saved
- [ ] **And** I can click to select a resume

#### Test Case 2.3: Resume Loads Correctly
- [ ] **Given** I selected a resume from library
- [ ] **When** The resume is loaded
- [ ] **Then** Resume content appears in the UI
- [ ] **And** Resume sections are correctly parsed (Summary, Skills, Experience)
- [ ] **And** I can proceed with optimization using this resume

#### Test Case 2.4: Resume Content Reloads Properly
- [ ] **Given** I selected a resume from library
- [ ] **When** I refresh the page
- [ ] **Then** The selected resume content persists
- [ ] **And** Session state includes the library-loaded resume
- [ ] **And** No data loss occurs

**Validation Points:**
- `getUserResumes` action returns correct resumes for user
- `getResumeContent` action loads full resume data
- Resume UI component displays selected resume
- Session persistence includes library selection

---

### Task 3: Resume Deletion Verification (AC #3)

**Objective:** Verify users can delete resumes from library

#### Test Case 3.1: Delete Button Visible
- [ ] **Given** I am viewing my library
- [ ] **When** I see my saved resumes
- [ ] **Then** Each resume has a delete button/icon
- [ ] **And** Delete button is clearly visible and accessible

#### Test Case 3.2: Confirmation Prompt
- [ ] **Given** I click delete on a resume
- [ ] **When** The delete action is triggered
- [ ] **Then** A confirmation dialog appears
- [ ] **And** Dialog warns: "Are you sure you want to delete this resume?"
- [ ] **And** I can cancel or confirm deletion

#### Test Case 3.3: Resume Removed from Library
- [ ] **Given** I confirmed deletion
- [ ] **When** The delete action completes
- [ ] **Then** Resume is removed from library UI
- [ ] **And** Library count decreases (e.g., 3 → 2)
- [ ] **And** Success toast: "Resume deleted successfully"

#### Test Case 3.4: Database Updated Correctly
- [ ] **Given** Resume was deleted from UI
- [ ] **When** I check the database
- [ ] **Then** Resume record is removed from `resumes` table
- [ ] **And** Deletion is permanent (no soft delete)

**Database Validation:**
```sql
-- Verify resume deleted
SELECT COUNT(*) FROM resumes WHERE user_id = '<test_user_id>';
-- Expected: 2 (if started with 3)

-- Verify specific resume deleted
SELECT * FROM resumes WHERE id = '<deleted_resume_id>';
-- Expected: 0 rows
```

---

### Task 4: Integration Verification (AC #4)

**Objective:** Verify Epic 9 integrates correctly with Epic 8 (auth) and database

#### Test Case 4.1: Auth Required for Library
- [ ] **Given** I am an anonymous user (not authenticated)
- [ ] **When** I try to access resume library features
- [ ] **Then** Library features are disabled or hidden
- [ ] **Or** I am prompted to sign up/sign in
- [ ] **And** Anonymous users cannot save resumes to library

#### Test Case 4.2: Library Data Associated with User
- [ ] **Given** I am authenticated as User A
- [ ] **When** I save resumes to library
- [ ] **Then** All resumes have `user_id` = User A's ID
- [ ] **And** Resumes are linked to my account

**Database Validation:**
```sql
-- Verify user_id foreign key constraint
SELECT user_id, COUNT(*)
FROM resumes
GROUP BY user_id;

-- Each user should have their own count (max 3)
```

#### Test Case 4.3: Each User Has Separate Library
- [ ] **Given** User A has 3 resumes in library
- [ ] **When** I sign in as User B
- [ ] **Then** User B sees an empty library (0 resumes)
- [ ] **And** User B cannot see User A's resumes
- [ ] **And** Row-level security (RLS) isolates user data

**RLS Policy Validation:**
```sql
-- Verify RLS policy on resumes table
SELECT * FROM pg_policies WHERE tablename = 'resumes';

-- Expected policies:
-- 1. Users can only SELECT their own resumes
-- 2. Users can only INSERT their own resumes
-- 3. Users can only DELETE their own resumes
```

#### Test Case 4.4: No Data Loss on Reload
- [ ] **Given** I have 3 resumes in library
- [ ] **When** I close the browser and reopen
- [ ] **And** I sign in again
- [ ] **Then** All 3 resumes are still in my library
- [ ] **And** No data is lost
- [ ] **And** Database persistence is working

---

### Task 5: Additional Verification

#### Test Case 5.1: No Console Errors
- [ ] **Given** I complete all library operations (save, select, delete)
- [ ] **When** I check browser console
- [ ] **Then** No JavaScript errors appear
- [ ] **And** No React warnings appear
- [ ] **And** No network errors appear

#### Test Case 5.2: Performance
- [ ] **Given** I perform library operations
- [ ] **When** I measure response times
- [ ] **Then** Save operation completes < 3 seconds
- [ ] **And** Select operation completes < 2 seconds
- [ ] **And** Delete operation completes < 2 seconds
- [ ] **And** UI remains responsive

#### Test Case 5.3: Error Handling
- [ ] **Given** I am at library limit (3 resumes)
- [ ] **When** I try to save a 4th resume
- [ ] **Then** Error code: `RESUME_LIMIT_EXCEEDED`
- [ ] **And** Error message is user-friendly
- [ ] **And** No database corruption occurs

#### Test Case 5.4: Edge Cases
- [ ] **Test:** Save resume with very long filename (>255 chars)
  - **Expected:** Filename truncated or error handled gracefully
- [ ] **Test:** Save resume with special characters in name
  - **Expected:** Special characters handled correctly
- [ ] **Test:** Delete resume while it's currently loaded in session
  - **Expected:** Session clears, user can upload new resume
- [ ] **Test:** Rapid consecutive saves (rate limiting)
  - **Expected:** Graceful handling, no duplicate saves

---

## Automated Test Coverage

### Unit Tests
- **File:** `tests/unit/actions/resumes/*.test.ts`
- **Coverage:**
  - `saveResume` action (10 tests)
  - `getUserResumes` action (4 tests)
  - `getResumeContent` action (5 tests)
  - `deleteResume` action (7 tests)
- **Status:** ✅ 26/26 passing

### Component Tests
- **File:** `tests/unit/components/SaveResumeButton.test.tsx`
- **Coverage:** Save button UI logic (13 tests)
- **Status:** ✅ 13/13 passing

- **File:** `tests/unit/components/SelectResumeButton.test.tsx`
- **Coverage:** Resume selection UI (14 tests)
- **Status:** ✅ 14/14 passing

### E2E Tests
- **File:** `tests/e2e/9-3-delete-resume.spec.ts`
- **Coverage:** Delete flow (6 tests)
- **Status:** ⏳ Ready for CI/CD

### Integration Tests
- **File:** `tests/integration/9-epic-9-full-workflow.spec.ts`
- **Coverage:** Complete save → select → delete workflow (3 tests)
- **Status:** ⏳ Ready for CI/CD

**Total Test Count:** 61 tests (53 passing + 9 ready for CI/CD)

---

## Success Criteria

Epic 9 is considered **VERIFIED** when all of the following are true:

- ✅ All manual test cases pass (Tasks 1-5)
- ✅ All automated tests pass (61/61 tests)
- ✅ No P0 or P1 bugs identified
- ✅ Database RLS policies enforce user isolation
- ✅ Resume library limit (3) is enforced
- ✅ No data loss on page reload
- ✅ No console errors during operations
- ✅ Performance meets requirements (< 3s save, < 2s select/delete)

---

## Known Limitations

1. **Resume Limit:** Hard limit of 3 resumes per user (by design)
2. **Authentication Required:** Anonymous users cannot use library (by design)
3. **No Resume Editing:** Once saved, resume content cannot be edited (use delete + re-save)
4. **File Size:** 5MB limit per resume (inherited from Epic 3)

---

## Rollback Plan

If critical issues are found during verification:

1. **Immediate:** Revert feature flag (if implemented)
2. **Short-term:** Rollback to commit before Epic 9 merge
3. **Communication:** Notify PM/SM of rollback and issues found
4. **Resolution:** Create hotfix branch to address critical bugs

---

## Sign-off

**QA Engineer:** ___________________________ Date: ___________

**Product Owner:** ___________________________ Date: ___________

**Tech Lead:** ___________________________ Date: ___________

---

## References

- **PRD:** `_bmad-output/planning-artifacts/prd.md`
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **Epic 9 Stories:** `_bmad-output/planning-artifacts/epics.md` (Epic 9)
- **Traceability Matrix:** `_bmad-output/traceability-matrix-epic-9.md`
- **Test Automation Summary:** `_bmad-output/epic-9-automation-summary.md`
- **Database Schema:** `supabase/migrations/` (resumes table)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-27
**Maintained By:** Test Engineering Architect (TEA)
