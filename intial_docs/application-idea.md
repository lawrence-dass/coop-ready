# CoopReady - Application Idea Document

**Version:** 1.0 (MVP)
**Date:** January 12, 2026
**Author:** John (PM Agent) + Lawrence
**Status:** Draft for Review

---

## Executive Summary

**CoopReady** is an AI-powered resume optimization tool specifically designed for **students seeking co-op/internship opportunities** and **career changers transitioning into tech roles**. Unlike generic ATS checkers, CoopReady understands the unique challenges faced by candidates with limited professional experience and provides intelligent, experience-level-aware suggestions to showcase academic projects, transferable skills, and potential.

**Target Market:** Fresh graduates, master's students, bootcamp grads, and career changers targeting tech roles (Data Analyst, Software Engineer, ML Engineer, etc.)

**Revenue Model:** Freemium (3 scans/month free, unlimited for $5/month)

**Budget Constraint:** $50/month AWS operational cost

---

## Problem Statement

### The Pain Points

**For Students (No Professional Experience):**
- Generic ATS tools penalize them for lack of "work experience"
- Don't know how to frame classroom projects as professional achievements
- Struggle to translate academic language into industry terminology
- Expensive tools ($30-50/month) are financially inaccessible

**For Career Changers (Transitioning to Tech):**
- Transferable skills from previous careers are ignored or undervalued
- Don't know how to position non-tech experience for tech roles
- Generic ATS tools don't understand industry-specific skill mapping
- Example: "Customer service" → "Stakeholder management" translation missing

### Current Market Gaps

Existing ATS tools (Jobscan, Resume Worded, etc.) are:
1. **Generalized** - One-size-fits-all approach doesn't work for entry-level candidates
2. **Expensive** - $30-90/month pricing excludes students
3. **Keyword-focused** - Miss the narrative and context that matter for inexperienced candidates
4. **No Personalization** - Don't adapt to experience level or target industry

---

## Solution: CoopReady MVP

### Core Value Proposition

*"An AI resume optimizer that understands YOUR experience level, translates YOUR skills into employer language, and crafts ATS-friendly resumes that get you interviews—all for less than a latte per month."*

### Target Users (Personas)

**Persona 1: "Sarah the Student"**
- Master's student in Data Science
- No prior work experience (only internships/projects)
- Applying for data analyst co-op positions
- Needs to position her capstone project as professional experience
- Budget: $5/month max

**Persona 2: "Marcus the Career Changer"**
- 5 years in retail management
- Completed coding bootcamp (Python, SQL, cloud)
- Transitioning to junior data engineer role
- Needs to map leadership/operational skills to tech context
- Budget: $5/month max

---

## MVP Feature Breakdown

### Phase 1: Core Features (MUST-HAVE for Launch)

#### 1. User Profile Setup
**Functionality:**
- Two-step onboarding flow:
  - **Step 1:** Select profile type
    - "I'm a Student (Co-op/Internship)"
    - "I'm a Career Changer (Transitioning to Tech)"
  - **Step 2:** Select target role (dropdown)
    - Data Analyst
    - Data Engineer
    - Data Scientist
    - Software Engineer
    - AI/ML Engineer
    - DevOps Engineer
    - Other (text input)

**User Story:**
> As a user, I want to specify my experience level and target role so that the AI provides relevant, personalized suggestions.

**Technical Notes:**
- Store in user profile table (Supabase Postgres)
- Used to customize AI prompting strategy

---

#### 2. Authentication & Rate Limiting
**Functionality:**
- Email-based authentication (magic link OR simple email/password)
- Track scan usage per user
- Free tier: 3 scans/month
- Paid tier: Unlimited scans

**User Story:**
> As a free user, I want to try the tool 3 times before committing to a subscription.

**Technical Notes:**
- Supabase Auth for user management
- Usage counter in `user_scans` table
- Reset counter monthly via cron job

**Analytics Tracking:**
- Total scans per user
- Conversion rate (free → paid)
- Most common target roles
- Average ATS score improvement

---

#### 3. Resume Upload & Job Description Input
**Functionality:**
- Upload resume (PDF or DOCX, max 2MB)
- Paste job description (text area, max 5000 chars)
- OR provide job description URL (scrape with fallback)

**User Story:**
> As a user, I want to upload my resume and paste a job description to get instant ATS analysis.

**Technical Notes:**
- Use `pdf-parse` (Node.js) or `PyPDF2` (Python) for extraction
- Store uploaded resume in AWS S3 (encrypted)
- Extract text → clean → store in DB

---

#### 4. ATS Compatibility Score & Analysis
**Functionality:**
- Overall ATS score (0-100)
- Section-level breakdown:
  - Contact Information (formatting check)
  - Summary/Objective (presence + quality)
  - Skills (keyword match vs job description)
  - Experience/Projects (relevance + impact metrics)
  - Education (proper formatting)
  - Formatting Issues (tables, images, columns detected)

**User Story:**
> As a user, I want to see a clear score showing how well my resume matches the job posting.

**Technical Notes:**
- AI-powered scoring via GPT-4o-mini with structured output
- Persist score in `analysis_results` table
- Display in dashboard with visual breakdown (Recharts)

---

#### 5. Improvement Suggestions (Two Levels)

**Level 1: Section-Level Suggestions**
Example:
> **Skills Section:** Your skills list is missing 5 key technologies mentioned in the job description: PostgreSQL, Docker, AWS Lambda, REST APIs, Git. Add these if you have experience with them.

**Level 2: Bullet-Point Level Suggestions (Rewriting)**
Example:

| Original Bullet | Optimized Bullet |
|-----------------|------------------|
| Built a chatbot for customer service | Engineered an NLP-powered chatbot using Python and LangChain, reducing customer support response time by 40% in a simulated environment |
| Managed team of 5 baristas | Led cross-functional team of 5 in high-volume customer service environment, optimizing workflow efficiency and achieving 95% customer satisfaction rating |
| Completed data analysis project | Conducted end-to-end data analysis on 50K+ records using Python (Pandas, NumPy) and visualized insights via Tableau, informing strategic recommendations for e-commerce optimization |

**User Story:**
> As a student with project experience, I want specific examples of how to rewrite my project descriptions to sound professional and impactful.

**Technical Notes:**
- Use GPT-4o-mini with experience-level-aware prompts
- Prompt injection: Include target role, experience level, transferable skills mapping
- Return structured JSON: `{ section, original, suggested, reasoning }`

---

#### 6. Transferable Skills Engine
**Functionality:**
- Detect skills from non-tech backgrounds
- Map to tech-equivalent terminology
- Suggest phrasing adjustments

**Mapping Examples:**
| Original Skill (Career Changer) | Tech Translation |
|---------------------------------|------------------|
| Customer service | Stakeholder communication, user experience research |
| Teaching | Technical documentation, training & onboarding |
| Project management | Agile/Scrum methodology, sprint planning |
| Retail management | Team leadership, operational efficiency, data-driven decision making |
| Event planning | Cross-functional collaboration, resource allocation |

**User Story:**
> As a career changer, I want the tool to identify my transferable skills and show me how to position them for tech roles.

**Technical Notes:**
- Semantic skill matching via embeddings (OpenAI `text-embedding-3-small`)
- Prebuilt skill taxonomy (CSV/JSON) for common mappings
- AI fallback for uncommon skills

---

#### 7. Results Dashboard
**Functionality:**
Display:
- Overall ATS score (big number + visual gauge)
- Section-level scores (bar chart)
- Top 5 missing keywords
- Section-level suggestions (collapsible accordion)
- Bullet-point rewrite suggestions (side-by-side table)

**User Story:**
> As a user, I want to see all analysis results in one clean dashboard so I can quickly understand what to fix.

**Technical Notes:**
- Built with React + Recharts (or shadcn/ui charts)
- Responsive design (mobile-friendly)
- Export results as PDF option

---

#### 8. Download Optimized Resume
**Functionality:**
- User can **accept/reject** individual bullet-point suggestions
- Click "Generate Optimized Resume"
- System generates a new resume (PDF/DOCX) with accepted changes applied
- Download link provided

**User Story:**
> As a user, I want to download a polished resume with AI suggestions already incorporated, ready to submit.

**Technical Notes:**
- Use `jsPDF` (client-side) or `pdfkit` (server-side) for PDF generation
- Or use Google Docs API / LaTeX template for DOCX generation
- Store generated resume in S3, return signed URL (expires in 24 hours)

---

### Phase 2: Nice-to-Have Features (Post-MVP)

#### 9. Resume Templates
- Offer 3-5 ATS-friendly templates (Conservative, Modern, Technical)
- User selects template during profile setup

#### 10. Cover Letter Generation
- AI-generated cover letter based on resume + job description
- Tailored to experience level

#### 11. Job Description Library
- Save frequently used job descriptions
- Re-scan resume against multiple jobs

#### 12. Progress Tracking
- Show improvement over time (score trends)
- "Your ATS score improved by 25% since last month!"

#### 13. Interview Prep Suggestions
- Based on resume + job description, suggest likely interview questions
- "They'll probably ask about your machine learning project—here's how to explain it"

---

## Competitive Positioning

### Direct Competitors
| Tool | Price | Strengths | Weaknesses |
|------|-------|-----------|------------|
| Jobscan | $49/mo | Comprehensive, established | Expensive, generic, no experience-level awareness |
| Resume Worded | $33/mo | Good keyword analysis | Expensive, limited customization |
| Rezi | $29/mo | Template-focused | Not AI-driven, expensive |

### CoopReady Advantages
1. **Experience-Level Aware:** Only tool that adapts to student vs career changer context
2. **Transferable Skills Focus:** Unique skill mapping for career changers
3. **Affordability:** $5/month (10x cheaper than competitors)
4. **Student-Centric:** Designed for co-op/internship seekers, not just experienced professionals
5. **Detailed AI Prompting:** Best-in-class prompt engineering for nuanced suggestions

### Positioning Statement
> "CoopReady is the only ATS optimizer built specifically for students and career changers entering tech—because your potential matters more than your resume gap."

---

## Technical Architecture (Recommended for MVP)

### Tech Stack

**Frontend:**
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui** (component library)
- **Recharts** (data visualization)

**Backend:**
- **Next.js API Routes** (serverless functions)
- **OpenAI API** (GPT-4o-mini for analysis, text-embedding-3-small for skills matching)

**Database & Auth:**
- **Supabase** (Postgres + Auth + Storage)
  - Tables: `users`, `profiles`, `scans`, `analysis_results`

**File Storage:**
- **AWS S3** (resume uploads, generated PDFs)

**Deployment:**
- **Vercel** (Next.js hosting, free tier → $20/mo Pro if needed)
- OR **AWS Amplify** (~$10-15/mo)

**AI Optimization:**
- Cache common job descriptions (vector search for duplicates)
- Batch API calls where possible
- Use `gpt-4o-mini` (cheaper than GPT-4)

### Cost Breakdown (Monthly)

| Service | Free Tier | Paid Tier | Estimated Cost |
|---------|-----------|-----------|----------------|
| Supabase | 50k MAU, 500MB DB | $25/mo (Pro) | $0 (MVP) → $25 (growth) |
| AWS S3 | 5GB free (12 months) | $0.023/GB | $1-2/mo |
| OpenAI API | Pay-per-use | ~$0.50 per 1M tokens | $10-20/mo (100-200 scans) |
| Vercel | Free (hobby) | $20/mo (Pro) | $0 (MVP) → $20 (growth) |
| **Total** | | | **$11-37/mo** (well under $50) |

**Scaling Costs:**
- At 1000 users (50 scans/month avg): ~$80-100/mo
- At 5000 users: ~$200-300/mo → justify price increase or investor raise

---

## User Flow (MVP)

```
1. Landing Page → "Optimize Your Resume for Free"
2. Sign Up (Email + Password OR Magic Link)
3. Profile Setup:
   - Select: "Student" or "Career Changer"
   - Select Target Role (dropdown)
4. Upload Resume (PDF/DOCX)
5. Paste Job Description (text OR URL)
6. Click "Analyze Resume"
7. Processing Screen (animated loader, ~10-20 seconds)
8. Results Dashboard:
   - ATS Score (0-100)
   - Section Breakdown
   - Missing Keywords
   - Section-Level Suggestions
   - Bullet-Point Rewrites (side-by-side)
9. User Reviews Suggestions:
   - Checkboxes to accept/reject each rewrite
10. Click "Download Optimized Resume"
11. Generated PDF/DOCX ready for download
12. Prompt: "Scan used (2/3 remaining this month)"
13. Upgrade CTA: "Unlimited scans for $5/month"
```

---

## Success Metrics (KPIs for MVP)

### Acquisition
- Sign-ups per week (target: 50 in month 1)
- Conversion rate (landing page → sign-up): Target 5-10%

### Engagement
- Scans per user (average): Target 2.5 scans/user
- Time to first scan: Target <5 minutes after sign-up

### Retention
- Free-to-paid conversion: Target 8-12% (industry benchmark: 5%)
- Monthly churn: Target <10%

### Quality
- Average ATS score improvement: Target +20 points
- User satisfaction (post-scan survey): Target 4.5/5 stars

---

## MVP Development Priorities (Lean Approach)

### Phase 1A: Foundation (Week 1-2)
- [ ] Next.js app setup + Supabase integration
- [ ] Auth flow (email/password)
- [ ] Profile setup (experience level + target role)
- [ ] Resume upload + text extraction
- [ ] Job description input

### Phase 1B: Core AI (Week 3-4)
- [ ] OpenAI integration (GPT-4o-mini)
- [ ] Prompt engineering for experience-level-aware analysis
- [ ] ATS scoring algorithm
- [ ] Section-level suggestions
- [ ] Bullet-point rewriting

### Phase 1C: Transferable Skills (Week 5)
- [ ] Skill taxonomy database (CSV)
- [ ] Semantic skill matching (embeddings)
- [ ] Skill mapping display in results

### Phase 1D: Results & Download (Week 6)
- [ ] Results dashboard UI
- [ ] Accept/reject suggestion workflow
- [ ] PDF generation (optimized resume)
- [ ] Download + S3 storage

### Phase 1E: Rate Limiting & Payment (Week 7-8)
- [ ] Scan usage tracking
- [ ] Rate limit enforcement (3 scans/month)
- [ ] Stripe integration (subscription)
- [ ] Upgrade flow

### Phase 1F: Polish & Launch (Week 9-10)
- [ ] Analytics dashboard (admin view)
- [ ] Error handling + edge cases
- [ ] Performance optimization
- [ ] User testing + feedback
- [ ] Public launch (Product Hunt, Reddit, etc.)

**Total MVP Timeline: 10 weeks (2.5 months)**

---

## Open Questions & Decisions Needed

1. **PDF Generation Library:** Client-side (jsPDF) or server-side (pdfkit)?
2. **Payment Gateway:** Stripe (recommended) or AWS Payment?
3. **Email Provider:** Supabase built-in OR SendGrid/Resend?
4. **Error Monitoring:** Sentry (free tier) or AWS CloudWatch?
5. **Resume Parsing:** Build custom parser OR use third-party API (e.g., Affinda)?

---

## Next Steps

1. **Review & Approve** this document
2. **Create PRD** (Product Requirements Document) with detailed user stories
3. **Design System Architecture** (database schema, API endpoints)
4. **Prioritize Epic Breakdown** (for sprint planning)
5. **Start Development** (Foundation → AI → UI)

---

## Appendix: AI Prompt Strategy (Competitive Advantage)

### Prompt Template (Experience-Level-Aware)

**For Students:**
```
You are an expert resume coach specializing in helping students land co-op and internship positions.

Context:
- Candidate: {experience_level} targeting {target_role}
- Resume: {resume_text}
- Job Description: {job_description}

Task:
1. Analyze the resume for ATS compatibility (score 0-100)
2. Identify missing keywords from the job description
3. Provide section-level feedback on:
   - How to frame academic projects as professional experience
   - How to quantify achievements (even without work experience)
   - How to highlight relevant coursework and skills
4. Rewrite 5 bullet points to be more impactful, using this formula:
   - [Action Verb] + [Specific Task] + [Technology/Method] + [Quantifiable Outcome or Context]

Focus on: academic projects, coursework, volunteer work, leadership in student organizations.
Avoid: penalizing for lack of work experience. Emphasize potential and skills.

Output format: JSON
```

**For Career Changers:**
```
You are an expert career transition coach specializing in helping professionals move into tech roles.

Context:
- Candidate: {experience_level} with background in {previous_industry}, targeting {target_role}
- Resume: {resume_text}
- Job Description: {job_description}

Task:
1. Analyze the resume for ATS compatibility (score 0-100)
2. Identify transferable skills from {previous_industry} that map to {target_role}
3. Suggest skill translations:
   - Example: "Customer service" → "Stakeholder communication"
4. Rewrite 5 bullet points to emphasize transferable skills, using this formula:
   - [Transferable Skill] + [Context from Previous Industry] + [Relevance to Target Role]

Focus on: leadership, problem-solving, data-driven decision making, communication.
Avoid: dismissing previous experience as irrelevant.

Output format: JSON
```

---

**Document End**

*This is a living document. Version updates will be tracked as the product evolves.*
