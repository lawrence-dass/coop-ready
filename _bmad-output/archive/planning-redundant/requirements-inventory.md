# Requirements Inventory

## Functional Requirements

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

## Non-Functional Requirements

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

## Additional Requirements

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

## FR Coverage Map

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
