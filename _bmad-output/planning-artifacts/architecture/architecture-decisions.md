---
parent: architecture.md
section: decisions
last_updated: 2026-01-24
---

# Architecture Decisions

_Technology choices, starter template evaluation, and core architectural decisions._

---

## Starter Template Evaluation

### Primary Technology Domain

**AI-Native Full-Stack Web App** based on project requirements:
- LLM pipeline orchestration (LangChain)
- File processing (PDF/DOCX parsing)
- Real-time UI updates (progress states)
- Server-side API calls (Claude API)

### Starter Options Considered

| Option | Pros | Cons |
|--------|------|------|
| create-next-app + shadcn | Official, minimal, aligns with PRD | Manual setup for Supabase, LangChain |
| Vercel Supabase starter | Auth pre-configured | Missing shadcn, more cleanup needed |
| Community starters | More batteries included | May include unwanted dependencies |

### Selected Starter: create-next-app + shadcn/ui init

**Rationale for Selection:**
- Matches PRD tech stack exactly
- Official tooling = best maintenance
- Minimal opinionation allows custom architecture
- shadcn/ui's copy-paste model aligns with component strategy

**Initialization Commands:**

```bash
# Create Next.js project with defaults (TypeScript, Tailwind, App Router, Turbopack)
npx create-next-app@latest submit_smart --yes

# Navigate to project
cd submit_smart

# Initialize shadcn/ui
npx shadcn@latest init

# Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @langchain/anthropic @langchain/core langchain
npm install ai
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install sonner
npm install lucide-react
npm install react-dropzone
npm install unpdf mammoth
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.x with strict mode
- Node.js runtime for API routes
- Edge-compatible for Vercel deployment

**Styling Solution:**
- Tailwind CSS with CSS variables
- shadcn/ui theming system
- `cn()` utility for conditional classes

**Build Tooling:**
- Turbopack for development
- Next.js bundler for production
- Automatic code splitting

**Code Organization:**
- App Router file-based routing
- `/app` directory structure
- Server Components by default

**Development Experience:**
- Fast Refresh (HMR)
- TypeScript error overlay
- ESLint integration

**Note:** Project initialization using these commands should be the first implementation story.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Server Actions vs API Routes pattern
2. LLM pipeline execution strategy
3. Database schema and migrations

**Important Decisions (Shape Architecture):**
1. File storage strategy
2. Error boundary approach
3. Cost tracking implementation

**Deferred Decisions (Post-MVP):**
1. Caching strategy (Redis for V1.5+)
2. Rate limiting implementation
3. Fallback LLM provider

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase (Postgres) | PRD requirement, built-in auth |
| ORM/Query | Raw SQL + Supabase client | Simpler for MVP, no ORM overhead |
| Migrations | SQL files in `/supabase/migrations/` | Version controlled, CI-friendly |
| RLS | Row-level security on all tables | User data isolation |
| File Storage | In-memory parsing (V0.1) | Simpler, store extracted text only |

**Schema Design Approach:**
- Sessions table: Core optimization data
- User data isolated via `user_id` foreign key
- Anonymous sessions linked via `anonymous_id`
- Migration to authenticated user supported

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Provider | Supabase Auth | PRD requirement |
| V0.1 Auth | Anonymous sessions | Zero-friction trial |
| V1.0 Auth | Email + Google OAuth | User retention |
| API Key Storage | Server-side only | Security requirement |
| Prompt Injection Defense | XML tag isolation | PRD requirement |

**Security Patterns:**
- All LLM calls server-side only
- User content wrapped in XML tags (data, not instructions)
- No PII in logs
- HTTPS enforced (Vercel default)

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Quick Operations | Server Actions | Type-safe, simple |
| LLM Pipeline | API Route (`/api/optimize`) | 60s timeout needed |
| Response Pattern | ActionResponse<T> | PRD requirement, consistent error handling |
| Error Classification | Typed error codes | Clear retry logic |

**ActionResponse Pattern (Enforced):**

```typescript
type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } }
```

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | Zustand | PRD requirement, simple |
| Component Library | shadcn/ui | UX spec requirement |
| Forms | React Hook Form + Zod | PRD requirement |
| Loading States | ProgressSteps component | UX spec requirement |
| Error Boundaries | Global + component-level | LLM operations need granular handling |

**Component Organization:**

```
/components
  /ui/          # shadcn (never edit)
  /forms/       # Form components
  /shared/      # Reusable business components
  /features/    # Feature-specific components
```

### LLM Pipeline Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | LangChain.js | PRD requirement |
| Execution | Sequential chain (V0.1) | Simpler, reliable |
| Streaming | Batch response (V0.1) | Simpler implementation |
| Judge Loop | V1.0 only | Reduce V0.1 complexity |
| Retry Strategy | 2x exponential backoff | Balance reliability/cost |
| Timeout | 60 seconds | PRD requirement |

**Pipeline Structure:**

```
Parse → Analyze → Optimize → [Judge (V1.0)]
                     ↓
              ActionResponse<Suggestions>
```

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel | PRD requirement |
| Environment | Vercel env vars | Secure, per-environment |
| Logging | Console + Vercel Logs | Simple for MVP |
| Cost Tracking | Token logging per call | PRD requirement |
| Monitoring | Vercel Analytics (V1.0) | Defer complexity |

**Environment Configuration:**
- `.env.local` for development
- Vercel dashboard for production
- Never commit secrets

### Decision Impact Analysis

**Implementation Sequence:**
1. Project setup (starter + deps)
2. Supabase schema + RLS
3. Auth flow (anonymous)
4. File parsing layer
5. LLM pipeline (API route)
6. Frontend components
7. Session persistence

**Cross-Component Dependencies:**
- Auth affects session persistence
- LLM pipeline affects error handling
- Schema affects all data operations
