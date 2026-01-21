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

### Experience-Level-Aware Analysis

CoopReady personalizes resume analysis based on your experience level, ensuring you get relevant feedback for your situation.

**Setting Your Experience Level:**

During onboarding (or in Profile Settings), select one of three experience levels:
- **Student / Recent Graduate**: Currently in school or graduated within 2 years
- **Career Changer**: Transitioning to tech from a non-tech background
- **Experienced Professional**: 2+ years of tech work experience

**How Experience Level Affects Analysis:**

| Level | What We Optimize For | Feedback Focus |
|-------|---------------------|----------------|
| **Student** | Academic projects, internships, coursework, relevant certifications | Translating academic work to professional language; showing how school projects demonstrate real-world capability; not penalizing limited years of professional experience |
| **Career Changer** | Transferable skills, bootcamp training, personal projects, tech commitment | Mapping existing experience to tech terminology; identifying and emphasizing transferable skills; highlighting learning ability and growth |
| **Experienced** | Quantified impact, architectural decisions, leadership, scale | Showcasing professional impact; metrics and scope of influence; technical depth and senior-level capabilities |

**Examples of Experience-Aware Feedback:**

*For Students:*
- "Your academic projects in data structures demonstrate solid software engineering fundamentals"
- "Include your GPA if 3.5+ to strengthen your candidacy for entry-level roles"
- "Your internship experience shows practical application of classroom learning"

*For Career Changers:*
- "Your project management background translates well to agile development practices"
- "Emphasize how your bootcamp capstone project demonstrates full-stack capabilities"
- "Your previous sales experience shows strong communication skills valued in tech teams"

*For Experienced Professionals:*
- "Quantify the impact of your architecture decisions (e.g., 'Redesigned API reducing latency by 60%')"
- "Highlight team leadership and mentorship to demonstrate senior-level readiness"
- "Show scale: 'Managed system handling 10M+ requests/day'"

**Why This Matters:**

Traditional resume analysis penalizes students for lacking years of experience and overlooks career changers' valuable transferable skills. CoopReady's experience-aware approach ensures feedback is relevant and actionable for YOUR situation, not a one-size-fits-all checklist.

**Note:** You can update your experience level anytime in Profile Settings as you gain more experience or change career stages.

### Keyword Detection

CoopReady automatically extracts and analyzes keywords from job descriptions to identify:

**What's Detected:**
- **Technical Skills**: Programming languages, frameworks, tools, databases
- **Soft Skills**: Communication, leadership, teamwork, problem-solving
- **Certifications**: AWS, GCP, Azure, Kubernetes, Docker
- **Experience Markers**: Years of experience, seniority level keywords
- **Industry Terms**: Domain-specific vocabulary

**Keyword Variants:**
The system recognizes common abbreviations and alternative forms:
- "JS" matches "JavaScript"
- "TS" matches "TypeScript"
- "React" matches "ReactJS" or "React.js"
- "Node" matches "NodeJS" or "Node.js"
- "API" matches "REST API" or "RESTful API"
- "DB" matches "Database"
- "SQL" matches "PostgreSQL" or "MySQL"

**Priority Levels:**
Missing keywords are categorized by importance:
- **High Priority**: Required skills explicitly stated as "must have"
- **Medium Priority**: Preferred skills or nice-to-have technologies
- **Low Priority**: Keywords mentioned once or in passing

**Coverage Metric:**
- Shows percentage of high-priority keywords found in resume
- ≥90% coverage displays "Great job! Your resume covers the key requirements"
- Top 10-15 missing keywords displayed for actionable optimization

### Section-Level Scoring

CoopReady provides detailed scores for individual resume sections to help you understand exactly where to focus your optimization efforts.

**Sections Scored:**
- **Experience**: Work history, relevance to target role, quantified achievements
- **Education**: Degree relevance, institution prestige, GPA (if strong), coursework
- **Skills**: Technical and soft skills alignment with job requirements
- **Projects**: Complexity, relevance, technical skills demonstrated
- **Summary/Objective**: Personalization, keyword density, clarity of intent

Each section receives:
- **Score (0-100)**: Overall quality and relevance to job description
- **Explanation**: 2-3 sentences describing why it scored that way
- **Strengths**: What's working well in this section (specific examples)
- **Weaknesses**: Specific issues to address (actionable feedback)

**Only sections that exist in your resume are scored** - no empty sections means focused, actionable feedback.

**What Makes a Section Score High/Low:**

| Section | High Score Indicators | Low Score Indicators |
|---------|----------------------|---------------------|
| **Experience** | Relevant roles, quantified achievements, keyword match, career progression | Vague descriptions, no metrics, irrelevant jobs, gaps |
| **Education** | Relevant degree, strong GPA (3.5+), notable school, relevant coursework | Unrelated degree, no GPA listed, missing relevant details |
| **Skills** | Comprehensive coverage of required tech, well-categorized, specific tools | Missing key requirements, too generic, poorly organized |
| **Projects** | Relevant to target role, technical complexity, clear impact | Vague descriptions, no technical details, irrelevant projects |
| **Summary** | Personalized to job, high keyword density, clear value proposition | Generic, keyword-light, unclear intent |

**Example Section Score:**
```
Experience Section: 75/100
Explanation: "Experience section shows strong relevance with 3+ years in React and Node.js.
             Quantified achievements present in 2 bullet points. Recent roles align well
             with job requirements."

Strengths:
  - Relevant tech stack experience (React, Node.js, AWS)
  - Quantified impact in bullet points
  - Progressive career growth demonstrated

Weaknesses:
  - Could add more quantified metrics to older roles
  - Missing Docker/Kubernetes experience mentioned in JD
```

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
