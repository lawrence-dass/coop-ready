---
paths:
  - "components/**/*"
  - "app/**/*.tsx"
---

# Frontend Component Rules

These rules apply when working on React components.

## File Structure Template

```tsx
// 1. Imports (external first, then internal)
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useOptimization } from '@/store/optimization';
import type { Session } from '@/types';

// 2. Types (if component-specific)
interface Props {
  sessionId: string;
  onComplete: () => void;
}

// 3. Component (named export preferred)
export function SuggestionCard({ sessionId, onComplete }: Props) {
  // Hooks first (in consistent order)
  const { suggestions, isLoading } = useOptimization();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  // Handlers
  const handleApply = () => {
    startTransition(async () => {
      const { error } = await applySuggestion(sessionId);
      if (error) {
        toast.error(error.message);
        return;
      }
      onComplete();
    });
  };

  // Render
  return ( ... );
}
```

## Styling Rules

- Use Tailwind classes exclusively (no CSS modules, no inline styles)
- Follow shadcn/ui patterns for consistency
- Use CSS variables for theming (`--primary`, `--background`, etc.)

## Component Locations

| Type | Location | Notes |
|------|----------|-------|
| shadcn components | `/components/ui/` | **NEVER edit** - generated files |
| Custom wrappers | `/components/shared/` | Extend shadcn via wrappers |
| Form components | `/components/forms/` | React Hook Form based |
| Page components | `/app/**/page.tsx` | Next.js App Router |

## State Management

| State Type | Use |
|------------|-----|
| Local UI state | `useState` |
| Form state | React Hook Form + Zod |
| Global app state | Zustand stores (`/store/`) |
| Server state | Server Actions + `useTransition` |

## Loading & Error States

```tsx
const [isPending, startTransition] = useTransition();

// Show loading state
<Button disabled={isPending}>
  {isPending ? 'Saving...' : 'Save'}
</Button>

// Handle errors with toast
if (error) {
  toast.error(error.message);
}
```
