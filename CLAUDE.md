# CLAUDE.md - SubmitSmart Development Guide

## Current Status

**Check what's next:**
```bash
/bmad:bmm:workflows:sprint-status    # Interactive sprint status
git branch --show-current            # Current branch
```

**Source of truth:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Progress:** 3 epics done (Epic 1-3), Epic 4 next in backlog

---

## Quick Start

```bash
# Development
npm run dev                          # Start dev server (localhost:3000)
npm run build                        # Production build
npm run lint                         # Run ESLint
npm run check-env                    # Validate environment variables

# Testing
npm run test:unit                    # Run Vitest unit tests (watch mode)
npm run test:unit:run                # Run Vitest once (CI mode)
npm run test:e2e                     # Run Playwright e2e tests
npm run test:e2e:p0                  # Run only @P0 critical tests
npm run test:all                     # Run all tests (unit + e2e)
npm run test:report                  # View Playwright HTML report

# BMAD Workflows
/bmad:bmm:workflows:sprint-status    # Check current sprint status
/bmad:bmm:workflows:dev-story        # Implement current story
/bmad:bmm:workflows:code-review      # Review implementation (adversarial)
/bmad:bmm:workflows:epic-integration # Final epic integration testing
```

---

## Tech Stack

**Framework:** Next.js 15 (App Router) + TypeScript + React 19
**Styling:** Tailwind CSS 4 + shadcn/ui components
**Database:** Supabase (PostgreSQL) with Row-Level Security
**AI/LLM:** LangChain.js + Anthropic Claude (Sonnet 4)
**State:** Zustand (client-side store)
**Testing:** Vitest (unit/integration) + Playwright (e2e)

### Key Directories

```
/app/                    # Next.js App Router pages & layouts
/components/             # React components (shared, features)
  └── shared/            # Reusable UI components
/actions/                # Server actions (server-side only)
/lib/
  ├── ai/                # LLM pipeline & prompts
  └── supabase/          # Database client & utilities
/store/                  # Zustand state management
/types/                  # TypeScript type definitions
/tests/                  # Test files (see Testing section)
/supabase/migrations/    # Database schema migrations
/_bmad-output/           # BMAD planning & implementation artifacts
```

---

## Critical Rules

### 1. ActionResponse Pattern (MANDATORY)
**Never throw from server actions.** Always return `ActionResponse<T>`:

```typescript
// ✅ CORRECT
export async function myAction(): Promise<ActionResponse<Data>> {
  try {
    const result = await doSomething();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: { code: 'ERROR_CODE', message: 'User-friendly message' }
    };
  }
}

// ❌ WRONG - Don't throw
export async function myAction() {
  throw new Error('This breaks the client');
}
```

### 2. Error Codes (Standardized)
Use these error codes consistently:
- `INVALID_FILE_TYPE` - Unsupported file format
- `FILE_TOO_LARGE` - Exceeds 5MB limit
- `PARSE_ERROR` - Failed to parse file content
- `LLM_TIMEOUT` - LLM request exceeded 60s timeout
- `LLM_ERROR` - LLM processing failed
- `RATE_LIMITED` - API rate limit exceeded
- `VALIDATION_ERROR` - Input validation failed

### 3. Naming Conventions
- **Database:** `snake_case` (tables: `sessions`, columns: `user_id`)
- **TypeScript:** `camelCase` (variables, functions)
- **Components:** `PascalCase` (`ResumeUploader.tsx`)
- **Routes:** `kebab-case` (`/job-description`)
- **Files:** Match their export (`useResumeParser.ts`, `ActionResponse.ts`)

### 4. LLM Security (Prompt Injection Defense)
- **Server-side only** - Never expose API keys to client
- **Treat user content as data** - Wrap in XML tags to prevent prompt injection:
  ```typescript
  const prompt = `Analyze this resume:
  <resume>${userResume}</resume>
  <job_description>${userJD}</job_description>`;
  ```

### 5. Constraints
- **LLM timeout:** 60 seconds max
- **File size:** 5MB max
- **Cost limit:** $0.10 per optimization
- **Anonymous sessions:** Persist across browser refresh

### 6. Epic Final Story
Integration-and-verification-testing stories use:
```bash
/bmad:bmm:workflows:epic-integration
```
This includes TEA (Test Execution Agent) + TR (Traceability) + TA (Test Automation).

---

## Testing

### Test Structure

```
tests/
├── unit/              # Vitest unit tests (*.test.ts)
│   ├── actions/       # Server action tests
│   └── hooks/         # React hook tests
├── integration/       # Mixed integration tests
│   ├── *.test.tsx     # Vitest integration tests
│   └── *.spec.ts      # Playwright integration tests
├── api/               # Playwright API tests (*.spec.ts)
├── e2e/               # Playwright e2e tests (*.spec.ts)
└── support/           # Test helpers & fixtures
```

### Test Runner Separation

**Vitest:** `*.test.ts` / `*.test.tsx` (unit + integration)
**Playwright:** `*.spec.ts` (e2e + api + integration)

**Why separate?** Prevents ESM/CJS conflicts (Vitest requires ES modules, Playwright is flexible)

### Test Priority Tags

Use tags in test names for CI optimization:
- `@P0` - Critical path (must pass for merge)
- `@P1` - Important features (run on main)
- `@P2` - Nice-to-have (run nightly)

Example:
```typescript
test('[P0] should upload PDF successfully', async () => {
  // Critical test
});
```

### Test Commands

```bash
# Unit Tests (Vitest)
npm run test:unit         # Watch mode
npm run test:unit:run     # CI mode (run once)

# E2E Tests (Playwright)
npm run test:e2e          # All e2e tests
npm run test:e2e:p0       # Only @P0 tests
npm run test:e2e:headed   # Show browser
npm run test:e2e:ui       # Interactive UI mode

# All Tests
npm run test:all          # Unit + E2E (CI workflow)
```

---

## Database Migrations

**Location:** `supabase/migrations/`

**Naming:** `YYYYMMDDHHMMSS_description.sql`

**Apply locally:**
```bash
npx supabase migration up
```

**Create new migration:**
```bash
npx supabase migration new migration_name
```

**Important:** Always include RLS policies with new tables.

---

## CI/CD

### GitHub Actions Workflows

**`.github/workflows/test-suite.yml`** - Full test suite (unit + e2e)
**`.github/workflows/e2e-tests.yml`** - E2E tests only

**Triggers:** Push to main, PRs
**Artifacts:** Playwright reports, test artifacts

### Test Artifacts

- **Playwright reports:** `playwright-report/`
- **Test artifacts:** `playwright-artifacts/` (screenshots, videos, traces)
- **Coverage:** Generated by Vitest

---

## Development Workflow

### Story Implementation

1. **Check status:** `/bmad:bmm:workflows:sprint-status`
2. **Implement story:** `/bmad:bmm:workflows:dev-story`
3. **Run tests:** `npm run test:all`
4. **Code review:** `/bmad:bmm:workflows:code-review` (adversarial review)
5. **Create PR:** Push to feature branch
6. **Merge:** After PR approval and CI passes

### Epic Integration (Final Story)

Epic final stories (e.g., `3-6-epic-3-integration-and-verification-testing`):
```bash
/bmad:bmm:workflows:epic-integration
```

This workflow:
- Sets up git branch
- Runs TEA (Test Execution Agent)
- Generates traceability matrix
- Executes test automation
- Commits and pushes results

---

## Reference Documentation

### Planning Artifacts
- **PRD:** `_bmad-output/planning-artifacts/prd.md`
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **UX Design:** `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Epics:** `_bmad-output/planning-artifacts/epics.md`

### Implementation Artifacts
- **Sprint Status:** `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **Story Files:** `_bmad-output/implementation-artifacts/stories/`

### Workflows
- **Development Workflow:** `_bmad-output/DEVELOPMENT_WORKFLOW.md`
- **Post-Merge Workflow:** `.claude/post-merge-workflow.md`

---

## Environment Variables

**Required:** See `.env.example`

**Validate configuration:**
```bash
npm run check-env
```

**Key variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (server-only)
- `ANTHROPIC_API_KEY` - Claude API key (server-only)

---

## Troubleshooting

### Common Issues

**Tests failing with "Vitest cannot be imported":**
- Ensure `"type": "module"` in `package.json`
- Check `playwright.config.ts` has `testMatch: /.*\.spec\.ts$/`

**Supabase connection issues:**
- Run `npm run check-env` to validate credentials
- Check `.env.local` exists with correct values

**LLM timeouts:**
- Check API key is valid
- Verify network connectivity
- Review prompt complexity (may need optimization)

---

## Maintenance Notes

**⚠️ Keep this file static!**

This file contains:
- ✅ Patterns and rules (rarely change)
- ✅ Commands and workflows (stable)
- ✅ Pointers to dynamic data (always current)

This file should NOT contain:
- ❌ Current epic/story (check `sprint-status.yaml`)
- ❌ Current branch (run `git branch --show-current`)
- ❌ Story counts (check `/bmad:bmm:workflows:sprint-status`)

**When to update:**
- Adding/removing technologies
- Changing naming conventions
- Adding new critical patterns
- Major workflow changes
