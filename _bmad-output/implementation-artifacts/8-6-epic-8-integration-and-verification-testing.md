# Story 8.6: Epic 8 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 8 stories (user authentication via email/password and OAuth) work correctly,
So that users can create accounts, log in, and access personalized features.

## Acceptance Criteria

1. **Given** Epic 8 stories are complete
   **When** I register with email and password
   **Then** account is created, email verified (if required), and user is logged in

2. **Given** I have a registered account
   **When** I log in with correct credentials
   **Then** I'm authenticated and can access user-specific features

3. **Given** I have set up Google OAuth
   **When** I click "Sign in with Google"
   **Then** I'm authenticated via Google and account created automatically

4. **Given** I am logged in
   **When** I click sign out
   **Then** I'm logged out and session is cleared

5. **Given** Epic 8 is complete
   **When** I execute the verification checklist
   **Then** user authentication works end-to-end and Epic 9 (resume library) is ready

## Tasks / Subtasks

- [ ] **Task 1: Email/Password Registration Verification** (AC: #1)
  - [ ] Test registration with valid email/password
  - [ ] Verify account created in Supabase Auth
  - [ ] Verify user can log in after registration
  - [ ] Test validation (weak password, invalid email)
  - [ ] Test duplicate email handling

- [ ] **Task 2: Email/Password Login Verification** (AC: #2)
  - [ ] Test login with correct credentials
  - [ ] Test login with incorrect password (error message)
  - [ ] Test login with non-existent email (error message)
  - [ ] Test session created after login
  - [ ] Test user_id now available (instead of anonymous_id)

- [ ] **Task 3: Google OAuth Verification** (AC: #3)
  - [ ] Verify Google OAuth configured in Supabase
  - [ ] Test OAuth flow and callback
  - [ ] Verify account created on first Google login
  - [ ] Test existing account recognized on subsequent Google login

- [ ] **Task 4: Sign Out Verification** (AC: #4)
  - [ ] Test sign out button clears session
  - [ ] Verify user redirected to login
  - [ ] Test authenticated routes require login
  - [ ] Verify session data cleared

- [ ] **Task 5: Create Verification Checklist** (AC: #5)
  - [ ] Create `/docs/EPIC-8-VERIFICATION.md`
  - [ ] Include auth flow test cases
  - [ ] Include edge case tests
  - [ ] Update README with reference

## Dev Notes

### What Epic 8 Delivers

- **Story 8.1:** Email/Password Registration - Account creation
- **Story 8.2:** Email/Password Login - Session-based auth
- **Story 8.3:** Google OAuth - Third-party authentication
- **Story 8.4:** Sign Out - Session termination
- **Story 8.5:** Onboarding Flow - 3-question user profile setup

### Migration Path

- Anonymous users (Epic 2) can upgrade to registered users
- Previous session data transfers to authenticated user
- user_id replaces anonymous_id after auth

### Dependencies

- Supabase Auth configured
- Google OAuth credentials set up
- Database supports user_profiles table

### Verification Success Criteria

✅ Registration works with validation
✅ Login works with credentials
✅ Google OAuth working
✅ Sign out clears session
✅ Session created after login
✅ Authenticated routes protected
✅ Anonymous-to-auth migration works
✅ No console errors
