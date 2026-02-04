# Anti-Patterns to AVOID

## Server Actions

```typescript
// WRONG - Throwing from server action
throw new Error('Failed');  // NEVER do this!

// CORRECT - Return error object
return { data: null, error: { message: 'Failed', code: 'VALIDATION_ERROR' } };
```

## LLM Operations

```typescript
// WRONG - LLM call in component or direct in action
const result = await llm.invoke(prompt);

// CORRECT - LLM calls only in /lib/ai/, called from API routes
// API routes support 60s timeout needed for LLM operations
```

## Components

```typescript
// WRONG - Editing shadcn components directly
// Files in /components/ui/ are generated - NEVER edit them

// CORRECT - Create wrapper components to extend behavior
// Put custom components in /components/shared/

// WRONG - Direct Supabase calls from components
const { data } = await supabase.from('sessions').select();

// CORRECT - Go through /lib/supabase/ or server actions
const { data } = await getSession(sessionId);
```

## State Management

```typescript
// WRONG - Inconsistent naming (snake_case in TypeScript)
const UserData = { user_id: 1 };

// CORRECT - camelCase in TypeScript
const userData = { userId: 1 };
```

## Database

```typescript
// WRONG - Not filtering by user
const { data } = await supabase.from('sessions').select();

// CORRECT - RLS enforces user_id filtering, but be explicit
const { data } = await supabase
  .from('sessions')
  .select()
  .eq('user_id', userId);
```

## Authentication

```typescript
// WRONG - Assuming user exists without checking
const { data: { user } } = await supabase.auth.getUser();
await doSomething(user.id); // user might be null!

// CORRECT - Always check authentication
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
}
```

## File Handling

```typescript
// WRONG - Not validating file before processing
const text = await extractText(file);

// CORRECT - Validate type and size first
if (!ALLOWED_TYPES.includes(file.type)) {
  return { data: null, error: { code: 'INVALID_FILE_TYPE', message: '...' } };
}
if (file.size > MAX_FILE_SIZE) {
  return { data: null, error: { code: 'FILE_TOO_LARGE', message: '...' } };
}
```
