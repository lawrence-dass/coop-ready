# CLAUDE.md - SubmitSmart Development Guide

## Current Status

**Phase:** Implementation → Epic 1 (Project Foundation)
**Story:** 1.2 - Configure Supabase Database Schema (in-progress)
**Branch:** `feature/1-2-config-supabase-db`
**Sprint:** 1 done, 41 backlog, 1 in-progress

## Quick Start

See `_bmad-output/DEVELOPMENT_WORKFLOW.md` for full workflows. Key commands:

```bash
npm run dev                          # Start dev server
/bmad:bmm:workflows:sprint-status    # Check what's next
/bmad:bmm:workflows:dev-story        # Implement current story
/bmad:bmm:workflows:code-review      # Review implementation
```

## Tech Stack

**Next.js 15** (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + LangChain.js

Key dirs: `/lib/ai/` (LLM), `/lib/supabase/` (DB), `/actions/` (server), `/store/` (state)

## Critical Rules

1. **ActionResponse Pattern (MANDATORY)** - Never throw from server actions
2. **Error Codes** - Use: INVALID_FILE_TYPE, FILE_TOO_LARGE, PARSE_ERROR, LLM_TIMEOUT, LLM_ERROR, RATE_LIMITED, VALIDATION_ERROR
3. **Naming** - DB: snake_case, TS: camelCase, Components: PascalCase, Routes: kebab-case
4. **LLM Security** - Server-side only, wrap user content in XML tags
5. **Constraints** - 60s timeout, 5MB files, $0.10/optimization
6. **Epic Final Story** - Integration-and-verification-testing stories use `/bmad:bmm:workflows:epic-integration` (includes TEA + TR + TA)

## Next Action

**Current:** Story 1.2 in-progress → Implement Supabase migrations
**When done:** Run code review → If passed, next story auto-created via post-merge workflow
**Reference:** `.claude/post-merge-workflow.md`

## Reference Docs

- Planning: `_bmad-output/planning-artifacts/`
- Patterns: `project-context.md`
- Workflows: `_bmad-output/DEVELOPMENT_WORKFLOW.md`
