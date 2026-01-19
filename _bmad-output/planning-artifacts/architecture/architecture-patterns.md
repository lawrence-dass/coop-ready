# Architecture Patterns & Consistency Rules

**Critical Conflict Points Addressed:** 15+ areas where AI agents could make different choices, now standardized.

## Naming Patterns

### Database Naming (Supabase/Postgres)

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `users`, `scan_results`, `resume_suggestions` |
| Columns | snake_case | `user_id`, `created_at`, `scan_count` |
| Foreign keys | `{table}_id` | `user_id`, `scan_id` |
| Indexes | `idx_{table}_{column}` | `idx_users_email` |

### API/Routes (Next.js)

| Element | Convention | Example |
|---------|------------|---------|
| Route segments | kebab-case | `/api/resume-analysis`, `/dashboard/scan-results` |
| Route params | `[param]` format | `/scan/[scanId]` |
| Query params | camelCase | `?userId=123&includeDetails=true` |

### Code (TypeScript)

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `ScoreCard.tsx`, `ResumeUpload.tsx` |
| Files (components) | PascalCase | `ScoreCard.tsx` |
| Files (utils/hooks) | camelCase | `useAnalysis.ts`, `formatScore.ts` |
| Functions | camelCase | `getResumeText()`, `calculateScore()` |
| Variables | camelCase | `scanResult`, `userId` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE`, `API_TIMEOUT` |
| Types/Interfaces | PascalCase | `ScanResult`, `UserProfile` |

## Format Patterns

### API Response Structure

```typescript
// All Server Actions and Route Handlers return:
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }
```

### Data Format Rules

| Format | Convention | Example |
|--------|------------|---------|
| JSON fields | camelCase | `{ userId, scanResult }` |
| DB ↔ API | Transform at boundary | `user_id` → `userId` |
| Dates | ISO 8601 strings | `"2026-01-18T14:30:00Z"` |
| Booleans | true/false | `{ isPaid: true }` |
| Nulls | Explicit null | `{ middleName: null }` |

### Zod Schema Pattern

```typescript
// lib/validations/{feature}.ts
export const scanInputSchema = z.object({
  resumeFileId: z.string().uuid(),
  jobDescription: z.string().min(100).max(5000),
})
export type ScanInput = z.infer<typeof scanInputSchema>
```

## Process Patterns

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

### Client Consumption Pattern

```typescript
const [isPending, startTransition] = useTransition()

function handleSubmit() {
  startTransition(async () => {
    const { data, error } = await serverAction(input)
    if (error) {
      toast.error(error.message)
      return
    }
    // Success handling
  })
}
```

### Toast Notifications

| Action | Method | Usage |
|--------|--------|-------|
| Success | `toast.success()` | After successful operations |
| Error | `toast.error()` | Display error.message from response |
| Loading | `toast.loading()` | Long-running operations (AI analysis) |

## Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions exactly — no exceptions
2. Return `{ data, error }` shape from all Server Actions
3. Use Zod for all input validation
4. Place files in correct directories per structure
5. Use `useTransition` for Server Action calls
6. Log errors server-side, show friendly messages client-side

**Anti-Patterns to Avoid:**
- `throw new Error()` in Server Actions (breaks client)
- Mixed naming conventions (`userId` and `user_id` in same layer)
- Putting components in wrong folders
- Direct database column names in API responses
- `undefined` instead of `null` in responses
