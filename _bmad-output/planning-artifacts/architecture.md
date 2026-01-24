---
type: index
shards:
  - architecture/architecture-overview.md
  - architecture/architecture-decisions.md
  - architecture/architecture-patterns.md
  - architecture/architecture-structure.md
  - architecture/architecture-validation.md
original_lines: 868
index_lines: 95
sharded_date: 2026-01-24
status: complete
---

# Architecture Decision Document

_Index file. Full details in `architecture/` subfolder._

---

## When to Load Each Shard

| Shard | Load When | Lines |
|-------|-----------|-------|
| [overview](architecture/architecture-overview.md) | Understanding project context, requirements | ~75 |
| [decisions](architecture/architecture-decisions.md) | Reviewing technology choices, rationale | ~200 |
| **[patterns](architecture/architecture-patterns.md)** | **Implementing code (most common)** | ~170 |
| [structure](architecture/architecture-structure.md) | Creating new files, understanding boundaries | ~190 |
| [validation](architecture/architecture-validation.md) | Checking readiness, reviewing coverage | ~165 |

**Default:** For routine implementation, use `project-context.md` (contains critical patterns).

---

## Critical Patterns (Always Available)

### ActionResponse Pattern (MANDATORY)

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

**NEVER throw from server actions** - always return error objects.

### Error Codes

| Code | When |
|------|------|
| `INVALID_FILE_TYPE` | Wrong file format |
| `FILE_TOO_LARGE` | Exceeds 5MB |
| `PARSE_ERROR` | Can't extract text |
| `LLM_TIMEOUT` | 60s exceeded |
| `LLM_ERROR` | API failure |
| `RATE_LIMITED` | Too many requests |
| `VALIDATION_ERROR` | Bad input |

### Naming Quick Reference

| Context | Convention | Example |
|---------|------------|---------|
| Database | snake_case | `created_at` |
| TypeScript | camelCase | `createdAt` |
| Components | PascalCase | `SuggestionCard.tsx` |
| API routes | kebab-case | `/api/parse-resume` |

**Transform at boundaries:** Database snake_case → TypeScript camelCase

### Key Directories

```
/lib/ai/        → ALL LLM operations
/lib/supabase/  → ALL database operations
/lib/parsers/   → File parsing
/components/ui/ → shadcn (NEVER edit)
/actions/       → Server Actions
/store/         → Zustand stores
```

---

## Architecture Summary

| Metric | Value |
|--------|-------|
| Functional Requirements | 42 (all covered) |
| Non-Functional Requirements | 24 (all covered) |
| Architectural Decisions | 25+ |
| Implementation Patterns | 12 |
| Project Components | 65+ |

**Status:** READY FOR IMPLEMENTATION ✅

---

## Full Documentation

| Document | Purpose |
|----------|---------|
| [Overview](architecture/architecture-overview.md) | Requirements, constraints, cross-cutting concerns |
| [Decisions](architecture/architecture-decisions.md) | Technology choices, starter template, rationale |
| [Patterns](architecture/architecture-patterns.md) | Naming, structure, format, communication patterns |
| [Structure](architecture/architecture-structure.md) | Complete directory, boundaries, integration points |
| [Validation](architecture/architecture-validation.md) | Coherence, coverage, readiness assessment |

---

_Sharded from 868 lines → 95 line index + 5 shards (2026-01-24)_
