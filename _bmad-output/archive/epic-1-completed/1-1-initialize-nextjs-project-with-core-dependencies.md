# Story 1.1: Initialize Next.js Project with Core Dependencies

Status: done

## Story

As a developer,
I want the project initialized with Next.js 15, TypeScript, and all required dependencies,
So that I can start building features on a properly configured codebase.

## Acceptance Criteria

1. **Given** no existing project
   **When** the initialization script is run
   **Then** a Next.js 15 project is created with App Router and TypeScript

2. **Given** Next.js project exists
   **When** shadcn/ui is initialized
   **Then** the design system is configured with purple/indigo primary color (#635BFF)

3. **Given** project structure exists
   **When** dependencies are installed
   **Then** all core dependencies are present (Supabase, LangChain, Zustand, React Hook Form, Zod, etc.)

4. **Given** all dependencies installed
   **When** `npm run dev` is executed
   **Then** the project runs successfully without errors

## Tasks / Subtasks

- [x] **Task 1: Initialize Next.js Project** (AC: #1)
  - [x] Run `npx create-next-app@latest . --yes` (use current directory since repo exists)
  - [x] Verify TypeScript, Tailwind, App Router, Turbopack are enabled
  - [x] Confirm `/app` directory structure created

- [x] **Task 2: Initialize shadcn/ui** (AC: #2)
  - [x] Run `npx shadcn@latest init`
  - [x] Select default style options
  - [x] Configure CSS variables for theming
  - [x] Verify `components.json` created
  - [x] Verify `/components/ui/` directory exists

- [x] **Task 3: Install Core Dependencies** (AC: #3)
  - [x] Install Supabase: `npm install @supabase/supabase-js @supabase/ssr`
  - [x] Install LangChain: `npm install @langchain/anthropic @langchain/core langchain`
  - [x] Install AI SDK: `npm install ai`
  - [x] Install State: `npm install zustand`
  - [x] Install Forms: `npm install react-hook-form zod @hookform/resolvers`
  - [x] Install UI: `npm install sonner lucide-react react-dropzone`
  - [x] Install Parsers: `npm install unpdf mammoth`

- [x] **Task 4: Create Project Structure** (AC: #1)
  - [x] Create `/lib/ai/` directory
  - [x] Create `/lib/supabase/` directory
  - [x] Create `/lib/parsers/` directory
  - [x] Create `/lib/validations/` directory
  - [x] Create `/actions/` directory
  - [x] Create `/store/` directory
  - [x] Create `/types/` directory
  - [x] Create `/components/forms/` directory
  - [x] Create `/components/shared/` directory

- [x] **Task 5: Verify Setup** (AC: #4)
  - [x] Run `npm run dev`
  - [x] Confirm app loads at localhost:3000
  - [x] Verify no TypeScript errors
  - [x] Verify Tailwind styles work

## Dev Notes

### CRITICAL: This is a Greenfield Project Initialization

This story initializes the project IN THE EXISTING repository. The repo already has:
- `.gitignore`
- `README.md`
- `_bmad-output/` (planning artifacts)
- `CLAUDE.md`

**DO NOT** run `create-next-app` with a new directory name. Use `.` to initialize in current directory.

### Exact Initialization Commands

```bash
# Step 1: Initialize Next.js in current directory
npx create-next-app@latest . --yes --typescript --tailwind --eslint --app --turbopack --src-dir=false --import-alias="@/*"

# Step 2: Initialize shadcn/ui
npx shadcn@latest init

# Step 3: Install all dependencies (single command)
npm install @supabase/supabase-js @supabase/ssr @langchain/anthropic @langchain/core langchain ai zustand react-hook-form zod @hookform/resolvers sonner lucide-react react-dropzone unpdf mammoth
```

### Project Structure to Create

After initialization, create these directories:

```
/lib
  /ai/           # ALL LLM operations (isolated)
  /supabase/     # ALL database operations (isolated)
  /parsers/      # File parsing (PDF/DOCX)
  /validations/  # Zod schemas

/actions         # Server Actions
/store           # Zustand stores
/types           # Shared type definitions

/components
  /ui/           # shadcn (auto-created, NEVER edit)
  /forms/        # Form components
  /shared/       # Reusable business components
```

### Architecture Compliance

| Requirement | Implementation |
|-------------|----------------|
| App Router | Enabled via `--app` flag |
| TypeScript | Enabled via `--typescript` flag |
| Tailwind CSS | Enabled via `--tailwind` flag |
| Turbopack | Enabled via `--turbopack` flag |
| Import alias | `@/*` for clean imports |

### Dependencies Reference

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Server-side Supabase |
| `@langchain/anthropic` | Claude API integration |
| `@langchain/core` | LangChain core |
| `langchain` | Pipeline orchestration |
| `ai` | Vercel AI SDK |
| `zustand` | Client state management |
| `react-hook-form` | Form handling |
| `zod` | Schema validation |
| `@hookform/resolvers` | Zod + RHF integration |
| `sonner` | Toast notifications |
| `lucide-react` | Icons |
| `react-dropzone` | File upload |
| `unpdf` | PDF text extraction |
| `mammoth` | DOCX text extraction |

### References

- [Source: architecture/architecture-decisions.md#Initialization Commands]
- [Source: architecture/architecture-patterns.md#Project Organization]
- [Source: project-context.md#Technology Stack & Versions]
- [Source: project-context.md#Directory Structure Rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- **Task 1**: Initialized Next.js 16.1.4 (latest) with TypeScript, Tailwind CSS 4, App Router, and Turbopack. Created in temp directory then merged into existing repo due to create-next-app restrictions on non-empty directories.
- **Task 2**: Configured shadcn/ui manually with components.json, CSS variables in globals.css with purple/indigo primary color (HSL 245 100% 60% ≈ #635BFF), and created lib/utils.ts with cn() helper.
- **Task 3**: All 14 core dependencies installed successfully via npm.
- **Task 4**: Created all 9 required directories with .gitkeep files for git tracking.
- **Task 5**: Verified build success, TypeScript compilation, ESLint, and dev server startup.

### File List

**Created:**
- `components/ui/.gitkeep`
- `app/` (directory with layout.tsx, page.tsx, globals.css, favicon.ico)
- `public/` (directory with default Next.js assets)
- `components/ui/` (empty, ready for shadcn components)
- `components/forms/.gitkeep`
- `components/shared/.gitkeep`
- `lib/utils.ts`
- `lib/ai/.gitkeep`
- `lib/supabase/.gitkeep`
- `lib/parsers/.gitkeep`
- `lib/validations/.gitkeep`
- `actions/.gitkeep`
- `store/.gitkeep`
- `types/.gitkeep`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `next-env.d.ts` (auto-generated, not tracked)
- `postcss.config.mjs`
- `eslint.config.mjs`
- `components.json`

**Modified:**
- `app/globals.css` (code review: fixed primary color to exact #635BFF)
- `app/layout.tsx` (code review: updated metadata to SubmitSmart branding)
- `_bmad-output/project-context.md` (code review: updated Tailwind version to 4.x)

### Change Log

- 2026-01-24: Story 1.1 implemented - Project initialized with Next.js 16.1.4, TypeScript 5, Tailwind CSS 4, shadcn/ui, and all core dependencies
- 2026-01-24: Code review fixes applied - Fixed primary color HSL, updated metadata, added missing .gitkeep, corrected docs
