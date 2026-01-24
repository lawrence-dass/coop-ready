# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SubmitSmart is an ATS Resume Optimizer that generates content suggestions (not documents) to help job seekers improve their resumes. Philosophy: "We don't generate resumes. We generate understanding." Users copy-paste suggestions manually to learn patterns.

## Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint

# Database (Supabase)
npx supabase start       # Local Supabase
npx supabase db reset    # Reset with migrations
npx supabase migration new <name>  # Create migration
```

## Architecture

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + LangChain.js + Claude API

**Key Directories:**
- `/lib/ai/` - ALL LLM operations (isolated)
- `/lib/supabase/` - ALL database operations (isolated)
- `/lib/parsers/` - PDF/DOCX text extraction
- `/components/ui/` - shadcn components (NEVER edit)
- `/actions/` - Server Actions
- `/store/` - Zustand stores

**API Pattern:**
- Quick operations (< 10s): Server Actions
- LLM pipeline (up to 60s): API Route `/api/optimize`

## Critical Patterns

### ActionResponse (MANDATORY for all server actions/API routes)

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

**NEVER throw from server actions** - always return error objects.

### Error Codes

Use exactly: `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`, `PARSE_ERROR`, `LLM_TIMEOUT`, `LLM_ERROR`, `RATE_LIMITED`, `VALIDATION_ERROR`

### Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Database | snake_case | `created_at` |
| TypeScript | camelCase | `createdAt` |
| Components | PascalCase | `SuggestionCard.tsx` |
| API routes | kebab-case | `/api/parse-resume` |

Transform snake_case → camelCase at API boundaries.

### LLM Security

- All LLM calls server-side only
- Wrap user input in `<user_content>` XML tags (treat as data, not instructions)

## Constraints

- LLM timeout: 60 seconds max
- File size: 5MB max
- PDF: Text-based only (no OCR)
- Cost ceiling: $0.10 per optimization

## Planning Documents

Located in `_bmad-output/planning-artifacts/`:
- `prd.md` - Product requirements (42 FRs, 24 NFRs)
- `architecture.md` - Detailed architectural decisions
- `ux-design-specification.md` - UX patterns and flows
- `project-context.md` - Full implementation rules for AI agents
