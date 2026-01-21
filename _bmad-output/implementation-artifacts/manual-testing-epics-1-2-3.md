# Manual Testing Guide - Epics 1, 2, 3

**Project:** CoopReady
**Date Created:** 2026-01-20
**Testing Phase:** Pre-Epic 4 Production Readiness
**Tester:** Lawrence

---

## 📋 Test Credentials & Environment Setup

### Test Environment
- **Base URL:** http://localhost:3000
- **Database:** Supabase (configured via .env.local)

### Test User Accounts

#### Primary Test User (Completed Profile)
```
Email: test@coopready.com
Password: TestUser123!
Status: Onboarding completed
Experience Level: Student/Recent Graduate
Target Role: Software Engineer
```

#### Secondary Test User (New User - For Onboarding Flow)
```
Email: newuser@coopready.com
Password: NewUser123!
Status: Not yet registered (create during testing)
```

#### Career Changer Test User
```
Email: career@coopready.com
Password: CareerChange123!
Status: Onboarding completed
Experience Level: Career Changer
Target Role: Data Analyst
```

### Test Resume Files

Prepare these test files before testing:

**Valid Test Files:**
- `test-resume.pdf` - Text-based PDF resume (< 2MB)
- `test-resume.docx` - DOCX resume (< 2MB)

**Invalid Test Files:**
- `large-resume.pdf` - PDF file > 2MB (for size validation)
- `test-resume.txt` - Text file (for type validation)
- `scanned-resume.pdf` - Image-based/scanned PDF (for extraction error handling)

**Test Job Description:**
```
Senior Software Engineer - Full Stack

We are seeking a passionate Senior Software Engineer to join our growing team.

Requirements:
- 5+ years of experience with React, TypeScript, and Node.js
- Strong understanding of REST APIs and database design
- Experience with cloud platforms (AWS, Azure, or GCP)
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Design and develop scalable web applications
- Collaborate with cross-functional teams
- Mentor junior developers
- Participate in code reviews and architectural decisions

Nice to Have:
- Experience with Python, GraphQL, Docker, Kubernetes
- Open source contributions
- Leadership experience

We offer competitive salary, equity, health benefits, and remote work flexibility.
```

---

## 🧪 Epic 1: Project Foundation & User Authentication

### Story 1.1: Project Initialization
**Status:** ✅ Automated verification only (no manual testing needed)
**Verification:** Project builds and runs successfully

- [x] Application starts without errors (`npm run dev`)
- [x] No TypeScript compilation errors
- [x] Supabase connection works

---

### Story 1.2: Design System & Layout Shell

#### Test Scenario 1: Desktop Layout (1280x720)
- [ ] Open application in Chrome at 1280x720 resolution
- [ ] Login with `test@coopready.com`
- [ ] **Verify sidebar:**
  - [ ] Sidebar is visible on left side
  - [ ] Sidebar has dark navy background (#2f3e4e or similar)
  - [ ] Navigation items visible: Dashboard, New Scan, History, Settings
  - [ ] User menu button visible in header
- [ ] **Verify sidebar collapse:**
  - [ ] Click sidebar toggle button
  - [ ] Sidebar collapses (icons only, labels hidden)
  - [ ] Click toggle again
  - [ ] Sidebar expands (icons + labels visible)
- [ ] **Verify navigation:**
  - [ ] Click "New Scan" → navigates to /scan/new
  - [ ] Click "History" → navigates to /history
  - [ ] Click "Settings" → navigates to /settings
  - [ ] Click "Dashboard" → navigates to /dashboard

#### Test Scenario 2: Mobile Layout (375x667)
- [ ] Resize browser to 375x667 (mobile viewport)
- [ ] **Verify mobile menu:**
  - [ ] Sidebar is hidden
  - [ ] Hamburger menu button visible in header
  - [ ] Click hamburger button
  - [ ] Mobile menu overlay appears
  - [ ] All navigation items visible in mobile menu
  - [ ] Click outside overlay → menu closes
- [ ] **Verify content:**
  - [ ] Main content is not clipped or overflowing
  - [ ] Text is readable (font size ≥ 14px)
  - [ ] All interactive elements are tappable (min 44px touch target)

#### Test Scenario 3: User Menu
- [ ] **Verify user menu display:**
  - [ ] Click user menu button (avatar/email in header)
  - [ ] User email displayed in dropdown
  - [ ] "Settings" link visible
  - [ ] "Log out" button visible
  - [ ] Click "Settings" → navigates to /settings
  - [ ] Click user menu again to open
  - [ ] Click "Log out" → logs out and redirects to /auth/login

---

### Story 1.3: User Registration

#### Test Scenario 1: Successful Registration
- [ ] Navigate to `/auth/sign-up`
- [ ] **Register new user:**
  - [ ] Enter email: `newuser@coopready.com`
  - [ ] Enter password: `NewUser123!` (≥ 8 characters)
  - [ ] Enter confirm password: `NewUser123!`
  - [ ] Click "Sign Up" button
- [ ] **Verify success:**
  - [ ] Redirected to "check your email" page (/auth/sign-up-success)
  - [ ] Success message displayed
  - [ ] Instructions to check email visible

#### Test Scenario 2: Duplicate Email Validation
- [ ] Navigate to `/auth/sign-up`
- [ ] Enter email: `test@coopready.com` (existing user)
- [ ] Enter password: `TestPassword123!`
- [ ] Enter confirm password: `TestPassword123!`
- [ ] Click "Sign Up"
- [ ] **Verify error:**
  - [ ] Error message: "An account with this email already exists"
  - [ ] User remains on sign-up page
  - [ ] No redirect occurs

#### Test Scenario 3: Email Format Validation
- [ ] Navigate to `/auth/sign-up`
- [ ] Enter email: `invalid-email-no-at-sign`
- [ ] Enter password: `TestPassword123!`
- [ ] Enter confirm password: `TestPassword123!`
- [ ] Click "Sign Up"
- [ ] **Verify validation:**
  - [ ] Error message: "Please enter a valid email"
  - [ ] Form not submitted (remains on sign-up page)

#### Test Scenario 4: Password Length Validation
- [ ] Navigate to `/auth/sign-up`
- [ ] Enter email: `test2@coopready.com`
- [ ] Enter password: `short` (< 8 characters)
- [ ] Enter confirm password: `short`
- [ ] Click "Sign Up"
- [ ] **Verify validation:**
  - [ ] Error message: "Password must be at least 8 characters"
  - [ ] Form not submitted

#### Test Scenario 5: Password Confirmation Match
- [ ] Navigate to `/auth/sign-up`
- [ ] Enter email: `test3@coopready.com`
- [ ] Enter password: `Password123!`
- [ ] Enter confirm password: `DifferentPass456!`
- [ ] Click "Sign Up"
- [ ] **Verify validation:**
  - [ ] Error message: "Passwords do not match"
  - [ ] Form not submitted

#### ⚠️ Test Scenario 6: Email Confirmation Flow (MANUAL TESTING REQUIRED)
**Note:** This test requires real email infrastructure and cannot be automated.

**Prerequisites:**
- Access to email inbox for test email address
- OR use Supabase dashboard to manually confirm email

**Steps:**
1. **Register new user** (if not already done in Scenario 1):
   - [ ] Navigate to `/auth/sign-up`
   - [ ] Register with email: `manual-test@coopready.com`
   - [ ] Password: `ManualTest123!`
   - [ ] Verify redirect to "check your email" page

2. **Check email inbox:**
   - [ ] Open email inbox for `manual-test@coopready.com`
   - [ ] Locate confirmation email from Supabase/CoopReady
   - [ ] Email subject contains "Confirm" or "Verify"
   - [ ] Email body contains confirmation link

3. **Click confirmation link:**
   - [ ] Click the confirmation link in email
   - [ ] Redirected to `/auth/login?verified=true`
   - [ ] Success toast: "Email verified successfully!"
   - [ ] Login page displays

4. **Verify login works:**
   - [ ] Enter email: `manual-test@coopready.com`
   - [ ] Enter password: `ManualTest123!`
   - [ ] Click "Log in"
   - [ ] Successfully logs in and redirects to onboarding (new user)

**Alternative (If Email Not Accessible):**
- [ ] Use Supabase dashboard → Authentication → Users
- [ ] Find user `manual-test@coopready.com`
- [ ] Manually set `email_confirmed_at` timestamp
- [ ] Attempt login → should work

---

### Story 1.4: User Login

#### Test Scenario 1: Valid Login
- [ ] Navigate to `/auth/login`
- [ ] Enter email: `test@coopready.com`
- [ ] Enter password: `TestUser123!`
- [ ] Click "Log in"
- [ ] **Verify success:**
  - [ ] Redirected to /dashboard (or /onboarding if profile incomplete)
  - [ ] Session cookie set (visible in DevTools → Application → Cookies)
  - [ ] Dashboard/onboarding page loads successfully
  - [ ] User email visible in header/user menu

#### Test Scenario 2: Incorrect Password
- [ ] Navigate to `/auth/login`
- [ ] Enter email: `test@coopready.com`
- [ ] Enter password: `WrongPassword123!`
- [ ] Click "Log in"
- [ ] **Verify error:**
  - [ ] Error message: "Invalid email or password"
  - [ ] Remains on login page
  - [ ] No session cookie created

#### Test Scenario 3: Non-Existent Email
- [ ] Navigate to `/auth/login`
- [ ] Enter email: `nonexistent@coopready.com`
- [ ] Enter password: `AnyPassword123!`
- [ ] Click "Log in"
- [ ] **Verify error:**
  - [ ] Error message: "Invalid email or password" (SAME as incorrect password)
  - [ ] Remains on login page
  - [ ] Error does NOT reveal email doesn't exist (security)

#### Test Scenario 4: Session Persistence
- [ ] Login with valid credentials
- [ ] **Verify session persists:**
  - [ ] Close browser tab
  - [ ] Reopen browser
  - [ ] Navigate to `/dashboard`
  - [ ] Still authenticated (no redirect to login)
  - [ ] Dashboard content loads

#### Test Scenario 5: Invalid Email Format
- [ ] Navigate to `/auth/login`
- [ ] Enter email: `invalid-email-format`
- [ ] Enter password: `AnyPassword123!`
- [ ] Click "Log in"
- [ ] **Verify validation:**
  - [ ] Error message: "Please enter a valid email"
  - [ ] Form not submitted

#### Test Scenario 6: Empty Password
- [ ] Navigate to `/auth/login`
- [ ] Enter email: `test@coopready.com`
- [ ] Leave password field empty
- [ ] Click "Log in"
- [ ] **Verify validation:**
  - [ ] Error message: "Password is required"
  - [ ] Form not submitted

---

### Story 1.5: User Logout

#### Test Scenario 1: Logout from User Menu
- [ ] Login with `test@coopready.com`
- [ ] Navigate to /dashboard
- [ ] **Logout:**
  - [ ] Click user menu button
  - [ ] Click "Log out"
  - [ ] Loading state shows on button ("Logging out...")
- [ ] **Verify logout:**
  - [ ] Redirected to /auth/login
  - [ ] Session cookie cleared (check DevTools)
  - [ ] User menu no longer accessible

#### Test Scenario 2: Protected Route Access After Logout
- [ ] After logging out (from Scenario 1)
- [ ] **Try accessing protected routes:**
  - [ ] Navigate to `/dashboard` → redirected to /auth/login
  - [ ] Navigate to `/settings` → redirected to /auth/login
  - [ ] Navigate to `/history` → redirected to /auth/login
  - [ ] Navigate to `/scan/new` → redirected to /auth/login

#### Test Scenario 3: Browser Back Button Protection
- [ ] Login with `test@coopready.com`
- [ ] Navigate to /dashboard
- [ ] Logout via user menu
- [ ] **Verify back button protection:**
  - [ ] Redirected to /auth/login
  - [ ] Click browser back button
  - [ ] Cannot access cached dashboard content
  - [ ] Redirected back to /auth/login

---

### Story 1.6: Password Reset

#### Test Scenario 1: Navigate to Reset Page
- [ ] Navigate to `/auth/login`
- [ ] Click "Forgot password?" link
- [ ] **Verify navigation:**
  - [ ] Redirected to /auth/forgot-password
  - [ ] Email input field visible
  - [ ] "Reset Password" button visible
  - [ ] Instructions visible: "Enter your email address"

#### Test Scenario 2: Request Reset for Valid Email
- [ ] On `/auth/forgot-password`
- [ ] Enter email: `test@coopready.com`
- [ ] Click "Reset Password"
- [ ] **Verify success:**
  - [ ] Success message: "Check your email for reset instructions"
  - [ ] Email input hidden (success state)
  - [ ] No error displayed

#### Test Scenario 3: Request Reset for Non-Existent Email (Security)
- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter email: `nonexistent@coopready.com`
- [ ] Click "Reset Password"
- [ ] **Verify security:**
  - [ ] SAME success message: "Check your email for reset instructions"
  - [ ] Email input hidden (same UX as valid email)
  - [ ] No indication that email doesn't exist (prevents enumeration)

#### Test Scenario 4: Invalid Email Format
- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter email: `invalid-email-format`
- [ ] Click "Reset Password"
- [ ] **Verify validation:**
  - [ ] Error message: "Please enter a valid email"
  - [ ] Form not submitted

#### Test Scenario 5: Password Update Flow
**Note:** This requires clicking the reset link from email (similar to email confirmation).

**Prerequisites:**
- [ ] Request password reset for `test@coopready.com`
- [ ] Access email inbox and click reset link

**Steps:**
- [ ] Click reset link from email
- [ ] **Verify redirect:**
  - [ ] Redirected to /auth/update-password
  - [ ] "New Password" input visible
  - [ ] "Confirm Password" input visible
  - [ ] "Update Password" button visible
  - [ ] Instructions visible: "Enter your new password"

- [ ] **Update password:**
  - [ ] Enter new password: `NewTestPass123!` (≥ 8 characters)
  - [ ] Enter confirm password: `NewTestPass123!`
  - [ ] Click "Update Password"

- [ ] **Verify success:**
  - [ ] Redirected to /auth/login?reset=true
  - [ ] Success toast: "Password updated successfully!"
  - [ ] Login page displays

- [ ] **Verify new password works:**
  - [ ] Enter email: `test@coopready.com`
  - [ ] Enter password: `NewTestPass123!` (NEW password)
  - [ ] Click "Log in"
  - [ ] Successfully logs in and redirects to /dashboard

- [ ] **Cleanup (restore original password):**
  - [ ] Repeat password reset flow
  - [ ] Change password back to: `TestUser123!`

#### Test Scenario 6: Password Validation on Update
- [ ] Navigate to /auth/update-password (via reset link)
- [ ] **Test short password:**
  - [ ] Enter password: `Short1` (< 8 characters)
  - [ ] Enter confirm: `Short1`
  - [ ] Click "Update Password"
  - [ ] Error message: "Password must be at least 8 characters"
  - [ ] Form not submitted

- [ ] **Test mismatched passwords:**
  - [ ] Enter password: `ValidPass123!`
  - [ ] Enter confirm: `DifferentPass456!`
  - [ ] Click "Update Password"
  - [ ] Error message: "Passwords do not match"
  - [ ] Form not submitted

---

### Story 1.7: Protected Dashboard Route

#### Test Scenario 1: Authenticated Dashboard Access
- [ ] Login with `test@coopready.com`
- [ ] **Verify dashboard:**
  - [ ] Redirected to /dashboard
  - [ ] Dashboard header visible
  - [ ] Sidebar navigation visible
  - [ ] Welcome message displays user email: `test@coopready.com`
  - [ ] User menu shows email

#### Test Scenario 2: Unauthenticated Redirect with URL Preservation
- [ ] Logout (or open incognito window)
- [ ] **Try accessing /dashboard:**
  - [ ] Navigate to `/dashboard`
  - [ ] Redirected to /auth/login?redirectTo=/dashboard
  - [ ] URL contains `redirectTo=/dashboard` parameter

- [ ] **Login and verify redirect back:**
  - [ ] Enter email: `test@coopready.com`
  - [ ] Enter password: `TestUser123!`
  - [ ] Click "Log in"
  - [ ] Redirected BACK to /dashboard (original URL)
  - [ ] Dashboard loads successfully

#### Test Scenario 3: All Dashboard Routes Protected
- [ ] Logout (or open incognito window)
- [ ] **Try accessing protected routes:**
  - [ ] Navigate to `/dashboard` → redirected to /auth/login?redirectTo=/dashboard
  - [ ] Navigate to `/settings` → redirected to /auth/login?redirectTo=/settings
  - [ ] Navigate to `/history` → redirected to /auth/login?redirectTo=/history
  - [ ] Navigate to `/scan/new` → redirected to /auth/login?redirectTo=/scan/new
  - [ ] All redirects preserve original URL in `redirectTo` parameter

#### Test Scenario 4: User Menu Display
- [ ] Login with `test@coopready.com`
- [ ] Navigate to /dashboard
- [ ] **Verify user menu:**
  - [ ] Click user menu button
  - [ ] User email displayed: `test@coopready.com`
  - [ ] "Settings" link visible
  - [ ] "Log out" button visible
  - [ ] Click outside menu → closes
  - [ ] Click "Settings" → navigates to /settings

#### Test Scenario 5: Session Expiry Handling
- [ ] Login with `test@coopready.com`
- [ ] Navigate to /dashboard
- [ ] **Simulate session expiry:**
  - [ ] Open DevTools → Application → Cookies
  - [ ] Delete all `sb-*` cookies (Supabase session cookies)
  - [ ] Navigate to /dashboard (refresh page)
- [ ] **Verify expiry handling:**
  - [ ] Redirected to /auth/login?expired=true&redirectTo=/dashboard
  - [ ] Toast message: "Your session has expired"
  - [ ] Original URL preserved in `redirectTo` parameter

#### Test Scenario 6: Open Redirect Prevention (Security)
- [ ] Logout
- [ ] **Try malicious redirect:**
  - [ ] Navigate to `/auth/login?redirectTo=//evil.com/phishing`
  - [ ] Enter valid credentials
  - [ ] Click "Log in"
- [ ] **Verify security:**
  - [ ] Redirected to /dashboard (safe default), NOT evil.com
  - [ ] URL is same origin (localhost:3000)
  - [ ] No external redirect occurs

---

## 🧪 Epic 2: User Onboarding & Profile Management

### Story 2.1: Onboarding Flow - Experience Level & Target Role

#### Test Scenario 1: First-Time Login Redirect to Onboarding
- [ ] **Register a brand new user** (or use `newuser@coopready.com` if not registered yet)
  - [ ] Navigate to /auth/sign-up
  - [ ] Register with email: `newuser@coopready.com`, password: `NewUser123!`
  - [ ] Confirm email (manually or via Supabase dashboard)

- [ ] **Login for first time:**
  - [ ] Navigate to /auth/login
  - [ ] Enter email: `newuser@coopready.com`
  - [ ] Enter password: `NewUser123!`
  - [ ] Click "Log in"

- [ ] **Verify onboarding redirect:**
  - [ ] Redirected to /onboarding (NOT /dashboard)
  - [ ] Onboarding container visible
  - [ ] Experience level step displays

#### Test Scenario 2: Experience Level Selection
- [ ] On /onboarding (Step 1: Experience Level)
- [ ] **Verify display:**
  - [ ] Heading: "Experience Level" or similar
  - [ ] Two options visible:
    - [ ] "Student/Recent Graduate" with description
    - [ ] "Career Changer" with description
  - [ ] "Next" button visible but DISABLED

- [ ] **Test selection:**
  - [ ] Click "Student/Recent Graduate"
  - [ ] Option appears selected (visual feedback)
  - [ ] "Next" button becomes ENABLED

- [ ] **Test deselection and reselection:**
  - [ ] Click "Career Changer"
  - [ ] "Career Changer" now selected
  - [ ] "Student/Recent Graduate" deselected
  - [ ] "Next" button remains ENABLED

#### Test Scenario 3: Target Role Selection
- [ ] Select "Student/Recent Graduate"
- [ ] Click "Next"
- [ ] **Verify Step 2 (Target Role):**
  - [ ] Heading: "Target Role" or similar
  - [ ] Dropdown/select field visible
  - [ ] "Back" button visible
  - [ ] "Complete Setup" button visible but DISABLED

- [ ] **Test dropdown:**
  - [ ] Click target role dropdown
  - [ ] Common roles visible:
    - [ ] Software Engineer
    - [ ] Data Analyst
    - [ ] Product Manager
    - [ ] UX Designer
    - [ ] Other

- [ ] **Select standard role:**
  - [ ] Click "Software Engineer"
  - [ ] Selection displays in dropdown
  - [ ] "Complete Setup" button becomes ENABLED

#### Test Scenario 4: Custom Role Input (Other)
- [ ] On Step 2 (Target Role)
- [ ] Click target role dropdown
- [ ] **Select "Other":**
  - [ ] Click "Other"
  - [ ] Custom role input field appears
  - [ ] Input field is focused (cursor ready)
  - [ ] "Complete Setup" button DISABLED (no custom role entered yet)

- [ ] **Enter custom role:**
  - [ ] Type: `Blockchain Developer`
  - [ ] "Complete Setup" button becomes ENABLED

- [ ] **Test empty custom role:**
  - [ ] Clear input field (delete text)
  - [ ] "Complete Setup" button becomes DISABLED
  - [ ] Enter text again: `DevRel Engineer`
  - [ ] "Complete Setup" button becomes ENABLED

#### Test Scenario 5: Back Navigation Between Steps
- [ ] On Step 2 (Target Role)
- [ ] **Test back button:**
  - [ ] Click "Back" button
  - [ ] Returned to Step 1 (Experience Level)
  - [ ] Previous selection still selected ("Student/Recent Graduate")
  - [ ] Click "Next" to return to Step 2
  - [ ] Previous role selection still selected ("Software Engineer" or custom role)

#### Test Scenario 6: Complete Onboarding
- [ ] On Step 2 (Target Role)
- [ ] Ensure selections:
  - [ ] Experience Level: "Career Changer"
  - [ ] Target Role: "Data Analyst"
- [ ] **Complete setup:**
  - [ ] Click "Complete Setup" button
  - [ ] Redirected to /dashboard
  - [ ] Dashboard loads successfully
  - [ ] Welcome message acknowledges selections (mentions "Career Changer" or "Data Analyst")

#### Test Scenario 7: Skip Onboarding for Existing Users
- [ ] **Logout** (from completed profile user)
- [ ] **Login with existing user:**
  - [ ] Navigate to /auth/login
  - [ ] Enter email: `test@coopready.com` (has completed profile)
  - [ ] Enter password: `TestUser123!`
  - [ ] Click "Log in"
- [ ] **Verify skip onboarding:**
  - [ ] Redirected directly to /dashboard (NOT /onboarding)
  - [ ] Onboarding page NOT shown
  - [ ] Dashboard content loads

#### Test Scenario 8: Block Protected Routes Until Onboarding Complete
- [ ] **Login as new user** (incomplete onboarding):
  - [ ] Use `newuser@coopready.com` (delete profile in Supabase to reset onboarding)
  - [ ] Or create another new user
  - [ ] Login → redirected to /onboarding

- [ ] **Try accessing protected routes:**
  - [ ] Manually navigate to `/dashboard` (type in URL)
  - [ ] Redirected back to /onboarding
  - [ ] Try `/settings` → redirected to /onboarding
  - [ ] Try `/history` → redirected to /onboarding
  - [ ] Try `/scan/new` → redirected to /onboarding

- [ ] **Complete onboarding:**
  - [ ] Select experience level and target role
  - [ ] Click "Complete Setup"
  - [ ] Now can access protected routes normally

#### Test Scenario 9: Prevent Completed Users from Accessing Onboarding
- [ ] Login with `test@coopready.com` (completed profile)
- [ ] **Try accessing onboarding:**
  - [ ] Navigate to `/onboarding`
  - [ ] Redirected to /dashboard
  - [ ] Cannot access onboarding page

---

### Story 2.2: Profile Settings Page

#### Test Scenario 1: Navigate to Settings
- [ ] Login with `test@coopready.com`
- [ ] **From Dashboard:**
  - [ ] Click "Settings" in sidebar navigation
  - [ ] Redirected to /settings
  - [ ] Settings page loads

- [ ] **From User Menu:**
  - [ ] Navigate to /dashboard
  - [ ] Click user menu button
  - [ ] Click "Settings" link
  - [ ] Redirected to /settings

#### Test Scenario 2: Display Current Profile
- [ ] On /settings
- [ ] **Verify profile section:**
  - [ ] Profile section visible with heading "Profile" or similar
  - [ ] Current experience level displayed: "Student/Recent Graduate" or "Career Changer"
  - [ ] Current target role displayed: e.g., "Software Engineer"
  - [ ] "Edit" button visible

#### Test Scenario 3: Edit Profile
- [ ] On /settings
- [ ] Click "Edit" button
- [ ] **Verify edit mode:**
  - [ ] Profile form appears (editable fields)
  - [ ] Experience level radio buttons visible:
    - [ ] Student/Recent Graduate
    - [ ] Career Changer
  - [ ] Target role dropdown visible
  - [ ] Current selections pre-filled
  - [ ] "Save Changes" button visible
  - [ ] "Cancel" button visible

#### Test Scenario 4: Change Experience Level
- [ ] In edit mode
- [ ] Current: "Student/Recent Graduate"
- [ ] **Change to Career Changer:**
  - [ ] Click "Career Changer" radio button
  - [ ] Selection updates
  - [ ] "Save Changes" button enabled
  - [ ] Click "Save Changes"
  - [ ] Success toast: "Profile updated successfully!"
  - [ ] Edit mode exits (form hidden)
  - [ ] Updated value displayed: "Career Changer"

#### Test Scenario 5: Change Target Role (Standard Role)
- [ ] Click "Edit" button
- [ ] Current target role: "Software Engineer"
- [ ] **Change to different role:**
  - [ ] Click target role dropdown
  - [ ] Select "Product Manager"
  - [ ] "Save Changes" button enabled
  - [ ] Click "Save Changes"
  - [ ] Success toast: "Profile updated successfully!"
  - [ ] Updated value displayed: "Product Manager"

#### Test Scenario 6: Change to Custom Role
- [ ] Click "Edit" button
- [ ] Click target role dropdown
- [ ] **Select "Other":**
  - [ ] Click "Other"
  - [ ] Custom role input appears
  - [ ] Input is focused
  - [ ] Type: `ML Engineer`
  - [ ] Click "Save Changes"
  - [ ] Success toast: "Profile updated successfully!"
  - [ ] Custom role displayed: "ML Engineer"

#### Test Scenario 7: Cancel Changes
- [ ] Click "Edit" button
- [ ] **Make changes:**
  - [ ] Change experience level to "Student/Recent Graduate"
  - [ ] Change target role to "UX Designer"
  - [ ] Click "Cancel" button
- [ ] **Verify cancellation:**
  - [ ] Edit mode exits (form hidden)
  - [ ] Original values still displayed (NOT changed)
  - [ ] Changes were NOT saved

#### Test Scenario 8: Navigate Away Without Saving
- [ ] Click "Edit" button
- [ ] **Make changes:**
  - [ ] Change experience level to "Career Changer"
  - [ ] Change target role to "Data Analyst"
  - [ ] DO NOT click "Save Changes"
- [ ] **Navigate away:**
  - [ ] Click "Dashboard" in sidebar
  - [ ] Navigate to /settings again
- [ ] **Verify changes not saved:**
  - [ ] Original values still displayed
  - [ ] Changed values NOT persisted

#### Test Scenario 9: Preserve Target Role When Changing Only Experience Level
- [ ] Click "Edit" button
- [ ] Current: Experience Level = "Student", Target Role = "Software Engineer"
- [ ] **Change only experience level:**
  - [ ] Select "Career Changer"
  - [ ] Leave target role as "Software Engineer"
  - [ ] Click "Save Changes"
  - [ ] Success toast displayed
- [ ] **Verify:**
  - [ ] Experience level updated: "Career Changer"
  - [ ] Target role preserved: "Software Engineer" (NOT changed)

---

## 🧪 Epic 3: Resume & Job Description Input

### Story 3.1: Resume Upload with Validation

#### Test Scenario 1: Upload UI Display
- [ ] Login with `test@coopready.com`
- [ ] Navigate to /scan/new
- [ ] **Verify upload UI:**
  - [ ] Drag-and-drop zone visible
  - [ ] Clear instructions: "Drag and drop your resume" or similar
  - [ ] Accepted formats listed: "PDF, DOCX"
  - [ ] Max file size shown: "Max 2MB"
  - [ ] "Browse files" button visible

#### Test Scenario 2: Upload Valid PDF (Drag & Drop)
- [ ] On /scan/new
- [ ] **Prepare valid PDF** (< 2MB, text-based)
- [ ] **Drag and drop:**
  - [ ] Drag `test-resume.pdf` into upload zone
  - [ ] Drop file
- [ ] **Verify upload:**
  - [ ] Progress indicator shown during upload
  - [ ] Filename displayed: "test-resume.pdf"
  - [ ] Remove/delete button visible
  - [ ] Success toast: "Resume uploaded successfully" or similar
  - [ ] File uploaded to Supabase Storage

#### Test Scenario 3: Upload Valid DOCX
- [ ] On /scan/new (remove previous file if uploaded)
- [ ] **Drag and drop DOCX:**
  - [ ] Drag `test-resume.docx` into upload zone
  - [ ] Drop file
- [ ] **Verify upload:**
  - [ ] Progress indicator shown
  - [ ] Filename displayed: "test-resume.docx"
  - [ ] Remove button visible
  - [ ] Success toast displayed
  - [ ] Same success experience as PDF

#### Test Scenario 4: Upload via Browse Button
- [ ] On /scan/new
- [ ] **Use browse button:**
  - [ ] Click "Browse files" button
  - [ ] File picker opens
  - [ ] File picker filtered to show only PDF and DOCX (accept attribute)
  - [ ] Select `test-resume.pdf`
  - [ ] Click "Open"
- [ ] **Verify upload:**
  - [ ] Progress indicator shown
  - [ ] Filename displayed
  - [ ] Success toast displayed

#### Test Scenario 5: File Size Validation (> 2MB)
- [ ] On /scan/new
- [ ] **Prepare large file** (> 2MB)
- [ ] **Attempt upload:**
  - [ ] Drag `large-resume.pdf` (> 2MB) into upload zone
  - [ ] Drop file
- [ ] **Verify validation:**
  - [ ] Error message: "File size must be under 2MB"
  - [ ] File NOT uploaded (no filename displayed)
  - [ ] Upload zone remains available
  - [ ] No success toast

#### Test Scenario 6: File Type Validation (Unsupported Type)
- [ ] On /scan/new
- [ ] **Attempt upload of .txt file:**
  - [ ] Drag `test-resume.txt` into upload zone
  - [ ] Drop file
- [ ] **Verify validation:**
  - [ ] Error message: "Please upload a PDF or DOCX file"
  - [ ] File NOT uploaded
  - [ ] Upload zone remains available

- [ ] **Try other unsupported types:**
  - [ ] Attempt .jpg image → same error
  - [ ] Attempt .png image → same error

#### Test Scenario 7: Remove Uploaded File
- [ ] Upload valid PDF (from Scenario 2)
- [ ] **Remove file:**
  - [ ] Click remove/delete button
  - [ ] File cleared
  - [ ] Filename no longer displayed
  - [ ] Upload zone visible again (ready for new upload)
  - [ ] Can upload new file

#### Test Scenario 8: Replace Uploaded File
- [ ] Upload `test-resume.pdf`
- [ ] Filename displayed: "test-resume.pdf"
- [ ] **Upload different file:**
  - [ ] Drag `test-resume.docx` into upload zone
  - [ ] Drop file
- [ ] **Verify replacement:**
  - [ ] Previous file replaced
  - [ ] New filename displayed: "test-resume.docx"
  - [ ] Remove button available

---

### Story 3.2: Resume Text Extraction

#### Test Scenario 1: Extract Text from PDF
- [ ] On /scan/new
- [ ] **Upload text-based PDF:**
  - [ ] Upload `test-resume.pdf` (text-based, NOT scanned)
  - [ ] File uploaded successfully
- [ ] **Verify extraction:**
  - [ ] No extraction error displayed
  - [ ] Success toast or message indicating extraction in progress
  - [ ] After processing (wait ~5-10 seconds):
    - [ ] No error toast appears
    - [ ] File remains uploaded (not cleared due to error)

#### Test Scenario 2: Extract Text from DOCX
- [ ] On /scan/new
- [ ] **Upload DOCX:**
  - [ ] Upload `test-resume.docx`
  - [ ] File uploaded successfully
- [ ] **Verify extraction:**
  - [ ] No extraction error displayed
  - [ ] Success toast or processing message
  - [ ] After processing:
    - [ ] No error appears
    - [ ] Text extracted (formatting converted to plain text)

#### Test Scenario 3: Handle Scanned PDF Error (Image-Based)
- [ ] On /scan/new
- [ ] **Upload scanned/image-based PDF:**
  - [ ] Upload `scanned-resume.pdf` (image-only, no text layer)
  - [ ] File uploads successfully
- [ ] **Verify error handling:**
  - [ ] After extraction attempt (~5-10 seconds):
    - [ ] Warning/error message: "Unable to extract text. Please upload a text-based PDF"
    - [ ] Error is user-friendly (no technical jargon)
    - [ ] User can re-upload different file
    - [ ] Upload zone remains accessible
    - [ ] User NOT blocked from proceeding

#### Test Scenario 4: Handle Corrupted PDF Error
- [ ] On /scan/new
- [ ] **Upload corrupted PDF:**
  - [ ] Create corrupted PDF (truncate file or corrupt header)
  - [ ] Upload corrupted file
- [ ] **Verify error handling:**
  - [ ] After extraction attempt:
    - [ ] Appropriate error message shown (graceful failure)
    - [ ] User-friendly message (not stack trace)
    - [ ] User can re-upload
    - [ ] User NOT blocked

**Note:** If corrupted test file not available, skip this scenario.

#### Test Scenario 5: Database Update on Success
**Note:** This requires database verification.

- [ ] Upload valid text-based PDF
- [ ] Wait for extraction to complete
- [ ] **Verify in Supabase Dashboard:**
  - [ ] Navigate to Supabase → Table Editor → `resumes` table
  - [ ] Find the uploaded resume record
  - [ ] `extracted_text` column contains text content
  - [ ] `extraction_status` = `completed`
  - [ ] `extraction_error` is null

---

### Story 3.3: Resume Section Parsing

#### Test Scenario 1: Basic Section Categorization
- [ ] Upload valid resume with multiple sections
- [ ] Wait for extraction and parsing to complete
- [ ] Navigate to resume preview page (or scan results)
- [ ] **Verify sections:**
  - [ ] Contact section visible (if in resume)
  - [ ] Summary/Objective section visible (if in resume)
  - [ ] Education section visible
  - [ ] Experience section visible
  - [ ] Skills section visible
  - [ ] Projects section visible (if in resume)
  - [ ] Other section visible (for non-standard content)
  - [ ] All 7 section categories present (even if some empty)

#### Test Scenario 2: Experience Section Parsing
- [ ] View parsed resume with Experience section
- [ ] **Verify job entries:**
  - [ ] Individual job entries separated clearly
  - [ ] Each entry shows:
    - [ ] Company name
    - [ ] Job title
    - [ ] Dates (e.g., "June 2021 - Present")
    - [ ] Bullet points (responsibilities/achievements)
  - [ ] Multiple job entries displayed if present
  - [ ] Bullet points formatted readably

#### Test Scenario 3: Education Section Parsing
- [ ] View parsed resume with Education section
- [ ] **Verify education entries:**
  - [ ] Each entry shows:
    - [ ] Institution name (e.g., "University of California, Berkeley")
    - [ ] Degree (e.g., "Bachelor of Science in Computer Science")
    - [ ] Dates (e.g., "2015-2019" or "Graduated May 2019")
    - [ ] GPA (if present in resume, e.g., "GPA: 3.8/4.0")
  - [ ] Multiple education entries displayed if present

#### Test Scenario 4: Skills Section with Categorization
- [ ] View parsed resume with Skills section
- [ ] **Verify skills display:**
  - [ ] All skills extracted and displayed
  - [ ] Technical skills visually distinguished (e.g., different color/badge)
  - [ ] Soft skills visually distinguished (e.g., different color/badge)
  - [ ] Skills displayed as chips/tags or list
  - [ ] Categories clearly labeled (e.g., "Technical Skills" vs "Soft Skills")

**Examples to verify:**
- [ ] Technical: React, Python, SQL, AWS → marked as "technical"
- [ ] Soft: Communication, Leadership, Teamwork → marked as "soft"

#### Test Scenario 5: Non-Standard Sections Handling
- [ ] Upload resume with non-standard sections (e.g., "Certifications", "Volunteering", "Publications")
- [ ] **Verify handling:**
  - [ ] Non-standard content placed in "Other" section
  - [ ] Content not lost (visible somewhere in preview)
  - [ ] Standard sections still parsed correctly

#### Test Scenario 6: Parsed Data Storage
- [ ] Upload and parse resume
- [ ] **Verify in Supabase Dashboard:**
  - [ ] Navigate to `resumes` table
  - [ ] Find resume record
  - [ ] `parsed_sections` column contains JSON data
  - [ ] JSON has keys: contact, summary, education, experience, skills, projects, other
  - [ ] `parsing_status` = `completed`
  - [ ] `parsing_error` is null

---

### Story 3.4: Resume Preview Display

#### Test Scenario 1: Resume Content Organized by Section
- [ ] Upload resume, wait for extraction and parsing
- [ ] Navigate to resume preview page
- [ ] **Verify preview display:**
  - [ ] Resume preview container visible
  - [ ] All sections clearly labeled:
    - [ ] Contact (if present)
    - [ ] Education
    - [ ] Experience
    - [ ] Skills
    - [ ] Projects (if present)
  - [ ] Section headers visible and distinguishable
  - [ ] Content matches original resume

#### Test Scenario 2: Experience Section Display
- [ ] View resume preview
- [ ] **Verify experience section:**
  - [ ] Job entries show company, title, dates
  - [ ] Bullet points displayed in readable format (not run-on text)
  - [ ] Section is expandable/collapsible (click to expand/collapse)
  - [ ] Visual hierarchy clear (company > title > dates > bullets)

#### Test Scenario 3: Skills Section Display with Visual Distinction
- [ ] View resume preview
- [ ] **Verify skills section:**
  - [ ] All skills displayed as chips/tags (pill-shaped badges)
  - [ ] Technical skills have distinct color (e.g., blue)
  - [ ] Soft skills have distinct color (e.g., green or purple)
  - [ ] Visual distinction is CLEAR (easy to tell difference)
  - [ ] Skills are grouped or labeled by category

**Example:**
- Technical Skills (blue): React, TypeScript, Python, SQL
- Soft Skills (green): Communication, Leadership, Teamwork

#### Test Scenario 4: Error State - Parsing Failed
- [ ] Upload resume that causes parsing failure
  - [ ] OR manually set `parsing_status='failed'` in Supabase
- [ ] **Verify error state:**
  - [ ] Navigate to preview page
  - [ ] Error message displayed explaining what went wrong
  - [ ] Re-upload button visible and enabled
  - [ ] User NOT blocked from proceeding
  - [ ] Clear call-to-action (e.g., "Upload a different file")

#### Test Scenario 5: Error State - Extraction Failed
- [ ] Upload scanned PDF (image-based)
- [ ] Extraction fails
- [ ] **Verify error state:**
  - [ ] Navigate to preview page
  - [ ] Extraction error message displayed
  - [ ] Re-upload option shown
  - [ ] User-friendly message (not technical)

#### Test Scenario 6: Loading State During Processing
- [ ] Upload resume
- [ ] **Immediately navigate to preview page** (while parsing in progress)
- [ ] **Verify loading state:**
  - [ ] Loading skeleton/spinner shown
  - [ ] No error displayed (processing in progress)
  - [ ] "Processing..." or similar message
- [ ] **Wait for completion:**
  - [ ] UI auto-updates when parsing completes
  - [ ] Loading state replaced with parsed content
  - [ ] No page refresh required (polling or real-time updates)

#### Test Scenario 7: Proceed Button - Enabled When Complete
- [ ] Upload resume and wait for parsing to complete
- [ ] Navigate to preview page
- [ ] **Verify proceed button:**
  - [ ] `parsing_status='completed'`
  - [ ] "Proceed to Analysis" or "Continue" button visible
  - [ ] Button is ENABLED
  - [ ] Click button → navigates to next step (/scan/job-description or /analysis)

#### Test Scenario 8: Proceed Button - Disabled When Pending
- [ ] Upload resume
- [ ] Navigate to preview while parsing is pending
- [ ] **Verify proceed button:**
  - [ ] `parsing_status='pending'`
  - [ ] Proceed button NOT visible OR disabled
  - [ ] Cannot proceed until parsing completes

---

### Story 3.5: Job Description Input

#### Test Scenario 1: JD Input UI Display
- [ ] Navigate to /scan/new
- [ ] Upload resume (resume must be uploaded first)
- [ ] **Verify JD section:**
  - [ ] Job description section visible
  - [ ] Large textarea for pasting JD
  - [ ] Character counter: "0 / 5000" (initially)
  - [ ] Helper text: "Paste the full job description"

#### Test Scenario 2: Real-Time Character Counter
- [ ] On /scan/new with JD textarea visible
- [ ] **Type/paste text:**
  - [ ] Paste short text (~100 characters)
  - [ ] Character counter updates in real-time: "100 / 5000"
  - [ ] Paste more text (~500 characters total)
  - [ ] Counter updates: "500 / 5000"
  - [ ] Real-time update (no lag)

#### Test Scenario 3: Max Length Validation (5000 Characters)
- [ ] On /scan/new
- [ ] **Paste text > 5000 characters:**
  - [ ] Copy long text (6000+ characters)
  - [ ] Paste into JD textarea
- [ ] **Verify validation:**
  - [ ] Character counter shows over-limit (e.g., "6000 / 5000")
  - [ ] Counter text is RED or warning color
  - [ ] Error message: "Job description must be under 5000 characters"
  - [ ] Submit/Start Analysis button is DISABLED
  - [ ] Cannot proceed until text reduced

#### Test Scenario 4: Empty JD Validation
- [ ] On /scan/new
- [ ] Resume uploaded, JD textarea empty
- [ ] **Verify validation:**
  - [ ] Submit button DISABLED
  - [ ] Hint text: "Enter a job description to continue"
  - [ ] No error shown (empty is just disabled state)

#### Test Scenario 5: Short JD Warning (< 100 Characters)
- [ ] On /scan/new
- [ ] **Enter short JD:**
  - [ ] Type: "Software Engineer position" (~30 characters)
- [ ] **Verify warning:**
  - [ ] Warning message: "Job description seems short. Include the full posting for best results"
  - [ ] Warning is NOT an error (user can still proceed)
  - [ ] Submit button is ENABLED (warning, not blocking)
  - [ ] User can continue if they want

#### Test Scenario 6: Keyword Extraction Preview
- [ ] On /scan/new
- [ ] **Paste valid JD** (>100 characters, include technical keywords):
  - [ ] Use test JD from credentials section (React, TypeScript, Python, etc.)
- [ ] **Verify keyword preview:**
  - [ ] Keyword preview section visible
  - [ ] Detected keywords displayed (e.g., React, TypeScript, Python)
  - [ ] Keywords shown as chips/tags or list
  - [ ] At least 3-5 keywords detected and displayed
  - [ ] Helps verify correct content pasted

#### Test Scenario 7: Character Counter Color Coding
- [ ] On /scan/new
- [ ] **Test different lengths:**
  - [ ] At 100 characters: Counter is muted/gray color
  - [ ] At 3600 characters: Counter is yellow/warning color (approaching limit)
  - [ ] At 4600 characters: Counter is red/danger color (near limit)
  - [ ] At 5000+ characters: Counter is red + error message
- [ ] **Verify tiered visual feedback** via color

#### Test Scenario 8: Form Submission with Valid Inputs
- [ ] On /scan/new
- [ ] **Complete both inputs:**
  - [ ] Upload valid resume (PDF or DOCX)
  - [ ] Paste valid JD (>100 chars, <5000 chars)
- [ ] **Verify submit button:**
  - [ ] "Start Analysis" button is ENABLED
  - [ ] Click "Start Analysis"
  - [ ] Success toast: "Scan created" or similar
  - [ ] Redirected to /scan/[scanId] (scan results page)
  - [ ] Loading state shown (analysis in progress)

---

### Story 3.6: New Scan Page Integration

#### Test Scenario 1: Complete Page Layout
- [ ] Login with `test@coopready.com`
- [ ] **Navigate to New Scan:**
  - [ ] Click "New Scan" in sidebar
  - [ ] Redirected to /scan/new
- [ ] **Verify page layout:**
  - [ ] Scan page container visible
  - [ ] Resume upload section visible (left or top)
  - [ ] Job description section visible (right or bottom)
  - [ ] "Start Analysis" button visible
  - [ ] Button initially DISABLED (no inputs)

#### Test Scenario 2: Button Disabled Without JD
- [ ] On /scan/new
- [ ] **Upload resume only:**
  - [ ] Upload `test-resume.pdf`
  - [ ] Resume uploaded successfully
  - [ ] Leave JD textarea empty
- [ ] **Verify button state:**
  - [ ] "Start Analysis" button is DISABLED
  - [ ] Hint text: "Enter a job description to continue"

#### Test Scenario 3: Button Disabled Without Resume
- [ ] On /scan/new
- [ ] **Enter JD only:**
  - [ ] Leave resume empty
  - [ ] Paste valid JD (>100 chars)
  - [ ] JD entered successfully
- [ ] **Verify button state:**
  - [ ] "Start Analysis" button is DISABLED
  - [ ] Hint text: "Upload your resume to continue"

#### Test Scenario 4: Complete Analysis Workflow
- [ ] On /scan/new
- [ ] **Upload resume:**
  - [ ] Upload `test-resume.pdf`
  - [ ] Resume uploaded successfully
- [ ] **Enter JD:**
  - [ ] Paste test JD (from credentials section)
  - [ ] JD entered successfully
  - [ ] Keyword preview shows (React, TypeScript, Python, etc.)
- [ ] **Start analysis:**
  - [ ] "Start Analysis" button is ENABLED
  - [ ] Click "Start Analysis"
  - [ ] Button shows loading state (disabled, "Starting..." or spinner)
- [ ] **Verify redirect:**
  - [ ] Redirected to `/scan/[scanId]` (dynamic ID)
  - [ ] Scan ID visible in URL
  - [ ] Loading state: "Analyzing resume..." or similar
  - [ ] New scan record created in database

#### Test Scenario 5: Resume Persistence Across Page Reloads
- [ ] On /scan/new
- [ ] Upload resume: `test-resume.pdf`
- [ ] **Reload page:**
  - [ ] Refresh page (Cmd+R or F5)
  - [ ] Page reloads
- [ ] **Verify persistence:**
  - [ ] Previously uploaded resume still displayed
  - [ ] Filename: "test-resume.pdf" visible
  - [ ] Remove button available
  - [ ] Can remove and upload new file
  - [ ] OR can use existing file for new scan

**Note:** JD typically NOT persisted (form field cleared on reload).

#### Test Scenario 6: Responsive Two-Column Layout

**Desktop (1280x720):**
- [ ] Resize browser to 1280x720
- [ ] Navigate to /scan/new
- [ ] **Verify layout:**
  - [ ] Two-column grid layout
  - [ ] Resume upload on LEFT
  - [ ] JD input on RIGHT
  - [ ] Columns are side-by-side
  - [ ] Equal or proportional width
  - [ ] "Start Analysis" button below columns or at bottom

**Mobile (375x667):**
- [ ] Resize browser to 375x667
- [ ] Navigate to /scan/new
- [ ] **Verify layout:**
  - [ ] Stacked layout (single column)
  - [ ] Resume upload on TOP
  - [ ] JD input on BOTTOM
  - [ ] All sections accessible without horizontal scroll
  - [ ] "Start Analysis" button at bottom
  - [ ] Touch-friendly (large tap targets)

#### Test Scenario 7: Contextual Hints Based on Form State
- [ ] On /scan/new
- [ ] **Empty form:**
  - [ ] No resume, no JD
  - [ ] Button hint: "Upload resume and enter job description" or similar

- [ ] **Resume only:**
  - [ ] Upload resume
  - [ ] Button hint: "Enter a job description to continue"

- [ ] **JD only:**
  - [ ] Remove resume, keep JD
  - [ ] Button hint: "Upload your resume to continue"

- [ ] **Both complete:**
  - [ ] Upload resume and enter JD
  - [ ] Button ENABLED, hint changes to "Click to start analysis" or similar

#### Test Scenario 8: Loading State During Scan Creation
- [ ] On /scan/new with valid resume and JD
- [ ] **Click "Start Analysis":**
  - [ ] Button immediately shows loading state
  - [ ] Button disabled (cannot click again)
  - [ ] Loading text: "Starting analysis..." or spinner
  - [ ] After ~1-2 seconds:
    - [ ] Redirected to `/scan/[scanId]`
    - [ ] Loading completes

---

## 📊 Testing Summary Checklist

### Pre-Testing Setup
- [ ] Local development server running (`npm run dev`)
- [ ] Supabase connection working
- [ ] Test user accounts created (or use provided credentials)
- [ ] Test resume files prepared (PDF, DOCX, large file, text file, scanned PDF)
- [ ] Test job description copied (from credentials section)

### Epic 1: Authentication (7 Stories)
- [ ] Story 1.1: Project Initialization ✅ (automated only)
- [ ] Story 1.2: Design System & Layout Shell (3 scenarios)
- [ ] Story 1.3: User Registration (6 scenarios, **including manual email confirmation**)
- [ ] Story 1.4: User Login (6 scenarios)
- [ ] Story 1.5: User Logout (3 scenarios)
- [ ] Story 1.6: Password Reset (6 scenarios, **including email reset flow**)
- [ ] Story 1.7: Protected Dashboard Route (6 scenarios)

### Epic 2: Onboarding & Profile (2 Stories)
- [ ] Story 2.1: Onboarding Flow (9 scenarios)
- [ ] Story 2.2: Profile Settings Page (9 scenarios)

### Epic 3: Resume & Job Description (6 Stories)
- [ ] Story 3.1: Resume Upload (8 scenarios)
- [ ] Story 3.2: Resume Text Extraction (5 scenarios)
- [ ] Story 3.3: Resume Section Parsing (6 scenarios)
- [ ] Story 3.4: Resume Preview Display (8 scenarios)
- [ ] Story 3.5: Job Description Input (8 scenarios)
- [ ] Story 3.6: New Scan Page Integration (8 scenarios)

### Post-Testing
- [ ] All critical scenarios passed
- [ ] Known issues documented (if any)
- [ ] Screenshot/video evidence collected (for critical flows)
- [ ] Cleanup: Delete test data from Supabase (optional)
- [ ] Reset test user passwords to original (if changed during testing)

---

## 🐛 Issue Tracking Template

Use this template to document any issues found during manual testing:

```markdown
### Issue #X: [Brief Description]

**Story:** [e.g., 1.3: User Registration]
**Scenario:** [e.g., Test Scenario 6: Email Confirmation Flow]
**Severity:** [P0 - Blocker | P1 - High | P2 - Medium | P3 - Low]
**Status:** [New | In Progress | Fixed | Won't Fix]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshot/Video:**
[Link or attach]

**Environment:**
- Browser: [Chrome 120, Safari 17, etc.]
- OS: [macOS 14, Windows 11, etc.]
- Screen size: [1280x720, 375x667, etc.]

**Notes:**
[Additional context]
```

---

## ✅ Sign-Off

**Tested By:** ________________
**Date:** ________________
**Test Duration:** _______ hours
**Pass Rate:** _____ / _____ scenarios

**Overall Result:** [ ] PASS  [ ] PASS with Issues  [ ] FAIL

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Ready for Epic 4:** [ ] YES  [ ] NO (issues must be resolved first)

---

**Generated:** 2026-01-20
**For:** CoopReady Manual Testing - Epics 1, 2, 3
**Next Steps:** Complete manual testing → Resolve any issues → Proceed to Epic 4

---

<!-- Powered by BMAD-CORE™ -->
