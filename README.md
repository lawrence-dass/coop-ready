# SubmitSmart

An ATS Resume Optimizer that helps job seekers improve their resumes through intelligent content suggestions.

## Philosophy

**We don't generate resumes. We generate understanding.**

Unlike traditional resume builders that produce downloadable documents, SubmitSmart produces content suggestions that users copy-paste into their own resumes. This ensures they:
- Understand what changes they're making
- Can explain their resume in interviews
- Learn patterns for future applications
- Own their professional narrative

## Target Users

| Segment | Key Need |
|---------|----------|
| Co-op Students | Translate academic projects to professional language |
| Master's Students | Convert academic CV to corporate resume |
| Early Career (0-3 yrs) | Maximize limited experience impact |
| Career Changers | Reframe transferable skills |

## Tech Stack

- **Frontend:** Next.js 16, TypeScript 5, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase (PostgreSQL + RLS)
- **AI:** Claude API via LangChain.js
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Parsing:** unpdf (PDF), mammoth (DOCX)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for local Supabase)
- Supabase account (for cloud database) OR local Supabase via Docker
- Anthropic API key ([Get one here](https://console.anthropic.com/settings/keys))

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Edit `.env.local` and configure the following variables:

#### Option A: Local Development (Supabase via Docker)

```bash
# Start local Supabase
npx supabase start

# Use the credentials displayed (already in .env.local by default)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

# Add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-api-xxxxx
```

#### Option B: Cloud Supabase

```bash
# Get credentials from: https://supabase.com/dashboard/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-api-xxxxx
```

#### Apply Database Migrations

```bash
# For local Supabase
npx supabase db reset

# For cloud Supabase
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables Reference

| Variable | Required | Description | Where to Get It |
|----------|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin key | Supabase Dashboard → Settings → API (⚠️ Keep secret!) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key | [Anthropic Console](https://console.anthropic.com/settings/keys) (⚠️ Keep secret!) |

**Security Warning:** Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` to the browser.

## Project Structure

```
/app                 # Next.js App Router pages
/components          # React components
  /ui                # shadcn/ui (do not edit)
  /forms             # Form components
  /shared            # Reusable business components
/lib
  /ai                # LLM operations
  /supabase          # Database operations
  /parsers           # PDF/DOCX parsing
  /validations       # Zod schemas
/actions             # Server Actions
/store               # Zustand stores
/types               # TypeScript types
```

## Documentation

Planning artifacts are in `_bmad-output/planning-artifacts/`:
- `prd.md` - Product Requirements
- `architecture.md` - Technical Architecture
- `ux-design-specification.md` - UX Design Spec

### Verification

- [Epic 1 Verification](docs/EPIC-1-VERIFICATION.md) - Project foundation checklist
- [Epic 8 Verification](docs/EPIC-8-VERIFICATION.md) - User authentication verification checklist

These documents verify that their respective epics are complete and ready for the next phase.

## License

MIT
