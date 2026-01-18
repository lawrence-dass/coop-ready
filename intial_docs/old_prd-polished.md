---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - CoopReady-application-idea.md
  - sample/ats-sample/readme.md
  - sample/ats-sample/application_architecture.md
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 1
workflowType: 'prd'
classification:
  projectType: 'web_app'
  domain: 'HR Tech / Career Services'
  complexity: 'medium'
  projectContext: 'brownfield'
---

# Product Requirements Document - CoopReady

**Author:** Lawrence
**Date:** 2026-01-12

---

## Executive Summary

CoopReady is an AI-powered resume optimization tool specifically designed for students and career changers entering tech roles. Unlike generic ATS checkers, CoopReady provides experience-level-aware suggestions that translate academic projects into professional achievements and map non-tech skills to tech contexts.

**Core Differentiator:** Context-aware AI that understands the user's starting point (student with only academic projects vs career changer with transferable skills) and adapts all suggestions accordingly.

**Target Users:**
- Students seeking co-ops, internships, or first tech roles
- Career changers transitioning into tech from non-tech backgrounds

**Revenue Model:** Freemium - 3 scans/month free, unlimited scans for $5/month

**MVP Timeline:** 6-8 weeks to launch with core features

---

## Success Criteria

### User Success

**Primary Success Indicator:** Users successfully improve their ATS compatibility and feel confident submitting their optimized resume.

**Measurable Outcomes:**
- **ATS Score Improvement:** Average improvement of +20 points (e.g., 55 → 75)
- **User Satisfaction:** 4.5/5 stars on post-scan survey
- **Time to Value:** Users complete their first scan within 5 minutes of sign-up
- **Suggestion Adoption:** Users accept and apply at least 60% of AI-suggested improvements
- **Resume Quality:** Optimized resumes contain 80%+ of relevant keywords from job description

**Success Moments:**
- **"Aha!" Moment:** When users see their vague bullet point ("Built a chatbot") transformed into professional achievement ("Engineered an NLP-powered chatbot using Python and LangChain, reducing customer support response time by 40% in a simulated environment")
- **Confidence Boost:** Users feel ready to submit their resume after seeing concrete, actionable improvements
- **Skill Recognition:** Career changers see their transferable skills properly positioned for tech roles

### Business Success

**Month 1-3 Targets (MVP Launch):**
- **User Acquisition:** 50 sign-ups per week
- **Activation Rate:** 70% of sign-ups complete at least 1 scan
- **Landing Page Conversion:** 5-10% (visitor → sign-up)
- **Free-to-Paid Conversion:** 8-12% (industry benchmark: 5%)

**Month 6-12 Targets (Growth Phase):**
- **Paying Customers:** 500+ active subscribers
- **Monthly Recurring Revenue (MRR):** $2,500+ ($5/mo × 500 users)
- **User Retention:** Monthly churn <10%
- **Engagement:** Average 2.5 scans per user per month
- **Virality:** 15% of users refer at least 1 friend

**Revenue Success:**
- **Break-even:** Operational costs ($50/mo AWS) covered by 10 paying customers
- **Sustainability:** MRR exceeds $500/mo (100 paying customers) within 6 months
- **Growth Signal:** If 1000+ users and 12%+ conversion rate, consider price increase or investment

### Technical Success

**Performance Requirements:**
- **Analysis Speed:** Resume analysis completes in <20 seconds (including AI processing)
- **Uptime:** 99.5% availability for paying customers
- **Scalability:** System handles 500 concurrent scans without degradation
- **Cost Efficiency:** OpenAI API costs stay under $20/mo for 200 scans (smart caching working)

**Security & Privacy:**
- **Zero Data Breaches:** No unauthorized access to user resumes
- **Secure Storage:** All resumes encrypted at rest in S3
- **Compliance:** GDPR-compliant data deletion within 30 days of request
- **Rate Limiting:** Effective prevention of abuse (free tier: 3 scans/month enforced)

**AI Quality:**
- **Suggestion Accuracy:** 85%+ of AI suggestions are relevant and helpful (measured by user acceptance rate)
- **Skill Mapping Accuracy:** Transferable skills engine correctly maps 90%+ of common non-tech skills
- **No Hallucinations:** AI suggestions based on actual resume content, not fabricated achievements

### Measurable Outcomes

**Launch Success (Month 1):**
- ✅ 200+ total sign-ups
- ✅ 20+ paying customers ($100 MRR)
- ✅ 4+ star average rating
- ✅ <5% error rate on resume processing

**Product-Market Fit Signal (Month 3-6):**
- ✅ 40%+ of users complete 2+ scans (repeat usage)
- ✅ Net Promoter Score (NPS) >30
- ✅ Organic growth: 20%+ sign-ups from word-of-mouth
- ✅ Free-to-paid conversion sustained at 10%+

---

## Product Scope

### MVP - Minimum Viable Product

**Core Features (Must-Have for Launch):**

1. **User Profile Setup**
   - Experience level selection (Student vs Career Changer)
   - Target role selection (Data Analyst, Software Engineer, etc.)

2. **Authentication & Rate Limiting**
   - Email/password or magic link authentication
   - Free tier: 3 scans/month
   - Paid tier: Unlimited scans
   - Usage tracking and monthly reset

3. **Resume Upload & Job Description Input**
   - PDF/DOCX upload (max 2MB)
   - Job description paste or URL scraping
   - Text extraction and cleaning

4. **ATS Compatibility Score & Analysis**
   - Overall score (0-100)
   - Section-level breakdown (Contact Info, Skills, Experience, Education, Formatting)
   - Visual dashboard with charts

5. **Improvement Suggestions (Two Levels)**
   - Section-level suggestions (e.g., "Add these 5 missing keywords")
   - Bullet-point rewrites (side-by-side comparison with optimized versions)

6. **Transferable Skills Engine**
   - Semantic skill matching via embeddings
   - Skill taxonomy for common career changer scenarios
   - Tech translation suggestions

7. **Results Dashboard**
   - ATS score visualization
   - Missing keywords
   - Accept/reject suggestion workflow

8. **Download Optimized Resume**
   - PDF/DOCX generation with accepted suggestions
   - S3 storage with signed URLs (24-hour expiration)

**Technical Foundation:**
- Next.js 14 (frontend + API routes)
- Supabase (Postgres + Auth)
- AWS S3 (file storage)
- OpenAI API (GPT-4o-mini + embeddings)
- Vercel hosting (free tier initially)

**Out of Scope for MVP:**
- ❌ Resume templates (use existing resume formatting)
- ❌ Cover letter generation
- ❌ Job description library/saved searches
- ❌ Progress tracking over time
- ❌ Interview prep suggestions
- ❌ Mobile app (web-only for MVP)

### Growth Features (Post-MVP)

**Phase 2 (Month 3-6):**

1. **Resume Templates**
   - 3-5 ATS-friendly templates (Conservative, Modern, Technical)
   - Template selection during profile setup
   - One-click apply template to existing content

2. **Job Description Library**
   - Save frequently used job descriptions
   - Re-scan resume against multiple jobs
   - Comparison view across different JDs

3. **Progress Tracking**
   - Score improvement over time
   - Historical scan results
   - "Your ATS score improved by 25% since last month!"

4. **Enhanced Analytics**
   - Industry-specific benchmarks
   - Keyword trend analysis
   - Competitive positioning vs other candidates

**Phase 3 (Month 6-12):**

5. **Cover Letter Generation**
   - AI-generated cover letters based on resume + JD
   - Experience-level tailoring
   - Side-by-side editing interface

6. **Interview Prep Suggestions**
   - Likely interview questions based on resume + JD
   - STAR method answer templates
   - Project deep-dive preparation

7. **Advanced Personalization**
   - Industry-specific resume formats
   - Company-specific optimization (e.g., "Google SWE resume tips")
   - Multi-resume management (different roles)

### Vision (Future)

**Dream Features (12+ Months):**

1. **AI Resume Builder from Scratch**
   - Build entire resume through conversational AI
   - Zero existing resume required
   - Smart extraction from LinkedIn/GitHub

2. **Job Application Tracker**
   - Track applications, interviews, follow-ups
   - Automated follow-up reminders
   - Success rate analytics

3. **Resume Co-Pilot (Chrome Extension)**
   - One-click optimize resume for any job posting
   - Inline suggestions while browsing job boards
   - Auto-fill application forms

4. **Community Features**
   - Peer resume reviews
   - Success stories from students/career changers
   - Resume templates shared by community

5. **Enterprise/University Licensing**
   - University career centers bulk licensing
   - Bootcamp partnerships
   - Corporate reskilling programs

---

## User Journeys

### Journey 1: Sarah - "From Projects to Professional"

**Persona:**
- **Name:** Sarah Chen
- **Context:** Master's student in Data Science
- **Experience Level:** No prior work experience (only internships/academic projects)
- **Goal:** Land a data analyst co-op position
- **Obstacle:** Resume reads like an academic paper, getting auto-rejected by ATS

**The Journey:**

**Opening Scene - The Frustration:**
It's 2 AM and Sarah stares at her laptop screen, frustrated. She's applied to 47 data analyst co-op positions in the past month - zero responses. Her resume lists her impressive capstone project (a customer churn prediction model with 87% accuracy), but it reads like an academic paper: "Completed data analysis project using Python and machine learning algorithms." She knows she has the skills, but something's not translating.

**Rising Action - Discovery:**
Sarah's friend mentions CoopReady. She signs up and selects "Student (Co-op/Internship)" → "Data Analyst." She uploads her resume and pastes a Microsoft job description. Within 15 seconds: **ATS Score: 52/100** - "Your resume is being filtered out before humans ever see it."

**Climax - The "Aha!" Moment:**
Sarah sees the bullet-point rewrites:

**Before:** "Completed data analysis project using Python and machine learning algorithms."

**After:** "Engineered a customer churn prediction model using Python (Scikit-learn, Pandas) achieving 87% accuracy on 50K+ records, directly informing retention strategy recommendations that reduced projected churn by 15% in simulation."

She realizes: She wasn't selling herself short - she was hiding her achievements in academic language. The AI understood that her "class project" IS professional experience.

**Resolution - Success:**
Sarah accepts 12 of 15 suggestions. New ATS score: **81/100**. She applies to 8 companies. Within 10 days: 3 interview requests, including Microsoft. At the interview, the recruiter says, "Your capstone project really stood out. The way you framed the business impact was impressive." Sarah lands the co-op and becomes a paying subscriber.

---

### Journey 2: Marcus - "The Invisible Skills"

**Persona:**
- **Name:** Marcus Johnson
- **Context:** 5 years in retail management, completed coding bootcamp
- **Experience Level:** Career changer with strong operational background
- **Goal:** Transition to junior data engineer role
- **Obstacle:** Retail experience feels like a liability, not an asset

**The Journey:**

**Opening Scene - The Invisibility:**
Marcus sits in his car after another retail shift, scrolling through LinkedIn. Former bootcamp classmates are landing data engineer roles. He graduated 3 months ago - same bootcamp, same projects - but he's getting ghosted. The difference? They have "2-3 years of related experience." He has 5 years managing a retail store, but every resume submission feels like his experience is being ignored.

**Rising Action - The Translation Begins:**
His bootcamp career coach recommends CoopReady. He selects "Career Changer (Transitioning to Tech)" → "Data Engineer." He uploads his resume and pastes a fintech startup job description. **ATS Score: 48/100**. Feedback: "Your transferable skills from retail management aren't positioned for tech contexts."

**Climax - Seeing Himself Differently:**
Marcus clicks on "Transferable Skills Engine." His screen shows mappings:
- "Managed inventory database system" → "Database administration, SQL query optimization"
- "Led team of 12 employees" → "Team leadership, agile sprint facilitation, stakeholder management"
- "Reduced operational costs by 18%" → "Data-driven decision making, KPI analysis, process optimization"

Then the rewrite:

**Before:** "Managed team of 12 retail associates, handling scheduling and training."

**After:** "Led cross-functional team of 12 in high-pressure environment, implementing data-driven scheduling optimization that improved labor efficiency by 22% while maintaining 94% employee satisfaction scores."

Marcus realizes his retail experience ISN'T a liability - he just never knew how to speak the language.

**Resolution - The Differentiator:**
Marcus updates his resume using the suggestions. New ATS score: **79/100**. More importantly, he sees himself as a data engineer with strong operational experience. He applies to 15 data engineer roles focused on operational analytics. Within 2 weeks: 5 phone screens. One hiring manager says, "Your operational experience is exactly what we need." He lands a junior data engineer role at a logistics company, where his retail background becomes his differentiator.

---

## Domain-Specific Requirements

### Privacy & Data Compliance

- Users must consent to OpenAI data processing via Terms & Conditions before service use
- Users can delete all data (resumes, analysis results, account) within 30 days via "Delete My Data" button (GDPR/CCPA compliance)
- All resumes encrypted at rest (AES-256)
- HTTPS-only communication enforced

### AI Quality & Ethics

- AI prompts designed to be gender/race/age-neutral
- All suggestions require user acceptance (no auto-apply)
- User acceptance rates tracked to measure suggestion quality
- AI-generated content clearly labeled

### Legal

- Terms of Service disclose OpenAI processing
- Users own all content (original + optimized resume)
- No liability clause (users responsible for accuracy)

---

## Web App Specific Requirements

### Technical Architecture

**Application Type:**
- Single Page Application (SPA) with Next.js 14 App Router
- Client-side routing for authenticated dashboard
- Server-side rendering for landing/marketing pages

**Browser Support:**
- Modern browsers only (Chrome, Firefox, Safari, Edge - last 2 versions)
- No legacy browser support (IE11, old mobile browsers)

**SEO Strategy:**
- Landing page: SEO optimized (meta tags, SSR)
- Authenticated dashboard: No SEO needed (behind login)

**Real-Time Features:**
- No WebSockets for MVP
- HTTP polling for analysis status updates
- Standard page refreshes

**Accessibility:**
- Basic keyboard navigation support
- Semantic HTML for screen readers
- No WCAG 2.1 Level AA compliance requirement for MVP

**Performance Targets:**
- First Contentful Paint (FCP): <2 seconds
- Time to Interactive (TTI): <5 seconds
- Lighthouse score: >80 for landing page

**Responsive Design:**
- Mobile-friendly (responsive breakpoints)
- Optimized for desktop usage (primary use case)
- No native mobile app for MVP

---

## Functional Requirements

### User Account Management

- **FR1:** Users can create an account using email and password
- **FR2:** Users can log in to their account
- **FR3:** Users can log out of their account
- **FR4:** Users can delete all their data (resumes, analysis results, account) within 30 days
- **FR5:** Users can select their experience level (Student seeking Co-op/Internship OR Career Changer transitioning to tech)
- **FR6:** Users can select their target role (Data Analyst, Data Engineer, Data Scientist, Software Engineer, AI/ML Engineer, DevOps Engineer, Other)

### Resume Analysis

- **FR7:** Users can upload a resume file (PDF or DOCX format, max 2MB)
- **FR8:** Users can input a job description by pasting text (max 5000 characters)
- **FR9:** System extracts text content from uploaded resume files
- **FR10:** System calculates an ATS compatibility score (0-100) for the resume against the job description
- **FR11:** System provides section-level breakdown scores (Contact Info, Summary, Skills, Experience/Projects, Education, Formatting)
- **FR12:** System identifies missing keywords from the job description
- **FR13:** System detects formatting issues that affect ATS parsing (tables, images, multi-column layouts)

### AI-Powered Optimization

- **FR14:** System generates section-level improvement suggestions based on user's experience level and target role
- **FR15:** System rewrites resume bullet points with before/after comparisons
- **FR16:** System identifies transferable skills from non-tech backgrounds for Career Changers
- **FR17:** System maps transferable skills to tech-equivalent terminology
- **FR18:** System adapts suggestions based on whether user is a Student or Career Changer
- **FR19:** System incorporates target role context into all suggestions

### Results & Output

- **FR20:** Users can view their ATS compatibility score in a visual dashboard
- **FR21:** Users can view section-level score breakdowns with charts
- **FR22:** Users can view a list of missing keywords
- **FR23:** Users can view section-level suggestions
- **FR24:** Users can view bullet-point rewrite suggestions in side-by-side format
- **FR25:** Users can accept individual suggestions
- **FR26:** Users can reject individual suggestions
- **FR27:** Users can generate an optimized resume with only accepted suggestions applied
- **FR28:** Users can download the optimized resume (PDF or DOCX format)
- **FR29:** System labels all AI-generated suggestions clearly

### Usage & Subscription Management

- **FR30:** Free tier users can perform up to 3 scans per month
- **FR31:** System tracks scan usage per user
- **FR32:** System resets scan counters monthly
- **FR33:** Paid tier users can perform unlimited scans
- **FR34:** Users can upgrade from free to paid tier ($5/month subscription)
- **FR35:** System displays remaining scans for free tier users
- **FR36:** System prompts users to upgrade when they reach their scan limit

### Privacy & Compliance

- **FR37:** System encrypts all uploaded resumes at rest
- **FR38:** Users must accept Terms & Conditions that disclose OpenAI data processing before using the service
- **FR39:** System generates signed URLs for resume downloads that expire within 24 hours
- **FR40:** System enforces HTTPS-only communication

### Public Pages & Marketing

- **FR41:** Visitors can view the landing page without authentication
- **FR42:** Landing page is indexed by search engines (SEO optimized)
- **FR43:** Visitors can navigate to sign-up from the landing page
- **FR44:** System renders landing/marketing pages with server-side rendering

---

## Non-Functional Requirements

### Performance

- **NFR1:** Resume analysis completes within 20 seconds for 95% of requests
- **NFR2:** Application pages load within 2 seconds on standard broadband connections
- **NFR3:** API response time (excluding OpenAI processing) <500ms for 95th percentile

### Security

- **NFR4:** All data encrypted at rest using AES-256
- **NFR5:** All client-server communication uses HTTPS/TLS 1.3
- **NFR6:** User passwords hashed using bcrypt with minimum 12 rounds
- **NFR7:** API keys and secrets never exposed in client-side code
- **NFR8:** Resume files deleted within 30 days of user account deletion

### Reliability

- **NFR9:** System uptime ≥99.5% (excluding planned maintenance)
- **NFR10:** Failed OpenAI API calls retried up to 3 times with exponential backoff
- **NFR11:** Users receive clear error messages when analysis fails

### Scalability (MVP Baseline)

- **NFR12:** System handles up to 100 concurrent users without degradation
- **NFR13:** Database queries remain performant up to 10,000 user accounts

### Accessibility (Basic)

- **NFR14:** All interactive elements keyboard accessible
- **NFR15:** Color contrast meets WCAG 2.1 Level A minimum standards

### Integration

- **NFR16:** System gracefully handles OpenAI API rate limits and quota errors
- **NFR17:** Authentication flow completes within 3 seconds for 95% of login attempts

---
