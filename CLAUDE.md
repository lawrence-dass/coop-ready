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

## Test Strategy

### Budget
- Max 5 unit tests per story
- E2E tests only in epic-integration (1 test per user journey)
- Total target: ~100-120 tests across entire project

### Decision Table

| What Changed | Test With | Don't Test With |
|-------------|-----------|-----------------|
| UI component | E2E only | Unit |
| Server action | Unit (contract only) | Integration |
| Scoring/calculation | Unit | E2E |
| AI pipeline | Contract (shape only) | Content assertions |
| Auth flow | E2E only | Unit |
| Store logic | Through component E2E | Isolated unit |

### Rules
- Never test shadcn components directly
- Never assert on AI-generated content
- Never test rendering — test behavior
- If it needs 3+ mocks, test at a higher level instead
- Every test must have a `[P0]` or `[P1]` tag
- Unit test the math, E2E test the flows, contract test the AI, skip everything else

## Documentation Index

| What | Where |
|------|-------|
| Full context | `_bmad-output/project-context.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Testing | `docs/TESTING.md` |
| ATS Scoring | `docs/reference/ats-scoring-system-specification-v2.1.md` |
| Database | `docs/DATABASE.md` |
| Environment | `docs/ENVIRONMENT.md` |