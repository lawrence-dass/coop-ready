# SubmitSmart - Product Overview

## What is SubmitSmart?

SubmitSmart is an **AI-powered ATS (Applicant Tracking System) Resume Optimizer** that helps job seekers improve their resumes through intelligent content suggestions. Unlike traditional resume builders that produce downloadable documents, SubmitSmart produces content suggestions that users copy-paste into their own resumes.

**Core Philosophy: "We don't generate resumes. We generate understanding."**

This ensures users:
- Understand what changes they're making
- Can explain their resume in interviews
- Learn patterns for future applications
- Own their professional narrative

---

## The Problem We Solve

### Current Reality for Job Seekers

| Problem | Impact |
|---------|--------|
| **Time-consuming** | Tailoring takes 1-3 hours per application |
| **Guesswork** | Job seekers don't know which keywords matter |
| **ATS rejection** | 75% of resumes rejected by ATS before human review |
| **No feedback** | No way to know why applications fail |

### Why Existing Solutions Fall Short

| Solution | Problem |
|----------|---------|
| Resume builders | Generic content, no job-specific tailoring |
| AI resume writers | Produce documents users don't understand |
| Manual tailoring | Time-consuming, requires expertise |
| ATS scanners | Scoring only, no actionable content |

### Our Solution

A content optimization platform that:
1. **Analyzes** the gap between resume and target job description
2. **Generates** tailored content suggestions with explanations
3. **Educates** users on *why* each change improves their chances
4. **Validates** improvements through before/after comparison

---

## Target Users

| Segment | Share | Key Need |
|---------|-------|----------|
| **Co-op Students** | 35% | Translate academic projects to professional language |
| **Master's Students** | 25% | Convert academic CV to corporate resume |
| **Early Career (0-3 yrs)** | 25% | Maximize limited experience impact |
| **Career Changers** | 15% | Reframe transferable skills |

---

## Core Features

### 1. Resume Upload & Parsing
- **Supported formats:** PDF and DOCX
- **File size limit:** 5MB maximum
- **Section extraction:** Automatically parses resumes into structured sections (Summary, Skills, Experience, Education)
- **Upload methods:** Drag-and-drop or file picker

### 2. Job Description Analysis
- **Paste-based input:** Users paste job description text directly
- **Keyword extraction:** Identifies critical keywords for ATS compatibility
- **Semantic matching:** Matches resume content against JD using AI-powered semantic analysis (not just exact string matching)

### 3. ATS Scoring System
- **Score range:** 0-100 compatibility score
- **Score components:**
  - Keyword alignment (50% weight)
  - Section coverage (25% weight)
  - Content quality (25% weight)
- **Category breakdown:** Shows scores for individual categories (Keywords, Skills, Experience)
- **Gap analysis:** Identifies missing keywords grouped by category (skills, technologies, qualifications)

### 4. AI-Powered Content Suggestions

#### Summary Section
- Optimizes professional summary with relevant keywords
- Maintains user's voice and authenticity
- Includes "Why this works" explanations

#### Skills Section
- Identifies matched and missing skills
- Suggests skills to add (only if user has evidence of experience)
- Provides impact tier ratings (critical/high/moderate)

#### Experience Section
- Reframes bullet points with relevant keywords
- Adds quantification where inferable (never fabricated)
- Maintains chronological context and job progression

#### Education Section
- Critical for co-op/internship candidates
- Suggests relevant coursework based on degree program
- Recommends certifications aligned with JD requirements
- Adds GPA, honors, and formatting improvements

### 5. Quality Assurance (LLM-as-Judge)
- **Automatic validation:** Each suggestion is evaluated before showing to user
- **Evaluation criteria:**
  - Authenticity (0-25): No fabrication, reframing only
  - Clarity (0-25): Professional language quality
  - ATS Relevance (0-25): Keyword optimization
  - Actionability (0-25): Specific, implementable changes
- **Pass threshold:** 60/100 minimum score
- **Cheap gate:** Near-duplicate detection to prevent no-change suggestions

### 6. User Preferences & Customization

#### Job Type
- **Co-op/Internship:** Learning-focused language ("Contributed to", "Developed", "Gained experience")
- **Full-time:** Impact-focused language ("Led", "Drove", "Owned", "Delivered")

#### Modification Level
- **Conservative (15-25%):** Keyword additions, minimal restructuring
- **Moderate (35-50%):** Restructure for impact while preserving intent
- **Aggressive (60-75%):** Full rewrite for maximum impact

#### Style Preferences
- **Tone:** Professional, Technical, or Casual
- **Verbosity:** Concise, Detailed, or Comprehensive
- **Emphasis:** Skills-focused, Impact-focused, or Keywords-focused
- **Industry:** Tech, Finance, Healthcare, or Generic

### 7. Copy-to-Clipboard Workflow
- **Intentional friction:** Users manually copy-paste suggestions
- **Benefits:**
  - Forces engagement with each change
  - Ensures users can explain their resume
  - Builds transferable knowledge
- **Response time:** < 100ms per copy action

### 8. Score Comparison & Visualization
- **Before/After comparison:** Original score vs. projected score
- **Visual indicators:** Progress rings, color coding
- **Point values:** Each suggestion shows estimated point impact
- **Impact tiers:** Critical, High, Moderate ratings

### 9. Session Persistence
- **Anonymous access:** No signup required to try
- **Session preservation:** Work persists across page refreshes
- **Authenticated users:** Full history and resume library

### 10. User Accounts & History
- **Authentication:** Email/password or Google OAuth
- **Resume library:** Save up to 3 resumes
- **Optimization history:** View last 10 sessions
- **Session reload:** Return to previous optimizations

---

## User Journey Example

### Maya - Co-op Student

**Scenario:** Week 2 of co-op applications, 12 submissions, zero callbacks. Resume lists "Built a React todo app" - technically accurate but generic.

1. **Upload:** Uploads resume PDF via drag-and-drop
2. **Paste JD:** Pastes Shopify Jr Dev posting
3. **Analysis:** Sees ATS score: 38%
4. **Gap Analysis:** Identifies missing keywords: "React hooks", "Context API", "responsive design"
5. **Suggestions:** "React todo app" becomes "Developed responsive task management application using React hooks and Context API, implementing persistent local storage and optimized re-rendering"
6. **Copy & Apply:** Copies suggestion, updates resume
7. **Compare:** Runs comparison - score jumps to 71%
8. **Result:** Submits to Shopify with confidence

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| AI | Claude API via LangChain.js |
| File Parsing | unpdf (PDF), mammoth (DOCX) |

### LLM Pipeline

```
[Resume] + [JD] → Parse → Analyze → Optimize → Judge → [Suggestions]
                                        ↑           |
                                        └── Retry ──┘
```

**Pipeline Steps:**
1. **Parse:** Extract structured sections from resume
2. **Analyze:** Compare against JD, calculate gaps
3. **Optimize:** Generate tailored suggestions
4. **Judge:** Validate quality, retry if needed

### Model Usage

| Prompt | Model | Purpose |
|--------|-------|---------|
| Keyword Extraction | Claude Haiku | Fast, cost-efficient extraction |
| Keyword Matching | Claude Haiku | Semantic matching |
| Content Quality | Claude Haiku | Section evaluation |
| Suggestion Generation | Claude Sonnet | High-quality content generation |
| Quality Judging | Claude Haiku | Fast validation |

---

## Key Constraints & Guardrails

### Authenticity
- **Never fabricates:** All suggestions reframe existing experience, never invent claims
- **No fake metrics:** Specific numbers (%, $) only if inferable from context
- **AI-tell detection:** Automatically rejects phrases like "leveraged", "synergized", "spearheaded"

### Security
- **Prompt injection defense:** User content wrapped in XML tags, treated as data not instructions
- **API keys server-side:** Never exposed to client
- **Row-level security:** User data isolated via Supabase RLS
- **Privacy consent:** Required before first upload

### Performance
- **Optimization timeout:** 60 seconds maximum
- **Cost per optimization:** < $0.10
- **Page load:** < 2.5 seconds (LCP)
- **Copy action:** < 100ms

---

## Success Metrics

### User Success
- **Optimization completion rate:** > 70%
- **Average score improvement:** > 15 points
- **Users who copy at least 1 suggestion:** > 80%
- **Time to complete optimization:** < 60 seconds

### Technical Success
- **LLM error rate:** < 5%
- **File parsing success:** > 95%
- **Session persistence:** 100%

### Quality Metrics
- **Judge pass rate:** Tracked per section
- **Regenerate rate:** < 20% (lower = better quality)
- **Thumbs up ratio:** > 80%

---

## Product Roadmap

### V0.1 - Proof of Concept (Completed)
- Anonymous authentication
- Resume upload (PDF/DOCX)
- JD paste input
- LLM pipeline (Parse, Analyze, Optimize)
- Content suggestions by section
- Copy-to-clipboard
- Session persistence

### V1.0 - Full MVP (Completed)
- User accounts (email + Google OAuth)
- Onboarding flow
- Resume library (3 max)
- LLM-as-judge quality verification
- Compare feature (before/after)
- Optimization history
- Point scoring per suggestion

### V0.5 - Hybrid Features (Current)
- Job Type and Modification Level preferences
- "Why this works" explanations
- Privacy consent flow
- Dashboard UI architecture

### Future (V1.5+)
- Usage limits + pricing tiers
- LinkedIn profile analysis
- GitHub profile analysis
- Career-changer mode with transferable skills mapping
- Advanced analytics dashboard

---

## What We Don't Do

| Feature | Reason |
|---------|--------|
| Generate downloadable resumes | Against philosophy - education over automation |
| Create resumes from scratch | We optimize existing content |
| Store sensitive data | Minimal data retention, privacy-first |
| Train AI on user data | Explicitly stated in privacy policy |
| Replace human judgment | We suggest, users decide |

---

## Getting Started

### For Users
1. Visit the app (no signup required)
2. Upload your resume (PDF or DOCX)
3. Paste the job description you're targeting
4. Click "Analyze" to see your ATS score
5. Review suggestions and copy what resonates
6. Update your resume with the new content
7. Re-run to see your improved score

### For Developers
See the [README.md](/README.md) for setup instructions and the [CLAUDE.md](/CLAUDE.md) for development guidelines.

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [README.md](/README.md) | Quick start and setup |
| [CLAUDE.md](/CLAUDE.md) | Development guide and conventions |
| [LLM_PROMPTS.md](/docs/LLM_PROMPTS.md) | All LLM prompts documented |
| [TESTING.md](/docs/TESTING.md) | Testing framework and commands |
| [DATABASE.md](/docs/DATABASE.md) | Database migrations |
| [PRD](/\_bmad-output/planning-artifacts/prd.md) | Full product requirements |
| [Architecture](/\_bmad-output/planning-artifacts/architecture.md) | Technical architecture |
