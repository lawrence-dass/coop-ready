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

> Principle: Unit test the math, E2E test the flows, contract test the AI, skip everything else.

### Priority Definitions
- **`[P0]`** — If this fails, users cannot use the app (auth, upload, scoring, suggestions)
- **`[P1]`** — If this fails, a feature is degraded but app works (preferences, history, settings)
- Every test MUST have a `[P0]` or `[P1]` tag. No untagged tests.

### What to Test (Decision Table)

| What Changed | Test With | Skip |
|-------------|-----------|------|
| Pure logic (scoring, parsing, validation) | Unit (Vitest) | E2E |
| Server action | Unit — contract shape only | Integration |
| AI pipeline | Contract — assert shape, length bounds, error codes | Content/quality assertions |
| UI with business logic (forms, conditional state) | Integration (RTL + Vitest) | E2E |
| UI layout/styling only | Nothing — visual review | All automated tests |
| Auth flow | E2E (Playwright) | Unit |
| Complete user journey | E2E (Playwright) | Unit, Integration |

### What NOT to Test
- shadcn components directly (pre-tested library code)
- Component rendering/prop passing without business logic
- AI-generated content (non-deterministic — assert shape, not words)
- Metrics, observability, migration scripts
- Zustand store internals (test through components that use them)

### Test Budget
- **Simple story** (UI tweak, config change): 0-2 tests
- **Medium story** (new component with logic, new action): 3-6 tests
- **Complex story** (scoring algorithm, AI pipeline): 8-15 tests
- **E2E tests**: 1 per user journey, created only during epic-integration
- If a test breaks during refactor (not a bug), evaluate if it's worth keeping — delete if redundant

### BMAD Workflow Instructions

| Workflow | Test Responsibility | Do NOT |
|----------|-------------------|--------|
| `dev-story` | Unit tests for deterministic logic only | Create component rendering tests, E2E tests, or integration tests |
| `code-review` | Review test quality and relevance | Suggest adding more tests — only flag missing critical paths |
| `epic-integration` | E2E tests (1 per user journey) | Create unit tests or duplicate existing coverage |

## Documentation Index

| What | Where |
|------|-------|
| Full context | `_bmad-output/project-context.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Testing | `docs/TESTING.md` |
| ATS Scoring | `docs/reference/ats-scoring-system-specification-v2.1.md` |
| Database | `docs/DATABASE.md` |
| Environment | `docs/ENVIRONMENT.md` |