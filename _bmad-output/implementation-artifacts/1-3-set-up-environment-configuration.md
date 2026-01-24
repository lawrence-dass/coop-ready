# Story 1.3: Set Up Environment Configuration

Status: ready-for-dev

## Story

As a developer,
I want environment variables configured for local development and production,
So that API keys are secure and the app works in all environments.

## Acceptance Criteria

1. **Given** the project is initialized
   **When** environment files are configured
   **Then** `.env.local` contains all required variables (Supabase URL/keys, Anthropic API key)

2. **Given** `.env.example` is created
   **When** a new developer clones the repository
   **Then** they can use `.env.example` as a template without needing to know which variables are required

3. **Given** environment variables are set
   **When** the app starts
   **Then** server-only variables are NOT prefixed with `NEXT_PUBLIC_` (to prevent exposure)

4. **Given** all environment variables are configured
   **When** the app connects to services
   **Then** the app successfully connects to Supabase Auth and Claude API

## Tasks / Subtasks

- [ ] **Task 1: Create Environment Template** (AC: #2)
  - [ ] Create `.env.example` with all required variable names
  - [ ] Document which variables are for Supabase (URL, anon key, service role key)
  - [ ] Document which variables are for Anthropic (API key)
  - [ ] Include comments explaining each variable's purpose
  - [ ] Ensure no actual secrets are included in `.env.example`

- [ ] **Task 2: Configure Local Development Environment** (AC: #1, #3)
  - [ ] Create `.env.local` (or `.env.development.local` if preferred)
  - [ ] Set `NEXT_PUBLIC_SUPABASE_URL` (from Supabase project settings)
  - [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase Auth settings)
  - [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (server-only, NOT prefixed with NEXT_PUBLIC_)
  - [ ] Set `ANTHROPIC_API_KEY` (server-only, NOT prefixed with NEXT_PUBLIC_)
  - [ ] Verify variables are correctly named per Next.js conventions

- [ ] **Task 3: Update .gitignore** (AC: #1, #3)
  - [ ] Ensure `.env.local` is in `.gitignore`
  - [ ] Ensure `.env.development.local` is in `.gitignore` (if used)
  - [ ] Ensure no `.env.*` files with actual secrets can be accidentally committed

- [ ] **Task 4: Document Environment Setup** (AC: #1, #2)
  - [ ] Add/update README.md with "Environment Setup" section
  - [ ] Document how to obtain Supabase credentials (link to Supabase console)
  - [ ] Document how to obtain Anthropic API key (link to Anthropic dashboard)
  - [ ] Provide copy-paste template for `.env.local` based on `.env.example`
  - [ ] Include warning about not committing `.env.local`

- [ ] **Task 5: Verify Connection** (AC: #4)
  - [ ] Test that `npm run dev` starts without environment variable errors
  - [ ] Verify Supabase client can connect (check browser console for auth errors)
  - [ ] Create minimal test that verifies environment variables are loaded correctly
  - [ ] Document any connection issues and troubleshooting steps in README

## Dev Notes

### Critical Environment Setup

**Supabase Configuration:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your project's URL from Supabase dashboard (Settings → General → Project URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous/public key from Supabase Auth settings
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations (NEVER expose to client)

**Anthropic Configuration:**
- `ANTHROPIC_API_KEY`: Your Anthropic API key (server-side only)

**Next.js Environment Variable Rules:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Server-only variables (no prefix) are accessible only in Server Components and API routes
- Never prefixed a secret (like API keys) with `NEXT_PUBLIC_`

### Previous Story Intelligence (Story 1.2)

From Story 1.2 (Supabase Database Schema):
- Supabase project is already initialized in `/supabase/` directory
- `supabase/config.toml` created with project configuration
- Migrations directory exists at `/supabase/migrations/`
- RLS policies configured for anonymous sessions
- **Learning**: The Supabase client needs connection credentials to reach the project

### Git Pattern from Recent Commits

Story 1.2 pattern followed:
- Feature branch: `feature/1-3-env-config` ✅ (auto-created)
- Commit message format: `feat(story-1-3): Set up environment configuration`

### Architecture Compliance

**From architecture-decisions.md:**
- Next.js environment variables: Yes, using `.env.local` ✅
- Server-only secrets: NOT prefixed with NEXT_PUBLIC_ ✅
- Supabase client initialization: Requires connection variables ✅

**From project-context.md:**
- Database: Supabase (requires URL and keys) ✅
- LLM: Anthropic Claude (requires API key, server-side only) ✅
- Naming: Use snake_case for env var names (e.g., `SUPABASE_URL`) ✅

**From CLAUDE.md & .claude/post-merge-workflow.md:**
- This is Story 1.3, following Story 1.2 (Supabase setup)
- After this story: Story 1.4 (Core types and ActionResponse pattern)
- Constraint: Story 1.3 must be complete before Story 1.4 (type definitions need env vars available)

### Technology Stack Context

**Next.js 16.x with TypeScript:**
- App Router means environment variables are handled via Next.js built-in support
- `.env.local` is automatically loaded in development
- `.env.production` can be created for production environment
- TypeScript can have types generated for env vars (optional enhancement)

**Supabase Client Library:**
From Story 1.1 dependencies installed:
- `@supabase/supabase-js`: Client library
- `@supabase/ssr`: Server-side rendering support for Supabase
- Both require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to initialize

**Anthropic API:**
From Story 1.1 dependencies installed:
- `@langchain/anthropic`: LangChain integration
- `@langchain/core`: Core pipeline
- Both will use `ANTHROPIC_API_KEY` for API requests (must be server-side only)

### Supabase Client Initialization Pattern

From Story 1.2 completed setup:
```
Supabase Project Created
       ↓
Migrations Applied (sessions table, RLS)
       ↓
config.toml Created
       ↓
CLIENT NEEDS: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY ← Story 1.3 provides these
       ↓
App can authenticate users & access database
```

### File Structure Notes

After this story, project structure will include:
```
/
├── .env.example         ← Template for all env vars (committed to git)
├── .env.local          ← Actual values (NOT committed, in .gitignore)
├── .gitignore          ← Updated to protect .env.local
├── README.md           ← Environment setup documentation added
├── app/
│   ├── layout.tsx      ← Can initialize Supabase client with env vars
│   └── page.tsx
├── lib/
│   ├── supabase/
│   │   └── client.ts   ← Will use NEXT_PUBLIC_SUPABASE_* env vars here
│   └── ai/
│       └── client.ts   ← Will use ANTHROPIC_API_KEY for API calls
└── supabase/
    └── config.toml     ← Already exists from Story 1.2
```

### Error Prevention Guardrails

**Common Mistakes This Story Prevents:**
1. ❌ Committing `.env.local` with real secrets → `.gitignore` updated to prevent this
2. ❌ Prefixing `ANTHROPIC_API_KEY` with `NEXT_PUBLIC_` → Guardrail: Document as server-only
3. ❌ Wrong Supabase credential names → `.env.example` serves as canonical reference
4. ❌ Missing environment variable on server startup → Task 5 verifies connection works
5. ❌ Developers not knowing how to set up environment → README documentation explains each variable

### Testing the Configuration (Manual)

Once Story 1.3 is complete, verify with:
```bash
# 1. Check that .env.local exists and isn't committed
git status  # Should show .env.local is NOT in the list

# 2. Start dev server - should not error on missing vars
npm run dev

# 3. Check browser console - no Supabase auth errors
# Expected: Supabase client initializes silently

# 4. Optional: Add debug log to verify env vars loaded
# In lib/supabase/client.ts or layout.tsx:
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### References

- [Source: project-context.md#Technology Stack & Versions] - All env variables documented
- [Source: project-context.md#Critical Implementation Rules] - ActionResponse pattern
- [Source: architecture/architecture-decisions.md#Environment Variables] - Env var strategy
- [Source: _bmad-output/implementation-artifacts/1-2-configure-supabase-database-schema.md] - What Story 1.3 depends on
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript/introduction)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Completion Notes List

_To be filled in by developer after implementation_

### File List

**To Create:**
- `.env.example` - Template with all required variable names (no secrets)
- `.env.local` - Actual configuration (will be in .gitignore)
- Updates to `README.md` - Environment setup section with instructions

**To Modify:**
- `.gitignore` - Ensure `.env.local` is ignored

**Testing:**
- Manual verification via `npm run dev` and checking Supabase connection

### Change Log

- 2026-01-24: Story 1.3 created - Environment configuration template and documentation
