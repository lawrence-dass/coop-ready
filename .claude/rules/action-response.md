# ActionResponse Pattern (MANDATORY)

Every server action and API route MUST return this type. This is the most critical pattern in the codebase.

## Type Definition

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

## Rules

1. **NEVER throw from server actions** - always return error objects
2. Every server action and API route MUST return `ActionResponse<T>`
3. Use standard error codes exactly as specified below

## Error Codes

| Code | When to Use |
|------|-------------|
| `INVALID_FILE_TYPE` | Wrong file format |
| `FILE_TOO_LARGE` | Exceeds 5MB limit |
| `PARSE_ERROR` | Cannot extract text from file |
| `LLM_TIMEOUT` | 60 second timeout exceeded |
| `LLM_ERROR` | Claude API failure |
| `RATE_LIMITED` | Too many requests |
| `VALIDATION_ERROR` | Invalid input data |
| `UNAUTHORIZED` | User not authenticated |
| `NOT_FOUND` | Resource doesn't exist |

## Example Implementation

```typescript
'use server';

import { ActionResponse } from '@/types';

export async function parseResume(file: File): Promise<ActionResponse<ResumeData>> {
  try {
    if (!isValidFileType(file)) {
      return {
        data: null,
        error: { message: 'Only PDF and DOCX files are supported', code: 'INVALID_FILE_TYPE' }
      };
    }

    const data = await extractText(file);
    return { data, error: null };
  } catch (e) {
    console.error('parseResume failed:', e);
    return {
      data: null,
      error: { message: 'Failed to parse resume', code: 'PARSE_ERROR' }
    };
  }
}
```

## Client-Side Usage

```typescript
const [isPending, startTransition] = useTransition();

function handleAction() {
  startTransition(async () => {
    const { data, error } = await serverAction(input);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Success path - use data
  });
}
```
