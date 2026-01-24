---
parent: architecture.md
section: patterns
last_updated: 2026-01-24
---

# Implementation Patterns & Consistency Rules

_Critical patterns that AI agents must follow for consistent implementation._

**Note:** The most critical patterns are also in `project-context.md` for quick reference.

---

## Pattern Categories Defined

**Critical Conflict Points Identified:** 12 areas where AI agents could make different choices

---

## Naming Patterns

### Database Naming (Supabase)

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `sessions`, `user_resumes` |
| Columns | snake_case | `created_at`, `resume_content` |
| Foreign Keys | `{table}_id` | `user_id`, `session_id` |
| Indexes | `idx_{table}_{column}` | `idx_sessions_user_id` |

### API Naming

| Element | Convention | Example |
|---------|------------|---------|
| Routes | kebab-case | `/api/parse-resume` |
| Query params | camelCase | `?sessionId=123` |
| Path params | camelCase | `/api/sessions/[sessionId]` |

### TypeScript/React Naming

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `SuggestionCard.tsx` |
| Hooks | camelCase with `use` | `useOptimization.ts` |
| Utilities | camelCase | `formatScore.ts` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `OptimizationResult` |
| Zustand actions | camelCase verb | `setResumeContent`, `clearSession` |

### Transform at boundaries

```typescript
// Database returns snake_case, transform to camelCase at API layer
const { user_id, created_at } = dbRow;
return { userId: user_id, createdAt: created_at };
```

---

## Structure Patterns

### Project Organization

```
/app
  /api
    /parse-resume/route.ts
    /optimize/route.ts
    /session/route.ts
  page.tsx
  layout.tsx
  error.tsx
  loading.tsx

/components
  /ui/                    # shadcn/ui (NEVER edit directly)
  /forms/                 # Form components
  /shared/                # Reusable business components

/lib
  /ai/                    # ALL AI/LLM operations
  /supabase/              # ALL Supabase access
  /parsers/               # File parsing
  /validations/           # Zod schemas
  utils.ts

/actions                  # Server Actions
/store                    # Zustand store
/types                    # Shared type definitions
```

### File Co-location Rules

- Tests: Co-located as `*.test.ts` next to source
- Types: In `/types` for shared, inline for component-specific
- Styles: Tailwind only, no separate CSS files

---

## Format Patterns

### API Response Format (MANDATORY)

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

### Error Codes (Standardized)

| Code | Meaning |
|------|---------|
| `INVALID_FILE_TYPE` | Wrong file format |
| `FILE_TOO_LARGE` | Exceeds 5MB |
| `PARSE_ERROR` | Can't extract text |
| `LLM_TIMEOUT` | 60s exceeded |
| `LLM_ERROR` | API failure |
| `RATE_LIMITED` | Too many requests |
| `VALIDATION_ERROR` | Bad input |

---

## Communication Patterns

### Zustand Store Pattern

```typescript
interface SessionStore {
  // State (nouns)
  resumeContent: string | null;
  isLoading: boolean;
  loadingStep: string | null;
  error: string | null;

  // Actions (verbs)
  setResumeContent: (content: string) => void;
  setLoading: (loading: boolean, step?: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

### Loading State Naming

- `isLoading` for boolean loading states
- `loadingStep` for multi-step progress
- `isPending` for React `useTransition` states

---

## Process Patterns

### Error Handling Flow

```typescript
const [isPending, startTransition] = useTransition();

function handleAction() {
  startTransition(async () => {
    const { data, error } = await serverAction(input);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Success path
  });
}
```

---

## Enforcement Guidelines

### All AI Agents MUST:

1. Use `ActionResponse<T>` for all server actions and API routes
2. Never throw errors from server actions - always return error objects
3. Use the standardized error codes
4. Follow the naming conventions in this document
5. Place files in the designated directories
6. Transform snake_case → camelCase at API boundaries

### Anti-Patterns to Avoid

```typescript
// WRONG - Throwing from server action
throw new Error('Failed');  // NEVER throw!

// WRONG - Inconsistent naming
const UserData = { user_id: 1 };  // Should be userId
```
