# CoopReady

![E2E Tests](https://github.com/lawrence-dass/coop-ready/actions/workflows/e2e-tests.yml/badge.svg)

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

- Node.js 20+ (see `.nvmrc` for exact version)
  - Using [nvm](https://github.com/nvm-sh/nvm): `nvm use`
  - Using [fnm](https://github.com/Schniz/fnm): `fnm use`
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

## OpenAI Setup

CoopReady uses OpenAI's GPT-4o-mini model for resume analysis. To get started:

1. **Obtain an API key**:
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Sign up or log in
   - Navigate to API Keys and create a new secret key
   - Copy the key immediately (you won't see it again)

2. **Add to environment**:
   ```bash
   # In .env.local
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Important**:
   - Never commit `.env.local` to version control
   - Never expose this key in client-side code
   - Keep it server-side only (no `NEXT_PUBLIC_` prefix)

4. **Verify setup**: Check server console for initialization message

For detailed setup instructions, troubleshooting, and best practices, see [docs/OPENAI_SETUP.md](docs/OPENAI_SETUP.md).

## Analysis Engine

CoopReady uses OpenAI's GPT-4o-mini to analyze resumes and calculate ATS compatibility scores.

### Scoring Formula

The ATS score (0-100) is calculated using a weighted breakdown:

| Category | Weight | Description |
|----------|--------|-------------|
| **Keywords** | 40% | Keyword density and job description match |
| **Skills** | 30% | Technical/soft skills alignment with requirements |
| **Experience** | 20% | Relevant background and quantified achievements |
| **Format** | 10% | ATS-parseable structure and section clarity |

**Score Interpretation:**
- **70-100**: Excellent fit - Strong match with job requirements
- **50-70**: Good fit - Qualified with minor optimization opportunities
- **30-50**: Fair fit - Some relevant experience but improvements needed
- **0-30**: Poor fit - Major gaps in qualifications or ATS compatibility

### Context-Aware Scoring

Analysis adapts to user experience level:
- **Students**: Values academic projects, coursework, certifications equally with internships
- **Career Changers**: Emphasizes transferable skills and demonstrates growth narrative
- **Experienced**: Focuses on quantified achievements and leadership impact

### Cost Estimates

Average cost per analysis (GPT-4o-mini):
- **Token usage**: 1,000-1,500 tokens per analysis
- **Cost**: $0.001-0.003 per scan
- **Free tier** (3 scans/month): ~$0.01/user
- **Paid tier** (30 scans/month): ~$0.05/user

For detailed pricing and optimization tips, see [docs/OPENAI_SETUP.md](docs/OPENAI_SETUP.md).

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
