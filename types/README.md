# Type System Documentation

This directory contains all shared TypeScript types used throughout the SubmitSmart application.

## Quick Start

```typescript
// Import from the main index
import type { ActionResponse, Resume, OptimizationStore } from '@/types';
import { ERROR_CODES, createErrorResponse } from '@/types';
```

## File Structure

| File | Purpose |
|------|---------|
| `index.ts` | Main export file - re-exports everything |
| `errors.ts` | Error types, type guards, and helper functions |
| `optimization.ts` | Domain types (Resume, JobDescription, Analysis, etc.) |
| `store.ts` | Zustand store interface |
| `examples.ts` | Usage examples (reference only, not committed) |

## Core Patterns

### 1. ActionResponse Pattern (MANDATORY)

Every server action and API route MUST return `ActionResponse<T>`:

```typescript
async function uploadResume(file: File): Promise<ActionResponse<string>> {
  try {
    const text = await parseFile(file);
    return { data: text, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: 'Failed to parse', code: 'PARSE_ERROR' }
    };
  }
}
```

**Client-side usage:**

```typescript
const { data, error } = await uploadResume(file);
if (error) {
  toast.error(error.message);
  return;
}
// TypeScript knows data is string here
console.log(data);
```

### 2. Error Codes

Use exactly these 7 error codes - do not create ad-hoc codes:

- `INVALID_FILE_TYPE` - Wrong file format
- `FILE_TOO_LARGE` - Exceeds 5MB
- `PARSE_ERROR` - Can't extract text
- `LLM_TIMEOUT` - API call > 60s
- `LLM_ERROR` - API error
- `RATE_LIMITED` - Too many requests
- `VALIDATION_ERROR` - Invalid input

```typescript
import { ERROR_CODES, createErrorResponse } from '@/types';

// Create error response
return createErrorResponse('FILE_TOO_LARGE');

// Access error code
if (error.code === ERROR_CODES.PARSE_ERROR) {
  // Handle parse error
}
```

### 3. Domain Types

```typescript
import type { Resume, JobDescription, AnalysisResult, Suggestion } from '@/types';

// Use types for function parameters and returns
async function analyzeResume(
  resume: Resume,
  jd: JobDescription
): Promise<ActionResponse<AnalysisResult>> {
  // ...
}
```

### 4. Zustand Store

The store interface is defined but not implemented yet.

```typescript
// Implementation will be in /store/useOptimizationStore.ts
import { create } from 'zustand';
import type { OptimizationStore } from '@/types/store';

export const useOptimizationStore = create<OptimizationStore>((set) => ({
  // ... implementation
}));
```

## Database Transform Pattern

The database uses `snake_case`, TypeScript uses `camelCase`.
Transform at API boundaries:

```typescript
// Database query returns snake_case
const { data: session } = await supabase
  .from('sessions')
  .select('*')
  .single();

// Transform to TypeScript types (camelCase)
const typedSession: OptimizationSession = {
  id: session.id,
  anonymousId: session.anonymous_id,
  userId: session.user_id,
  resumeContent: session.resume_content ? JSON.parse(session.resume_content) : null,
  jobDescription: session.jd_content ? JSON.parse(session.jd_content) : null,
  analysisResult: session.analysis,
  suggestions: session.suggestions,
  createdAt: new Date(session.created_at),
  updatedAt: new Date(session.updated_at),
};
```

### Mapping Reference

| Database Column (snake_case) | TypeScript Property (camelCase) |
|------------------------------|----------------------------------|
| `resume_content` | `resumeContent` |
| `jd_content` | `jobDescription` |
| `analysis` | `analysisResult` |
| `suggestions` | `suggestions` |
| `anonymous_id` | `anonymousId` |
| `user_id` | `userId` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

## Type Guard Functions

```typescript
import { isErrorCode, isActionResponseError, isActionResponseSuccess } from '@/types';

// Check if string is valid ErrorCode
if (isErrorCode(code)) {
  const message = ERROR_MESSAGES[code];
}

// Type guard for ActionResponse
const response = await someAction();
if (isActionResponseError(response)) {
  console.error(response.error.message);
} else {
  console.log(response.data);
}
```

## Helper Functions

```typescript
import { createErrorResponse, createSuccessResponse, getErrorMessage } from '@/types';

// Create responses
return createSuccessResponse(data);
return createErrorResponse('PARSE_ERROR');
return createErrorResponse('VALIDATION_ERROR', 'Custom error message');

// Get error message
const message = getErrorMessage('FILE_TOO_LARGE');
toast.error(message);
```

## Best Practices

1. **Import from index**: Always import from `@/types`, not individual files
2. **Use type over interface for props**: `type Props = { ... }` for React components
3. **Use interface for extensibility**: `interface` for objects that might be extended
4. **Never throw from server actions**: Always return `ActionResponse`
5. **Use const assertions**: `as const` for readonly objects
6. **Export types, not values**: Types should be `export type`, values should be `export const`

## Common Patterns

### Server Action

```typescript
import type { ActionResponse } from '@/types';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/types';

export async function serverAction(input: string): Promise<ActionResponse<Result>> {
  // Validation
  if (!input) {
    return createErrorResponse('VALIDATION_ERROR', 'Input is required');
  }

  try {
    const result = await doSomething(input);
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Server action error:', error);
    return createErrorResponse('LLM_ERROR');
  }
}
```

### React Component with Store

```typescript
'use client';

import { useOptimizationStore } from '@/store/useOptimizationStore';
import { storeSelectors } from '@/types/store';

export function MyComponent() {
  const resume = useOptimizationStore(storeSelectors.resume);
  const isLoading = useOptimizationStore(storeSelectors.isLoading);
  const setError = useOptimizationStore((state) => state.setError);

  // ...
}
```

### API Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse, AnalysisResult } from '@/types';
import { createErrorResponse, createSuccessResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await analyzeResume(body);

    const response: ActionResponse<AnalysisResult> = createSuccessResponse(result);
    return NextResponse.json(response);
  } catch (error) {
    const response = createErrorResponse('LLM_ERROR');
    return NextResponse.json(response, { status: 500 });
  }
}
```

## Validation

Run TypeScript compiler to verify types are correct:

```bash
npm run build  # Should complete without type errors
```

## Reference

- All error codes defined in `index.ts`
- Error messages defined in `errors.ts`
- Domain types in `optimization.ts`
- Store interface in `store.ts`
- project-context.md for architectural patterns
