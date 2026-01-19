# Architecture Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data validation: Zod
- Auth pattern: Supabase RLS + Middleware hybrid
- API pattern: Server Actions + Route Handlers hybrid
- Rate limiting: Database-based tracking

**Important Decisions (Shape Architecture):**
- State management: RSC + URL state + Zustand (if needed)
- Form handling: React Hook Form + Zod
- Component organization: Feature-based folders
- Error handling: Consistent shape with graceful degradation

**Deferred Decisions (Post-MVP):**
- Caching layer (Redis/Upstash)
- Advanced monitoring (Sentry, LogRocket)
- Custom CI/CD pipeline

## Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Validation** | Zod | TypeScript-first, shadcn/ui compatible, Server Action friendly |
| **Schema Management** | Supabase Dashboard → SQL migrations | Fast iteration for MVP, version control when stable |
| **Caching** | None (MVP) | Scale doesn't warrant complexity; Next.js built-in for static |

## Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Authorization** | RLS + Middleware hybrid | Defense-in-depth; RLS protects data, middleware protects routes |
| **Sessions** | Cookie-based via @supabase/ssr | Works with Server Components, auto-refresh |
| **API Keys** | Vercel env vars, server-only | Never exposed to client, encrypted at rest |

## API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Pattern** | Server Actions (mutations) + Route Handlers (webhooks) | Next.js 14 best practice, type-safe |
| **Rate Limiting** | Database-based (scans_this_month column) | No additional service, fits budget |
| **Error Handling** | `{ error: string, code?: string }` shape | Consistent, user-friendly messages, detailed server logs |

**Error Handling Standard:**
- Try/catch in all Server Actions with user-friendly messages
- Log detailed errors server-side (Vercel logs)
- Graceful degradation for OpenAI failures (show retry option)
- Toast notifications for action feedback

## Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | RSC + URL state + Zustand (if needed) | Minimal client state, server-first |
| **Forms** | React Hook Form + Zod | shadcn/ui compatible, client validation |
| **Loading States** | Suspense + Skeletons + Progress indicator | Good UX during AI processing |
| **Components** | Feature-based folders under components/ | Scalable organization |

## Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **CI/CD** | Vercel Git Integration | Zero config, preview deploys, auto-deploy on merge |
| **Environments** | Dev / Preview / Production | Separate Supabase projects per environment |
| **Monitoring** | Vercel Analytics + Logs | Free tier sufficient for MVP |
| **Scaling** | Vercel serverless auto-scale | No containers, keep simple |

**Environment Variables:**

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin access for RLS bypass |
| `OPENAI_API_KEY` | Server | AI analysis |
| `STRIPE_SECRET_KEY` | Server | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Server | Webhook verification |

## Implementation Sequence

1. Project init (starter template)
2. Database schema + RLS policies
3. Auth flow (provided by starter)
4. Core UI components (shadcn/ui)
5. Resume upload + storage
6. AI analysis pipeline
7. Results display + accept/reject
8. Stripe integration
9. Rate limiting

## Cross-Component Dependencies

- Auth → All protected features
- Database schema → Storage, Analysis, Billing
- Error handling standard → All Server Actions
- Component structure → All UI work
