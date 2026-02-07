---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - initial_docs/revision/ats-resume-optimizer-product-brief.md
  - initial_docs/revision/ats-resume-optimizer-v01-prd.md
---

# submit_smart - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for submit_smart, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Identity & Access (5)**
- FR1: Anonymous users can access the optimization flow without creating an account (V0.1)
- FR2: Users can create an account using email and password (V1.0)
- FR3: Users can sign in using Google OAuth (V1.0)
- FR4: Users can sign out of their account (V1.0)
- FR5: Users can complete an onboarding flow with 3 questions (V1.0)

**Resume Management (7)**
- FR6: Users can upload a resume file in PDF format
- FR7: Users can upload a resume file in DOCX format
- FR8: Users can see upload validation errors for unsupported formats
- FR9: Users can see upload validation errors for files exceeding 5MB
- FR10: Users can save up to 3 resumes in their library (V1.0)
- FR11: Users can select a resume from their library for optimization (V1.0)
- FR12: Users can delete a resume from their library (V1.0)

**Job Description Input (3)**
- FR13: Users can paste a job description as text input
- FR14: Users can edit the pasted job description before optimization
- FR15: Users can clear the job description input

**ATS Analysis & Scoring (5)**
- FR16: System can parse resume content into structured sections
- FR17: System can analyze keyword alignment between resume and JD
- FR18: System can calculate an ATS compatibility score (0-100)
- FR19: Users can view their ATS score with breakdown by category
- FR20: Users can view identified keyword gaps between resume and JD

**Content Optimization (8)**
- FR21: System can generate optimized content suggestions for Summary section
- FR22: System can generate optimized content suggestions for Skills section
- FR23: System can generate optimized content suggestions for Experience section
- FR24: Users can view original text alongside suggested improvements
- FR25: Users can copy individual suggestions to clipboard
- FR26: Users can see point value for each suggestion (V1.0)
- FR27: Users can regenerate suggestions for a specific section
- FR28: Users can configure 5 optimization preferences (V1.0)

**Quality Assurance (4)**
- FR29: System can validate suggestions for AI-tell phrases and rewrite if found
- FR30: System can enforce authenticity (reframe only, no fabrication)
- FR31: System can verify suggestion quality using LLM-as-judge (V1.0)
- FR32: System can treat resume/JD content as data, not instructions (prompt security)

**Comparison & Validation (3)**
- FR33: Users can compare original resume score with optimized score (V1.0)
- FR34: Users can view before/after text comparison (V1.0)
- FR35: Users can provide thumbs up/down feedback on suggestions

**Session & History (4)**
- FR36: System can persist session data across page refresh
- FR37: Users can view their optimization history (up to 10 sessions) (V1.0)
- FR38: Users can reload a previous optimization session (V1.0)
- FR39: Users can delete items from their history (V1.0)

**Error Handling (3)**
- FR40: Users can see error messages that include error type, plain-language explanation, and suggested recovery action when LLM fails
- FR41: Users can retry optimization after a failure
- FR42: System can recover gracefully from timeout errors

**Total: 42 Functional Requirements (26 V0.1, 16 V1.0)**

### Non-Functional Requirements

**Performance (6)**
- NFR1: Page load time (LCP) < 2.5 seconds
- NFR2: Time to Interactive < 3.5 seconds
- NFR3: File upload acknowledgment < 3 seconds
- NFR4: Full optimization pipeline completion < 60 seconds
- NFR5: Copy to clipboard response < 100ms
- NFR6: UI interactions (clicks, toggles) < 200ms

**Security (6)**
- NFR7: All API keys stored server-side only (100% compliance)
- NFR8: User content treated as data in prompts (injection defense) - All LLM calls
- NFR9: Data in transit encryption (HTTPS) - Enforced
- NFR10: Row-level security policies for user data isolation - All tables
- NFR11: Schema-based input validation - All user inputs
- NFR12: No PII in application logs (100% compliance)

**Reliability (5)**
- NFR13: Application uptime > 99% (Vercel SLA)
- NFR14: LLM API success rate > 95%
- NFR15: Graceful error handling (no crashes) - All error scenarios
- NFR16: Session persistence across refresh (100%)
- NFR17: File parsing success rate (PDF/DOCX) > 95%

**Accessibility (4)**
- NFR18: WCAG 2.1 AA compliance - All interactive elements
- NFR19: Keyboard navigation support - Full app coverage
- NFR20: Screen reader compatibility - Form controls, results
- NFR21: Color contrast ratios - WCAG AA minimum

**Integration (3)**
- NFR22: Authentication service response time < 2 seconds
- NFR23: Anthropic API timeout handling - 60 second limit
- NFR24: API error responses include error code, explanation, and recovery action

**Total: 24 Non-Functional Requirements**

### Additional Requirements

**From Architecture - Project Setup (Critical for Epic 1):**
- Starter template: create-next-app + shadcn/ui init
- Initialize with TypeScript, Tailwind, App Router, Turbopack
- Install core dependencies: @supabase/supabase-js, @supabase/ssr, @langchain/anthropic, @langchain/core, langchain, ai, zustand, react-hook-form, zod, @hookform/resolvers, sonner, lucide-react, react-dropzone, unpdf, mammoth

**From Architecture - Infrastructure:**
- Supabase schema with sessions table
- Row-level security (RLS) policies for user isolation
- Anonymous sessions via anonymous_id
- Environment variables setup (.env.local, Vercel)

**From Architecture - Implementation Patterns:**
- ActionResponse<T> pattern for all server actions and API routes
- Standardized error codes: INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR
- Zustand store pattern for client state
- Transform snake_case (DB) to camelCase (TypeScript) at boundaries

**From Architecture - Implementation Sequence:**
1. Project setup (starter + deps)
2. Supabase schema + RLS
3. Auth flow (anonymous)
4. File parsing layer
5. LLM pipeline (API route)
6. Frontend components
7. Session persistence

**From UX Design:**
- Purple/indigo primary color (#635BFF)
- Left sidebar navigation pattern
- Card-based suggestion display
- Progress indicator for multi-step LLM operations
- Toast notifications via sonner
- Responsive design (mobile-first)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Anonymous access |
| FR2 | Epic 8 | Email/password signup |
| FR3 | Epic 8 | Google OAuth |
| FR4 | Epic 8 | Sign out |
| FR5 | Epic 8 | Onboarding flow |
| FR6 | Epic 3 | PDF upload |
| FR7 | Epic 3 | DOCX upload |
| FR8 | Epic 3 | Format validation errors |
| FR9 | Epic 3 | Size validation errors |
| FR10 | Epic 9 | Save resumes to library |
| FR11 | Epic 9 | Select from library |
| FR12 | Epic 9 | Delete from library |
| FR13 | Epic 4 | Paste JD |
| FR14 | Epic 4 | Edit JD |
| FR15 | Epic 4 | Clear JD |
| FR16 | Epic 3 | Parse resume sections |
| FR17 | Epic 5 | Keyword alignment |
| FR18 | Epic 5 | Calculate ATS score |
| FR19 | Epic 5 | View score breakdown |
| FR20 | Epic 5 | View keyword gaps |
| FR21 | Epic 6 | Summary suggestions |
| FR22 | Epic 6 | Skills suggestions |
| FR23 | Epic 6 | Experience suggestions |
| FR24 | Epic 6 | Original vs suggested view |
| FR25 | Epic 6 | Copy to clipboard |
| FR26 | Epic 11 | Point values |
| FR27 | Epic 6 | Regenerate suggestions |
| FR28 | Epic 11 | Configure preferences |
| FR29 | Epic 6 | AI-tell validation |
| FR30 | Epic 6 | Authenticity enforcement |
| FR31 | Epic 12 | LLM-as-judge |
| FR32 | Epic 6 | Prompt security |
| FR33 | Epic 11 | Compare scores |
| FR34 | Epic 11 | Before/after comparison |
| FR35 | Epic 7 | Thumbs up/down |
| FR36 | Epic 2 | Session persistence |
| FR37 | Epic 10 | View history |
| FR38 | Epic 10 | Reload session |
| FR39 | Epic 10 | Delete history |
| FR40 | Epic 7 | Error messages |
| FR41 | Epic 7 | Retry after failure |
| FR42 | Epic 7 | Timeout recovery |

## Epic List

### Epic 1: Project Foundation
Development team can build on a properly configured codebase with all infrastructure in place.

**FRs covered:** Infrastructure (enables all FRs)
**Version:** V0.1

---

### Epic 2: Anonymous Access & Session
Users can access the app without signup and have their work automatically saved across page refreshes.

**FRs covered:** FR1, FR36
**Version:** V0.1

---

### Epic 3: Resume Upload & Parsing
Users can upload their resume (PDF or DOCX) and have it processed into structured sections for analysis.

**FRs covered:** FR6, FR7, FR8, FR9, FR16
**Version:** V0.1

---

### Epic 4: Job Description Input
Users can input the target job description they want to optimize their resume for.

**FRs covered:** FR13, FR14, FR15
**Version:** V0.1

---

### Epic 5: ATS Analysis & Scoring
Users can see how well their resume matches the job description with a score and gap analysis.

**FRs covered:** FR17, FR18, FR19, FR20
**Version:** V0.1

---

### Epic 6: Content Optimization
Users can get AI-generated suggestions to improve their resume and copy them to their clipboard.

**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR27, FR29, FR30, FR32
**Version:** V0.1

---

### Epic 7: Error Handling & Feedback
Users have a graceful experience when things go wrong and can provide feedback on suggestions.

**FRs covered:** FR35, FR40, FR41, FR42
**Version:** V0.1

---

### Epic 8: User Authentication
Users can create accounts with email/password or Google OAuth and complete onboarding.

**FRs covered:** FR2, FR3, FR4, FR5
**Version:** V1.0

---

### Epic 9: Resume Library
Users can save, select, and manage up to 3 resumes in their personal library.

**FRs covered:** FR10, FR11, FR12
**Version:** V1.0

---

### Epic 10: Optimization History
Users can view their past optimization sessions and reload them.

**FRs covered:** FR37, FR38, FR39
**Version:** V1.0

---

### Epic 11: Compare & Enhanced Suggestions
Users can see detailed before/after comparisons and configure optimization preferences.

**FRs covered:** FR26, FR28, FR33, FR34
**Version:** V1.0

---

### Epic 12: Quality Assurance (LLM-as-Judge)
System automatically verifies suggestion quality using AI evaluation.

**FRs covered:** FR31
**Version:** V1.0

---

## Epic 1: Project Foundation

Development team can build on a properly configured codebase with all infrastructure in place.

### Story 1.1: Initialize Next.js Project with Core Dependencies

As a developer,
I want the project initialized with Next.js 15, TypeScript, and all required dependencies,
So that I can start building features on a properly configured codebase.

**Acceptance Criteria:**

**Given** no existing project
**When** the initialization script is run
**Then** a Next.js 15 project is created with App Router and TypeScript
**And** shadcn/ui is initialized with the project's design system
**And** all core dependencies are installed (Supabase, LangChain, Zustand, React Hook Form, Zod, etc.)
**And** the project runs successfully with `npm run dev`

---

### Story 1.2: Configure Supabase Database Schema

As a developer,
I want the Supabase database configured with the sessions table and RLS policies,
So that user data is properly isolated and persisted.

**Acceptance Criteria:**

**Given** a Supabase project is connected
**When** migrations are applied
**Then** a `sessions` table exists with columns for resume_content, jd_content, analysis, suggestions, anonymous_id, timestamps
**And** RLS policies enforce user data isolation via anonymous_id
**And** the schema supports the data model defined in the PRD

---

### Story 1.3: Set Up Environment Configuration

As a developer,
I want environment variables configured for local development and production,
So that API keys are secure and the app works in all environments.

**Acceptance Criteria:**

**Given** the project is initialized
**When** environment files are configured
**Then** `.env.local` contains all required variables (Supabase URL/keys, Anthropic API key)
**And** `.env.example` documents required variables without secrets
**And** server-only variables are not prefixed with NEXT_PUBLIC_
**And** the app connects to Supabase and Claude API successfully

---

### Story 1.4: Implement Core Types and ActionResponse Pattern

As a developer,
I want the ActionResponse pattern and core types defined,
So that all server actions follow a consistent error handling pattern.

**Acceptance Criteria:**

**Given** the project structure is in place
**When** I create a server action
**Then** I can use the ActionResponse<T> type for consistent responses
**And** standardized error codes are available (INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR)
**And** the Zustand store interface is defined
**And** core type definitions exist in `/types`

---

## Epic 2: Anonymous Access & Session

Users can access the app without signup and have their work automatically saved across page refreshes.

### Story 2.1: Implement Anonymous Authentication

As a user,
I want to access the optimization flow without creating an account,
So that I can try the tool with zero friction.

**Acceptance Criteria:**

**Given** I am a new visitor to the app
**When** I land on the optimization page
**Then** an anonymous session is automatically created via Supabase Auth
**And** I can proceed with the full optimization flow
**And** no login/signup is required
**And** the session creation takes less than 2 seconds

---

### Story 2.2: Implement Session Persistence

As a user,
I want my optimization work to persist across page refreshes,
So that I don't lose my progress if I accidentally close the browser.

**Acceptance Criteria:**

**Given** I have uploaded a resume and entered a job description
**When** I refresh the page or close and reopen the browser
**Then** my resume content is still available
**And** my job description is still available
**And** my analysis results (if any) are restored
**And** my suggestions (if any) are restored
**And** the session is linked to my anonymous_id

---

## Epic 3: Resume Upload & Parsing

Users can upload their resume (PDF or DOCX) and have it processed into structured sections for analysis.

### Story 3.1: Implement Resume Upload UI

As a user,
I want to upload my resume via drag-and-drop or file picker,
So that I can easily provide my resume for optimization.

**Acceptance Criteria:**

**Given** I am on the optimization page
**When** I drag a file onto the upload zone or click to select a file
**Then** the file is accepted if it's PDF or DOCX format
**And** the upload zone shows visual feedback during drag-over
**And** the filename is displayed after selection
**And** I can remove the file and upload a different one

---

### Story 3.2: Implement File Validation

As a user,
I want clear error messages when I upload an invalid file,
So that I know exactly what went wrong and how to fix it.

**Acceptance Criteria:**

**Given** I attempt to upload a file
**When** the file is not PDF or DOCX format
**Then** I see an error message "Invalid file type. Please upload a PDF or DOCX file."
**And** the error code INVALID_FILE_TYPE is returned

**Given** I attempt to upload a file
**When** the file exceeds 5MB
**Then** I see an error message "File too large. Maximum size is 5MB."
**And** the error code FILE_TOO_LARGE is returned

---

### Story 3.3: Implement PDF Text Extraction

As a user,
I want my PDF resume parsed into text,
So that the system can analyze its content.

**Acceptance Criteria:**

**Given** I upload a valid PDF file
**When** the file is processed
**Then** text content is extracted using unpdf library
**And** the extracted text is stored in the session
**And** extraction completes within 3 seconds
**And** if extraction fails, I see error code PARSE_ERROR with helpful message

---

### Story 3.4: Implement DOCX Text Extraction

As a user,
I want my DOCX resume parsed into text,
So that the system can analyze its content.

**Acceptance Criteria:**

**Given** I upload a valid DOCX file
**When** the file is processed
**Then** text content is extracted using mammoth library
**And** the extracted text is stored in the session
**And** extraction completes within 3 seconds
**And** if extraction fails, I see error code PARSE_ERROR with helpful message

---

### Story 3.5: Implement Resume Section Parsing

As a user,
I want my resume parsed into structured sections,
So that the system can provide section-specific suggestions.

**Acceptance Criteria:**

**Given** resume text has been extracted
**When** the LLM parse step runs
**Then** the resume is structured into sections (Summary, Skills, Experience, Education)
**And** each section's content is identified
**And** the structured data is stored in the session
**And** the response follows ActionResponse<T> pattern

---

## Epic 4: Job Description Input

Users can input the target job description they want to optimize their resume for.

### Story 4.1: Implement Job Description Input

As a user,
I want to paste a job description into a text area,
So that the system can analyze it against my resume.

**Acceptance Criteria:**

**Given** I am on the optimization page with a resume uploaded
**When** I paste or type text into the job description field
**Then** the text is captured and validated
**And** the JD is stored in the Zustand store
**And** I can see character count or validation status

---

### Story 4.2: Implement Job Description Editing

As a user,
I want to edit the job description before optimization,
So that I can clean up formatting or make adjustments.

**Acceptance Criteria:**

**Given** I have pasted a job description
**When** I make changes to the text
**Then** the changes are saved to state
**And** I can undo/redo changes (browser native)
**And** the textarea supports standard text editing

---

### Story 4.3: Implement Job Description Clear

As a user,
I want to clear the job description,
So that I can start over with a different job posting.

**Acceptance Criteria:**

**Given** I have entered a job description
**When** I click the clear button
**Then** the job description field is emptied
**And** the state is updated
**And** I can enter a new job description

---

## Epic 5: ATS Analysis & Scoring

Users can see how well their resume matches the job description with a score and gap analysis.

### Story 5.1: Implement Keyword Analysis

As a user,
I want to see which keywords from the job description are in my resume,
So that I understand my current alignment.

**Acceptance Criteria:**

**Given** I have uploaded a resume and entered a job description
**When** I trigger the analysis
**Then** the system identifies keywords in the JD
**And** the system finds matching keywords in my resume
**And** the system identifies missing keywords (gaps)
**And** results are stored in the session

---

### Story 5.2: Implement ATS Score Calculation

As a user,
I want to see my ATS compatibility score (0-100),
So that I have a clear metric for how well my resume matches.

**Acceptance Criteria:**

**Given** keyword analysis is complete
**When** the score is calculated
**Then** I see a score between 0-100
**And** the score reflects keyword alignment, section coverage, and content quality
**And** the calculation methodology is consistent and reproducible

---

### Story 5.3: Implement Score Display with Breakdown

As a user,
I want to see my ATS score with a breakdown by category,
So that I understand which areas need the most improvement.

**Acceptance Criteria:**

**Given** the ATS score has been calculated
**When** I view the results
**Then** I see the overall score prominently displayed
**And** I see a breakdown by category (e.g., Keywords, Skills, Experience)
**And** the display uses visual indicators (progress ring, color coding)
**And** the UI follows the UX design specification

---

### Story 5.4: Implement Gap Analysis Display

As a user,
I want to see the specific keyword gaps between my resume and the JD,
So that I know exactly what's missing.

**Acceptance Criteria:**

**Given** the analysis is complete
**When** I view the gap analysis
**Then** I see a list of missing keywords from the JD
**And** I see which keywords are already present
**And** gaps are grouped by category (skills, technologies, qualifications)
**And** the display helps me understand what to add

---

## Epic 6: Content Optimization

Users can get AI-generated suggestions to improve their resume and copy them to their clipboard.

### Story 6.1: Implement LLM Pipeline API Route

As a developer,
I want an API route that orchestrates the LLM optimization pipeline,
So that the frontend can trigger optimization with proper timeout handling.

**Acceptance Criteria:**

**Given** resume and JD are provided
**When** the `/api/optimize` endpoint is called
**Then** the LangChain sequential pipeline executes (Parse → Analyze → Optimize)
**And** the request has a 60-second timeout
**And** user content is wrapped in XML tags for prompt injection defense
**And** the response follows ActionResponse<T> pattern
**And** token usage is logged for cost tracking

---

### Story 6.2: Implement Summary Section Suggestions

As a user,
I want optimized suggestions for my professional summary,
So that I can improve my resume's opening statement.

**Acceptance Criteria:**

**Given** optimization is triggered
**When** suggestions are generated
**Then** I receive an optimized professional summary
**And** the suggestion incorporates relevant keywords from the JD
**And** the suggestion reframes my existing experience (no fabrication)
**And** AI-tell phrases are detected and rewritten

---

### Story 6.3: Implement Skills Section Suggestions

As a user,
I want optimized suggestions for my skills section,
So that I can better align my skills with the job requirements.

**Acceptance Criteria:**

**Given** optimization is triggered
**When** suggestions are generated
**Then** I receive optimized skills content
**And** skills are organized and prioritized based on JD relevance
**And** missing relevant skills are highlighted (if I have related experience)
**And** the format matches professional resume standards

---

### Story 6.4: Implement Experience Section Suggestions

As a user,
I want optimized bullet points for my experience section,
So that I can better describe my achievements.

**Acceptance Criteria:**

**Given** optimization is triggered
**When** suggestions are generated
**Then** I receive optimized experience bullets for each role
**And** bullets are reframed with relevant keywords
**And** quantification is added where possible
**And** authenticity is enforced (reframe only, no fabrication)

---

### Story 6.5: Implement Suggestion Display UI

As a user,
I want to see my original text alongside the suggested improvements,
So that I can compare and decide what to use.

**Acceptance Criteria:**

**Given** suggestions have been generated
**When** I view the results
**Then** I see original text and suggested text side-by-side or in tabs
**And** suggestions are grouped by section (Summary, Skills, Experience)
**And** the UI uses cards as per UX specification
**And** loading states show progress during generation

---

### Story 6.6: Implement Copy to Clipboard

As a user,
I want to copy individual suggestions to my clipboard,
So that I can paste them into my resume.

**Acceptance Criteria:**

**Given** suggestions are displayed
**When** I click the copy button on a suggestion
**Then** the suggestion text is copied to my clipboard
**And** I see visual feedback (toast notification, button state change)
**And** the copy action completes in under 100ms

---

### Story 6.7: Implement Regenerate Suggestions

As a user,
I want to regenerate suggestions for a specific section,
So that I can get alternative options if I don't like the first ones.

**Acceptance Criteria:**

**Given** suggestions have been generated
**When** I click regenerate for a section
**Then** new suggestions are generated for that section only
**And** the loading state is shown during regeneration
**And** the new suggestions replace the old ones
**And** I can regenerate multiple times

---

## Epic 7: Error Handling & Feedback

Users have a graceful experience when things go wrong and can provide feedback on suggestions.

### Story 7.1: Implement Error Display Component

As a user,
I want to see clear error messages when something goes wrong,
So that I understand what happened and what to do next.

**Acceptance Criteria:**

**Given** an error occurs during any operation
**When** the error is displayed
**Then** I see the error type (e.g., "Optimization Failed")
**And** I see a plain-language explanation
**And** I see a suggested recovery action
**And** the error display follows the UX design specification

---

### Story 7.2: Implement Retry Functionality

As a user,
I want to retry the optimization after a failure,
So that I can recover from temporary issues.

**Acceptance Criteria:**

**Given** an optimization has failed
**When** I click the retry button
**Then** the optimization is attempted again
**And** my previous inputs (resume, JD) are preserved
**And** I see loading state during retry
**And** if successful, results are displayed normally

---

### Story 7.3: Implement Timeout Recovery

As a user,
I want graceful handling when the optimization takes too long,
So that I'm not left waiting indefinitely.

**Acceptance Criteria:**

**Given** the optimization exceeds 60 seconds
**When** the timeout is reached
**Then** the request is cancelled gracefully
**And** I see error code LLM_TIMEOUT with explanation
**And** I'm offered the option to retry
**And** partial results are not displayed (all or nothing)

---

### Story 7.4: Implement Suggestion Feedback

As a user,
I want to provide thumbs up/down feedback on suggestions,
So that I can indicate which suggestions were helpful.

**Acceptance Criteria:**

**Given** suggestions are displayed
**When** I click thumbs up or thumbs down on a suggestion
**Then** my feedback is recorded
**And** visual feedback confirms my selection
**And** I can change my feedback
**And** feedback is stored in the session for future analytics

---

## Epic 8: User Authentication

Users can create accounts with email/password or Google OAuth and complete onboarding.

### Story 8.1: Implement Email/Password Registration

As a user,
I want to create an account with my email and password,
So that I can save my work and access it later.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter a valid email and password
**Then** an account is created via Supabase Auth
**And** I receive a confirmation email (if required)
**And** my anonymous session data is migrated to my new account
**And** I am redirected to the app

---

### Story 8.2: Implement Email/Password Login

As a user,
I want to sign in with my email and password,
So that I can access my saved work.

**Acceptance Criteria:**

**Given** I have an account
**When** I enter my credentials on the login page
**Then** I am authenticated via Supabase Auth
**And** my session is established
**And** I am redirected to the optimization page
**And** authentication completes in under 2 seconds

---

### Story 8.3: Implement Google OAuth

As a user,
I want to sign in with my Google account,
So that I can use the app without creating a new password.

**Acceptance Criteria:**

**Given** I am on the login/signup page
**When** I click "Sign in with Google"
**Then** I am redirected to Google's OAuth flow
**And** after authorization, I am returned to the app
**And** my account is created or linked
**And** my anonymous session data is migrated if applicable

---

### Story 8.4: Implement Sign Out

As a user,
I want to sign out of my account,
So that I can secure my session on shared devices.

**Acceptance Criteria:**

**Given** I am signed in
**When** I click sign out
**Then** my session is terminated
**And** I am redirected to the home page
**And** my data is no longer accessible without signing in again

---

### Story 8.5: Implement Onboarding Flow

As a user,
I want to complete a brief onboarding with 3 questions,
So that the app can personalize my experience.

**Acceptance Criteria:**

**Given** I have just created an account
**When** I complete onboarding
**Then** I am asked 3 questions about my background/goals
**And** my answers are saved to my profile
**And** I can skip onboarding if desired
**And** I am directed to the main app after completion

---

## Epic 9: Resume Library

Users can save, select, and manage up to 3 resumes in their personal library.

### Story 9.1: Implement Save Resume to Library

As a user,
I want to save my uploaded resume to my library,
So that I can reuse it for future optimizations.

**Acceptance Criteria:**

**Given** I am signed in and have uploaded a resume
**When** I click "Save to Library"
**Then** the resume is saved to my account
**And** I can name the resume (e.g., "Software Engineer Resume")
**And** I am prevented from saving more than 3 resumes
**And** if at limit, I see a message explaining the limit

---

### Story 9.2: Implement Resume Selection from Library

As a user,
I want to select a resume from my library for optimization,
So that I don't have to re-upload the same file.

**Acceptance Criteria:**

**Given** I have resumes saved in my library
**When** I click to select a resume
**Then** I see my saved resumes with names and dates
**And** I can select one to use for optimization
**And** the selected resume's content is loaded into the session

---

### Story 9.3: Implement Resume Deletion from Library

As a user,
I want to delete resumes from my library,
So that I can make room for new versions.

**Acceptance Criteria:**

**Given** I have resumes in my library
**When** I click delete on a resume
**Then** I am asked to confirm the deletion
**And** upon confirmation, the resume is permanently removed
**And** my library count is updated

---

## Epic 10: Optimization History

Users can view their past optimization sessions and reload them.

### Story 10.1: Implement History List View

As a user,
I want to view my past optimization sessions,
So that I can review what I've done before.

**Acceptance Criteria:**

**Given** I am signed in
**When** I navigate to the history page
**Then** I see up to 10 past optimization sessions
**And** each entry shows date, resume name, job title/company (if identifiable)
**And** sessions are sorted by most recent first

---

### Story 10.2: Implement Session Reload

As a user,
I want to reload a previous optimization session,
So that I can review or continue my work.

**Acceptance Criteria:**

**Given** I am viewing my history
**When** I click on a past session
**Then** the session data is loaded (resume, JD, analysis, suggestions)
**And** I can view the results as they were
**And** I can run a new optimization with the same inputs

---

### Story 10.3: Implement History Deletion

As a user,
I want to delete items from my history,
So that I can clean up old sessions.

**Acceptance Criteria:**

**Given** I am viewing my history
**When** I click delete on a session
**Then** I am asked to confirm
**And** upon confirmation, the session is permanently removed
**And** the history list is updated

---

## Epic 11: Compare & Enhanced Suggestions

Users can see detailed before/after comparisons and configure optimization preferences.

### Story 11.1: Implement Point Values for Suggestions

As a user,
I want to see the point value for each suggestion,
So that I can prioritize which changes have the most impact.

**Acceptance Criteria:**

**Given** suggestions have been generated
**When** I view the suggestions
**Then** each suggestion shows its estimated point impact
**And** points indicate how much the change improves my ATS score
**And** I can sort/prioritize by point value

---

### Story 11.2: Implement Optimization Preferences

As a user,
I want to configure 5 optimization preferences,
So that I can customize how suggestions are generated.

**Acceptance Criteria:**

**Given** I am about to run optimization
**When** I access preferences
**Then** I can configure 5 options (e.g., tone, verbosity, focus areas)
**And** my preferences are saved to my profile
**And** subsequent optimizations use my preferences
**And** I can reset to defaults

---

### Story 11.3: Implement Score Comparison

As a user,
I want to compare my original score with my optimized score,
So that I can see the improvement at a glance.

**Acceptance Criteria:**

**Given** I have received suggestions
**When** I view the comparison
**Then** I see my original ATS score
**And** I see my projected optimized score (if I apply suggestions)
**And** the improvement is clearly visualized (e.g., 45% → 72%)

---

### Story 11.4: Implement Before/After Text Comparison

As a user,
I want to view a side-by-side text comparison,
So that I can see exactly what changed.

**Acceptance Criteria:**

**Given** suggestions have been generated
**When** I view the comparison view
**Then** I see original text and suggested text side-by-side
**And** differences are highlighted (additions, removals, changes)
**And** I can toggle between sections
**And** the view is easy to scan and understand

---

## Epic 12: Quality Assurance (LLM-as-Judge)

System automatically verifies suggestion quality using AI evaluation.

### Story 12.1: Implement LLM-as-Judge Pipeline Step

As a system,
I want to verify suggestion quality using a judge LLM call,
So that low-quality suggestions are automatically improved.

**Acceptance Criteria:**

**Given** suggestions have been generated by the optimize step
**When** the judge step runs
**Then** each suggestion is evaluated for quality (relevance, authenticity, clarity)
**And** suggestions that fail are flagged for regeneration
**And** the pipeline retries the optimize step for failed suggestions
**And** maximum 2 retry attempts before returning best effort

---

### Story 12.2: Implement Quality Metrics Logging

As a developer,
I want to log quality metrics from the judge step,
So that we can monitor and improve suggestion quality over time.

**Acceptance Criteria:**

**Given** the judge step runs
**When** evaluation completes
**Then** pass/fail rates are logged
**And** failure reasons are categorized
**And** metrics are available for monitoring
**And** no PII is included in logs

---

## Story Summary

| Epic | Title | Stories | Version |
|------|-------|---------|---------|
| 1 | Project Foundation | 4 | V0.1 |
| 2 | Anonymous Access & Session | 2 | V0.1 |
| 3 | Resume Upload & Parsing | 5 | V0.1 |
| 4 | Job Description Input | 3 | V0.1 |
| 5 | ATS Analysis & Scoring | 4 | V0.1 |
| 6 | Content Optimization | 7 | V0.1 |
| 7 | Error Handling & Feedback | 4 | V0.1 |
| 8 | User Authentication | 5 | V1.0 |
| 9 | Resume Library | 3 | V1.0 |
| 10 | Optimization History | 3 | V1.0 |
| 11 | Compare & Enhanced Suggestions | 4 | V1.0 |
| 12 | Quality Assurance (LLM-as-Judge) | 2 | V1.0 |
| 13 | Hybrid Preferences (V0.5) | 5 | V0.5 |
| 14 | Explanation Output (V0.5) | 4 | V0.5 |
| 15 | Privacy Consent (V0.5) | 4 | V0.5 |
| 16 | Dashboard UI Architecture (V0.5) | 8 | V0.5 |
| **Total** | | **67 stories** | |

---

# V0.5 Hybrid Features

The following epics implement the V0.5 Hybrid Plan, adding structural controls (Job Type, Modification Level), explanation output, and privacy consent to complement the existing style preferences.

**Reference Document:** `initial_docs/revision/ats-resume-optimizer-v05-hybrid-plan.md`

---

## Epic 13: Hybrid Preferences (V0.5)

Users can configure Job Type and Modification Level to control how suggestions are framed and how much content is changed.

**FRs covered:** FR28 (extends existing preferences implementation)
**Version:** V0.5

### Story 13.1: Add Job Type and Modification Level Types

As a developer,
I want the type definitions for Job Type and Modification Level preferences,
So that I can use them throughout the codebase with type safety.

**Acceptance Criteria:**

**Given** the existing `OptimizationPreferences` type
**When** I need to access job type or modification level
**Then** `JobTypePreference` type exists with values `'coop' | 'fulltime'`
**And** `ModificationLevelPreference` type exists with values `'conservative' | 'moderate' | 'aggressive'`
**And** `OptimizationPreferences` interface includes `jobType` and `modificationLevel` fields
**And** `DEFAULT_PREFERENCES` includes default values (`fulltime`, `moderate`)
**And** `validatePreferences()` validates the new fields
**And** `PREFERENCE_METADATA` includes labels and descriptions for new options

---

### Story 13.2: Add Preferences Database Migration

As a developer,
I want the database schema updated to support Job Type and Modification Level,
So that user preferences persist correctly.

**Acceptance Criteria:**

**Given** the existing `optimization_preferences` JSONB column in profiles table
**When** the migration runs
**Then** the default JSONB includes `jobType: 'fulltime'` and `modificationLevel: 'moderate'`
**And** existing rows are backfilled with new fields
**And** no existing preferences are overwritten
**And** the migration is idempotent (safe to run multiple times)

---

### Story 13.3: Update Preferences Dialog UI

As a user,
I want to configure Job Type and Modification Level in the preferences dialog,
So that I can control how my suggestions are generated.

**Acceptance Criteria:**

**Given** I open the Preferences dialog
**When** I view the available settings
**Then** I see a "Job Type" section with radio buttons for "Co-op/Internship" and "Full-time"
**And** I see a "Modification Level" section with radio buttons for "Conservative", "Moderate", "Aggressive"
**And** each option has a clear description explaining its effect
**And** the new sections appear before the existing Tone/Verbosity sections
**And** I can save my selections and they persist
**And** Reset to Defaults resets the new fields to `fulltime` and `moderate`

---

### Story 13.4: Add Job Type and Modification Level Prompt Templates

As a developer,
I want prompt templates that inject Job Type and Modification Level instructions into LLM calls,
So that the AI generates appropriately-framed content.

**Acceptance Criteria:**

**Given** preferences include `jobType` and `modificationLevel`
**When** `buildPreferencePrompt()` is called
**Then** Job Type prompt is injected with audience-specific language guidelines
**And** Modification Level prompt is injected with change magnitude instructions
**And** Co-op/Internship prompts use learning-focused language ("Contributed to...", "Developed...")
**And** Full-time prompts use impact-focused language ("Led...", "Drove...", "Owned...")
**And** Conservative level instructs 15-25% change (keyword additions only)
**And** Moderate level instructs 35-50% change (restructure for impact)
**And** Aggressive level instructs 60-75% change (full rewrite)
**And** Job Type and Modification Level take precedence over style preferences if conflicts arise

---

### Story 13.5: Epic 13 Integration and Verification Testing

As a QA engineer,
I want to verify that Job Type and Modification Level preferences work end-to-end,
So that we can confidently release the feature.

**Acceptance Criteria:**

**Given** all Epic 13 stories are implemented
**When** I test the complete flow
**Then** I can select Job Type and Modification Level in preferences
**And** preferences persist across sessions
**And** Co-op mode produces learning-focused suggestions (verify language patterns)
**And** Full-time mode produces impact-focused suggestions (verify language patterns)
**And** Conservative mode makes minimal changes to original content
**And** Aggressive mode produces significantly rewritten content
**And** no regression in existing preference functionality (Tone, Verbosity, etc.)

---

## Epic 14: Explanation Output (V0.5)

Users can see "Why this works" explanations for each suggestion to understand the reasoning behind changes.

**FRs covered:** New requirement from V0.5 PRD
**Version:** V0.5

### Story 14.1: Add Explanation Types and Schema

As a developer,
I want the type definitions updated to include explanation fields,
So that suggestions can carry reasoning information.

**Acceptance Criteria:**

**Given** the existing suggestion types (`SummarySuggestion`, `SkillsSuggestion`, `ExperienceSuggestion`, `BulletSuggestion`)
**When** I need to access explanation data
**Then** each suggestion type includes an optional `explanation?: string` field
**And** the explanation is a 1-2 sentence string explaining why the change helps
**And** the session storage schema accepts the new field
**And** no breaking changes to existing suggestion handling

---

### Story 14.2: Update LLM Prompts for Explanations

As a developer,
I want the LLM prompts to request explanations alongside suggestions,
So that the AI provides reasoning for each change.

**Acceptance Criteria:**

**Given** the suggestion generation prompts
**When** the LLM generates a suggestion
**Then** the prompt instructs the LLM to include a 1-2 sentence explanation
**And** the explanation must reference specific JD keywords or requirements
**And** the JSON response schema includes `explanation` field
**And** explanations are parsed and stored with suggestions
**And** empty or missing explanations are handled gracefully (don't fail)

---

### Story 14.3: Render Explanations in UI

As a user,
I want to see "Why this works" explanations beneath each suggestion,
So that I understand why the change was recommended.

**Acceptance Criteria:**

**Given** suggestions with explanations are displayed
**When** I view the suggestion cards
**Then** I see a "Why this works" section beneath each suggestion
**And** the explanation is visually distinct (e.g., light blue background, 💡 icon)
**And** the text is readable and not truncated
**And** suggestions without explanations display without the explanation section (graceful degradation)

---

### Story 14.4: Epic 14 Integration and Verification Testing

As a QA engineer,
I want to verify that explanations are generated and displayed correctly,
So that we can confidently release the feature.

**Acceptance Criteria:**

**Given** all Epic 14 stories are implemented
**When** I run a full optimization
**Then** each suggestion includes an explanation
**And** explanations reference JD keywords or requirements (not generic)
**And** explanations display correctly in the UI
**And** the feature degrades gracefully if LLM omits explanation
**And** no regression in existing suggestion functionality

---

## Epic 15: Privacy Consent (V0.5)

Users must accept a privacy disclosure before uploading their first resume.

**FRs covered:** New requirement from V0.5 PRD (legal/trust)
**Version:** V0.5

### Story 15.1: Add Privacy Consent Database Columns

As a developer,
I want the database schema updated to track privacy consent,
So that we can record when users accept the disclosure.

**Acceptance Criteria:**

**Given** the existing `profiles` table
**When** the migration runs
**Then** a `privacy_accepted` BOOLEAN column exists (default false)
**And** a `privacy_accepted_at` TIMESTAMP column exists (nullable)
**And** existing profiles have `privacy_accepted = false`
**And** RLS policies allow users to update their own consent status

---

### Story 15.2: Create Privacy Consent Dialog

As a user,
I want to see a privacy disclosure before my first upload,
So that I understand how my data will be used.

**Acceptance Criteria:**

**Given** I have not yet accepted the privacy disclosure
**When** the consent dialog appears
**Then** I see a clear explanation of data handling:
  - Resume is processed using AI services (Anthropic Claude)
  - Data is stored securely in my account
  - Data is not used to train AI models
  - I can delete my data at any time
**And** I see links to Privacy Policy and Terms of Service
**And** I see a checkbox to confirm understanding
**And** I can click "I Agree" to proceed (disabled until checkbox checked)
**And** I can click "Cancel" to dismiss without uploading

---

### Story 15.3: Gate Uploads Until Consent Accepted

As a user,
I want to be prevented from uploading until I accept the privacy disclosure,
So that I make an informed decision about my data.

**Acceptance Criteria:**

**Given** I have not accepted the privacy disclosure (`privacy_accepted = false`)
**When** I attempt to upload a resume
**Then** the Privacy Consent Dialog appears
**And** the upload is blocked until I accept
**And** after accepting, `privacy_accepted` is set to true and `privacy_accepted_at` is recorded
**And** subsequent uploads proceed without the dialog

**Given** I have already accepted the privacy disclosure
**When** I upload a resume
**Then** the upload proceeds normally (no dialog)

---

### Story 15.4: Epic 15 Integration and Verification Testing

As a QA engineer,
I want to verify that privacy consent works correctly for all user types,
So that we can confidently release the feature.

**Acceptance Criteria:**

**Given** all Epic 15 stories are implemented
**When** I test various scenarios
**Then** new users see the consent dialog on first upload attempt
**And** existing users (backfilled) see the consent dialog on next upload
**And** consent is recorded correctly in the database
**And** subsequent uploads skip the dialog
**And** anonymous users who later register retain their consent status
**And** the feature does not block other app functionality (viewing results, etc.)

---

## Epic 16: Dashboard UI Architecture (V0.5)

Transform SubmitSmart from a single-page app into a proper dashboard-based SaaS with distinct routes for each step of the optimization flow.

**FRs covered:** UX improvement (enables better navigation, scalability, and user experience)
**Version:** V0.5

### Route Structure

```
/                           → Marketing landing page (public)
/app                        → Redirect to /app/dashboard
/app/dashboard              → Dashboard home (overview, recent scans, quick actions)
/app/scan/new               → New scan page (upload resume + enter JD)
/app/scan/[sessionId]       → Scan results (ATS score, breakdowns, keyword analysis)
/app/scan/[sessionId]/suggestions → Suggestions view (section-by-section improvements)
/app/history                → Scan history (list of past sessions)
/app/settings               → User settings (preferences, profile)
/app/onboarding             → First-time user wizard (if not completed)
/auth/*                     → Keep existing auth routes
```

### Layout Structure

All `/app/*` routes share a common layout with:
- **Sidebar** (left): Navigation links, user profile
- **Header** (top): Page title, quick actions, notifications
- **Main content** (center): Page-specific content

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] SubmitSmart                    [User] [Settings] [?] │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Dashboard │   [Page Content Area]                           │
│  New Scan  │                                                 │
│  History   │                                                 │
│  Settings  │                                                 │
│            │                                                 │
│            │                                                 │
│ ────────── │                                                 │
│  [Sign Out]│                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

### Mobile Layout
- Sidebar collapses to hamburger menu
- Full-width content area
- Bottom navigation for key actions

---

### Story 16.1: Create Dashboard Layout Foundation

As a user,
I want a consistent dashboard layout across all app pages,
So that I can easily navigate between different sections of the application.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I visit any `/app/*` route
**Then** I see a sidebar navigation on the left (desktop) or hamburger menu (mobile)
**And** I see a header with the current page title
**And** the main content area displays the page content
**And** the sidebar shows navigation links: Dashboard, New Scan, History, Settings
**And** the sidebar shows a Sign Out button at the bottom
**And** the active route is highlighted in the sidebar
**And** on mobile (< 1024px), the sidebar collapses to a hamburger menu
**And** unauthenticated users are redirected to `/auth/login`

**Technical Notes:**
- Create route group `app/(dashboard)/`
- Implement components: `Sidebar.tsx`, `Header.tsx`, `MobileNav.tsx`
- Use Sheet component for mobile drawer navigation
- Add auth protection in layout

---

### Story 16.2: Implement Dashboard Home Page

As a user,
I want a dashboard home page with an overview of my activity,
So that I can quickly access key features and see my recent work.

**Acceptance Criteria:**

**Given** I am authenticated and on `/app/dashboard`
**When** the page loads
**Then** I see a welcome message with my name/email
**And** I see a "New Scan" quick action card with prominent CTA
**And** I see a "View History" quick action card
**And** I see a "Your Progress" stats card (placeholder for now)
**And** I see a "Recent Scans" section showing my last 3-5 sessions
**And** if I have no scans, I see a getting started guide
**And** clicking "New Scan" navigates to `/app/scan/new`
**And** clicking a recent scan navigates to `/app/scan/[sessionId]`

---

### Story 16.3: Implement New Scan Page

As a user,
I want a dedicated page to start a new resume optimization,
So that I can upload my resume and enter a job description.

**Acceptance Criteria:**

**Given** I am on `/app/scan/new`
**When** the page loads
**Then** I see the Resume Upload section (ResumeUploader component)
**And** I see the Job Description Input section
**And** I see configuration options (Job Type, Modification Level from V0.5)
**And** I see the "Analyze" button
**And** selecting a resume from library works correctly
**And** after successful analysis, I am redirected to `/app/scan/[sessionId]`
**And** errors are displayed using ErrorDisplay component
**And** the page creates a new session (clears any previous state)

**Technical Notes:**
- Extract upload/JD components from current home page
- Add `startNewScan()` action to clear previous session state
- Integrate V0.5 preferences (Job Type, Modification Level) from Epic 13

---

### Story 16.4: Implement Scan Results Page

As a user,
I want to see my analysis results on a dedicated page,
So that I can understand my ATS score and gaps before viewing suggestions.

**Acceptance Criteria:**

**Given** I am on `/app/scan/[sessionId]` with completed analysis
**When** the page loads
**Then** I see the ATS Score prominently displayed (ATSScoreDisplay)
**And** I see the Score Breakdown by category (ScoreBreakdownCard)
**And** I see the Keyword Analysis (KeywordAnalysisDisplay)
**And** I see Gap Summary cards (GapSummaryCard)
**And** I see a prominent "View Suggestions" CTA button
**And** clicking "View Suggestions" navigates to `/app/scan/[sessionId]/suggestions`
**And** I see secondary actions: "New Scan", "Download Report" (placeholder)
**And** if session not found, I see an error and link to start new scan
**And** the session is loaded from database if not in store

---

### Story 16.5: Implement Suggestions Page

As a user,
I want to view and interact with optimization suggestions on a dedicated page,
So that I can focus on improving my resume section by section.

**Acceptance Criteria:**

**Given** I am on `/app/scan/[sessionId]/suggestions` with generated suggestions
**When** the page loads
**Then** I see section tabs or accordion: Summary, Skills, Experience
**And** for each section, I see the SuggestionDisplay component
**And** I see "Why this works" explanations (from Epic 14)
**And** I can copy suggestions to clipboard
**And** I can provide thumbs up/down feedback
**And** I see Score Comparison (original vs projected) from Story 11.3
**And** I can regenerate suggestions for a specific section
**And** I see a "Back to Results" link
**And** I see a "New Scan" action

---

### Story 16.6: Migrate History and Settings

As a user,
I want history and settings pages integrated into the dashboard layout,
So that I have a consistent navigation experience.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to `/app/history`
**Then** I see my optimization history (HistoryListView component)
**And** the page uses the dashboard layout
**And** clicking a session navigates to `/app/scan/[sessionId]`
**And** I can delete sessions from history

**Given** I am authenticated
**When** I navigate to `/app/settings`
**Then** I see my profile information (email)
**And** I see optimization preferences (from PreferencesDialog)
**And** I see V0.5 preferences (Job Type, Modification Level)
**And** I can update and save preferences
**And** I see privacy settings section
**And** I see account actions (Sign Out, Delete Account placeholder)

**Technical Notes:**
- Move existing `/history` content to `/app/history`
- Extract PreferencesDialog content into Settings page
- Add redirects from old `/history` routes to new routes

---

### Story 16.7: Create Full Marketing Landing Page

As a visitor,
I want to see a marketing landing page that explains the product,
So that I can understand the value and sign up.

**Acceptance Criteria:**

**Given** I am a visitor (not authenticated)
**When** I visit `/`
**Then** I see a Hero section with:
  - Clear value proposition headline
  - Subheadline explaining the benefit
  - Primary CTA: "Get Started Free" → `/auth/signup`
  - Secondary CTA: "Sign In" → `/auth/login`
**And** I see a Features section highlighting 3-4 key benefits:
  - ATS Score Analysis
  - AI-Powered Suggestions
  - Section-by-Section Optimization
  - Privacy-First Approach
**And** I see a "How It Works" section with 3 steps:
  1. Upload your resume
  2. Paste the job description
  3. Get optimized suggestions
**And** I see a Testimonials placeholder section
**And** I see a Pricing placeholder section
**And** I see a Footer with links to Privacy Policy, Terms, etc.

**Given** I am authenticated
**When** I visit `/`
**Then** I am redirected to `/app/dashboard`

---

### Story 16.8: Epic 16 Integration and Verification Testing

As a QA engineer,
I want to verify the complete dashboard navigation and user flows,
So that we can confidently release the multi-route architecture.

**Acceptance Criteria:**

**Given** all Epic 16 stories are implemented
**When** I test the complete flows
**Then** Landing page displays correctly for unauthenticated users
**And** authenticated users are redirected from `/` to `/app/dashboard`
**And** dashboard shows welcome message and quick actions
**And** new scan flow: `/app/scan/new` → analysis → `/app/scan/[sessionId]`
**And** suggestions flow: results page → `/app/scan/[sessionId]/suggestions`
**And** history flow: `/app/history` → click session → `/app/scan/[sessionId]`
**And** settings flow: preferences save and persist
**And** mobile navigation works (hamburger menu, drawer)
**And** browser back/forward navigation works correctly
**And** deep linking to `/app/scan/[sessionId]` loads session from DB
**And** page refresh maintains state at each step
**And** old `/history` routes redirect to new routes
**And** no regression in existing functionality

---

## V0.5 Story Summary

| Epic | Title | Stories |
|------|-------|---------|
| 13 | Hybrid Preferences | 5 |
| 14 | Explanation Output | 4 |
| 15 | Privacy Consent | 4 |
| 16 | Dashboard UI Architecture | 8 |
| **V0.5 Total** | | **21 stories** |
