---
paths:
  - "actions/**/*"
  - "lib/**/*"
  - "app/api/**/*"
---

# Backend Rules

These rules apply when working on server actions, API routes, and library code.

## Server Action Template

```typescript
'use server';

import { ActionResponse } from '@/types';
import { createClient } from '@/lib/supabase/server';

export async function myAction(input: Input): Promise<ActionResponse<Output>> {
  try {
    // 1. Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: { message: 'Please sign in', code: 'UNAUTHORIZED' } };
    }

    // 2. Validate input
    const validated = inputSchema.safeParse(input);
    if (!validated.success) {
      return { data: null, error: { message: validated.error.message, code: 'VALIDATION_ERROR' } };
    }

    // 3. Perform operation
    const result = await performOperation(validated.data, user.id);

    // 4. Return success
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
| Quick operations (< 10s) | Server Action | Type-safe, simpler |
| LLM operations (up to 60s) | API Route | Extended timeout support |
| Streaming responses | API Route | Requires HTTP streaming |
| External webhooks | API Route | Need public HTTP endpoint |

## LLM Operations

All LLM code goes in `/lib/ai/`. Key rules:

1. **Server-side only** - never expose API keys to client
2. **Wrap user content** for prompt injection defense:

```typescript
const prompt = `Analyze this resume:
<user_content>${resumeText}</user_content>

Extract keywords and qualifications.`;
```

3. **60 second timeout** - use API routes for LLM calls
4. **Cost ceiling** - $0.10 per optimization max

## Database Access

All database operations go through `/lib/supabase/`:

```typescript
// In /lib/supabase/sessions.ts
export async function getSession(sessionId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)  // RLS enforces this, but be explicit
    .single();

  if (error) {
    return { data: null, error: { message: error.message, code: 'NOT_FOUND' } };
  }

  // Transform snake_case to camelCase at boundary
  return { data: transformSession(data), error: null };
}
```

## File Parsing

Files are parsed in `/lib/parsers/`:

- **PDF**: `unpdf` library (text-based only, no OCR)
- **DOCX**: `mammoth` library
- **Max size**: 5MB
- **Validation**: Always check type and size before parsing
