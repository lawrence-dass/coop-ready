# Implementation Plan: Modular CLAUDE.md Structure

## Summary

Restructure CLAUDE.md into a modular, import-based architecture using Claude Code's advanced features (`.claude/rules/`, path-scoped rules, `@` imports).

---

## Current State

- **CLAUDE.md**: 100 lines, monolithic quick reference
- **project-context.md**: 228 lines, detailed rules and patterns
- No `.claude/rules/` directory exists

---

## Files to Create/Modify

### 1. Create Directory Structure

```
.claude/rules/
.claude/rules/frontend/
.claude/rules/backend/
```

### 2. New Files to Create (7 total)

| File | Purpose | Est. Lines |
|------|---------|------------|
| `.claude/rules/action-response.md` | ActionResponse pattern details | ~40 |
| `.claude/rules/naming-conventions.md` | All naming rules table | ~15 |
| `.claude/rules/anti-patterns.md` | Things to avoid | ~30 |
| `.claude/rules/testing.md` | Test commands & patterns | ~35 |
| `.claude/rules/frontend/components.md` | Path-scoped component rules | ~40 |
| `.claude/rules/backend/server-actions.md` | Path-scoped backend rules | ~45 |
| `CLAUDE.local.md` | Template for personal preferences | ~10 |

### 3. Modify Existing File

| File | Change |
|------|--------|
| `CLAUDE.md` | Replace with lean core (~70 lines) |

---

## Implementation Order

1. Create `.claude/rules/` directories
2. Create all 6 rule files in parallel (no dependencies)
3. Create `CLAUDE.local.md` template
4. Update main `CLAUDE.md`

---

## Detailed File Contents

### `.claude/rules/action-response.md`

```markdown
# ActionResponse Pattern (MANDATORY)

## Type Definition

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

## Rules

1. **NEVER throw from server actions** - always return error objects
2. Every server action and API route MUST return this type
3. Use standard error codes (see below)

## Error Codes

| Code | When to Use |
|------|-------------|
| `INVALID_FILE_TYPE` | Wrong file format |
| `FILE_TOO_LARGE` | Exceeds 5MB |
| `PARSE_ERROR` | Can't extract text |
| `LLM_TIMEOUT` | 60s exceeded |
| `LLM_ERROR` | API failure |
| `RATE_LIMITED` | Too many requests |
| `VALIDATION_ERROR` | Bad input |

## Example

```typescript
export async function parseResume(file: File): Promise<ActionResponse<ResumeData>> {
  try {
    const data = await extractText(file);
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: 'Failed to parse resume', code: 'PARSE_ERROR' }
    };
  }
}
```
```

---

### `.claude/rules/naming-conventions.md`

```markdown
# Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case, plural | `sessions`, `user_resumes` |
| Database columns | snake_case | `created_at`, `resume_content` |
| API routes | kebab-case | `/api/parse-resume` |
| Components | PascalCase | `SuggestionCard.tsx` |
| Hooks | camelCase with `use` | `useOptimization.ts` |
| Utilities | camelCase | `formatScore.ts` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `OptimizationResult` |
| Zustand actions | camelCase verb | `setResumeContent` |

**Transform at API boundaries:** Database returns snake_case → convert to camelCase in TypeScript.
```

---

### `.claude/rules/anti-patterns.md`

```markdown
# Anti-Patterns to AVOID

## Server Actions

```typescript
// ❌ WRONG - Throwing from server action
throw new Error('Failed');

// ✅ CORRECT - Return error object
return { data: null, error: { message: 'Failed', code: 'VALIDATION_ERROR' } };
```

## LLM Operations

```typescript
// ❌ WRONG - LLM call in component
const result = await llm.invoke(prompt);

// ✅ CORRECT - LLM calls only in /lib/ai/ or API routes
```

## Components

```typescript
// ❌ WRONG - Editing shadcn components
// NEVER edit files in /components/ui/

// ❌ WRONG - Direct Supabase calls from components
const { data } = await supabase.from('sessions').select();

// ✅ CORRECT - Go through /lib/supabase/ or server actions
```

## State Management

```typescript
// ❌ WRONG - Inconsistent naming
const UserData = { user_id: 1 };

// ✅ CORRECT - camelCase in TypeScript
const userData = { userId: 1 };
```

## Database

```typescript
// ❌ WRONG - Bypassing RLS
const { data } = await supabase.from('sessions').select().single();

// ✅ CORRECT - Always filter by user_id (RLS enforces this)
```
```

---

### `.claude/rules/testing.md`

```markdown
# Testing Guidelines

## Commands

```bash
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run test:all          # Full suite
npm run build && npm run test:all  # Pre-commit validation
```

## File Organization

| Test Type | Location | Naming |
|-----------|----------|--------|
| Unit tests | `__tests__/` adjacent to source | `*.test.ts` |
| Component tests | `__tests__/` in component dir | `*.test.tsx` |
| E2E tests | `e2e/` | `*.spec.ts` |
| Test utilities | `test/` | `helpers.ts`, `fixtures.ts` |

## Priority Tags

- `@P0` - Critical path, blocks release
- `@P1` - Important, should not regress
- `@P2` - Nice to have, lower priority

## Test Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('parseResume', () => {
  it('returns parsed content for valid PDF', async () => {
    const result = await parseResume(validPdfFile);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('returns error for invalid file type', async () => {
    const result = await parseResume(invalidFile);
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('INVALID_FILE_TYPE');
  });
});
```
```

---

### `.claude/rules/frontend/components.md`

```yaml
---
paths:
  - "components/**/*"
  - "app/**/*.tsx"
---
```

```markdown
# Frontend Component Rules

## File Structure

```tsx
// 1. Imports (external, then internal)
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOptimization } from '@/store/optimization';

// 2. Types (if not in separate file)
interface Props {
  sessionId: string;
  onComplete: () => void;
}

// 3. Component
export function SuggestionCard({ sessionId, onComplete }: Props) {
  // Hooks first
  const { suggestions } = useOptimization();
  const [isExpanded, setIsExpanded] = useState(false);

  // Handlers
  const handleClick = () => { ... };

  // Render
  return ( ... );
}
```

## Styling Rules

- Use Tailwind classes exclusively
- Follow shadcn/ui patterns for consistency
- **NEVER edit `/components/ui/` files** - extend via wrapper components

## State Management

- Local UI state: `useState`
- Form state: React Hook Form
- Global app state: Zustand stores in `/store/`
- Server state: Server Actions + `useTransition`

## Loading States

```tsx
const [isPending, startTransition] = useTransition();

function handleAction() {
  startTransition(async () => {
    const { data, error } = await serverAction(input);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Success
  });
}
```
```

---

### `.claude/rules/backend/server-actions.md`

```yaml
---
paths:
  - "actions/**/*"
  - "lib/**/*"
  - "app/api/**/*"
---
```

```markdown
# Backend Rules

## Server Action Template

```typescript
'use server';

import { ActionResponse } from '@/types';
import { createClient } from '@/lib/supabase/server';

export async function myAction(input: Input): Promise<ActionResponse<Output>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    }

    // Implementation
    const result = await doSomething(input);

    return { data: result, error: null };
  } catch (e) {
    console.error('myAction failed:', e);
    return { data: null, error: { message: 'Operation failed', code: 'INTERNAL_ERROR' } };
  }
}
```

## When to Use API Routes vs Server Actions

| Use Case | Choice | Why |
|----------|--------|-----|
| Quick operations (< 10s) | Server Action | Type-safe, simple |
| LLM pipeline (up to 60s) | API Route | Timeout support |
| Streaming responses | API Route | Requires HTTP streaming |
| Webhooks | API Route | External access needed |

## LLM Operations

- **ALL LLM calls go in `/lib/ai/`** - never in components or actions directly
- **Server-side only** - never expose API keys to client
- **Wrap user content in XML tags** for prompt injection defense:

```typescript
const prompt = `Analyze this resume:
<user_content>${resumeText}</user_content>`;
```

## Database Access

- All queries go through `/lib/supabase/`
- RLS policies enforce user_id filtering
- Transform snake_case → camelCase at boundaries
```

---

### `CLAUDE.local.md` (Template)

```markdown
# CLAUDE.local.md - Personal Preferences

> This file is gitignored. Add your personal Claude Code preferences here.

## My Preferences

- Preferred test framework flags: `--watch`
- IDE: VSCode / Cursor / etc.
- Custom aliases: ...

## Notes

- Add any project-specific notes that are personal to your workflow
```

---

### Updated `CLAUDE.md` (Core ~70 lines)

```markdown
# CLAUDE.md - SubmitSmart

## Quick Start

```bash
npm run dev                          # Start dev server
npm run build && npm run test:all    # Build + full test suite
```

## Tech Stack

Next.js 16 + TypeScript + React 19 | Tailwind 4 + shadcn/ui | Supabase + LangChain | Zustand | Vitest + Playwright

## Critical Rules

> Detailed rules in `.claude/rules/` - loaded automatically by path

1. **ActionResponse Pattern** - Never throw from server actions → `.claude/rules/action-response.md`
2. **Naming** - snake_case DB, camelCase TS → `.claude/rules/naming-conventions.md`
3. **Anti-patterns** - What to avoid → `.claude/rules/anti-patterns.md`

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
| `/components/ui/` | shadcn (READ-ONLY) | NEVER - extend via wrappers |
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

## Documentation Index

| What | Where |
|------|-------|
| Full context | `_bmad-output/project-context.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Testing | `docs/TESTING.md` |
| ATS Scoring | `docs/reference/ats-scoring-system-specification-v2.1.md` |

## Recent Changes (Feb 2026)

- **Anonymous User Removal** - All users must sign in; simplified RLS
- **Deterministic ATS Scoring** - V2.1 algorithm in `/lib/scoring/`
```

---

## Verification Steps

After implementation:

1. Run `/memory` command in Claude Code to verify loaded context
2. Edit a file in `components/` - verify frontend rules load
3. Edit a file in `actions/` - verify backend rules load
4. Check that CLAUDE.md is ~70 lines and readable

---

## Benefits

1. **Efficient Context**: ~70 lines always-loaded core, path-scoped rules only when relevant
2. **Team Alignment**: Version-controlled rules in `.claude/rules/`
3. **Easy Updates**: Modular files easier to maintain than monolithic doc
4. **Path Awareness**: Frontend/backend rules load contextually

---

## Rollback Plan

If issues arise:
1. Keep current CLAUDE.md as `CLAUDE.md.backup`
2. Can restore by deleting `.claude/rules/` and renaming backup

---

_Plan created: 2026-02-04_
