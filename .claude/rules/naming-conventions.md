# Naming Conventions

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

## API Boundary Transformation

Database returns snake_case - convert to camelCase in TypeScript at the boundary:

```typescript
// Database returns: { user_id: 1, created_at: '...' }
// Transform to: { userId: 1, createdAt: '...' }
```

## Loading State Naming

- `isLoading` - boolean loading states
- `loadingStep` - multi-step progress indicator (e.g., "Parsing resume...")
- `isPending` - React useTransition states
