# CLAUDE.md - SubmitSmart Development Guide

## Current Status

**Check what's next:**
```bash
/bmad:bmm:workflows:sprint-status    # Interactive sprint status
git branch --show-current            # Current branch
```

**Source of truth:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Quick Start

```bash
# Development & Testing
npm run dev                          # Start dev server
npm run build && npm run test:all    # Build + test

# BMAD Workflows
/bmad:bmm:workflows:sprint-status    # Check current sprint status
/bmad:bmm:workflows:dev-story        # Implement current story
/bmad:bmm:workflows:code-review      # Code review (adversarial)
/bmad:bmm:workflows:epic-integration # Epic integration testing
```

---

## Tech Stack

Next.js 16 + TypeScript + React 19 | Tailwind 4 + shadcn/ui | Supabase + LangChain | Zustand | Vitest + Playwright

---

## Critical Rules (Read These!)

**1. ActionResponse Pattern (MANDATORY)**
- Never throw from server actions
- Always return `{ data: T, error: null }` or `{ data: null, error: ErrorObject }`
- Full details: [See project-context.md](project-context.md)

**2. Error Codes (Standardized)**
Use: `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `PARSE_ERROR`, `LLM_TIMEOUT`, `LLM_ERROR`, `RATE_LIMITED`, `VALIDATION_ERROR`

**3. Directory Structure**
```
/app/api/           → API routes (60s timeout for LLM)
/lib/ai/            → ALL LLM operations (server-side only)
/lib/supabase/      → Database access
/components/shared/ → Reusable UI components
/store/             → Zustand stores
```

**4. LLM Security**
- Wrap user content in XML tags: `<user_content>${resume}</user_content>`
- Never expose API keys to client

---

## Documentation

| What | Where |
|------|-------|
| All critical rules & patterns | [project-context.md](project-context.md) |
| Architecture decisions | [architecture.md](planning-artifacts/architecture.md) |
| Testing framework & commands | [docs/TESTING.md](docs/TESTING.md) |
| MCP server setup | [docs/MCP-SETUP.md](docs/MCP-SETUP.md) |
| Database migrations | [docs/DATABASE.md](docs/DATABASE.md) |
| Environment variables | [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) |
| CI/CD workflows | [docs/CI-CD.md](docs/CI-CD.md) |

---

## Key Constraints

- LLM timeout: 60s max
- File size: 5MB max
- Cost: $0.10 per optimization
- Sessions persist across refresh (Zustand + Supabase)

---
