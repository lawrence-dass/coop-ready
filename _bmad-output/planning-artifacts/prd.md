---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-CoopReady-2026-01-18.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: Web App (SaaS)
  domain: EdTech / Career Services
  complexity: Medium
  projectContext: Greenfield
---

# Product Requirements Document - CoopReady

**Author:** Lawrence
**Date:** 2026-01-18

## Executive Summary

**CoopReady** is an AI-powered resume optimization tool for students seeking co-ops/internships and career changers transitioning into tech. Unlike generic ATS checkers that penalize candidates for lack of traditional experience, CoopReady adapts suggestions based on the user's context—translating academic projects into professional achievements for students, and mapping transferable skills to tech terminology for career changers.

**Core Value Proposition:** Experience-level-aware AI that speaks the language of university co-op programs and understands what hiring managers look for in entry-level candidates.

**Target Users:** Fresh graduates, master's students, bootcamp grads, international students, and career changers targeting tech roles.

**Business Model:** Freemium — 3 scans/month free, unlimited for $5/month.

**MVP Scope:** 10 core features enabling resume upload, ATS scoring, before/after bullet rewrites, transferable skills mapping, and optimized resume download.

**Success Criteria:** 8-12% free-to-paid conversion rate within 3 months, validating product-market fit.

## Success Criteria

### User Success

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Interview Callbacks | User-reported within 2 weeks | Ultimate validation — resumes reaching human eyes |
| ATS Score Improvement | +20 points average | Immediate, visible feedback |
| Time to First Scan | <5 minutes | Low friction onboarding |
| Suggestion Acceptance Rate | 60%+ | AI recommendations are relevant |
| Emotional Outcome | **Empowerment** | Users feel capable of presenting themselves effectively |

**Success Moments:**
- User sees their vague bullet transformed and says "this is exactly what I meant"
- Career changer realizes their experience *is* valuable — just needed translation
- International student understands North American resume expectations

### Business Success

| Milestone | Target | Timeframe |
|-----------|--------|-----------|
| **Validation Signal** | 8-12% free-to-paid conversion | Month 1-3 |
| Weekly Sign-ups | 50/week | Month 1-3 |
| Activation Rate | 70% complete 1+ scan | Month 1-3 |
| Paying Subscribers | 500+ active | Month 6-12 |
| MRR | $2,500+ | Month 6-12 |
| Monthly Churn | <10% | Ongoing |

**Go/No-Go Decision:** If free-to-paid conversion stays below 8% after 3 months with adequate traffic, revisit core value proposition.

### Technical Success

| Metric | Target | Rationale |
|--------|--------|-----------|
| Analysis Speed | <20 seconds (p95) | Users won't wait longer |
| Uptime | 99.5% | Reliability for paying customers |
| OpenAI API Costs | <$20/mo for 200 scans | Sustainable unit economics |
| Error Rate | <5% on resume processing | Quality experience |

### Measurable Outcomes

- **Leading indicators:** Sign-up to first scan (>70%), suggestion acceptance (>60%), return usage (>40%)
- **Lagging indicators:** Conversion rate, interview callbacks, NPS >30

## Product Scope

### MVP - Minimum Viable Product

| # | Feature | Purpose |
|---|---------|---------|
| 1 | User Profile Setup | Experience level + target role powers personalization |
| 2 | Authentication | Email/password for accounts and subscription tracking |
| 3 | Rate Limiting | 3 free/month, unlimited paid — proves willingness to pay |
| 4 | Resume Upload | PDF/DOCX (max 2MB) with text extraction |
| 5 | Job Description Input | Paste JD text (max 5000 chars) |
| 6 | ATS Score & Analysis | 0-100 score + section breakdown |
| 7 | Improvement Suggestions | Before/after bullet rewrites |
| 8 | Transferable Skills Engine | Map non-tech skills to tech terminology |
| 9 | Results Dashboard | Accept/reject workflow for suggestions |
| 10 | Download Optimized Resume | PDF/DOCX output |

### Growth Features (Post-MVP)

- Resume templates (3-5 ATS-friendly options)
- Job description library (save & compare)
- Progress tracking (score history)
- Cover letter generation
- Interview prep Q&A
- LinkedIn profile review

### Vision (Future)

- AI Resume Builder (conversational, no existing resume needed)
- Chrome Extension (one-click optimize while browsing jobs)
- Enterprise/University licensing
- Community features (peer reviews, success stories)

## User Journeys

### Journey 1: Sarah Chen — The Academic Translator (Student Success Path)

**Opening Scene:**
Sarah stares at her laptop at 11 PM, surrounded by empty coffee cups. She's applied to 47 data analyst co-op positions in the last month. Zero callbacks. Her capstone project used advanced ML techniques — she built a recommendation system that outperformed the baseline by 23%. But her resume says: "Completed machine learning project for course requirement."

**Rising Action:**
A classmate mentions CoopReady. Sarah uploads her resume and pastes a job posting for a Data Analyst role at a fintech startup. The ATS score hits: **52/100**. Her stomach drops — but then she sees *why*. The job wants "stakeholder communication" and "business impact" — her resume has neither.

She clicks on her capstone project bullet. CoopReady shows:
- **Before:** "Completed machine learning project for course requirement"
- **After:** "Designed and deployed ML recommendation engine that improved prediction accuracy by 23%, presenting findings to faculty panel of 5 and incorporating feedback into production model"

Sarah's eyes widen. *That's exactly what I did. I just never said it that way.*

**Climax:**
She works through each suggestion — accepting the ones that resonate, tweaking others. Her skills section transforms: "Python" becomes "Python (pandas, scikit-learn, TensorFlow)". The transferable skills engine catches that her TA experience maps to "cross-functional collaboration" and "technical mentorship."

New score: **81/100**.

**Resolution:**
Sarah downloads her optimized resume. For the first time in weeks, she feels *confident* submitting an application. Two weeks later, she gets her first interview request — then two more. She wasn't unqualified. She was just hiding her achievements in academic language.

**Requirements Revealed:**
- Resume upload + text extraction
- JD input + keyword analysis
- ATS scoring with section breakdown
- Before/after bullet transformations
- Skills expansion suggestions
- Accept/reject workflow
- PDF download

---

### Journey 2: Marcus Johnson — The Career Pivoter (Career Changer Path)

**Opening Scene:**
Marcus finished his coding bootcamp three months ago. He can write Python, query databases, and spin up cloud infrastructure. But his resume still leads with "Retail Store Manager, 5 years." His bootcamp classmates with CS degrees are getting callbacks. He's getting ghosted.

He wonders if he needs to hide his retail experience entirely.

**Rising Action:**
Marcus selects "Career Changer" during CoopReady onboarding and pastes a Junior Data Engineer job posting. His ATS score: **48/100**. The analysis shows his bootcamp projects are buried at the bottom, and his retail experience uses zero tech terminology.

Then he sees the **Transferable Skills Engine**:
- "Managed inventory of 10,000+ SKUs" → "Database management, inventory optimization systems"
- "Led team of 12 associates" → "Cross-functional team leadership, performance coaching"
- "Reduced shrinkage by 15% through process improvements" → "Process optimization, data-driven decision making"

Marcus hadn't seen it before: his retail job *was* technical. He was doing data-driven operations without the vocabulary.

**Climax:**
CoopReady reorganizes his resume — bootcamp projects first, retail experience reframed as "Operations & Leadership Background." Each retail bullet now speaks tech language while telling the truth about what he did.

New score: **76/100**.

**Resolution:**
Marcus applies to 10 data engineering roles with his new resume. He gets 3 interview requests. In one interview, the hiring manager says: "I love that you have operational experience — most junior engineers have never worked in a real business environment."

His retail background wasn't a liability. It was his edge.

**Requirements Revealed:**
- Experience level selection (Career Changer mode)
- Transferable skills detection + mapping
- Resume structure reorganization suggestions
- Industry terminology translation
- Role-specific keyword optimization

---

### Journey 3: Priya Sharma — The International Adapter (International Student Path)

**Opening Scene:**
Priya moved from Mumbai to Toronto for her Master's in Computer Science. Back home, she led a team of 4 developers at a startup. But her resume is 3 pages long, includes her photo and date of birth, and lists every technology she's ever touched.

Canadian career advisors keep telling her to "make it more concise" — but nobody shows her *how*.

**Rising Action:**
Priya uploads her resume to CoopReady. The first thing she sees: "Resume length: 3 pages. North American standard: 1 page for early career."

The analysis breaks down specific issues:
- Personal information section (photo, DOB, marital status) — "Remove: not expected in North American resumes"
- Skills list of 40+ technologies — "Prioritize: match to job requirements"
- Bullet points starting with "Responsible for..." — "Reframe: lead with action verbs and impact"

**Climax:**
CoopReady transforms her experience bullets:
- **Before:** "Was responsible for development of mobile application features"
- **After:** "Developed 5 mobile app features serving 10K+ daily active users, reducing load time by 40%"

The tone shifts from modest to impact-driven — the way Canadian employers expect.

**Resolution:**
Priya's resume is now 1 page, quantified, and action-oriented. She finally understands the "Canadian style" everyone kept mentioning but nobody explained. Her next application gets a callback.

She had the skills. She just didn't know how to present them the local way.

**Requirements Revealed:**
- Resume length/format guidance
- Cultural adaptation suggestions
- Action verb recommendations
- Quantification prompts
- Before/after transformations for tone

---

### Journey 4: Returning User — Sarah's Next Chapter

**Opening Scene:**
It's 8 months later. Sarah landed that fintech co-op, and it went well. Now she's graduating and looking for full-time roles. She logs back into CoopReady.

**Rising Action:**
Her account shows her previous scans and resume versions. She uploads her updated resume — now with real work experience from her co-op — and pastes a job posting for a Senior Data Analyst role at a different company.

The analysis is different this time: she's not missing experience, but the JD emphasizes "stakeholder management" and "executive presentations" — skills she developed but hasn't highlighted.

**Climax:**
CoopReady suggests adding her co-op achievements:
- "Presented weekly insights to VP of Product, influencing $2M roadmap decisions"
- "Created self-serve dashboard reducing ad-hoc requests by 60%"

New score: **88/100**.

**Resolution:**
Sarah downloads her new resume, optimized for senior roles. CoopReady evolved with her — from student to professional.

**Requirements Revealed:**
- User accounts with scan history
- Resume version storage
- Progression from student to professional context
- Different optimization for senior roles

---

### Journey 5: Career Services Advisor — The Multiplier

**Opening Scene:**
David is a Career Peer Advisor at a university co-op office. He sees 15-20 students per day during peak season. Every conversation starts the same way: "Can you review my resume?"

He spends 80% of his time on the same feedback: "Quantify this. Use action verbs. Match keywords to the job posting."

**Rising Action:**
David starts recommending CoopReady to students *before* their appointments. "Run your resume through this first, then come see me."

Students arrive with resumes that already have proper formatting, quantified bullets, and relevant keywords. David can skip the basics and focus on *strategy* — which companies to target, how to network, how to prepare for interviews.

**Climax:**
David's appointments become 2x more productive. Instead of "add numbers to this bullet," he's discussing career paths and industry insights. Students leave with better outcomes. David handles more students without burning out.

**Resolution:**
David recommends CoopReady to the entire co-op office. They consider bulk licensing for the university.

**Requirements Revealed:**
- Shareable results / recommendations flow
- Potential future: university bulk licensing
- Value prop for B2B (career services) channel

---

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|---------------------------|
| **Sarah (Student)** | Upload, ATS scoring, before/after rewrites, skills expansion, accept/reject, download |
| **Marcus (Career Changer)** | Experience level selection, transferable skills engine, terminology translation, structure suggestions |
| **Priya (International)** | Format/length guidance, cultural adaptation, tone transformation, quantification prompts |
| **Returning User** | User accounts, scan history, resume versioning, progression context |
| **Career Services** | Shareability, B2B potential, scalable self-service |

## Web App (SaaS) Specific Requirements

### Project-Type Overview

CoopReady is a **hybrid web application** built with Next.js 14 (App Router), combining server-side rendering for public pages with client-side interactivity for the authenticated application experience.

### Technical Architecture Considerations

| Aspect | Approach |
|--------|----------|
| **Rendering Strategy** | Hybrid SSR + SPA — SSR for landing/marketing, CSR for dashboard |
| **Framework** | Next.js 14 with App Router |
| **State Management** | React Server Components + client hooks where needed |
| **API Layer** | Next.js API Routes (serverless functions) |
| **Database** | Supabase (Postgres + Auth + Storage) |
| **File Storage** | AWS S3 for resume uploads |
| **AI Integration** | OpenAI API (GPT-4o-mini, text-embedding-3-small) |
| **Payments** | Stripe (handles PCI compliance) |
| **Deployment** | Vercel (serverless, edge-optimized) |

### Browser Support Matrix

| Browser | Support Level |
|---------|---------------|
| Chrome (last 2 versions) | Full support |
| Firefox (last 2 versions) | Full support |
| Safari (last 2 versions) | Full support |
| Edge (last 2 versions) | Full support |
| iOS Safari | Full support (mobile) |
| Chrome Android | Full support (mobile) |
| IE11 | Not supported |

### Responsive Design Requirements

| Breakpoint | Target Devices | Priority |
|------------|----------------|----------|
| Mobile (< 768px) | Phones | High — students often on mobile |
| Tablet (768px - 1024px) | iPads, tablets | Medium |
| Desktop (> 1024px) | Laptops, monitors | High — primary editing experience |

**Design Approach:** Mobile-first CSS, responsive layouts with Tailwind CSS breakpoints.

### Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Time to Interactive (TTI) | < 3 seconds | User patience threshold |
| Largest Contentful Paint (LCP) | < 2.5 seconds | Core Web Vital |
| First Input Delay (FID) | < 100ms | Core Web Vital |
| Cumulative Layout Shift (CLS) | < 0.1 | Core Web Vital |
| Analysis Response Time | < 20 seconds (p95) | AI processing time |

### SEO Strategy

| Page Type | SEO Approach |
|-----------|--------------|
| Landing page | Full SSR, meta tags, structured data |
| Feature pages | SSR with keyword-optimized content |
| Blog/resources | SSR, sitemap inclusion |
| Dashboard/app | No index — behind auth |
| Results pages | No index — user-specific content |

**Target Keywords:**
- "resume optimization for students"
- "ATS checker for career changers"
- "co-op resume help"
- "entry level resume scanner"

### Accessibility Level

| Standard | Target | Implementation |
|----------|--------|----------------|
| WCAG 2.1 | AA compliance | Required for MVP |
| Keyboard Navigation | Full support | All interactive elements |
| Screen Readers | Full support | ARIA labels, semantic HTML |
| Color Contrast | 4.5:1 minimum | Text on backgrounds |
| Focus Indicators | Visible | Custom focus styles |

**Accessibility Priorities:**
- Form inputs with proper labels (resume upload, JD input)
- Clear error messages for screen readers
- Keyboard-navigable suggestion accept/reject workflow
- High contrast mode consideration

### Implementation Considerations

| Consideration | Approach |
|---------------|----------|
| **Authentication** | Supabase Auth (email/password for MVP) |
| **File Uploads** | Client-side validation → S3 presigned URLs |
| **Rate Limiting** | Middleware-based, tied to user subscription tier |
| **Error Handling** | Graceful degradation, user-friendly messages |
| **Loading States** | Skeleton screens during AI analysis |
| **Caching** | ISR for marketing pages, no cache for user data |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — deliver core resume optimization value with minimal features, iterate based on user feedback.

**Validation Strategy:** 5 beta users before enabling paid tier — enough to validate core value without over-engineering.

**Resource Requirements:** Solo technical founder with AI-assisted development, $50/month operational budget.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Sarah (Student) — full journey
- Marcus (Career Changer) — full journey
- Priya (International) — full journey
- Returning User — partial (no scan history for MVP)

**Must-Have Capabilities:** See [Product Scope > MVP](#product-scope) for the 10 core features plus Stripe payments integration.

**Explicitly Out of MVP:**
- Social login (Google, LinkedIn)
- Admin dashboard
- Resume templates
- JD library / comparison view
- Scan history / progress tracking
- Cover letter generation
- Interview prep Q&A

### Post-MVP Features

**Phase 2 (Growth — Month 3-6):**
- Resume templates (3-5 ATS-friendly options)
- Job description library (save & compare)
- Progress tracking (score history)
- Social login (Google, LinkedIn)
- Enhanced analytics

**Phase 3 (Expansion — Month 6-12):**
- Cover letter generation
- Interview prep Q&A
- LinkedIn profile review
- Job application tracker
- Admin dashboard

**Phase 4 (Platform — 12+ months):**
- AI Resume Builder (conversational)
- Chrome Extension
- Enterprise/University licensing
- Community features

### Risk Mitigation Strategy

| Risk Type | Risk | Likelihood | Mitigation |
|-----------|------|------------|------------|
| **Technical** | AI suggestion quality varies | Medium | Iterate on prompts, collect user feedback, A/B test prompt variations |
| **Market** | Users don't convert at 8%+ | Medium | Validate with 5 beta users before paid tier, pivot if needed |
| **Resource** | Solo founder bottleneck | High | Lean MVP scope, prioritize core flow, defer nice-to-haves |
| **Technical** | Resume parsing fails on edge cases | Medium | Start with PDF/DOCX only, graceful error handling |
| **Market** | Price too low for sustainability | Low | Monitor unit economics, consider $7-10 if value proven |

## Functional Requirements

### User Account Management

- **FR1:** Users can create an account using email and password
- **FR2:** Users can log in to their existing account
- **FR3:** Users can log out of their account
- **FR4:** Users can reset their password via email
- **FR5:** Users can select their experience level (Student or Career Changer) during onboarding
- **FR6:** Users can select their target role type during onboarding
- **FR7:** Users can update their experience level and target role in settings

### Resume Management

- **FR8:** Users can upload a resume file (PDF or DOCX format)
- **FR9:** System can extract text content from uploaded resume files
- **FR10:** System can parse resume sections (contact, education, experience, skills, projects)
- **FR11:** Users can view their extracted resume content before analysis
- **FR12:** System validates file type and size (max 2MB) before processing

### Job Description Management

- **FR13:** Users can paste job description text into a text input
- **FR14:** System can extract keywords and requirements from job descriptions
- **FR15:** System validates job description length (max 5000 characters)

### Analysis Engine

- **FR16:** System can calculate an ATS compatibility score (0-100) for resume vs job description
- **FR17:** System can identify missing keywords from job description not present in resume
- **FR18:** System can provide section-level breakdown of ATS score
- **FR19:** System can detect experience level context and adjust analysis accordingly
- **FR20:** System can identify resume format issues (length, structure, formatting)

### Suggestion Generation

- **FR21:** System can generate before/after bullet point rewrites for each experience entry
- **FR22:** System can detect transferable skills in non-tech experience
- **FR23:** System can map transferable skills to tech-equivalent terminology
- **FR24:** System can suggest action verb improvements for bullet points
- **FR25:** System can suggest quantification opportunities for achievements
- **FR26:** System can suggest skills expansion (e.g., "Python" → "Python (pandas, scikit-learn)")
- **FR27:** System can provide format/length guidance for North American resume standards
- **FR28:** System can suggest content to remove (e.g., photo, DOB for international students)

### Results & Feedback

- **FR29:** Users can view their ATS score and analysis results
- **FR30:** Users can view all generated suggestions organized by resume section
- **FR31:** Users can accept individual suggestions to include in optimized resume
- **FR32:** Users can reject individual suggestions to exclude from optimized resume
- **FR33:** Users can see a preview of how accepted suggestions change their resume
- **FR34:** Users can view missing keywords from the job description

### Resume Export

- **FR35:** Users can download their optimized resume with accepted suggestions applied
- **FR36:** Users can choose download format (PDF or DOCX)
- **FR37:** System generates properly formatted resume document for download

### Subscription & Billing

- **FR38:** Free users are limited to 3 scans per month
- **FR39:** System tracks and enforces scan usage limits per user
- **FR40:** Users can view their remaining scan count
- **FR41:** Users can upgrade to paid subscription ($5/month)
- **FR42:** Paid users have unlimited scans
- **FR43:** Users can manage their subscription (view status, cancel)
- **FR44:** System processes payments securely via Stripe

### Error Handling & Feedback

- **FR45:** System provides clear error messages when resume parsing fails
- **FR46:** System provides clear error messages when analysis cannot be completed
- **FR47:** Users can retry failed operations

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR1:** Page load time (TTI) | < 3 seconds | User patience threshold |
| **NFR2:** AI analysis completion | < 20 seconds (p95) | Users won't wait longer for results |
| **NFR3:** File upload processing | < 5 seconds | Immediate feedback after upload |
| **NFR4:** Core Web Vitals (LCP) | < 2.5 seconds | SEO and UX quality |
| **NFR5:** Core Web Vitals (CLS) | < 0.1 | Visual stability |

### Security

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR6:** Data encryption in transit | TLS 1.2+ (HTTPS) | Protect PII during transmission |
| **NFR7:** Data encryption at rest | AES-256 | Protect stored resumes and user data |
| **NFR8:** Authentication | Secure password hashing (bcrypt) | Protect user accounts |
| **NFR9:** File upload validation | Type, size, malware scanning | Prevent malicious uploads |
| **NFR10:** Payment processing | PCI-DSS compliant (via Stripe) | Secure payment handling |
| **NFR11:** Session management | Secure tokens, expiration | Prevent session hijacking |

### Accessibility

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR12:** WCAG compliance | Level AA | Inclusive design for all users |
| **NFR13:** Keyboard navigation | Full support | Users who can't use mouse |
| **NFR14:** Screen reader support | ARIA labels, semantic HTML | Visually impaired users |
| **NFR15:** Color contrast | 4.5:1 minimum | Readability for low vision |
| **NFR16:** Focus indicators | Visible on all interactive elements | Keyboard users |

### Integration

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR17:** OpenAI API availability | Handle failures gracefully, retry logic | Core dependency |
| **NFR18:** Stripe integration | Handle webhook failures, idempotent operations | Payment reliability |
| **NFR19:** S3 upload reliability | Retry failed uploads, timeout handling | File storage dependency |
| **NFR20:** Database connection | Connection pooling, reconnect logic | Supabase reliability |

### Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR21:** System uptime | 99.5% | Paying customers expect availability |
| **NFR22:** Error rate | < 5% for resume processing | Quality user experience |
| **NFR23:** Data backup | Daily automated backups | Data protection |

