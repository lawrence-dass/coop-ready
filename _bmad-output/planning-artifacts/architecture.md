---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
status: complete
completedAt: '2026-01-18'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-CoopReady-2026-01-18.md
workflowType: 'architecture'
project_name: 'CoopReady'
user_name: 'Lawrence'
date: '2026-01-18'
sharded: true
---

# Architecture Decision Document

**Status:** READY FOR IMPLEMENTATION | **Completed:** 2026-01-18

This architecture has been sharded into focused documents for efficient context loading.

## Quick Reference

| Document | Lines | Purpose | When to Load |
|----------|-------|---------|--------------|
| [Overview](./architecture/architecture-overview.md) | ~110 | Requirements, constraints, starter | Story creation |
| [Decisions](./architecture/architecture-decisions.md) | ~110 | Tech choices, auth, API patterns | Implementation planning |
| [Patterns](./architecture/architecture-patterns.md) | ~130 | Naming, format, process patterns | **Code writing, code review** |
| [Structure](./architecture/architecture-structure.md) | ~220 | Directory tree, boundaries, FR mapping | File placement decisions |
| [Validation](./architecture/architecture-validation.md) | ~100 | Checklist, readiness, handoff | Project status checks |

## Core Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Auth + Storage)
- **AI:** OpenAI API (GPT-4o-mini)
- **Payments:** Stripe
- **Deployment:** Vercel

## Essential Patterns (Most Used)

### ActionResponse Type
```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }
```

### Server Action Pattern
```typescript
export async function actionName(input: Input): Promise<ActionResponse<Output>> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }
  try {
    const result = await doWork(parsed.data)
    return { data: result, error: null }
  } catch (e) {
    console.error('[actionName]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}
```

### Client Consumption
```typescript
const [isPending, startTransition] = useTransition()
startTransition(async () => {
  const { data, error } = await serverAction(input)
  if (error) { toast.error(error.message); return }
  // Success
})
```

## Naming Conventions

| Layer | Convention | Example |
|-------|------------|---------|
| Database | snake_case | `user_id`, `scan_results` |
| TypeScript | camelCase | `userId`, `scanResult` |
| Components | PascalCase | `ScoreCard.tsx` |
| Routes | kebab-case | `/scan-results` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

## Key Directories

```
app/(auth)/      # Login, signup, forgot-password
app/(dashboard)/ # Protected routes (dashboard, scan, settings)
actions/         # Server Actions
components/ui/   # shadcn/ui primitives
lib/supabase/    # Supabase clients
lib/validations/ # Zod schemas
```

---

**For detailed information, see the appropriate shard document above.**
