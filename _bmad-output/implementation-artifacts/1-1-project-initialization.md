# Story 1.1: Project Initialization

Status: ready-for-dev

## Story

As a **developer**,
I want **the project initialized with Next.js 14, Supabase, and all required dependencies**,
So that **I have a working foundation to build the application on**.

## Acceptance Criteria

1. **AC1: Project Creation**
   - **Given** the project does not exist
   - **When** I run the initialization command `npx create-next-app -e with-supabase coopready`
   - **Then** a new Next.js 14 project is created with App Router
   - **And** Supabase auth is pre-configured with middleware
   - **And** TypeScript strict mode is enabled

2. **AC2: Dependency Installation**
   - **Given** the project is initialized
   - **When** I install additional dependencies (stripe, @stripe/stripe-js, openai, pdf-parse, mammoth, @react-pdf/renderer, docx, zod, react-hook-form)
   - **Then** all packages are added to package.json
   - **And** the project builds without errors

3. **AC3: Environment Configuration**
   - **Given** the project has dependencies installed
   - **When** I create the `.env.local` file with Supabase credentials
   - **Then** environment variables are loaded correctly
   - **And** Supabase client can connect to the database

4. **AC4: shadcn/ui Setup**
   - **Given** the project structure exists
   - **When** I run `npx shadcn@latest init`
   - **Then** shadcn/ui is configured with Tailwind CSS
   - **And** the `components/ui/` directory is created

5. **AC5: Environment Template**
   - **Given** the project is configured
   - **When** I check the repository
   - **Then** `.env.example` exists with placeholder values for all required environment variables
   - **And** `.env.local` is in `.gitignore`

## Tasks / Subtasks

- [ ] **Task 1: Create Next.js Project** (AC: 1)
  - [ ] 1.1 Run `npx create-next-app -e with-supabase coopready`
  - [ ] 1.2 Verify Next.js 14 with App Router is installed
  - [ ] 1.3 Verify TypeScript strict mode in tsconfig.json
  - [ ] 1.4 Verify Supabase middleware is present
  - [ ] 1.5 Verify project builds: `npm run build`

- [ ] **Task 2: Install Additional Dependencies** (AC: 2)
  - [ ] 2.1 Install payment deps: `npm install stripe @stripe/stripe-js`
  - [ ] 2.2 Install AI deps: `npm install openai`
  - [ ] 2.3 Install file parsing deps: `npm install pdf-parse mammoth`
  - [ ] 2.4 Install document generation deps: `npm install @react-pdf/renderer docx`
  - [ ] 2.5 Install form/validation deps: `npm install zod react-hook-form @hookform/resolvers`
  - [ ] 2.6 Verify all packages in package.json
  - [ ] 2.7 Run `npm run build` to verify no errors

- [ ] **Task 3: Configure shadcn/ui** (AC: 4)
  - [ ] 3.1 Run `npx shadcn@latest init`
  - [ ] 3.2 Select default style and colors when prompted
  - [ ] 3.3 Verify `components.json` is created
  - [ ] 3.4 Verify `components/ui/` directory exists
  - [ ] 3.5 Install initial UI components: `npx shadcn@latest add button card form input label sonner`

- [ ] **Task 4: Create Environment Configuration** (AC: 3, 5)
  - [ ] 4.1 Create `.env.example` with all required variables
  - [ ] 4.2 Verify `.env.local` is in `.gitignore`
  - [ ] 4.3 Create `.env.local` from template (for local development)
  - [ ] 4.4 Document environment variable requirements

- [ ] **Task 5: Final Verification** (AC: 1-5)
  - [ ] 5.1 Run `npm run dev` and verify app starts
  - [ ] 5.2 Verify Supabase connection works (check auth callback route)
  - [ ] 5.3 Run `npm run build` for final build verification
  - [ ] 5.4 Run `npm run lint` to ensure no linting errors

## Dev Notes

### Architecture Compliance

**CRITICAL - Follow these patterns exactly:**

1. **Project Structure** (from architecture.md)
   - The starter template provides the base structure
   - Do NOT modify the auto-generated Supabase files
   - Maintain the App Router directory structure

2. **TypeScript Configuration**
   - Ensure `strict: true` in tsconfig.json
   - No `any` types allowed
   - This is a critical requirement for type safety

3. **File Organization Pattern**
   ```
   coopready/
   ├── app/
   │   ├── (auth)/           # Auth routes (from starter)
   │   ├── (dashboard)/      # Protected routes (to be created later)
   │   └── api/              # API routes
   ├── components/
   │   └── ui/               # shadcn/ui components
   ├── lib/
   │   └── supabase/         # Supabase clients (from starter)
   └── ...
   ```

### Required Environment Variables

Create `.env.example` with these variables:

```bash
# Supabase - Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI - Required for AI features
OPENAI_API_KEY=your_openai_api_key

# Stripe - Required for payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**IMPORTANT:** Never prefix server-only keys with `NEXT_PUBLIC_`

### Package Versions (Latest Stable)

```json
{
  "dependencies": {
    "stripe": "latest",
    "@stripe/stripe-js": "latest",
    "openai": "latest",
    "pdf-parse": "latest",
    "mammoth": "latest",
    "@react-pdf/renderer": "latest",
    "docx": "latest",
    "zod": "latest",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest"
  }
}
```

### shadcn/ui Initial Components

Install these base components for the foundation:
- `button` - Primary interactive element
- `card` - Container component for content
- `form` - Form handling integration
- `input` - Text input fields
- `label` - Form labels
- `sonner` - Toast notifications (per architecture decision)

Command: `npx shadcn@latest add button card form input label sonner`

### Project Structure Notes

**Alignment with Architecture:**
- This story establishes the foundation that ALL subsequent stories build upon
- The Supabase starter provides auth middleware, Supabase clients, and route structure
- shadcn/ui provides the UI component foundation
- All additional directories (actions/, hooks/, types/, config/) will be created in later stories as needed

**What This Story Does NOT Include:**
- Database schema creation (Story 1.2+ will handle via Supabase Dashboard)
- Custom layouts (Story 1.2: Design System & Layout Shell)
- Auth pages styling (Story 1.3-1.6)
- Protected dashboard routes (Story 1.7)

### Testing the Setup

After completing all tasks:

1. **Dev Server Test:**
   ```bash
   npm run dev
   # Navigate to http://localhost:3000
   # Should see the starter landing page
   ```

2. **Build Test:**
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Lint Test:**
   ```bash
   npm run lint
   # Should pass with no errors
   ```

### References

- [Source: architecture.md#Starter Template Evaluation] - Starter selection rationale
- [Source: architecture.md#Selected Starter: Official Supabase Starter] - Initialization command
- [Source: architecture.md#Additional Setup Required] - Package list
- [Source: architecture.md#Environment Variables] - Env var configuration
- [Source: architecture.md#Project Organization] - Directory structure
- [Source: project-context.md#Technology Stack & Versions] - Version requirements
- [Source: project-context.md#Environment Variables] - Env var scope rules
- [Source: epics.md#Story 1.1: Project Initialization] - Story requirements

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

_(To be filled by dev agent during implementation)_

### Completion Notes List

_(To be filled by dev agent during implementation)_

### File List

_(Files created/modified during implementation will be listed here)_
