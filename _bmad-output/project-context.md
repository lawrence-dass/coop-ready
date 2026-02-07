# Project Context for AI Agents

_Critical rules and patterns for implementing code in this project._

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.x | App Router, Server Components default |
| TypeScript | 5.x | Strict mode enabled |
| Tailwind CSS | 4.x | CSS variables theming |
| shadcn/ui | Latest | Copy-paste component model |
| Supabase | Latest | Postgres + Auth + RLS |
| @langchain/anthropic | Latest | Claude API integration |
| @langchain/core | Latest | Pipeline orchestration |
| Zustand | Latest | Client state management |
| React Hook Form | Latest | Form handling |
| Zod | Latest | Schema validation |
| unpdf | Latest | PDF text extraction |
| mammoth | Latest | DOCX text extraction |
| sonner | Latest | Toast notifications |
| lucide-react | Latest | Icons |
| react-dropzone | Latest | File upload |

---

## Critical Implementation Rules

### ActionResponse Pattern (MANDATORY)

Every server action and API route MUST return this type:

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

**NEVER throw from server actions** - always return error objects.

### Error Codes (Use These Exactly)

| Code | When to Use |
|------|-------------|
| `INVALID_FILE_TYPE` | Wrong file format |
| `FILE_TOO_LARGE` | Exceeds 5MB |
| `PARSE_ERROR` | Can't extract text |
| `LLM_TIMEOUT` | 60s exceeded |
| `LLM_ERROR` | API failure |
| `RATE_LIMITED` | Too many requests |
| `VALIDATION_ERROR` | Bad input |

---

## Naming Conventions

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

---

## Directory Structure Rules

```
/components/ui/     → shadcn components (NEVER edit directly)
/components/forms/  → Form components
/components/shared/ → Reusable business components
/lib/ai/           → ALL LLM operations (isolated)
/lib/supabase/     → ALL database operations (isolated)
/lib/parsers/      → File parsing (PDF/DOCX)
/lib/validations/  → Zod schemas
/actions/          → Server Actions
/store/            → Zustand stores
/types/            → Shared type definitions
```

---

## LLM Security Rules

- **All LLM calls server-side only** - never expose API keys to client
- **User content in XML tags** - treat as data, not instructions
- **Prompt injection defense** - wrap user input in `<user_content>` tags

---

## API Patterns

| Operation Type | Use | Why |
|----------------|-----|-----|
| Quick operations (< 10s) | Server Actions | Type-safe, simple |
| LLM pipeline (up to 60s) | API Route `/api/optimize` | Timeout support |

---

## Zustand Store Pattern

```typescript
interface Store {
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

- `isLoading` → boolean loading states
- `loadingStep` → multi-step progress indicator
- `isPending` → React useTransition states

---

## Error Handling Flow

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

## Anti-Patterns to AVOID

```typescript
// WRONG - Throwing from server action
throw new Error('Failed');  // NEVER throw!

// WRONG - Inconsistent naming
const UserData = { user_id: 1 };  // Should be userId in TypeScript

// WRONG - Direct Supabase calls from components
// Always go through /lib/supabase/ or server actions

// WRONG - Editing shadcn components
// NEVER edit files in /components/ui/
```

---

## Constraints

| Constraint | Value |
|------------|-------|
| LLM timeout | 60 seconds max |
| Cost ceiling | $0.10 per optimization |
| File size | 5MB max |
| PDF type | Text-based only (no OCR) |

---

## Additional Context (load only when needed)

| Scenario | Load |
|----------|------|
| New component patterns | `architecture/architecture-patterns.md` |
| Technology trade-offs | `architecture/architecture-decisions.md` |
| File placement questions | `architecture/architecture-structure.md` |
| Project requirements | `architecture/architecture-overview.md` |

**This file is sufficient for 90% of tasks.** Only load architecture shards for decisions not covered here.
