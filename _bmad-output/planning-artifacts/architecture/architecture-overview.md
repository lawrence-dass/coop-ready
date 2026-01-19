# Architecture Overview

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
47 FRs across 9 capability areas:
- User Account Management (7 FRs) — Auth, onboarding, profile settings
- Resume Management (5 FRs) — Upload, extraction, parsing, validation
- Job Description Management (3 FRs) — Input, keyword extraction, validation
- Analysis Engine (5 FRs) — ATS scoring, keyword matching, format analysis
- Suggestion Generation (8 FRs) — Bullet rewrites, skills mapping, formatting guidance
- Results & Feedback (6 FRs) — Score display, suggestion review, accept/reject workflow
- Resume Export (3 FRs) — Document generation, format selection, download
- Subscription & Billing (7 FRs) — Rate limiting, Stripe integration, plan management
- Error Handling (3 FRs) — User-friendly errors, retry capability

**Non-Functional Requirements:**
23 NFRs defining quality attributes:
- Performance: TTI <3s, AI analysis <20s (p95), LCP <2.5s
- Security: TLS 1.2+, AES-256 at rest, bcrypt hashing, PCI via Stripe
- Accessibility: WCAG 2.1 AA, keyboard navigation, screen reader support
- Integration: Graceful degradation for OpenAI/Stripe/S3/Supabase failures
- Reliability: 99.5% uptime, <5% error rate, daily backups

**Scale & Complexity:**
- Primary domain: Full-stack web SaaS
- Complexity level: Medium
- Estimated architectural components: 8-10 major modules

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|------------|--------|--------|
| $50/month budget | Business requirement | Limits infrastructure choices |
| Solo founder | Resource constraint | Prioritize managed services, minimize ops |
| OpenAI API dependency | Core feature | Must handle rate limits, failures, costs |
| <20s AI response | NFR2 | Affects UX patterns, may need streaming |
| WCAG AA compliance | NFR12 | Affects component choices, testing |

### Cross-Cutting Concerns

| Concern | Affected Areas | Architectural Implication |
|---------|----------------|---------------------------|
| **Authentication** | All protected routes | Middleware, session management |
| **Rate Limiting** | Scan endpoint | Tier-aware middleware, usage tracking |
| **Error Handling** | External services | Retry logic, graceful degradation, user feedback |
| **Loading States** | AI processing | Progress indicators, timeout handling |
| **File Security** | Upload/download | Validation, signed URLs, malware consideration |

## Starter Template

### Selected: Official Supabase Starter

**Initialization:**
```bash
npx create-next-app -e with-supabase coopready
cd coopready
```

**Decisions Provided by Starter:**

| Decision | Value |
|----------|-------|
| **Language** | TypeScript (strict mode) |
| **Framework** | Next.js 14+ App Router |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Auth** | Supabase Auth with middleware |
| **Database Client** | @supabase/ssr for server components |
| **Project Structure** | `app/` directory, `components/ui/` for shadcn |

**Additional Packages Required:**

| Integration | Package | Purpose |
|-------------|---------|---------|
| Stripe | `stripe`, `@stripe/stripe-js` | Payments |
| OpenAI | `openai` | AI analysis |
| File Storage | Supabase Storage | Resume uploads |
| PDF parsing | `pdf-parse` | Extract text from PDF |
| DOCX parsing | `mammoth` | Extract text from DOCX |
| PDF generation | `@react-pdf/renderer` | Generate optimized resume PDF |
| DOCX generation | `docx` | Generate optimized resume DOCX |

## Architecture Status

**Status:** READY FOR IMPLEMENTATION
**Completed:** 2026-01-18
**Confidence:** HIGH

**Key Strengths:**
- Clean separation of concerns
- Proven technology combinations
- Comprehensive patterns for AI agent consistency
- All FRs/NFRs architecturally supported
- Budget-conscious choices ($50/mo achievable)

---

**Related Documents:**
- [Architecture Decisions](./architecture-decisions.md)
- [Architecture Patterns](./architecture-patterns.md)
- [Architecture Structure](./architecture-structure.md)
- [Architecture Validation](./architecture-validation.md)
