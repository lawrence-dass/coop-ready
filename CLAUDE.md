# CLAUDE.md - SubmitSmart Quick Reference

> **Full details:** `_bmad-output/project-context.md`

---

## Quick Start

```bash
npm run dev                          # Start dev server
npm run build && npm run test:all    # Build + full test suite
```

---

## Tech Stack

Next.js 16 + TypeScript + React 19 | Tailwind 4 + shadcn/ui | Supabase + LangChain | Zustand | Vitest + Playwright

**Full stack details:** `_bmad-output/project-context.md`

---

## Critical Rules (Must Follow)

**1. ActionResponse Pattern (MANDATORY)**
```typescript
{ data: T, error: null } | { data: null, error: ErrorObject }
```
Never throw from server actions. Details: `project-context.md`

**2. Error Codes**
`INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `PARSE_ERROR`, `LLM_TIMEOUT`, `LLM_ERROR`, `RATE_LIMITED`, `VALIDATION_ERROR`

**3. Directory Structure**
```
/app/api/           → API routes (60s timeout for LLM)
/lib/ai/            → ALL LLM operations (server-side only)
/lib/scoring/       → Deterministic ATS scoring engine
/lib/supabase/      → Database access
/components/shared/ → Reusable UI
/store/             → Zustand stores
```

**4. LLM Security**
- Wrap user content: `<user_content>${text}</user_content>`
- Server-side only, never expose API keys

**5. ATS Scoring**
- Use deterministic V2.1 algorithm (no LLM for scoring)
- LLM only for extraction (keywords, qualifications)
- See: `lib/scoring/` module

---

## Documentation Index

| What | Where |
|------|-------|
| **All rules & patterns** | `_bmad-output/project-context.md` |
| **Architecture** | `_bmad-output/planning-artifacts/architecture.md` |
| **Testing** | `docs/TESTING.md` |
| **Environment** | `docs/ENVIRONMENT.md` |
| **Database** | `docs/DATABASE.md` |
| **ATS Scoring Spec** | `docs/reference/ats-scoring-system-specification-v2.1.md` |
| **LLM Prompts** | `docs/reference/LLM_PROMPTS.md` |

---

## Key Constraints

- LLM timeout: 60s max
- File size: 5MB max
- Cost: $0.10 per optimization
- Sessions: Persist across refresh (Zustand + Supabase)

---

## Recent Major Changes

**Deterministic ATS Scoring (Jan 2026)**
- Replaced LLM scoring with algorithmic V2/V2.1
- Eliminates 15-20 point score inflation
- Module: `/lib/scoring/` (12 files, 2,500 lines)
- Details: `docs/reference/ats-scoring-system-specification-v2.1.md`

**Education Suggestions Fix (Jan 2026)**
- Eliminated resume fraud (fake coursework/projects)
- Honest formatting improvements only
- Details: `docs/EDUCATION-FABRICATION-FIX.md`

---
