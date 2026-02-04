# Testing Rules

> Full testing guide: `docs/TESTING.md`

## Quick Commands

```bash
npm run test:unit         # Vitest unit tests (watch mode)
npm run test:unit:run     # Vitest CI mode
npm run test:e2e          # Playwright e2e tests
npm run test:all          # Full test suite (CI)

# Pre-commit validation
npm run build && npm run test:all
```

## Test File Conventions

| Test Type | Location | Naming | Runner |
|-----------|----------|--------|--------|
| Unit tests | `tests/unit/` | `*.test.ts` | Vitest |
| Component tests | `tests/unit/` | `*.test.tsx` | Vitest |
| Integration tests | `tests/integration/` | `*.test.tsx` or `*.spec.ts` | Both |
| E2E tests | `tests/e2e/` | `*.spec.ts` | Playwright |
| API tests | `tests/api/` | `*.spec.ts` | Playwright |

## Priority Tags

Use in test names for CI optimization:

- `@P0` - Critical path, must pass for merge
- `@P1` - Important features, run on main branch
- `@P2` - Nice-to-have, run nightly

```typescript
test('[P0] should upload PDF successfully', async () => {
  // Critical test
});
```

## ActionResponse Test Pattern

Always test both success and error paths:

```typescript
import { describe, it, expect } from 'vitest';

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
