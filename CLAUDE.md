# CLAUDE.md - SubmitSmart

## Quick Start

```bash
npm run dev                          # Start dev server
npm run build && npm run test:all    # Build + full test suite
```

**Stack:** Next.js 16 + TypeScript + React 19 | Tailwind 4 + shadcn/ui | Supabase + LangChain | Zustand | Vitest + Playwright

## Critical Rules

> Detailed rules auto-loaded from `.claude/rules/`

1. **ActionResponse Pattern** - Never throw from server actions (see `.claude/rules/action-response.md`)
2. **Naming** - snake_case DB, camelCase TS (see `.claude/rules/naming-conventions.md`)
3. **Anti-patterns** - Common mistakes to avoid (see `.claude/rules/anti-patterns.md`)

## Directory Map

| Directory | Purpose | Create New Files Here When... |
|-----------|---------|-------------------------------|
| `/app/api/` | API routes | Need 60s timeout or streaming |
| `/actions/` | Server Actions | Quick operations (< 10s) |
| `/lib/ai/` | LLM operations | ANY Claude/LangChain code |
| `/lib/scoring/` | ATS scoring | Deterministic score logic |
| `/lib/supabase/` | Database access | New queries/mutations |
| `/lib/parsers/` | File parsing | PDF/DOCX extraction |
| `/components/shared/` | Reusable UI | Business components |
| `/components/ui/` | shadcn (READ-ONLY) | **NEVER** - extend via wrappers |
| `/store/` | Zustand stores | New global state |

## Key Constraints

| Constraint | Value |
|------------|-------|
| LLM timeout | 60 seconds |
| File size | 5MB max |
| Cost ceiling | $0.10/optimization |

## Decision Guide

| If you need to... | Do this |
|-------------------|---------|
| Add LLM logic | Create in `/lib/ai/`, call from API route |
| Add database query | Create in `/lib/supabase/`, call from action |
| Add UI component | Create in `/components/shared/` |
| Modify shadcn component | Create wrapper, don't edit `/components/ui/` |
| Add global state | Create store in `/store/` |

## Documentation Index

| What | Where |
|------|-------|
| Full context | `_bmad-output/project-context.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Testing | `docs/TESTING.md` |
| ATS Scoring | `docs/reference/ats-scoring-system-specification-v2.1.md` |
| Database | `docs/DATABASE.md` |
| Environment | `docs/ENVIRONMENT.md` |