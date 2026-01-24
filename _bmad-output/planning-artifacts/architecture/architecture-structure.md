---
parent: architecture.md
section: structure
last_updated: 2026-01-24
---

# Project Structure & Boundaries

_Complete project directory structure, architectural boundaries, and integration points._

---

## Complete Project Directory

```
submit_smart/
├── .env.local                      # Local environment (never commit)
├── .env.example                    # Template for env vars
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind + shadcn theming
├── tsconfig.json                   # TypeScript strict mode
├── components.json                 # shadcn/ui configuration
├── package.json
│
├── /app
│   ├── layout.tsx                  # Root layout, providers
│   ├── page.tsx                    # Home → redirects to /optimize
│   ├── error.tsx                   # Global error boundary
│   ├── loading.tsx                 # Global loading state
│   ├── globals.css                 # Tailwind imports
│   │
│   ├── /optimize
│   │   ├── page.tsx                # Main optimization flow (V0.1)
│   │   └── layout.tsx              # Optimize layout with sidebar
│   │
│   ├── /history                    # V1.0
│   │   └── page.tsx                # Session history list
│   │
│   ├── /auth                       # V1.0
│   │   ├── /login/page.tsx
│   │   ├── /signup/page.tsx
│   │   └── /callback/route.ts      # OAuth callback
│   │
│   └── /api
│       ├── /parse-resume/route.ts  # File parsing endpoint
│       ├── /optimize/route.ts      # LLM pipeline (60s timeout)
│       └── /session/route.ts       # Session CRUD
│
├── /components
│   ├── /ui/                        # shadcn/ui components (NEVER edit)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   │
│   ├── /forms/
│   │   ├── ResumeUploader.tsx      # Drag-drop file upload
│   │   └── JobDescriptionInput.tsx # JD textarea with validation
│   │
│   ├── /shared/
│   │   ├── ScoreDisplay.tsx        # ATS score with progress ring
│   │   ├── SuggestionCard.tsx      # Individual suggestion item
│   │   ├── SuggestionList.tsx      # Grouped suggestions
│   │   ├── ProgressSteps.tsx       # Multi-step loading indicator
│   │   ├── ComparisonView.tsx      # Before/after diff view
│   │   └── ErrorDisplay.tsx        # Standardized error UI
│   │
│   └── /layout/
│       ├── Header.tsx              # App header
│       ├── Sidebar.tsx             # Navigation sidebar
│       └── Footer.tsx              # App footer
│
├── /lib
│   ├── /ai/
│   │   ├── client.ts               # Claude/LangChain client setup
│   │   ├── pipeline.ts             # Main optimization pipeline
│   │   ├── prompts.ts              # All LLM prompts (XML-tagged)
│   │   ├── parser.ts               # LLM response parsing
│   │   └── types.ts                # AI-specific types
│   │
│   ├── /supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (cookies)
│   │   ├── middleware.ts           # Auth middleware
│   │   └── types.ts                # Database types
│   │
│   ├── /parsers/
│   │   ├── pdf.ts                  # PDF text extraction (unpdf)
│   │   ├── docx.ts                 # DOCX text extraction (mammoth)
│   │   └── index.ts                # Unified parser interface
│   │
│   ├── /validations/
│   │   ├── file.ts                 # File upload validation
│   │   ├── jd.ts                   # Job description validation
│   │   └── session.ts              # Session data validation
│   │
│   └── utils.ts                    # cn(), formatters, helpers
│
├── /actions
│   ├── session.ts                  # Session server actions
│   ├── resume.ts                   # Resume server actions
│   └── optimization.ts             # Optimization server actions
│
├── /store
│   ├── session.ts                  # Session state (Zustand)
│   └── ui.ts                       # UI state (modals, etc.)
│
├── /types
│   ├── index.ts                    # Shared type exports
│   ├── api.ts                      # API types (ActionResponse)
│   ├── session.ts                  # Session/optimization types
│   └── suggestion.ts               # Suggestion types
│
├── /hooks
│   ├── useOptimization.ts          # Optimization flow hook
│   ├── useFileUpload.ts            # File upload handling
│   └── useSession.ts               # Session management
│
└── /supabase
    ├── config.toml                 # Supabase local config
    └── /migrations/
        ├── 00001_initial_schema.sql
        └── 00002_rls_policies.sql
```

---

## Architectural Boundaries

### Boundary 1: API Layer

| Rule | Enforcement |
|------|-------------|
| All `/api` routes return `ActionResponse<T>` | Type checking |
| No direct Supabase calls from components | Linting rule |
| All LLM calls through `/lib/ai/` | Directory structure |
| Timeout handling at route level | Route configuration |

### Boundary 2: Component Layer

| Rule | Enforcement |
|------|-------------|
| `/components/ui/` is read-only | Never edit shadcn files |
| Components receive data via props | No direct API calls |
| Business logic in hooks, not components | Code review |
| Loading states via Zustand/useTransition | Pattern enforcement |

### Boundary 3: Service Layer

| Rule | Enforcement |
|------|-------------|
| `/lib/ai/` owns all LLM operations | Directory isolation |
| `/lib/supabase/` owns all DB operations | Directory isolation |
| `/lib/parsers/` owns file processing | Directory isolation |
| Cross-service calls through defined interfaces | Type boundaries |

### Boundary 4: Data Layer

| Rule | Enforcement |
|------|-------------|
| snake_case in database | SQL conventions |
| camelCase in TypeScript | Transform at boundary |
| RLS on all user tables | Migration requirement |
| No raw SQL in components | Service layer only |

---

## Requirements to Structure Mapping

| FR Category | Primary Location |
|-------------|------------------|
| User Identity (FR1-5) | `/app/auth/`, `/lib/supabase/` |
| Resume Management (FR6-12) | `/components/forms/`, `/lib/parsers/` |
| Job Description (FR13-15) | `/components/forms/`, `/lib/validations/` |
| ATS Analysis (FR16-20) | `/lib/ai/pipeline.ts` |
| Content Optimization (FR21-28) | `/lib/ai/`, `/components/shared/` |
| Quality Assurance (FR29-32) | `/lib/ai/` (V1.0 judge) |
| Comparison (FR33-35) | `/components/shared/ComparisonView.tsx` |
| Session History (FR36-39) | `/app/history/`, `/actions/session.ts` |
| Error Handling (FR40-42) | `/components/shared/ErrorDisplay.tsx` |

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  Zustand Store ←→ React Components ←→ Server Actions        │
├─────────────────────────────────────────────────────────────┤
│                    Next.js API Routes                        │
├────────────────┬────────────────┬───────────────────────────┤
│   /lib/ai/     │  /lib/supabase/│    /lib/parsers/          │
│   (LangChain)  │  (Postgres)    │    (PDF/DOCX)             │
├────────────────┼────────────────┼───────────────────────────┤
│  Claude API    │   Supabase     │    File System            │
│  (External)    │   (External)   │    (Memory)               │
└────────────────┴────────────────┴───────────────────────────┘
```

### Data Flow

1. User uploads file → `/lib/parsers/` → text extracted
2. User submits JD → Zustand store → validation
3. Optimize triggered → `/api/optimize` → `/lib/ai/pipeline.ts`
4. Pipeline calls Claude → structured response parsed
5. Response → Zustand store → UI components update
6. Session persisted → `/lib/supabase/` → database
