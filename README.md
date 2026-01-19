# CoopReady

AI-powered resume optimization tool for students and career changers entering tech.

## Overview

CoopReady helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) by providing:

- **ATS Score Analysis** - Get a 0-100 score showing how well your resume matches a job description
- **Smart Bullet Rewrites** - AI-powered suggestions to strengthen your experience descriptions
- **Transferable Skills Mapping** - Identify and highlight relevant skills from non-tech backgrounds
- **Before/After Comparison** - See exactly how suggestions improve your resume

## Target Users

- Students seeking co-ops and internships (limited work experience)
- Career changers transitioning to tech
- International students adapting to North American resume styles

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14+ | App Router, Server Components |
| TypeScript | Strict mode enabled |
| Tailwind CSS | Styling with shadcn/ui components |
| Supabase | Postgres database, Auth, Storage |
| OpenAI | GPT-4o-mini for resume analysis |
| Stripe | Payment processing |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for payments)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/coopready.git
   cd coopready
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your `.env.local` with:
   - Supabase credentials (URL, Publishable Key, Service Role Key)
   - OpenAI API key
   - Stripe keys

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase admin key (never expose to client) |
| `OPENAI_API_KEY` | Server | OpenAI API key |
| `STRIPE_SECRET_KEY` | Server | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright E2E tests |

## Project Structure

```
coopready/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   └── ...                # Feature components
├── lib/
│   ├── supabase/          # Supabase client utilities
│   └── utils.ts           # Utility functions
└── ...
```

## Documentation

- [PRD](/_bmad-output/planning-artifacts/prd.md) - Product Requirements Document
- [Architecture](/_bmad-output/planning-artifacts/architecture.md) - Technical Architecture
- [Project Context](/_bmad-output/project-context.md) - AI Agent Guidelines

## License

Private - All rights reserved.
