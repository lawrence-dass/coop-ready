---
project_name: 'CoopReady'
user_name: 'Lawrence'
date: '2026-01-18'
status: complete
rule_count: 25
optimized_for_llm: true
sections_completed:
  - technology-stack
  - implementation-rules
  - anti-patterns
  - environment-variables
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 14+ | App Router, Server Components |
| TypeScript | Strict mode | No `any` types |
| Tailwind CSS | Latest | With shadcn/ui |
| Supabase | Latest | Postgres + Auth + Storage |
| OpenAI | GPT-4o-mini | Server-side only |
| Stripe | Latest | PCI via hosted checkout |
| Zod | Latest | All input validation |
| React Hook Form | Latest | With Zod resolver |

## Critical Implementation Rules

### Server Actions (MUST FOLLOW)

```typescript
// ALWAYS return this shape from Server Actions
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

// CORRECT pattern
export async function myAction(input: Input): Promise<ActionResponse<Output>> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }
  try {
    const result = await doWork(parsed.data)
    return { data: result, error: null }
  } catch (e) {
    console.error('[myAction]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

// WRONG - never throw from Server Actions
export async function badAction() {
  throw new Error('This breaks the client!')  // ❌ NEVER DO THIS
}
```

### Naming Conventions (STRICT)

| Context | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case, plural | `scan_results` |
| Database columns | snake_case | `user_id`, `created_at` |
| TypeScript variables | camelCase | `scanResult`, `userId` |
| Components | PascalCase | `ScoreCard.tsx` |
| Hooks | camelCase with "use" | `useAnalysis.ts` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| API routes | kebab-case | `/api/resume-analysis` |

**Transform at boundary:** DB `user_id` → API `userId`

### File Organization (MUST FOLLOW)

```
components/
├── ui/          # shadcn/ui only - never edit directly
├── forms/       # Form components
├── analysis/    # Analysis feature components
├── layout/      # Layout components
└── shared/      # Reusable business components

lib/
├── supabase/    # ALL Supabase access
├── openai/      # ALL OpenAI access
├── stripe/      # ALL Stripe access
├── validations/ # Zod schemas
└── utils/       # Pure utilities

actions/         # Server Actions only
```

### Supabase Rules

- **Browser:** Use `lib/supabase/client.ts`
- **Server Components:** Use `lib/supabase/server.ts`
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to client
- **Always** use RLS policies for user data access
- **Transform** snake_case columns to camelCase at service boundary

### Client-Side Patterns

```typescript
// ALWAYS use useTransition for Server Actions
const [isPending, startTransition] = useTransition()

function handleSubmit() {
  startTransition(async () => {
    const { data, error } = await serverAction(input)
    if (error) {
      toast.error(error.message)
      return
    }
    // Success path
  })
}
```

### Zod Validation (REQUIRED)

```typescript
// All Server Actions MUST validate input with Zod
import { z } from 'zod'

export const scanInputSchema = z.object({
  resumeFileId: z.string().uuid(),
  jobDescription: z.string().min(100).max(5000),
})

// In Server Action - first thing
const parsed = scanInputSchema.safeParse(input)
if (!parsed.success) {
  return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
}
```

## Anti-Patterns (NEVER DO)

| Anti-Pattern | Why | Do Instead |
|--------------|-----|------------|
| `throw new Error()` in Server Actions | Breaks client | Return `{ data: null, error: {...} }` |
| `undefined` in responses | Inconsistent | Use `null` explicitly |
| Mixed naming (`userId` and `user_id`) | Confusion | Transform at boundary |
| Direct DB column names in API | Coupling | Transform to camelCase |
| `console.log` in production | Security | Use proper logging |
| Hardcoded API keys | Security | Use env vars |

## Environment Variables

| Variable | Scope | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes |
| `OPENAI_API_KEY` | Server only | Yes |
| `STRIPE_SECRET_KEY` | Server only | Yes |
| `STRIPE_WEBHOOK_SECRET` | Server only | Yes |

**NEVER** prefix server-only keys with `NEXT_PUBLIC_`

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Refer to `architecture.md` for detailed decisions

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules

**Related Documents:**
- Full architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`

---

_Last Updated: 2026-01-18_

