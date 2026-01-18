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
  - intial_docs/ux_screenshots/ (6 design reference images)
---

# CoopReady - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for CoopReady, decomposing the requirements from the PRD, Architecture, and UX Design references into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Account Management (FR1-FR7)**
- FR1: Users can create an account using email and password
- FR2: Users can log in to their existing account
- FR3: Users can log out of their account
- FR4: Users can reset their password via email
- FR5: Users can select their experience level (Student or Career Changer) during onboarding
- FR6: Users can select their target role type during onboarding
- FR7: Users can update their experience level and target role in settings

**Resume Management (FR8-FR12)**
- FR8: Users can upload a resume file (PDF or DOCX format)
- FR9: System can extract text content from uploaded resume files
- FR10: System can parse resume sections (contact, education, experience, skills, projects)
- FR11: Users can view their extracted resume content before analysis
- FR12: System validates file type and size (max 2MB) before processing

**Job Description Management (FR13-FR15)**
- FR13: Users can paste job description text into a text input
- FR14: System can extract keywords and requirements from job descriptions
- FR15: System validates job description length (max 5000 characters)

**Analysis Engine (FR16-FR20)**
- FR16: System can calculate an ATS compatibility score (0-100) for resume vs job description
- FR17: System can identify missing keywords from job description not present in resume
- FR18: System can provide section-level breakdown of ATS score
- FR19: System can detect experience level context and adjust analysis accordingly
- FR20: System can identify resume format issues (length, structure, formatting)

**Suggestion Generation (FR21-FR28)**
- FR21: System can generate before/after bullet point rewrites for each experience entry
- FR22: System can detect transferable skills in non-tech experience
- FR23: System can map transferable skills to tech-equivalent terminology
- FR24: System can suggest action verb improvements for bullet points
- FR25: System can suggest quantification opportunities for achievements
- FR26: System can suggest skills expansion (e.g., "Python" → "Python (pandas, scikit-learn)")
- FR27: System can provide format/length guidance for North American resume standards
- FR28: System can suggest content to remove (e.g., photo, DOB for international students)

**Results & Feedback (FR29-FR34)**
- FR29: Users can view their ATS score and analysis results
- FR30: Users can view all generated suggestions organized by resume section
- FR31: Users can accept individual suggestions to include in optimized resume
- FR32: Users can reject individual suggestions to exclude from optimized resume
- FR33: Users can see a preview of how accepted suggestions change their resume
- FR34: Users can view missing keywords from the job description

**Resume Export (FR35-FR37)**
- FR35: Users can download their optimized resume with accepted suggestions applied
- FR36: Users can choose download format (PDF or DOCX)
- FR37: System generates properly formatted resume document for download

**Subscription & Billing (FR38-FR44)**
- FR38: Free users are limited to 3 scans per month
- FR39: System tracks and enforces scan usage limits per user
- FR40: Users can view their remaining scan count
- FR41: Users can upgrade to paid subscription ($5/month)
- FR42: Paid users have unlimited scans
- FR43: Users can manage their subscription (view status, cancel)
- FR44: System processes payments securely via Stripe

**Error Handling (FR45-FR47)**
- FR45: System provides clear error messages when resume parsing fails
- FR46: System provides clear error messages when analysis cannot be completed
- FR47: Users can retry failed operations

### Non-Functional Requirements

**Performance (NFR1-NFR5)**
- NFR1: Page load time (TTI) < 3 seconds
- NFR2: AI analysis completion < 20 seconds (p95)
- NFR3: File upload processing < 5 seconds
- NFR4: Core Web Vitals LCP < 2.5 seconds
- NFR5: Core Web Vitals CLS < 0.1

**Security (NFR6-NFR11)**
- NFR6: Data encryption in transit (TLS 1.2+ HTTPS)
- NFR7: Data encryption at rest (AES-256)
- NFR8: Authentication with secure password hashing (bcrypt)
- NFR9: File upload validation (type, size, malware scanning)
- NFR10: Payment processing PCI-DSS compliant via Stripe
- NFR11: Secure session management with token expiration

**Accessibility (NFR12-NFR16)**
- NFR12: WCAG 2.1 Level AA compliance
- NFR13: Full keyboard navigation support
- NFR14: Screen reader support with ARIA labels and semantic HTML
- NFR15: Color contrast minimum 4.5:1
- NFR16: Visible focus indicators on all interactive elements

**Integration (NFR17-NFR20)**
- NFR17: OpenAI API with graceful failure handling and retry logic
- NFR18: Stripe integration with webhook failure handling, idempotent operations
- NFR19: Supabase Storage with retry and timeout handling
- NFR20: Database connection with pooling and reconnect logic

**Reliability (NFR21-NFR23)**
- NFR21: System uptime 99.5%
- NFR22: Error rate < 5% for resume processing
- NFR23: Daily automated backups

### Additional Requirements

**From Architecture - Project Setup:**
- AR1: Project initialization using Supabase starter template: `npx create-next-app -e with-supabase coopready`
- AR2: shadcn/ui initialization and component setup
- AR3: Additional package installation: stripe, @stripe/stripe-js, openai, pdf-parse, mammoth, @react-pdf/renderer, docx
- AR4: Environment variables configuration (Supabase, OpenAI, Stripe)
- AR5: Database schema creation via Supabase Dashboard with RLS policies

**From Architecture - Code Patterns:**
- AR6: Server Actions must return `{ data: T; error: null } | { data: null; error: { message, code? } }` shape
- AR7: Zod validation required for all Server Action inputs
- AR8: Database naming: snake_case tables/columns, transform to camelCase at API boundary
- AR9: Feature-based component organization (forms/, analysis/, layout/, shared/)
- AR10: useTransition hook required for all Server Action calls on client

**From Architecture - Infrastructure:**
- AR11: Supabase Storage for file uploads (not AWS S3)
- AR12: Vercel deployment with Git integration
- AR13: Middleware-based auth protection for dashboard routes
- AR14: RLS policies for data access control

**From UX Screenshots - Design System:**
- UX1: Primary color: Purple/Violet (~#7266ba)
- UX2: Sidebar: Dark navy (~#2f3e4e)
- UX3: Accent colors: Teal, Yellow, Green for data visualization
- UX4: Background: Light gray (#f0f3f4), Cards: White
- UX5: Left sidebar navigation pattern with collapsible sections
- UX6: Card-based dashboard layout with stat widgets
- UX7: Clean, minimal login form (centered, simple)
- UX8: Data tables with progress indicators and pagination
- UX9: Donut/pie charts for score visualization
- UX10: Sans-serif typography (Open Sans style)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Create account with email/password |
| FR2 | Epic 1 | Log in to existing account |
| FR3 | Epic 1 | Log out of account |
| FR4 | Epic 1 | Reset password via email |
| FR5 | Epic 2 | Select experience level during onboarding |
| FR6 | Epic 2 | Select target role during onboarding |
| FR7 | Epic 2 | Update experience level and target role in settings |
| FR8 | Epic 3 | Upload resume file (PDF/DOCX) |
| FR9 | Epic 3 | Extract text from uploaded resume |
| FR10 | Epic 3 | Parse resume sections |
| FR11 | Epic 3 | View extracted resume content |
| FR12 | Epic 3 | Validate file type and size |
| FR13 | Epic 3 | Paste job description text |
| FR14 | Epic 3 | Extract keywords from job description |
| FR15 | Epic 3 | Validate job description length |
| FR16 | Epic 4 | Calculate ATS compatibility score (0-100) |
| FR17 | Epic 4 | Identify missing keywords |
| FR18 | Epic 4 | Section-level score breakdown |
| FR19 | Epic 4 | Experience-level-aware analysis |
| FR20 | Epic 4 | Detect resume format issues |
| FR21 | Epic 5 | Generate before/after bullet rewrites |
| FR22 | Epic 5 | Detect transferable skills |
| FR23 | Epic 5 | Map transferable skills to tech terminology |
| FR24 | Epic 5 | Suggest action verb improvements |
| FR25 | Epic 5 | Suggest quantification opportunities |
| FR26 | Epic 5 | Suggest skills expansion |
| FR27 | Epic 5 | Provide format/length guidance |
| FR28 | Epic 5 | Suggest content to remove |
| FR29 | Epic 5 | View ATS score and analysis results |
| FR30 | Epic 5 | View suggestions by resume section |
| FR31 | Epic 5 | Accept individual suggestions |
| FR32 | Epic 5 | Reject individual suggestions |
| FR33 | Epic 5 | Preview optimized resume |
| FR34 | Epic 5 | View missing keywords |
| FR35 | Epic 6 | Download optimized resume |
| FR36 | Epic 6 | Choose download format (PDF/DOCX) |
| FR37 | Epic 6 | Generate formatted resume document |
| FR38 | Epic 7 | Free users limited to 3 scans/month |
| FR39 | Epic 7 | Track and enforce scan limits |
| FR40 | Epic 7 | View remaining scan count |
| FR41 | Epic 7 | Upgrade to paid subscription |
| FR42 | Epic 7 | Paid users have unlimited scans |
| FR43 | Epic 7 | Manage subscription (view/cancel) |
| FR44 | Epic 7 | Process payments via Stripe |
| FR45 | Epic 3 | Error messages for resume parsing failures |
| FR46 | Epic 4 | Error messages for analysis failures |
| FR47 | Epic 6 | Retry failed operations |

## Epic List

### Epic 1: Project Foundation & User Authentication
Users can create accounts, sign in, and access the protected dashboard with a complete authentication system.

**FRs covered:** FR1, FR2, FR3, FR4
**Additional Reqs:** AR1-AR5 (project setup), AR6-AR10 (code patterns), AR11-AR14 (infrastructure), UX1-UX5 (design system, sidebar), UX7 (login form)
**NFRs:** NFR6-NFR11 (security), NFR12-NFR16 (accessibility), NFR1, NFR4, NFR5 (performance)

---

### Epic 2: User Onboarding & Profile Management
Users can personalize their experience by selecting their experience level (Student/Career Changer) and target role, enabling context-aware analysis.

**FRs covered:** FR5, FR6, FR7

---

### Epic 3: Resume & Job Description Input
Users can upload their resume, input a job description, and view extracted content ready for AI analysis.

**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR45
**NFRs:** NFR3 (upload < 5s), NFR9 (file validation), NFR19 (storage reliability)

---

### Epic 4: ATS Analysis Engine
Users receive an ATS compatibility score (0-100) with detailed analysis of their resume against the job description.

**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR46
**NFRs:** NFR2 (AI analysis < 20s), NFR17 (OpenAI graceful handling)
**UX:** UX6 (stat cards), UX9 (donut charts for scores)

---

### Epic 5: Suggestions & Optimization Workflow
Users can view AI-generated improvement suggestions (before/after bullet rewrites, transferable skills mapping), accept/reject them individually, and preview their optimized resume.

**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34
**UX:** UX8 (data tables), card-based suggestion display

---

### Epic 6: Resume Export & Download
Users can download their optimized resume with all accepted suggestions applied in their preferred format (PDF or DOCX).

**FRs covered:** FR35, FR36, FR37, FR47

---

### Epic 7: Subscription & Billing
Free users are limited to 3 scans/month; paid users ($5/mo) get unlimited scans with secure Stripe payment processing.

**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44
**NFRs:** NFR10 (PCI via Stripe), NFR18 (Stripe webhook handling)

---

## Epic 1: Project Foundation & User Authentication

Users can create accounts, sign in, and access the protected dashboard with a complete authentication system.

### Story 1.1: Project Initialization

As a **developer**,
I want **the project initialized with Next.js 14, Supabase, and all required dependencies**,
So that **I have a working foundation to build the application on**.

**Acceptance Criteria:**

**Given** the project does not exist
**When** I run the initialization command `npx create-next-app -e with-supabase coopready`
**Then** a new Next.js 14 project is created with App Router
**And** Supabase auth is pre-configured with middleware
**And** TypeScript strict mode is enabled

**Given** the project is initialized
**When** I install additional dependencies (stripe, openai, pdf-parse, mammoth, @react-pdf/renderer, docx, zod, react-hook-form)
**Then** all packages are added to package.json
**And** the project builds without errors

**Given** the project has dependencies installed
**When** I create the `.env.local` file with Supabase credentials
**Then** environment variables are loaded correctly
**And** Supabase client can connect to the database

**Given** the project structure exists
**When** I run `npx shadcn@latest init`
**Then** shadcn/ui is configured with Tailwind CSS
**And** the `components/ui/` directory is created

**Technical Notes:**
- Follow AR1-AR5 from Architecture
- Create `.env.example` with placeholder values
- Verify Supabase connection works in development

---

### Story 1.2: Design System & Layout Shell

As a **user**,
I want **a consistent, professional-looking interface**,
So that **I feel confident using the application**.

**Acceptance Criteria:**

**Given** shadcn/ui is initialized
**When** I configure the Tailwind theme
**Then** the primary color is purple/violet (#7266ba)
**And** the sidebar color is dark navy (#2f3e4e)
**And** accent colors (teal, yellow, green) are defined
**And** background is light gray (#f0f3f4)

**Given** the theme is configured
**When** I create the dashboard layout component
**Then** a left sidebar navigation is rendered (collapsible)
**And** the main content area uses card-based layout
**And** the layout is responsive (mobile-first)

**Given** the layout exists
**When** I view it on mobile (<768px)
**Then** the sidebar collapses to a hamburger menu
**And** content remains accessible and readable

**Given** the layout exists
**When** I view it on desktop (>1024px)
**Then** the sidebar is expanded by default
**And** the layout uses the full width appropriately

**Technical Notes:**
- Follow UX1-UX10 from design screenshots
- Use Open Sans or similar sans-serif font
- Implement with Tailwind CSS breakpoints
- Create `components/layout/Sidebar.tsx`, `Header.tsx`, `DashboardLayout.tsx`

---

### Story 1.3: User Registration

As a **new user**,
I want **to create an account using my email and password**,
So that **I can access the resume optimization features**.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter a valid email and password (min 8 characters)
**Then** my account is created in Supabase Auth
**And** I receive a confirmation email
**And** I am redirected to a "check your email" page

**Given** I am on the signup page
**When** I enter an email that is already registered
**Then** I see an error message "An account with this email already exists"
**And** I am not redirected

**Given** I am on the signup page
**When** I enter an invalid email format
**Then** I see a validation error "Please enter a valid email"
**And** the form is not submitted

**Given** I am on the signup page
**When** I enter a password shorter than 8 characters
**Then** I see a validation error "Password must be at least 8 characters"
**And** the form is not submitted

**Given** I click the confirmation link in my email
**When** the link is valid and not expired
**Then** my email is verified
**And** I am redirected to the login page with a success message

**Technical Notes:**
- Create `app/(auth)/signup/page.tsx`
- Use Zod schema for validation (AR7)
- Follow ActionResponse pattern (AR6)
- Create `users` table in Supabase with RLS policies
- Style login form per UX7 (centered, minimal)

---

### Story 1.4: User Login

As a **registered user**,
I want **to log in to my account**,
So that **I can access my personalized dashboard**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter valid credentials (email + password)
**Then** I am authenticated via Supabase
**And** a session cookie is set
**And** I am redirected to the dashboard

**Given** I am on the login page
**When** I enter an incorrect password
**Then** I see an error message "Invalid email or password"
**And** I remain on the login page

**Given** I am on the login page
**When** I enter an email that doesn't exist
**Then** I see an error message "Invalid email or password"
**And** the error does not reveal whether the email exists (security)

**Given** I am logged in
**When** I close the browser and return later
**Then** my session is still active (cookie-based)
**And** I am taken directly to the dashboard

**Technical Notes:**
- Create `app/(auth)/login/page.tsx`
- Use `@supabase/ssr` for session management
- Follow UX7 design (clean login form)
- Include "Forgot password?" link
- Include "Don't have an account? Sign up" link

---

### Story 1.5: User Logout

As a **logged-in user**,
I want **to log out of my account**,
So that **my session is securely ended**.

**Acceptance Criteria:**

**Given** I am logged in and on any protected page
**When** I click the "Log out" button in the user menu
**Then** my session is invalidated
**And** the session cookie is cleared
**And** I am redirected to the login page

**Given** I have logged out
**When** I try to access a protected route directly via URL
**Then** I am redirected to the login page
**And** I cannot access protected content

**Given** I have logged out
**When** I use the browser back button
**Then** I cannot access cached protected pages
**And** I am redirected to login if I try

**Technical Notes:**
- Add logout action to `actions/auth.ts`
- Add "Log out" option to `components/layout/UserMenu.tsx`
- Use Server Action for logout (not client-side only)

---

### Story 1.6: Password Reset

As a **user who forgot my password**,
I want **to reset it via email**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Forgot password?"
**Then** I am taken to the password reset request page

**Given** I am on the password reset request page
**When** I enter my registered email and submit
**Then** a password reset email is sent
**And** I see a message "Check your email for reset instructions"

**Given** I am on the password reset request page
**When** I enter an email that is not registered
**Then** I still see "Check your email for reset instructions"
**And** no email is sent (prevents email enumeration)

**Given** I receive a password reset email
**When** I click the reset link within 1 hour
**Then** I am taken to the password reset form

**Given** I am on the password reset form
**When** I enter a new password (min 8 characters) and confirm it
**Then** my password is updated
**And** I am redirected to login with a success message

**Given** I click a password reset link
**When** the link is expired (>1 hour old)
**Then** I see an error "This reset link has expired"
**And** I can request a new reset email

**Technical Notes:**
- Create `app/(auth)/forgot-password/page.tsx`
- Create `app/(auth)/reset-password/page.tsx`
- Use Supabase Auth password reset flow
- Follow security best practices (no email enumeration)

---

### Story 1.7: Protected Dashboard Route

As a **logged-in user**,
I want **to access a protected dashboard**,
So that **I can see my personalized content securely**.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to `/dashboard`
**Then** I see the dashboard page with my user info
**And** the sidebar navigation is visible
**And** a welcome message displays my email

**Given** I am not authenticated
**When** I try to access `/dashboard` directly
**Then** I am redirected to `/login`
**And** the original URL is preserved for post-login redirect

**Given** I am not authenticated
**When** I try to access any route under `/(dashboard)/*`
**Then** I am redirected to `/login`

**Given** I am authenticated and on the dashboard
**When** I view the user menu
**Then** I see my email address
**And** I see a "Log out" option
**And** I see a "Settings" option

**Given** I am authenticated
**When** my session expires while I'm on a protected page
**Then** I am redirected to login on my next action
**And** I see a message "Your session has expired"

**Technical Notes:**
- Create `app/(dashboard)/layout.tsx` with auth check
- Create `app/(dashboard)/dashboard/page.tsx`
- Use middleware for route protection (AR13)
- Implement redirect preservation (return to original URL after login)

---

## Epic 2: User Onboarding & Profile Management

Users can personalize their experience by selecting their experience level (Student/Career Changer) and target role, enabling context-aware analysis.

### Story 2.1: Onboarding Flow - Experience Level & Target Role

As a **new user**,
I want **to select my experience level and target role during onboarding**,
So that **the AI analysis is personalized to my situation**.

**Acceptance Criteria:**

**Given** I have just registered and verified my email
**When** I log in for the first time
**Then** I am redirected to the onboarding page (not the dashboard)
**And** I cannot access other protected routes until onboarding is complete

**Given** I am on the onboarding page
**When** I view the experience level selection
**Then** I see two options: "Student/Recent Graduate" and "Career Changer"
**And** each option has a brief description of who it's for
**And** I must select one to proceed

**Given** I have selected my experience level
**When** I proceed to the target role step
**Then** I see a list of common tech roles (e.g., Software Engineer, Data Analyst, Product Manager, UX Designer, etc.)
**And** I can select one target role
**And** I can optionally type a custom role if mine isn't listed

**Given** I have selected both experience level and target role
**When** I click "Complete Setup" or similar
**Then** my selections are saved to my user profile in the database
**And** I am redirected to the dashboard
**And** I see a welcome message acknowledging my selections

**Given** I am an existing user with completed onboarding
**When** I log in
**Then** I am taken directly to the dashboard (skip onboarding)

**Technical Notes:**
- Create `app/(dashboard)/onboarding/page.tsx`
- Create `user_profiles` table with columns: `user_id`, `experience_level`, `target_role`, `onboarding_completed`, `created_at`, `updated_at`
- Add RLS policy: users can only read/write their own profile
- Create `actions/profile.ts` with `completeOnboarding` action
- Store experience levels in `config/experience-levels.ts`

---

### Story 2.2: Profile Settings Page

As a **user**,
I want **to view and update my experience level and target role**,
So that **I can adjust my profile as my career goals change**.

**Acceptance Criteria:**

**Given** I am logged in and have completed onboarding
**When** I navigate to Settings (via user menu or sidebar)
**Then** I see a Profile section showing my current experience level and target role

**Given** I am on the Settings page
**When** I click "Edit" on my profile section
**Then** I can change my experience level (Student/Career Changer)
**And** I can change my target role from the same list as onboarding

**Given** I have made changes to my profile
**When** I click "Save Changes"
**Then** my profile is updated in the database
**And** I see a success toast "Profile updated successfully"
**And** the displayed values reflect my changes

**Given** I am on the Settings page
**When** I make changes but click "Cancel" or navigate away
**Then** my changes are not saved
**And** my profile retains the previous values

**Given** I try to save with no experience level selected
**When** the validation runs
**Then** I see an error "Please select an experience level"
**And** the form is not submitted

**Technical Notes:**
- Create `app/(dashboard)/settings/page.tsx`
- Create `components/forms/ProfileSetup.tsx` (reusable for onboarding and settings)
- Add `updateProfile` action to `actions/profile.ts`
- Use React Hook Form + Zod for form handling
- Follow AR6 ActionResponse pattern

---

## Epic 3: Resume & Job Description Input

Users can upload their resume, input a job description, and view extracted content ready for AI analysis.

### Story 3.1: Resume Upload with Validation

As a **user**,
I want **to upload my resume file**,
So that **I can have it analyzed against job descriptions**.

**Acceptance Criteria:**

**Given** I am on the new scan page
**When** I view the resume upload area
**Then** I see a drag-and-drop zone with clear instructions
**And** I see a "Browse files" button as an alternative
**And** I see accepted formats listed (PDF, DOCX)
**And** I see the max file size (2MB)

**Given** I drag a valid PDF file (< 2MB) into the upload zone
**When** I drop the file
**Then** the file is uploaded to Supabase Storage
**And** I see a progress indicator during upload
**And** I see the filename displayed after successful upload
**And** I can remove/replace the uploaded file

**Given** I drag a valid DOCX file (< 2MB) into the upload zone
**When** I drop the file
**Then** the file is uploaded successfully
**And** I see the same success experience as PDF

**Given** I try to upload a file larger than 2MB
**When** the validation runs
**Then** I see an error "File size must be under 2MB"
**And** the file is not uploaded

**Given** I try to upload an unsupported file type (e.g., .txt, .jpg)
**When** the validation runs
**Then** I see an error "Please upload a PDF or DOCX file"
**And** the file is not uploaded

**Given** I click "Browse files"
**When** the file picker opens
**Then** it is filtered to only show PDF and DOCX files

**Technical Notes:**
- Create `components/forms/ResumeUpload.tsx` with drag-drop
- Create `resumes` table: `id`, `user_id`, `file_path`, `file_name`, `file_type`, `file_size`, `created_at`
- Use Supabase Storage with signed URLs
- Add RLS policy: users can only access their own resumes
- Validate on client AND server (AR7 Zod)
- Create `actions/resume.ts` with `uploadResume` action

---

### Story 3.2: Resume Text Extraction

As a **system**,
I want **to extract text content from uploaded resume files**,
So that **the content can be analyzed by the AI**.

**Acceptance Criteria:**

**Given** a PDF file has been uploaded
**When** the extraction process runs
**Then** all text content is extracted from the PDF
**And** the extracted text preserves paragraph structure
**And** the text is stored in the database linked to the resume record

**Given** a DOCX file has been uploaded
**When** the extraction process runs
**Then** all text content is extracted from the DOCX
**And** formatting (headers, bullets) is converted to plain text structure
**And** the text is stored in the database

**Given** a PDF file is image-based (scanned document)
**When** the extraction process runs
**Then** extraction fails gracefully
**And** an error is returned "Unable to extract text. Please upload a text-based PDF"
**And** the user sees this error message (FR45)

**Given** a corrupted or password-protected file is uploaded
**When** the extraction process runs
**Then** extraction fails gracefully
**And** an appropriate error message is shown to the user

**Given** extraction completes successfully
**When** the result is saved
**Then** the `resumes` table is updated with `extracted_text` column
**And** extraction status is marked as `completed`

**Technical Notes:**
- Use `pdf-parse` for PDF extraction
- Use `mammoth` for DOCX extraction
- Add columns to `resumes`: `extracted_text`, `extraction_status` (pending/completed/failed), `extraction_error`
- Create extraction logic in `lib/parsers/pdf.ts` and `lib/parsers/docx.ts`
- Run extraction server-side in `actions/resume.ts`

---

### Story 3.3: Resume Section Parsing

As a **system**,
I want **to parse the extracted resume text into sections**,
So that **analysis can be performed on specific parts of the resume**.

**Acceptance Criteria:**

**Given** text has been extracted from a resume
**When** the parsing process runs
**Then** the text is categorized into sections: Contact, Summary/Objective, Education, Experience, Skills, Projects, Other
**And** each section contains the relevant text content

**Given** a resume has a clear "Experience" or "Work Experience" header
**When** parsing identifies this section
**Then** individual job entries are identified
**And** each entry captures: company, title, dates, bullet points

**Given** a resume has an "Education" section
**When** parsing identifies this section
**Then** educational entries are identified
**And** each entry captures: institution, degree, dates, GPA (if present)

**Given** a resume has a "Skills" section
**When** parsing identifies this section
**Then** skills are extracted as a list
**And** technical skills are identified separately from soft skills

**Given** a resume has non-standard section headers
**When** parsing runs
**Then** the system makes best-effort categorization
**And** unrecognized sections are placed in "Other"

**Given** parsing completes
**When** results are saved
**Then** parsed sections are stored as JSON in `resumes.parsed_sections`
**And** parsing status is marked as `completed`

**Technical Notes:**
- Create `lib/parsers/resume.ts` for section parsing logic
- Use regex patterns + heuristics for section detection
- Add column `parsed_sections` (JSONB) to `resumes` table
- Consider using OpenAI for complex parsing (optional, can be enhanced later)
- Store structured data for each section type

---

### Story 3.4: Resume Preview Display

As a **user**,
I want **to view my extracted resume content before analysis**,
So that **I can verify the content was captured correctly**.

**Acceptance Criteria:**

**Given** my resume has been uploaded and processed
**When** I view the resume preview
**Then** I see my resume content organized by section
**And** each section (Contact, Education, Experience, Skills, Projects) is clearly labeled
**And** the content matches what's in my original resume

**Given** I am viewing the resume preview
**When** I look at the Experience section
**Then** I see each job entry with company, title, and dates
**And** bullet points are displayed in a readable format

**Given** I am viewing the resume preview
**When** I look at the Skills section
**Then** I see my skills listed clearly
**And** technical skills are visually distinguished (if categorized)

**Given** extraction or parsing failed
**When** I view the preview area
**Then** I see the error message explaining what went wrong
**And** I see an option to re-upload my resume

**Given** processing is still in progress
**When** I view the preview area
**Then** I see a loading skeleton or spinner
**And** the UI updates automatically when processing completes

**Technical Notes:**
- Create `components/analysis/ResumePreview.tsx`
- Display sections in expandable/collapsible cards
- Use skeleton loading states (shadcn Skeleton)
- Highlight any parsing warnings or issues
- Allow user to proceed even if some sections weren't detected

---

### Story 3.5: Job Description Input

As a **user**,
I want **to paste a job description**,
So that **my resume can be analyzed against it**.

**Acceptance Criteria:**

**Given** I am on the new scan page
**When** I view the job description input area
**Then** I see a large textarea for pasting the JD
**And** I see a character counter showing current/max (0/5000)
**And** I see helper text "Paste the full job description"

**Given** I paste a job description under 5000 characters
**When** the text is entered
**Then** the character counter updates in real-time
**And** the text is accepted without error

**Given** I paste or type text exceeding 5000 characters
**When** the validation runs
**Then** I see an error "Job description must be under 5000 characters"
**And** the character counter shows red/warning color
**And** I cannot proceed until I reduce the length

**Given** I try to proceed with an empty job description
**When** validation runs
**Then** I see an error "Please enter a job description"
**And** I cannot proceed

**Given** I paste a job description under 100 characters
**When** validation runs
**Then** I see a warning "Job description seems short. Include the full posting for best results"
**And** I can still proceed (warning, not error)

**Given** a valid job description is entered
**When** keyword extraction runs (client-side preview)
**Then** I see a preview of detected keywords/skills
**And** this helps me verify I pasted the right content

**Technical Notes:**
- Create `components/forms/JDInput.tsx`
- Use Zod schema: `z.string().min(100).max(5000)`
- Create `lib/validations/scan.ts` for scan input schemas
- Basic keyword extraction can be simple regex for preview (full extraction in Epic 4)
- Store JD in `scans` table (created in next story)

---

### Story 3.6: New Scan Page Integration

As a **user**,
I want **a single page to upload my resume and enter a job description**,
So that **I can initiate a scan with one streamlined experience**.

**Acceptance Criteria:**

**Given** I am logged in and have completed onboarding
**When** I click "New Scan" from the dashboard or sidebar
**Then** I am taken to `/scan/new`
**And** I see the resume upload component
**And** I see the job description input component
**And** I see a "Start Analysis" button (disabled until both inputs are valid)

**Given** I have uploaded a resume but not entered a JD
**When** I look at the "Start Analysis" button
**Then** it is disabled
**And** I see a hint "Enter a job description to continue"

**Given** I have entered a JD but not uploaded a resume
**When** I look at the "Start Analysis" button
**Then** it is disabled
**And** I see a hint "Upload your resume to continue"

**Given** I have both a valid resume and valid JD
**When** I click "Start Analysis"
**Then** a new scan record is created in the database
**And** the scan status is set to "pending"
**And** I am redirected to `/scan/[scanId]` to view results
**And** I see a loading state indicating analysis is in progress

**Given** I previously uploaded a resume in this session
**When** I return to the new scan page
**Then** I see my previously uploaded resume still selected
**And** I can choose to use it or upload a different one

**Given** I am on the new scan page
**When** I view the layout
**Then** resume upload is on the left (or top on mobile)
**And** JD input is on the right (or bottom on mobile)
**And** the design follows the card-based layout from UX screenshots

**Technical Notes:**
- Create `app/(dashboard)/scan/new/page.tsx`
- Create `scans` table: `id`, `user_id`, `resume_id`, `job_description`, `status` (pending/processing/completed/failed), `created_at`, `updated_at`
- Add RLS policy: users can only access their own scans
- Create `actions/scan.ts` with `createScan` action
- The actual analysis will be triggered in Epic 4

---

## Epic 4: ATS Analysis Engine

Users receive an ATS compatibility score (0-100) with detailed analysis of their resume against the job description.

### Story 4.1: OpenAI Integration Setup

As a **developer**,
I want **a configured OpenAI client with proper error handling**,
So that **the AI analysis features work reliably**.

**Acceptance Criteria:**

**Given** the OpenAI API key is configured in environment variables
**When** the application starts
**Then** the OpenAI client is initialized successfully
**And** the client can make API calls to GPT-4o-mini

**Given** an API call is made to OpenAI
**When** the response is successful
**Then** the response is parsed and returned correctly
**And** token usage is logged for cost monitoring

**Given** an API call fails due to rate limiting (429)
**When** the error is caught
**Then** the system retries with exponential backoff (max 3 retries)
**And** if all retries fail, a user-friendly error is returned

**Given** an API call fails due to network issues
**When** the error is caught
**Then** the system retries once
**And** if retry fails, returns "Analysis service temporarily unavailable"

**Given** an API call times out (> 30 seconds)
**When** the timeout is reached
**Then** the request is cancelled
**And** the user sees "Analysis is taking longer than expected. Please try again."

**Given** the OpenAI API key is invalid or missing
**When** an API call is attempted
**Then** a clear error is logged server-side
**And** the user sees "Analysis service configuration error"

**Technical Notes:**
- Create `lib/openai/client.ts` with singleton pattern
- Implement retry logic with exponential backoff
- Create `lib/openai/parseResponse.ts` for response handling
- Log all errors with context for debugging
- Use GPT-4o-mini for cost efficiency
- Set timeout to 30 seconds per request

---

### Story 4.2: ATS Score Calculation

As a **user**,
I want **to see an ATS compatibility score (0-100) for my resume**,
So that **I know how well my resume matches the job description**.

**Acceptance Criteria:**

**Given** I have submitted a resume and job description for analysis
**When** the ATS score calculation runs
**Then** I receive a score between 0 and 100
**And** the score reflects keyword match, skills alignment, and experience relevance

**Given** my resume closely matches the job description
**When** the score is calculated
**Then** I receive a high score (70-100)
**And** the score justification mentions strong keyword alignment

**Given** my resume has few matching keywords
**When** the score is calculated
**Then** I receive a lower score (below 50)
**And** the score justification mentions missing keywords

**Given** the analysis completes
**When** the score is saved
**Then** the `scans` table is updated with `ats_score` (integer)
**And** `score_justification` (text) explains the score

**Given** the AI analysis fails
**When** error handling runs
**Then** the scan status is set to "failed"
**And** the user sees an appropriate error message (FR46)

**Technical Notes:**
- Create `lib/openai/prompts/analysis.ts` with scoring prompt
- Add columns to `scans`: `ats_score`, `score_justification`
- Create `actions/analysis.ts` with `runAnalysis` action
- Prompt should consider: keyword density, skills match, experience relevance, formatting
- Score breakdown: Keywords (40%), Skills (30%), Experience (20%), Format (10%)

---

### Story 4.3: Missing Keywords Detection

As a **user**,
I want **to see which keywords from the job description are missing from my resume**,
So that **I know what to add to improve my match**.

**Acceptance Criteria:**

**Given** analysis is running on my resume and JD
**When** keyword detection completes
**Then** I see a list of important keywords from the JD
**And** keywords are categorized: Present (in my resume) vs Missing

**Given** keywords are detected
**When** I view the missing keywords list
**Then** keywords are sorted by importance/frequency in the JD
**And** I see at least the top 10 missing keywords

**Given** keywords are detected
**When** I view the present keywords list
**Then** I see which JD keywords my resume already contains
**And** this validates that relevant content was detected

**Given** my resume contains all major keywords
**When** I view the missing keywords section
**Then** I see a message "Great job! Your resume covers the key requirements"
**And** any minor missing keywords are still listed

**Given** analysis completes
**When** results are saved
**Then** the `scans` table is updated with `keywords_found` (JSON array)
**And** `keywords_missing` (JSON array) is populated

**Technical Notes:**
- Extend analysis prompt to extract and categorize keywords
- Add columns to `scans`: `keywords_found` (JSONB), `keywords_missing` (JSONB)
- Keywords should include: technical skills, soft skills, tools, certifications, industry terms
- Consider keyword variants (e.g., "JS" = "JavaScript")

---

### Story 4.4: Section-Level Score Breakdown

As a **user**,
I want **to see how each section of my resume scores**,
So that **I know which areas need the most improvement**.

**Acceptance Criteria:**

**Given** analysis has completed
**When** I view the section breakdown
**Then** I see individual scores for: Experience, Education, Skills, Projects (if applicable)
**And** each section score is 0-100

**Given** I view a section score
**When** I look at the details
**Then** I see a brief explanation of why this section scored as it did
**And** I understand what's strong and what's weak

**Given** my Experience section scores low
**When** I view the explanation
**Then** it mentions specific issues (e.g., "Missing quantified achievements", "No relevant keywords")

**Given** my Skills section scores high
**When** I view the explanation
**Then** it mentions what's working well (e.g., "Strong match for technical requirements")

**Given** analysis completes
**When** results are saved
**Then** the `scans` table is updated with `section_scores` (JSONB)
**And** format: `{ experience: { score: 75, explanation: "..." }, ... }`

**Technical Notes:**
- Extend analysis prompt to score each section individually
- Add column to `scans`: `section_scores` (JSONB)
- Sections to score: Experience, Education, Skills, Projects, Summary/Objective
- Only score sections that exist in the parsed resume

---

### Story 4.5: Experience-Level-Aware Analysis

As a **user**,
I want **the analysis to consider my experience level**,
So that **I get relevant feedback for my situation**.

**Acceptance Criteria:**

**Given** I am a "Student/Recent Graduate"
**When** analysis runs
**Then** the AI weights academic projects and education more heavily
**And** missing "years of experience" is not penalized
**And** feedback focuses on translating academic work to professional language

**Given** I am a "Career Changer"
**When** analysis runs
**Then** the AI looks for transferable skills from previous career
**And** feedback emphasizes mapping existing experience to tech terminology
**And** bootcamp/certification projects are valued appropriately

**Given** my experience level is considered
**When** I view the score justification
**Then** it references my experience level context
**And** suggestions are tailored to my situation

**Given** analysis runs
**When** the prompt is constructed
**Then** the user's experience level from their profile is included
**And** the target role is included for role-specific feedback

**Technical Notes:**
- Modify analysis prompt to accept `experienceLevel` and `targetRole` parameters
- Fetch user profile in `runAnalysis` action
- Create different prompt templates or sections for Student vs Career Changer
- Store `experience_level_context` in scan results for reference

---

### Story 4.6: Resume Format Issues Detection

As a **user**,
I want **to know if my resume has formatting problems**,
So that **I can fix structural issues that hurt my ATS score**.

**Acceptance Criteria:**

**Given** analysis runs on my resume
**When** format detection completes
**Then** I see a list of format issues (if any)
**And** issues are categorized by severity: Critical, Warning, Suggestion

**Given** my resume is longer than 1 page (for entry-level)
**When** format issues are detected
**Then** I see a warning "Resume is X pages. Consider condensing to 1 page for entry-level roles"

**Given** my resume has no clear section headers
**When** format issues are detected
**Then** I see a critical issue "ATS may not parse sections correctly. Add clear headers."

**Given** my resume includes a photo or personal info (international format)
**When** format issues are detected
**Then** I see a suggestion "Remove photo/DOB for North American applications"

**Given** my resume uses uncommon fonts or complex formatting
**When** format issues are detected
**Then** I see a warning about ATS compatibility

**Given** no format issues are found
**When** I view the format section
**Then** I see "No format issues detected" with a checkmark

**Given** analysis completes
**When** results are saved
**Then** the `scans` table is updated with `format_issues` (JSONB array)
**And** format: `[{ type: "warning", message: "...", detail: "..." }]`

**Technical Notes:**
- Analyze parsed resume structure for format issues
- Add column to `scans`: `format_issues` (JSONB)
- Check for: length, section headers, date formats, contact info presence, ATS-unfriendly elements
- Some checks can be rule-based (length), others AI-assisted (content issues)

---

### Story 4.7: Analysis Results Page

As a **user**,
I want **to view all my analysis results on a dedicated page**,
So that **I can understand my resume's strengths and weaknesses**.

**Acceptance Criteria:**

**Given** I have initiated a scan
**When** I am on the results page `/scan/[scanId]`
**Then** I see a loading state while analysis is in progress
**And** the page auto-refreshes or uses polling to check for completion

**Given** analysis is complete
**When** the results page loads
**Then** I see my ATS score prominently displayed (large number with donut chart)
**And** I see the score justification below it
**And** the design matches UX9 (donut chart visualization)

**Given** I am viewing complete results
**When** I scroll down
**Then** I see section-level score breakdown with visual indicators
**And** I see missing keywords section
**And** I see format issues section (if any)

**Given** I am viewing complete results
**When** I look at the layout
**Then** results are organized in cards per UX6
**And** each card is expandable/collapsible for detail
**And** the most important info (score) is above the fold

**Given** analysis failed
**When** I view the results page
**Then** I see an error message explaining what went wrong (FR46)
**And** I see a "Try Again" button to retry the analysis
**And** I see a "Start New Scan" button as alternative

**Given** analysis is taking longer than expected (> 15 seconds)
**When** I am waiting
**Then** I see a progress message "Analysis in progress... This usually takes 10-20 seconds"
**And** I see a skeleton loading state for the results

**Technical Notes:**
- Create `app/(dashboard)/scan/[scanId]/page.tsx`
- Create `app/(dashboard)/scan/[scanId]/loading.tsx` for loading state
- Create `components/analysis/ScoreCard.tsx` with donut chart (use recharts or similar)
- Create `components/analysis/ScoreBreakdown.tsx` for section scores
- Create `components/analysis/KeywordList.tsx` for keyword display
- Use polling or Supabase realtime to detect completion
- Implement retry logic for failed scans

---

## Epic 5: Suggestions & Optimization Workflow

Users can view AI-generated improvement suggestions (before/after bullet rewrites, transferable skills mapping), accept/reject them individually, and preview their optimized resume.

### Story 5.1: Bullet Point Rewrite Generation

As a **user**,
I want **AI-generated rewrites of my experience bullet points**,
So that **my achievements are presented more effectively**.

**Acceptance Criteria:**

**Given** analysis is running on my resume
**When** the suggestion generation completes
**Then** I receive before/after rewrites for each experience bullet point
**And** each rewrite improves clarity, impact, and keyword alignment

**Given** I have a vague bullet like "Worked on machine learning project"
**When** the AI generates a rewrite
**Then** the suggestion adds specificity, action verbs, and impact
**And** example: "Designed and deployed ML recommendation engine improving prediction accuracy by 23%"

**Given** I have a bullet that's already strong
**When** the AI analyzes it
**Then** it may suggest minor improvements or mark it as "No changes recommended"
**And** the original is preserved as an option

**Given** rewrites are generated
**When** they are saved
**Then** a `suggestions` table stores each suggestion with: `scan_id`, `section`, `original_text`, `suggested_text`, `suggestion_type`, `status` (pending/accepted/rejected)

**Given** I am a Student
**When** rewrites are generated
**Then** academic projects are rewritten with professional impact language
**And** course work is framed as practical experience

**Technical Notes:**
- Create `lib/openai/prompts/suggestions.ts` for rewrite prompts
- Create `suggestions` table with columns: `id`, `scan_id`, `section`, `item_index`, `original_text`, `suggested_text`, `suggestion_type`, `reasoning`, `status`, `created_at`
- Add RLS policy: users access suggestions via their scans
- Generate suggestions as part of `runAnalysis` or as separate action
- Suggestion types: `bullet_rewrite`, `skill_mapping`, `action_verb`, `quantification`, `skill_expansion`, `format`, `removal`

---

### Story 5.2: Transferable Skills Detection & Mapping

As a **career changer**,
I want **my non-tech experience mapped to tech terminology**,
So that **hiring managers see the relevance of my background**.

**Acceptance Criteria:**

**Given** I have non-tech work experience (e.g., retail manager)
**When** the AI analyzes my resume
**Then** it detects transferable skills in my experience
**And** maps them to tech-equivalent terminology

**Given** I managed inventory of 10,000+ SKUs
**When** the mapping is generated
**Then** I see a suggestion mapping this to "Database management, inventory optimization systems"

**Given** I led a team of 12 associates
**When** the mapping is generated
**Then** I see a suggestion mapping this to "Cross-functional team leadership, performance coaching"

**Given** transferable skills are detected
**When** I view the suggestions
**Then** each mapping shows: Original skill → Tech equivalent
**And** includes reasoning for why this mapping is relevant

**Given** I am a Student (not Career Changer)
**When** analysis runs
**Then** transferable skills mapping still runs but focuses on academic-to-professional translation
**And** TA experience maps to "Technical mentorship", group projects map to "Cross-functional collaboration"

**Given** mappings are generated
**When** they are saved
**Then** suggestions are stored with `suggestion_type: 'skill_mapping'`
**And** include both original context and mapped terminology

**Technical Notes:**
- Create `lib/openai/prompts/skills.ts` for transferable skills prompt
- Include industry-specific mapping knowledge in prompt
- Store mappings in `suggestions` table
- Consider user's target role when generating mappings

---

### Story 5.3: Action Verb & Quantification Suggestions

As a **user**,
I want **suggestions to improve my action verbs and add quantification**,
So that **my resume has more impact**.

**Acceptance Criteria:**

**Given** I have a bullet starting with a weak verb (e.g., "Responsible for", "Helped with")
**When** the AI generates suggestions
**Then** I receive an action verb improvement suggestion
**And** example: "Responsible for development" → "Developed", "Led", "Architected"

**Given** I have achievements without numbers
**When** the AI generates suggestions
**Then** I receive quantification prompts
**And** example: "Improved performance" → "Improved performance by X%" with prompt to add the number

**Given** quantification opportunities are identified
**When** I view the suggestion
**Then** I see the original text highlighted
**And** I see a prompt like "Consider adding: percentage, dollar amount, time saved, users impacted"

**Given** I have a bullet that already uses strong verbs and numbers
**When** the AI analyzes it
**Then** no action verb or quantification suggestion is generated for that bullet

**Given** suggestions are generated
**When** they are saved
**Then** action verb suggestions have `suggestion_type: 'action_verb'`
**And** quantification suggestions have `suggestion_type: 'quantification'`

**Technical Notes:**
- Include action verb improvements in main suggestion prompt
- Create list of weak verbs to flag: "Responsible for", "Helped", "Assisted", "Worked on", "Was involved in"
- Create list of strong verbs by category: Leadership, Technical, Analysis, Communication
- Quantification prompts should be contextual to the achievement type

---

### Story 5.4: Skills Expansion Suggestions

As a **user**,
I want **suggestions to expand my listed skills**,
So that **ATS systems match more specific keywords**.

**Acceptance Criteria:**

**Given** I have a generic skill listed (e.g., "Python")
**When** the AI generates suggestions
**Then** I receive a skill expansion suggestion
**And** example: "Python" → "Python (pandas, scikit-learn, TensorFlow)"

**Given** the job description mentions specific technologies
**When** skill expansion runs
**Then** suggestions prioritize expansions that match JD keywords
**And** example: If JD mentions "React", suggest "JavaScript" → "JavaScript (React, Node.js)"

**Given** I have a skill that can't be meaningfully expanded
**When** the AI analyzes it
**Then** no expansion suggestion is generated

**Given** expansions are suggested
**When** I view the suggestion
**Then** I see the original skill and the expanded version
**And** I see which JD keywords this expansion would match

**Given** suggestions are generated
**When** they are saved
**Then** skill expansion suggestions have `suggestion_type: 'skill_expansion'`
**And** include `keywords_matched` in the suggestion data

**Technical Notes:**
- Create skill expansion mappings for common technologies
- Cross-reference with extracted JD keywords
- Store in `suggestions` table with type `skill_expansion`
- Only suggest expansions the user can honestly claim

---

### Story 5.5: Format & Content Removal Suggestions

As a **user**,
I want **guidance on resume format and content to remove**,
So that **my resume follows North American standards**.

**Acceptance Criteria:**

**Given** my resume is longer than recommended
**When** format suggestions are generated
**Then** I see a suggestion "Consider condensing to 1 page for entry-level roles"
**And** specific sections are flagged as candidates for trimming

**Given** my resume includes a photo
**When** content removal suggestions are generated
**Then** I see a suggestion "Remove photo - not expected in North American resumes"

**Given** my resume includes date of birth or marital status
**When** content removal suggestions are generated
**Then** I see a suggestion "Remove personal information (DOB, marital status) - not expected and may cause bias"

**Given** my resume has outdated or irrelevant experience
**When** content removal suggestions are generated
**Then** I see suggestions to remove or condense that content
**And** reasoning explains why it's not relevant to the target role

**Given** my resume uses non-standard formatting
**When** format suggestions are generated
**Then** I see specific guidance (e.g., "Use consistent date format: MMM YYYY")

**Given** suggestions are generated
**When** they are saved
**Then** format suggestions have `suggestion_type: 'format'`
**And** removal suggestions have `suggestion_type: 'removal'`

**Technical Notes:**
- Format suggestions can partially overlap with format_issues from Epic 4
- Removal suggestions should be sensitive (explain why, not just "remove this")
- Store in `suggestions` table
- Consider international student context from user journey (Priya)

---

### Story 5.6: Suggestions Display by Section

As a **user**,
I want **to see all suggestions organized by resume section**,
So that **I can review and act on them systematically**.

**Acceptance Criteria:**

**Given** analysis and suggestion generation is complete
**When** I view the suggestions on the results page
**Then** suggestions are grouped by section: Experience, Education, Skills, Projects, Format
**And** each section shows the count of suggestions

**Given** I am viewing suggestions for the Experience section
**When** I expand it
**Then** I see suggestions ordered by job entry (most recent first)
**And** within each job, suggestions are listed by bullet point

**Given** I am viewing a suggestion
**When** I look at the card
**Then** I see the suggestion type (Rewrite, Skill Mapping, Action Verb, etc.)
**And** I see "Before" and "After" clearly labeled
**And** I see reasoning/explanation for the suggestion

**Given** a section has no suggestions
**When** I view that section
**Then** I see "No suggestions for this section" with a checkmark
**And** this indicates the section is already strong

**Given** I have many suggestions
**When** I view the list
**Then** suggestions are paginated or virtualized for performance
**And** I can filter by suggestion type

**Technical Notes:**
- Create `components/analysis/SuggestionList.tsx`
- Create `components/analysis/SuggestionCard.tsx` for individual suggestions
- Group suggestions by `section` field from database
- Use collapsible sections (shadcn Accordion or Collapsible)
- Fetch suggestions with scan data or lazy load

---

### Story 5.7: Accept/Reject Individual Suggestions

As a **user**,
I want **to accept or reject each suggestion individually**,
So that **I control which changes are applied to my resume**.

**Acceptance Criteria:**

**Given** I am viewing a suggestion
**When** I look at the suggestion card
**Then** I see "Accept" and "Reject" buttons
**And** the buttons are clearly visible and accessible

**Given** I click "Accept" on a suggestion
**When** the action completes
**Then** the suggestion status changes to "accepted"
**And** the card visually updates (e.g., green border, checkmark)
**And** a toast confirms "Suggestion accepted"

**Given** I click "Reject" on a suggestion
**When** the action completes
**Then** the suggestion status changes to "rejected"
**And** the card visually updates (e.g., grayed out, strikethrough)
**And** a toast confirms "Suggestion rejected"

**Given** I have accepted or rejected a suggestion
**When** I change my mind
**Then** I can click to toggle back to the other state
**And** the status updates accordingly

**Given** I want to accept all suggestions in a section
**When** I click "Accept All" for that section
**Then** all pending suggestions in that section are accepted
**And** I see a confirmation "X suggestions accepted"

**Given** I am done reviewing
**When** I look at the summary
**Then** I see counts: "X accepted, Y rejected, Z pending"
**And** I cannot proceed to download until I've reviewed all suggestions (or explicitly skipped)

**Technical Notes:**
- Create `components/analysis/AcceptRejectButtons.tsx`
- Create `actions/suggestions.ts` with `acceptSuggestion`, `rejectSuggestion`, `acceptAllInSection`
- Update `suggestions.status` in database
- Use optimistic updates for responsive UI
- Follow AR6 ActionResponse pattern

---

### Story 5.8: Optimized Resume Preview

As a **user**,
I want **to preview how my resume looks with accepted suggestions**,
So that **I can see the final result before downloading**.

**Acceptance Criteria:**

**Given** I have accepted some suggestions
**When** I click "Preview Optimized Resume"
**Then** I see a preview showing my resume with accepted changes applied
**And** changes are highlighted or marked to show what's different

**Given** I am viewing the preview
**When** I look at an accepted change
**Then** I can see the original text (strikethrough or tooltip)
**And** I can see the new text (highlighted)

**Given** I am viewing the preview
**When** I find an issue with a change
**Then** I can go back and reject that suggestion
**And** the preview updates to reflect the change

**Given** I haven't accepted any suggestions
**When** I view the preview
**Then** I see my original resume
**And** a message "No changes applied yet"

**Given** I am satisfied with the preview
**When** I look at the actions
**Then** I see a prominent "Download Resume" button
**And** I can proceed to Epic 6 (export)

**Given** I am viewing the preview on mobile
**When** the layout renders
**Then** the preview is readable and scrollable
**And** I can still access accept/reject functionality

**Technical Notes:**
- Create `components/analysis/ResumePreview.tsx` (or extend from Story 3.4)
- Apply accepted suggestions to parsed resume data
- Use diff highlighting (green for additions, red/strikethrough for removals)
- Store preview state client-side (don't persist merged content yet)
- Actual merging happens in Epic 6 during export

---

## Epic 6: Resume Export & Download

Users can download their optimized resume with all accepted suggestions applied in their preferred format (PDF or DOCX).

### Story 6.1: Resume Content Merging

As a **system**,
I want **to merge accepted suggestions into the final resume content**,
So that **the exported document reflects all user-approved changes**.

**Acceptance Criteria:**

**Given** a user has accepted suggestions for their scan
**When** the merge process runs
**Then** each accepted suggestion is applied to the corresponding resume section
**And** the merged content maintains proper structure

**Given** a bullet rewrite suggestion was accepted
**When** merging occurs
**Then** the original bullet text is replaced with the suggested text
**And** the bullet's position in the experience entry is preserved

**Given** a skill expansion suggestion was accepted
**When** merging occurs
**Then** the original skill is replaced with the expanded version
**And** other skills in the list remain unchanged

**Given** a removal suggestion was accepted
**When** merging occurs
**Then** the flagged content is removed from the merged result
**And** surrounding content flows naturally

**Given** a suggestion was rejected
**When** merging occurs
**Then** the original content is preserved unchanged

**Given** no suggestions were accepted
**When** merging occurs
**Then** the original parsed resume content is returned unchanged

**Given** merging completes
**When** the result is prepared
**Then** the merged content is structured for document generation
**And** section order follows standard resume conventions

**Technical Notes:**
- Create `lib/generators/merge.ts` for merge logic
- Input: parsed resume sections + accepted suggestions
- Output: merged resume data structure ready for generation
- Handle edge cases: overlapping suggestions, removed sections
- Do not persist merged content (generate on-demand)

---

### Story 6.2: PDF Resume Generation

As a **user**,
I want **to download my optimized resume as a PDF**,
So that **I have a professional, universally readable document**.

**Acceptance Criteria:**

**Given** I have merged resume content ready
**When** PDF generation runs
**Then** a properly formatted PDF document is created
**And** the PDF follows ATS-friendly formatting standards

**Given** the PDF is generated
**When** I view the document
**Then** section headers are clearly visible and consistent
**And** fonts are professional and readable (e.g., Arial, Calibri, or similar)
**And** margins are appropriate (0.5-1 inch)
**And** the layout is clean and scannable

**Given** the resume has multiple sections
**When** the PDF is generated
**Then** sections appear in standard order: Contact, Summary, Experience, Education, Skills, Projects
**And** each section has appropriate spacing

**Given** experience entries have bullet points
**When** the PDF is generated
**Then** bullets are properly formatted and aligned
**And** text wraps correctly within margins

**Given** the resume is one page
**When** the PDF is generated
**Then** content fits on one page without cutting off
**And** font size is readable (10-12pt body, 14-16pt headers)

**Given** generation fails
**When** error handling runs
**Then** a clear error message is returned
**And** the user can retry (FR47)

**Technical Notes:**
- Create `lib/generators/pdf.ts`
- Use `@react-pdf/renderer` for PDF generation
- Create reusable PDF components: Header, Section, BulletList, SkillsList
- Ensure ATS compatibility: no tables, simple formatting, standard fonts
- Target file size: < 500KB

---

### Story 6.3: DOCX Resume Generation

As a **user**,
I want **to download my optimized resume as a DOCX**,
So that **I can make additional edits in Word if needed**.

**Acceptance Criteria:**

**Given** I have merged resume content ready
**When** DOCX generation runs
**Then** a properly formatted Word document is created
**And** the document is editable in Microsoft Word and Google Docs

**Given** the DOCX is generated
**When** I open it in Word
**Then** formatting is preserved (fonts, sizes, spacing)
**And** I can easily edit any text
**And** styles are applied to headers and body text

**Given** the resume has bullet points
**When** the DOCX is generated
**Then** bullets use native Word bullet formatting
**And** I can add/remove bullets easily when editing

**Given** the resume has multiple sections
**When** the DOCX is generated
**Then** sections use Word heading styles
**And** I can navigate using the document outline

**Given** I download and re-upload the DOCX
**When** CoopReady parses it again
**Then** the content is extracted correctly
**And** the cycle can repeat for future optimizations

**Given** generation fails
**When** error handling runs
**Then** a clear error message is returned
**And** the user can retry (FR47)

**Technical Notes:**
- Create `lib/generators/docx.ts`
- Use `docx` package for DOCX generation
- Apply consistent styling: Heading1 for name, Heading2 for sections, Normal for body
- Ensure cross-platform compatibility (Word, Google Docs, LibreOffice)
- Target file size: < 100KB

---

### Story 6.4: Download UI & Format Selection

As a **user**,
I want **to choose my download format and download my optimized resume**,
So that **I get the file in my preferred format**.

**Acceptance Criteria:**

**Given** I am on the scan results page with accepted suggestions
**When** I click "Download Resume"
**Then** I see a format selection modal or dropdown
**And** options are: PDF and DOCX
**And** each option has a brief description

**Given** I select PDF format
**When** I click "Download"
**Then** the PDF is generated with merged content
**And** the file downloads with name "{MyName}_Resume_Optimized.pdf"
**And** I see a success toast "Resume downloaded!"

**Given** I select DOCX format
**When** I click "Download"
**Then** the DOCX is generated with merged content
**And** the file downloads with name "{MyName}_Resume_Optimized.docx"
**And** I see a success toast "Resume downloaded!"

**Given** generation is in progress
**When** I am waiting
**Then** the download button shows a loading spinner
**And** I cannot click download again until complete

**Given** generation fails
**When** error handling runs
**Then** I see an error message "Download failed. Please try again."
**And** I see a "Retry" button (FR47)
**And** clicking retry attempts generation again

**Given** I have no accepted suggestions
**When** I click "Download Resume"
**Then** I see a warning "No changes accepted. Download original resume?"
**And** I can proceed to download the original or go back to review suggestions

**Given** I am on mobile
**When** I download a file
**Then** the download works correctly on iOS and Android browsers
**And** the file is saved to the device's downloads

**Technical Notes:**
- Create download UI in scan results page
- Create `actions/export.ts` with `generateResume` action
- Action takes: `scanId`, `format` ('pdf' | 'docx')
- Return file as blob for client-side download
- Use `useTransition` for loading state
- Track downloads in `scans` table: `downloaded_at`, `download_format`

---

## Epic 7: Subscription & Billing

Free users are limited to 3 scans/month; paid users ($5/mo) get unlimited scans with secure Stripe payment processing.

### Story 7.1: Stripe Integration Setup

As a **developer**,
I want **Stripe configured with products, prices, and webhook handling**,
So that **payment processing works securely**.

**Acceptance Criteria:**

**Given** the Stripe account is set up
**When** I configure the integration
**Then** environment variables are set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
**And** the Stripe client is initialized in `lib/stripe/client.ts`

**Given** products need to be created
**When** I set up Stripe Dashboard
**Then** a "CoopReady Pro" product exists
**And** a $5/month recurring price is attached
**And** product and price IDs are stored in `config/plans.ts`

**Given** a webhook endpoint is needed
**When** I create the route handler
**Then** `app/api/webhooks/stripe/route.ts` handles Stripe events
**And** webhook signature is verified using `STRIPE_WEBHOOK_SECRET`
**And** invalid signatures return 400 error

**Given** a `checkout.session.completed` event is received
**When** the webhook processes it
**Then** the user's subscription status is updated in the database
**And** `user_profiles.subscription_status` is set to 'active'
**And** `user_profiles.stripe_customer_id` is stored

**Given** a `customer.subscription.deleted` event is received
**When** the webhook processes it
**Then** the user's subscription status is set to 'cancelled'
**And** the user reverts to free tier limits

**Given** a `invoice.payment_failed` event is received
**When** the webhook processes it
**Then** the user's subscription status is set to 'past_due'
**And** the user is notified (future: email notification)

**Technical Notes:**
- Create `lib/stripe/client.ts` for Stripe initialization
- Create `lib/stripe/webhooks.ts` for webhook event handlers
- Create `app/api/webhooks/stripe/route.ts`
- Add to `user_profiles`: `subscription_status` (free/active/past_due/cancelled), `stripe_customer_id`, `stripe_subscription_id`, `subscription_ends_at`
- Use idempotency keys for webhook processing
- Log all webhook events for debugging

---

### Story 7.2: Scan Usage Tracking

As a **system**,
I want **to track how many scans each user performs per month**,
So that **rate limiting can be enforced**.

**Acceptance Criteria:**

**Given** a user initiates a new scan
**When** the scan is created
**Then** the scan is counted toward their monthly usage
**And** `user_profiles.scans_this_month` is incremented

**Given** a new month begins
**When** the first scan of the month is attempted
**Then** `user_profiles.scans_this_month` is reset to 0
**And** `user_profiles.scan_reset_date` is updated to current month

**Given** a user has completed scans this month
**When** their usage is queried
**Then** the correct count is returned
**And** the count only includes scans from the current calendar month

**Given** a scan fails or is cancelled
**When** usage is tracked
**Then** failed scans do not count toward the limit
**And** only successfully completed scans are counted

**Given** usage data is needed
**When** I query the database
**Then** I can efficiently get a user's current month scan count
**And** the query uses `scan_reset_date` to determine if reset is needed

**Technical Notes:**
- Add to `user_profiles`: `scans_this_month` (integer, default 0), `scan_reset_date` (date)
- Create `actions/subscription.ts` with `checkUsage`, `incrementUsage`
- Reset logic: if `scan_reset_date` < start of current month, reset counter
- Only increment after scan status = 'completed'
- Consider timezone handling (use UTC)

---

### Story 7.3: Free Tier Rate Limiting

As a **system**,
I want **to enforce the 3 scans/month limit for free users**,
So that **the freemium model is maintained**.

**Acceptance Criteria:**

**Given** I am a free user with 0-2 scans this month
**When** I try to start a new scan
**Then** the scan is allowed to proceed
**And** my usage count is incremented

**Given** I am a free user with 3 scans this month
**When** I try to start a new scan
**Then** the scan is blocked
**And** I see a message "You've used all 3 free scans this month"
**And** I see an option to upgrade to Pro

**Given** I am a paid user (subscription_status = 'active')
**When** I try to start a new scan
**Then** the scan is always allowed
**And** no limit check is performed

**Given** I am a free user at the limit
**When** I view the new scan page
**Then** the "Start Analysis" button is disabled
**And** I see my usage: "3/3 scans used"
**And** I see upgrade CTA prominently

**Given** rate limiting is checked
**When** the check runs
**Then** it happens before any expensive operations (file processing, AI calls)
**And** the check is fast (database query only)

**Given** a user's subscription expires
**When** they try to scan
**Then** they are treated as a free user
**And** rate limiting applies if they've used 3+ scans

**Technical Notes:**
- Add rate limit check to `createScan` action (beginning of function)
- Create `checkCanScan` helper in `actions/subscription.ts`
- Return `{ canScan: boolean, remaining: number, reason?: string }`
- Check order: 1) Is paid? → allow, 2) Check usage count
- Block at UI level AND server level (defense in depth)

---

### Story 7.4: Scan Counter Display

As a **user**,
I want **to see how many scans I have remaining**,
So that **I know when I need to upgrade**.

**Acceptance Criteria:**

**Given** I am a free user
**When** I view the dashboard or sidebar
**Then** I see my scan usage: "X/3 scans used this month"
**And** the display updates after each scan

**Given** I have 1 scan remaining
**When** I view the counter
**Then** it shows a warning color (yellow/orange)
**And** text says "1 scan remaining"

**Given** I have 0 scans remaining
**When** I view the counter
**Then** it shows an alert color (red)
**And** text says "No scans remaining"
**And** an "Upgrade" button is prominent

**Given** I am a paid user
**When** I view the dashboard
**Then** I see "Unlimited scans" or "Pro" badge
**And** no counter is displayed

**Given** I am on the new scan page
**When** I view the page header
**Then** my scan count is visible
**And** I understand my limits before starting

**Given** the month resets
**When** I view the counter
**Then** it shows the reset count (e.g., "0/3 scans used")
**And** the reset happens automatically

**Technical Notes:**
- Create `components/shared/ScanCounter.tsx`
- Add to sidebar and new scan page
- Fetch usage via `useSubscription` hook or server component
- Use color coding: green (0-1 used), yellow (2 used), red (3 used)
- For paid users, show "Pro" badge instead of counter

---

### Story 7.5: Upgrade to Paid Subscription

As a **free user**,
I want **to upgrade to the paid plan**,
So that **I can get unlimited scans**.

**Acceptance Criteria:**

**Given** I am a free user
**When** I click "Upgrade to Pro" from any upgrade CTA
**Then** I am redirected to Stripe Checkout
**And** the checkout shows: "CoopReady Pro - $5/month"
**And** I can enter my payment information

**Given** I complete the Stripe Checkout successfully
**When** payment is processed
**Then** I am redirected back to CoopReady
**And** I see a success message "Welcome to Pro!"
**And** my subscription status is updated to 'active'

**Given** I cancel during Stripe Checkout
**When** I return to CoopReady
**Then** I see the dashboard (no error)
**And** my subscription status remains 'free'
**And** I can try again later

**Given** payment fails during checkout
**When** Stripe shows the error
**Then** I can retry with different payment method
**And** no partial subscription is created

**Given** I view the upgrade page/modal
**When** I see the offer
**Then** I see clear pricing: "$5/month"
**And** I see benefits: "Unlimited scans", "Priority support"
**And** I see a clear CTA button

**Given** I am already a paid user
**When** I somehow reach the upgrade flow
**Then** I see "You're already on Pro!"
**And** I am redirected to subscription management

**Technical Notes:**
- Create `lib/stripe/checkout.ts` with `createCheckoutSession`
- Create `actions/subscription.ts` with `createCheckout` action
- Checkout success URL: `/settings/subscription?success=true`
- Checkout cancel URL: `/settings/subscription?cancelled=true`
- Pass `client_reference_id` = user ID for webhook correlation
- Create `components/shared/UpgradePrompt.tsx` for reusable CTA

---

### Story 7.6: Subscription Management

As a **paid user**,
I want **to view and manage my subscription**,
So that **I can cancel if needed**.

**Acceptance Criteria:**

**Given** I am a paid user
**When** I navigate to Settings > Subscription
**Then** I see my current plan: "CoopReady Pro"
**And** I see my billing cycle: "Renews on [date]"
**And** I see my payment method (last 4 digits)

**Given** I want to update my payment method
**When** I click "Manage Billing"
**Then** I am redirected to Stripe Customer Portal
**And** I can update my card or billing info
**And** changes are reflected in CoopReady

**Given** I want to cancel my subscription
**When** I click "Cancel Subscription"
**Then** I see a confirmation: "Are you sure? You'll lose unlimited scans."
**And** I must confirm to proceed

**Given** I confirm cancellation
**When** the cancellation is processed
**Then** my subscription is set to cancel at period end
**And** I see "Subscription ends on [date]"
**And** I retain Pro access until the end date

**Given** my subscription has been cancelled but not yet ended
**When** I view subscription settings
**Then** I see "Cancelling on [date]"
**And** I see a "Reactivate" option
**And** clicking reactivate restores the subscription

**Given** I am a free user
**When** I navigate to Settings > Subscription
**Then** I see "Free Plan"
**And** I see my usage this month
**And** I see an "Upgrade to Pro" button

**Technical Notes:**
- Create `app/(dashboard)/settings/subscription/page.tsx`
- Create `lib/stripe/portal.ts` with `createPortalSession`
- Add `createPortal` action to `actions/subscription.ts`
- Portal return URL: `/settings/subscription`
- Handle `customer.subscription.updated` webhook for reactivation
- Show appropriate UI based on `subscription_status`
