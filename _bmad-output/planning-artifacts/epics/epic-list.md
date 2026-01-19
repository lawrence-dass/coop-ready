# Epic List

## Epic 1: Project Foundation & User Authentication
Users can create accounts, sign in, and access the protected dashboard with a complete authentication system.

**FRs covered:** FR1, FR2, FR3, FR4
**Additional Reqs:** AR1-AR5 (project setup), AR6-AR10 (code patterns), AR11-AR14 (infrastructure), UX1-UX5 (design system, sidebar), UX7 (login form)
**NFRs:** NFR6-NFR11 (security), NFR12-NFR16 (accessibility), NFR1, NFR4, NFR5 (performance)

---

## Epic 2: User Onboarding & Profile Management
Users can personalize their experience by selecting their experience level (Student/Career Changer) and target role, enabling context-aware analysis.

**FRs covered:** FR5, FR6, FR7

---

## Epic 3: Resume & Job Description Input
Users can upload their resume, input a job description, and view extracted content ready for AI analysis.

**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR45
**NFRs:** NFR3 (upload < 5s), NFR9 (file validation), NFR19 (storage reliability)

---

## Epic 4: ATS Analysis Engine
Users receive an ATS compatibility score (0-100) with detailed analysis of their resume against the job description.

**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR46
**NFRs:** NFR2 (AI analysis < 20s), NFR17 (OpenAI graceful handling)
**UX:** UX6 (stat cards), UX9 (donut charts for scores)

---

## Epic 5: Suggestions & Optimization Workflow
Users can view AI-generated improvement suggestions (before/after bullet rewrites, transferable skills mapping), accept/reject them individually, and preview their optimized resume.

**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34
**UX:** UX8 (data tables), card-based suggestion display

---

## Epic 6: Resume Export & Download
Users can download their optimized resume with all accepted suggestions applied in their preferred format (PDF or DOCX).

**FRs covered:** FR35, FR36, FR37, FR47

---

## Epic 7: Subscription & Billing
Free users are limited to 3 scans/month; paid users ($5/mo) get unlimited scans with secure Stripe payment processing.

**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44
**NFRs:** NFR10 (PCI via Stripe), NFR18 (Stripe webhook handling)

---
