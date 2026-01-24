---
parent: architecture.md
section: overview
last_updated: 2026-01-24
---

# Architecture Overview

_Project context analysis and requirements overview._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

| Category | V0.1 | V1.0 | Total | Architectural Impact |
|----------|------|------|-------|---------------------|
| User Identity & Access | 1 | 4 | 5 | Auth flows, session management |
| Resume Management | 4 | 3 | 7 | File storage, parsing layer |
| Job Description Input | 3 | 0 | 3 | Text validation, state |
| ATS Analysis & Scoring | 5 | 0 | 5 | LLM pipeline, scoring algorithm |
| Content Optimization | 5 | 3 | 8 | LLM pipeline, prompt engineering |
| Quality Assurance | 3 | 1 | 4 | LLM-as-judge, validation |
| Comparison & Validation | 1 | 2 | 3 | State diffing, UI components |
| Session & History | 1 | 3 | 4 | Database schema, queries |
| Error Handling | 3 | 0 | 3 | Error classification, retry logic |

**Non-Functional Requirements:**

| Category | Count | Key Constraint |
|----------|-------|----------------|
| Performance | 6 | < 60s optimization, < 100ms UI |
| Security | 6 | Prompt injection defense, RLS |
| Reliability | 5 | 95%+ success rate, graceful errors |
| Accessibility | 4 | WCAG 2.1 AA compliance |
| Integration | 3 | LLM timeout handling |

### Scale & Complexity

- **Primary domain:** AI-Native Full-Stack Web App
- **Complexity level:** Medium
- **Estimated architectural components:** 12-15

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| 60-second LLM timeout | Pipeline must be optimized, progress UI critical |
| $0.10 cost ceiling | Token budgeting, prompt optimization |
| 5MB file limit | Client-side validation, serverless limits |
| No OCR support | PDF must be text-based |

| Dependency | Risk | Mitigation |
|------------|------|------------|
| Anthropic Claude API | High | Future: OpenAI fallback |
| Supabase | Medium | Standard Postgres, portable |
| Vercel | Low | Standard Next.js, portable |

### Cross-Cutting Concerns Identified

1. **Error Handling Pattern** - ActionResponse<T> throughout all server actions
2. **LLM Cost Observability** - Token tracking on every API call
3. **Security Boundary** - User content treated as data, not instructions
4. **State Synchronization** - Zustand (client) ↔ Supabase (server)
5. **Progress Communication** - Loading states for long-running LLM operations
