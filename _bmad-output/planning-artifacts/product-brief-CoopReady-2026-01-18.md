---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - intial_docs/application-idea.md
  - intial_docs/old_prd.md
  - intial_docs/old_prd-polished.md
date: 2026-01-18
author: Lawrence
---

# Product Brief: CoopReady

## Executive Summary

**CoopReady** is an AI-powered resume optimization tool designed specifically for students seeking co-op/internship opportunities and career changers transitioning into tech roles.

Unlike generic ATS checkers that penalize candidates for lack of traditional work experience, CoopReady understands the user's starting point and adapts all suggestions accordingly—translating academic projects into professional achievements for students, and mapping transferable skills to tech terminology for career changers.

**Core Differentiator:** Experience-level-aware AI that speaks the language of university co-op programs and understands what hiring managers actually look for in entry-level candidates.

**Revenue Model:** Freemium (3 scans/month free, unlimited for $5/month)

**Target Market:** Fresh graduates, master's students, bootcamp grads, and career changers targeting tech roles.

---

## Core Vision

### Problem Statement

Students and career changers face a cruel paradox: they have real skills and genuine potential, but ATS systems filter them out before a human ever sees their resume. The problem isn't their qualifications—it's their inability to translate their experience into the language employers expect.

**For Students:**
- Academic projects are described in classroom language, not professional achievement terms
- Generic ATS tools penalize them for "lack of experience" instead of helping them reframe what they have
- Existing tools ($30-50/month) are financially inaccessible to students

**For Career Changers:**
- Transferable skills from previous careers (leadership, operations, customer service) are invisible to ATS systems
- They don't know how to position non-tech experience for tech roles
- No tool helps them translate "managed retail team" → "led cross-functional operations"

### Problem Impact

- Students apply to 50+ positions with zero responses—not because they're unqualified, but because their resumes never reach human eyes
- Career changers feel their previous experience is a liability rather than an asset
- Confidence erodes with each rejection, creating a cycle of underperformance in applications
- The people who most need career help can least afford the $30-90/month tools that might help

### Why Existing Solutions Fall Short

| Tool | Price | Core Problem |
|------|-------|--------------|
| Jobscan | $49/mo | Generic—treats all candidates the same regardless of experience level |
| Resume Worded | $33/mo | Keyword-focused—misses the narrative context that matters for inexperienced candidates |
| Rezi | $29/mo | Template-focused—doesn't provide intelligent, adaptive suggestions |
| ChatGPT (raw) | Free | No structure, no co-op context, no before/after workflow, inconsistent quality |

**The gap:** No tool combines experience-level awareness, university co-op ecosystem knowledge, and an affordable price point.

### Proposed Solution

CoopReady provides:

1. **Experience-Level-Aware Analysis** — Select "Student" or "Career Changer" and get suggestions tailored to your context
2. **Before/After Transformation** — See your vague bullet points transformed into impactful, ATS-friendly achievements
3. **Transferable Skills Engine** — Automatic mapping of non-tech skills to tech-equivalent terminology
4. **University Co-op Context** — Built with deep understanding of co-op programs, hiring timelines, and what employers actually look for
5. **Accessible Pricing** — $5/month instead of $30-50, because students shouldn't be priced out of career help

### Key Differentiators

| Differentiator | Why It Matters |
|----------------|----------------|
| **Founder is embedded in the problem** | Career peer advisor who helps students land co-ops daily—not building from assumptions, but from real conversations |
| **University/industry network** | Direct connections to experiential learning programs and industry partners for feedback and distribution |
| **Technical founder** | Software engineer who can build, iterate, and ship without external dependencies |
| **Spec-driven development** | Modern AI-assisted development enables rapid, high-quality iteration |
| **Co-op ecosystem knowledge** | Understanding of university co-op programs baked into the product—not generic job search advice |
| **10x quality bar** | Before/after comparisons that make users say "this actually gets me" |

---

## Target Users

### Primary Users

#### Persona 1: Sarah Chen — "The Academic Translator"

**Profile:**
- Master's student in Data Science
- No prior work experience (only academic projects and internships)
- Applying for data analyst co-op positions
- Budget-conscious ($5/month max)

**Problem Experience:**
- Resume reads like an academic paper: "Completed data analysis project using Python"
- Applied to 47+ positions with zero responses
- Generic ATS tools penalize her for "lack of experience"
- Knows she has the skills but can't translate them to employer language

**Success Vision:**
- Sees her capstone project transformed into a professional achievement
- ATS score jumps from 52 → 81
- Gets 3 interview requests within 10 days
- Realizes her class projects ARE professional experience—just needed reframing

**Quote:** "I wasn't selling myself short—I was hiding my achievements in academic language."

---

#### Persona 2: Marcus Johnson — "The Career Pivoter"

**Profile:**
- 5 years in retail management
- Completed coding bootcamp (Python, SQL, cloud)
- Transitioning to junior data engineer role
- Previous experience feels like a liability

**Problem Experience:**
- Bootcamp classmates with "related experience" are landing jobs; he's getting ghosted
- Transferable skills (leadership, operations, data-driven decisions) are invisible to ATS
- Doesn't know how to position retail management for tech roles
- Confidence eroding with each rejection

**Success Vision:**
- Sees skill mappings: "Managed inventory database" → "Database administration, SQL optimization"
- Bullet points rewritten to highlight transferable skills
- Realizes retail experience is a *differentiator*, not a liability
- Lands a data engineer role where operational background becomes his edge

**Quote:** "My retail experience isn't a liability—I just never knew how to speak the language."

---

#### Persona 3: Priya Sharma — "The International Adapter"

**Profile:**
- International student (e.g., from India, China, or Middle East)
- Strong technical background from home country
- Needs to adapt resume to North American (Canada/US) style
- Unfamiliar with local hiring norms, ATS expectations, and co-op culture

**Problem Experience:**
- Resume format doesn't match North American expectations (wrong structure, too long, missing keywords)
- Doesn't understand what Canadian/US employers look for in co-op candidates
- Cultural differences in how achievements are presented (modest vs. impact-driven)
- Language nuances make bullet points sound "off" to local recruiters

**Success Vision:**
- Resume transformed to North American format and tone
- Learns to quantify achievements the way local employers expect
- Understands co-op hiring timelines and expectations
- Gets interviews at companies that previously auto-rejected her

**Quote:** "I have the skills—I just didn't know how to present them the Canadian way."

---

### Secondary Users

#### Career Services Staff

**Profile:**
- University career advisors, co-op coordinators, experiential learning staff
- Help hundreds of students per semester with resume reviews
- Limited time per student (15-30 minute appointments)
- Need scalable tools to amplify their impact

**How They Benefit:**
- Can recommend CoopReady to students before appointments (pre-optimization)
- Students arrive with better-prepared resumes, making sessions more productive
- Potential for university-sponsored bulk licensing
- Reduces repetitive "resume basics" feedback, allowing focus on strategic coaching

**Relationship to Product:**
- Distribution channel (recommend to students)
- Potential enterprise customer (university licensing)
- Feedback source (see patterns across hundreds of students)

---

### User Journey

#### Discovery
- **Students:** Word-of-mouth from classmates, career advisor recommendation, Reddit/LinkedIn posts about job search struggles
- **Career Services:** Hear about tool from students or peer institutions, evaluate for bulk licensing

#### Onboarding
- Sign up (email/password)
- Select experience level: "Student" or "Career Changer"
- Select target role (Data Analyst, Software Engineer, etc.)
- Upload resume + paste job description

#### Core Usage (The "Aha!" Moment)
- See ATS score (often shockingly low: 48-55)
- View before/after bullet point transformations
- For career changers: See transferable skills mapped to tech terminology
- For international students: See North American formatting applied
- Accept/reject individual suggestions

#### Success Moment
- Download optimized resume
- Apply to jobs with confidence
- Get interview requests (validation that it worked)

#### Long-term Engagement
- Return for each new job application (different JD = different optimization)
- Upgrade to paid tier for unlimited scans during active job search
- Recommend to classmates/friends (virality loop)

---

## Success Metrics

### North Star Metric

**Free-to-Paid Conversion Rate**

The single metric that proves product-market fit: users finding enough value in CoopReady to pay $5/month.

- **Target:** 8-12% conversion (industry benchmark: 5%)
- **Why it matters:** If students—who are notoriously budget-conscious—choose to pay, we've proven real value
- **Measurement:** (Paid subscribers / Total registered users) × 100

---

### User Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Interview Callbacks** | Track user-reported callbacks post-optimization | The ultimate proof—resumes are getting past ATS and into human hands |
| **ATS Score Improvement** | +20 points average (e.g., 52 → 72) | Immediate, visible feedback that optimization worked |
| **Time to First Scan** | <5 minutes after sign-up | Low friction = users see value fast |
| **Suggestion Acceptance Rate** | 60%+ of suggestions accepted | AI recommendations are relevant and useful |
| **Resume Quality** | 80%+ of job description keywords present in optimized resume | Tangible improvement in ATS compatibility |

**Success Moments:**
- User sees their vague bullet point transformed and says "this is exactly what I meant"
- User reports getting interview request within 2 weeks of using CoopReady
- Career changer sees transferable skills mapped and realizes their experience *is* valuable

---

### Business Objectives

#### Month 1-3 (MVP Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Weekly Sign-ups | 50/week | New registrations via analytics |
| Activation Rate | 70% complete 1+ scan | (Users with ≥1 scan / Total users) × 100 |
| Landing Page Conversion | 5-10% | (Sign-ups / Visitors) × 100 |
| Free-to-Paid Conversion | 8-12% | (Paid / Total registered) × 100 |

#### Month 6-12 (Growth Phase)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Paying Subscribers | 500+ active | Count of active paid accounts |
| Monthly Recurring Revenue (MRR) | $2,500+ | Paid subscribers × $5 |
| Monthly Churn | <10% | (Canceled / Total paid at start of month) × 100 |
| Scans per User | 2.5 average/month | Total scans / Active users |
| Referral Rate | 15% of users refer 1+ friend | (Users who referred / Total users) × 100 |

#### Revenue Milestones

| Milestone | Target | Significance |
|-----------|--------|--------------|
| Break-even | 10 paying customers ($50 MRR) | Covers operational costs |
| Sustainability | 100 paying customers ($500 MRR) | Self-sustaining within 6 months |
| Growth signal | 1000+ users, 12%+ conversion | Consider price increase or investment |

---

### Key Performance Indicators

#### Leading Indicators (Predict Future Success)

| KPI | Target | Why It's Leading |
|-----|--------|------------------|
| Sign-up to First Scan Rate | >70% | Shows onboarding works—predicts activation |
| Suggestion Acceptance Rate | >60% | Shows AI quality—predicts satisfaction |
| Session Duration | >3 minutes | Shows engagement—predicts value perception |
| Return Usage (2+ scans) | >40% | Shows stickiness—predicts conversion |

#### Lagging Indicators (Confirm Success)

| KPI | Target | Why It's Lagging |
|-----|--------|------------------|
| Free-to-Paid Conversion | 8-12% | Confirms product-market fit |
| User-Reported Interview Callbacks | Track qualitatively | Confirms real-world impact |
| Net Promoter Score (NPS) | >30 | Confirms user satisfaction |
| Monthly Churn | <10% | Confirms ongoing value |

---

### Technical Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Analysis Speed | <20 seconds (95th percentile) | Users won't wait longer |
| Uptime | 99.5% | Reliability for paying customers |
| OpenAI API Costs | <$20/mo for 200 scans | Cost efficiency at scale |
| Error Rate | <5% on resume processing | Quality user experience |

---

## MVP Scope

### Design Principle

**Lean MVP, Scalable Foundation**

Build the smallest thing that delivers the core value (resume optimization), but architect it to support future features without major rewrites. The MVP proves the concept; the platform enables the vision.

---

### Core Features (MVP)

| # | Feature | Description | Why Essential |
|---|---------|-------------|---------------|
| 1 | **User Profile Setup** | Experience level (Student/Career Changer) + target role selection | Powers AI personalization—every suggestion depends on this context |
| 2 | **Authentication** | Email/password sign-up and login | User accounts enable saved data and subscription tracking |
| 3 | **Rate Limiting** | Free tier: 3 scans/month; Paid tier: unlimited | Business model foundation; proves willingness to pay |
| 4 | **Resume Upload** | PDF/DOCX upload (max 2MB) with text extraction | Core input—users bring their existing resume |
| 5 | **Job Description Input** | Paste job description text (max 5000 chars) | Comparison target for ATS optimization |
| 6 | **ATS Score & Analysis** | Overall score (0-100) + section-level breakdown | Immediate, visible feedback that creates urgency to optimize |
| 7 | **Improvement Suggestions** | Section-level advice + bullet-point rewrites (before/after) | The "aha!" moment—users see their vague text transformed |
| 8 | **Transferable Skills Engine** | Detect non-tech skills and map to tech terminology | Career changer differentiator—core value prop |
| 9 | **Results Dashboard** | Score visualization, missing keywords, accept/reject workflow | Users control what changes; builds trust in AI suggestions |
| 10 | **Download Optimized Resume** | Generate PDF/DOCX with accepted suggestions applied | Deliverable output—users leave with something actionable |

**MVP Success Criteria:**
- Users complete first scan in <5 minutes
- 60%+ suggestion acceptance rate
- 8-12% free-to-paid conversion
- Users report interview callbacks

---

### Out of Scope for MVP

| Feature | Rationale | When to Add |
|---------|-----------|-------------|
| **Resume Templates** | Users bring their own format; templates add complexity | Phase 2 (Month 3-6) |
| **Cover Letter Generation** | Different document type; focus on resume mastery first | Phase 3 (Month 6-12) |
| **Job Description Library** | One JD at a time is enough to prove value | Phase 2 |
| **Progress Tracking** | Nice-to-have; not core to immediate value | Phase 2 |
| **Interview Prep Q&A** | Different problem space; requires separate AI workflow | Phase 3 |
| **Job Application Tracker** | Complementary feature, not core to resume optimization | Phase 3 |
| **LinkedIn Profile Review** | Different input format; requires LinkedIn parsing | Phase 3 |
| **Mobile App** | Web-first; mobile can come later if demand exists | Phase 4 (12+ months) |

---

### Scalability Considerations

**Architecture Decisions for Future Growth:**

| Concern | MVP Approach | Future-Proofing |
|---------|--------------|-----------------|
| **Multi-document support** | Resume only | Design data model to support multiple document types (cover letter, LinkedIn) |
| **AI workflow flexibility** | Single analysis pipeline | Modular AI prompts that can be extended for different analysis types |
| **User data model** | Basic profile + scans | Extensible schema for job tracking, interview prep, progress history |
| **Feature flags** | None needed for MVP | Plan for feature flag infrastructure to enable gradual rollouts |
| **API design** | Internal API routes | RESTful patterns that could become public API for integrations |

---

### Future Vision

#### Phase 2: Enhanced Value (Month 3-6)

| Feature | Description |
|---------|-------------|
| **Resume Templates** | 3-5 ATS-friendly templates (Conservative, Modern, Technical) |
| **Job Description Library** | Save JDs, re-scan against multiple jobs, comparison view |
| **Progress Tracking** | Score improvement over time, historical scan results |
| **Enhanced Analytics** | Industry benchmarks, keyword trends |

#### Phase 3: Expanded Capabilities (Month 6-12)

| Feature | Description |
|---------|-------------|
| **Interview Prep Q&A** | AI-generated likely interview questions based on resume + JD, with researched expected answers and STAR-method templates |
| **Cover Letter Generation** | AI-generated cover letters tailored to experience level |
| **LinkedIn Profile Review** | Analyze LinkedIn profile for consistency with resume, suggest optimizations for recruiter visibility |
| **Job Application Tracker** | Track applications, interviews, follow-ups; automated reminders; success rate analytics |

#### Phase 4: Platform Vision (12+ Months)

| Feature | Description |
|---------|-------------|
| **AI Resume Builder** | Build entire resume through conversational AI (no existing resume required) |
| **Resume Co-Pilot (Chrome Extension)** | One-click optimize for any job posting while browsing |
| **Community Features** | Peer reviews, success stories, shared templates |
| **Enterprise/University Licensing** | Bulk licensing for career centers, bootcamps, corporate reskilling |

---

### MVP-to-Platform Evolution

```
MVP (Now)                    Phase 2-3 (6-12mo)              Platform (12mo+)
─────────────────────────────────────────────────────────────────────────────
Resume Optimization    →     Multi-Document Support    →     Full Career Toolkit
  └─ ATS Score               └─ Cover Letters               └─ Resume Builder
  └─ Bullet Rewrites         └─ LinkedIn Review             └─ Job Tracker
  └─ Skills Mapping          └─ Interview Prep              └─ Chrome Extension
                             └─ Progress Tracking           └─ Community
                                                            └─ Enterprise
```

**Key Principle:** Each phase builds on the previous. MVP proves the core value; future features expand the relationship with users who already trust the product.
