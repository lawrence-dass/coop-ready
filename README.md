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

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API via LangChain.js
- **State:** Zustand

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY and Supabase credentials

# Start development server
npm run dev
```

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

## License

MIT
