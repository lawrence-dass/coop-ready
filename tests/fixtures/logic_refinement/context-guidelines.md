# LLM Context Guidelines for ATS Resume Optimizer

## Purpose

This document provides decision frameworks for interpreting and applying context from three primary inputs: the user's resume, the target job description, and user preferences (optimization level and content scope). The goal is to produce authentic, ATS-optimized resumes that accurately represent the candidate while maximizing alignment with target positions.

---

## Input Context Hierarchy

When context from different sources conflicts, apply this priority order:

1. **Authenticity constraints** (highest priority): Never fabricate experience, skills, or credentials
2. **Job description requirements**: Target role defines what to emphasize and how to frame experience
3. **Original resume content**: Source of truth for all claims, metrics, and experience
4. **User preferences**: Optimization level and content scope guide degree of modification

---

## Resume Context Interpretation

### What to Extract

**Factual elements (immutable):**
- Employment dates, job titles, company names
- Degrees, certifications, institutions, graduation dates
- Explicit metrics and achievements stated by candidate
- Technologies, tools, and methodologies explicitly mentioned

**Inferential elements (derivable with caution):**
- Years of experience in specific domains (calculate from dates)
- Seniority level (infer from titles, responsibilities, team size)
- Industry exposure (derive from company context)
- Skill adjacencies (Vue.js experience suggests React transferability)

**Context clues for metric inference:**
- Company size suggests scale of impact (Fortune 500 vs. startup)
- Role scope suggests team size, budget responsibility
- Industry norms provide reasonable metric ranges
- Explicit achievements can inform implicit ones in similar roles

### Career Stage Detection

Identify candidate's career stage to calibrate expectations and formatting:

| Indicator | Early Career (0-3 yrs) | Mid-Career (4-10 yrs) | Senior (10+ yrs) |
|-----------|------------------------|----------------------|------------------|
| Education prominence | High | Medium | Low |
| Projects section | Often needed | Situational | Rarely needed |
| Skills detail | Comprehensive | Focused | Strategic |
| Achievement scope | Individual | Team/project | Organization/business |
| Resume length default | 1 page | 1-2 pages | 2 pages max |

### International Student Context

Many users are international master's students with professional experience from different countries and industries. Handle this context carefully:

**Experience from non-US/Canada markets:**
- Validate that job titles translate appropriately (some titles inflate or deflate across markets)
- Company names may need brief context if not globally recognized
- Metrics may need localization (currency conversion for financial impact, market context for percentages)
- Regulatory and compliance experience may differ by jurisdiction

**Language considerations:**
- Technical terminology should use North American conventions when targeting Canadian/US roles
- Industry-specific terms may have regional variations (e.g., "redundancy" vs. "layoff")
- Acronyms should be spelled out if they may be region-specific

**Credential handling:**
- Foreign degrees are valid; include institution name and country
- Professional certifications may need equivalency notes if jurisdiction-specific
- Licensures (law, medicine, accounting) typically don't transfer directly; frame as domain knowledge

---

## Job Description Context Interpretation

### Requirement Classification

Parse job descriptions to identify:

**Hard requirements (must address):**
- Skills listed as "required," "must have," or in minimum qualifications
- Years of experience thresholds
- Specific certifications or degrees mentioned as requirements
- Technical stack explicitly required

**Soft requirements (should address if possible):**
- Skills listed as "preferred," "nice to have," or "bonus"
- Industry experience preferences
- Team size or leadership experience preferences
- Specific methodologies mentioned

**Implicit requirements (infer from context):**
- Communication skills (customer-facing role, cross-functional mentions)
- Leadership potential (growth trajectory language, mentorship mentions)
- Technical depth vs. breadth (specialist vs. generalist indicators)
- Cultural fit signals (startup pace, enterprise process, etc.)

### Keyword Extraction Strategy

**Primary keywords (highest weight):**
- Job title and variations
- Core technical skills in requirements section
- Tools/platforms explicitly named
- Domain terminology repeated multiple times

**Secondary keywords (medium weight):**
- Skills in preferred qualifications
- Methodologies mentioned (Agile, Scrum, DevOps)
- Soft skills explicitly requested
- Industry-specific terminology

**Tertiary keywords (contextual):**
- Company-specific terms or products
- Team or department names
- Process terminology

### Role Level Calibration

Match resume language to job level:

| Job Level | Achievement Language | Scope Indicators | Typical Verbs |
|-----------|---------------------|------------------|---------------|
| Entry/Junior | Individual contributions, learning, growth | Single projects, specific tasks | Built, Developed, Implemented, Assisted |
| Mid-level | Ownership, efficiency, collaboration | Multiple projects, team coordination | Led, Designed, Optimized, Delivered |
| Senior | Strategy, mentorship, architecture | Cross-functional, department-wide | Architected, Established, Mentored, Drove |
| Lead/Principal | Vision, organizational impact, technical direction | Company-wide, industry influence | Transformed, Pioneered, Defined, Scaled |

---

## Career Transition Context

### Understanding the Pivot

Many users are master's students transitioning from established careers to new fields. Common patterns:

**Source fields and their transferable strengths:**

| Previous Field | Transferable to Analytics/Tech | Key Reframing |
|----------------|-------------------------------|---------------|
| Law | Compliance, risk analysis, contract automation, legal tech | Analytical reasoning, attention to detail, stakeholder communication |
| Banking/Finance | Fintech, quantitative analysis, risk modeling | Numerical analysis, regulatory knowledge, client management |
| Biochemistry/Science | Data science, research roles, biotech | Experimental design, statistical analysis, hypothesis testing |
| Management/Operations | Product management, business analytics, strategy | Process optimization, team leadership, business acumen |
| Healthcare | Health tech, clinical analytics, patient data | Domain expertise, compliance awareness, outcome measurement |

### Pivot Positioning Framework

When positioning a career changer:

1. **Lead with transferable skills, not job titles**: The skills section should prominently feature capabilities relevant to the target role, regardless of where they were developed

2. **Reframe achievements in target language**: A lawyer who "drafted 50+ contracts" can be reframed as "analyzed complex documents and extracted key provisions," which resonates with data analysis roles

3. **Bridge the gap explicitly**: The professional summary should connect past experience to target role logically

4. **Emphasize learning velocity**: Recent education, certifications, and projects demonstrate commitment and capability in the new field

5. **Don't hide the background**: Career changers with domain expertise are often MORE valuable, not less. A data analyst with law background brings unique perspective to legal tech or compliance analytics

### Academic-to-Industry Translation

For candidates whose primary recent experience is academic:

**Course projects become portfolio pieces:**
- Frame significant class projects as professional work with proper scope and outcomes
- Include technologies used, methodologies applied, and results achieved
- Quantify where possible (dataset size, model performance, time saved)

**Research translates to business impact:**
- "Published paper on X" becomes "Conducted original research analyzing Y, producing insights adopted by Z"
- Statistical methods are directly applicable
- Literature review demonstrates research and synthesis skills

**Teaching/TA experience shows leadership:**
- Mentoring students parallels onboarding team members
- Creating curriculum materials shows documentation and communication skills
- Managing office hours demonstrates stakeholder management

---

## User Preference Context

### Optimization Level Interpretation

**Conservative (15-25% modification):**
- Preserve original voice and structure
- Add keywords naturally within existing content
- Light quantification enhancement
- Minimal restructuring
- Best when: Strong existing alignment, candidate has clear personal brand

**Moderate (35-50% modification):**
- Strategic reorganization for relevance
- Active reframing of achievements
- Section reordering based on target role
- Enhanced quantification with reasonable inference
- Best when: Good foundation needs better positioning, standard career progression

**Aggressive (60-75% modification):**
- Complete restructuring around job requirements
- Maximum keyword integration
- Full rewrite of achievement bullets
- Significant reordering and emphasis shifts
- Best when: Career pivots, major emphasis changes, weak original alignment

### Content Scope Interpretation

**Focused (1-2 roles):**
- Only most relevant positions
- Deep detail on transferable experience
- Projects and education may feature more prominently
- Best when: Career changers, targeting very specific roles, recent graduates

**Balanced (2-3 roles):**
- Recent roles in detail, older roles condensed
- Shows trajectory while maintaining focus
- Standard formatting with clear progression
- Best when: Most situations, demonstrates growth without overwhelming

**Comprehensive (3-4+ roles):**
- Full career story with prioritized detail
- Earlier roles support narrative but condensed
- Shows breadth and evolution
- Best when: Senior positions, comprehensive background valuable, 10+ years experience

---

## Context Conflict Resolution

### When Resume and Job Description Conflict

**Skill gap identified:**
- Never fabricate the missing skill
- Identify adjacent skills that partially address the requirement
- Note transferable capabilities from related experience
- Flag the gap honestly in the "Key Changes Made" section
- Suggest actions to address (certification, project, etc.)

**Experience level mismatch:**
- If underqualified: Emphasize relevant achievements, learning velocity, adjacent experience
- If overqualified: Focus on aspects of the role that genuinely interest candidate
- Never inflate or deflate actual experience level

**Industry terminology differences:**
- Use the job description's terminology when candidate's experience is equivalent
- Provide context when direct equivalence isn't possible
- Don't force terminology that misrepresents the actual experience

### When User Preferences Conflict with Best Practices

**Aggressive optimization requested but minimal relevant experience:**
- Explain the constraint
- Maximize optimization within authenticity bounds
- Suggest complementary actions (projects, certifications)

**Focused scope requested but multiple highly relevant roles:**
- Present focused version as requested
- Note what's being omitted and potential impact
- Offer to provide alternative if desired

**Conservative optimization requested for weak alignment:**
- Honor the preference
- Clearly note remaining gaps
- Suggest that moderate optimization might better serve their goals

---

## Context Application Checklist

Before generating output, verify:

**Resume context properly extracted:**
- [ ] All employment dates and titles accurately captured
- [ ] Technical skills inventory complete
- [ ] Achievements and metrics identified
- [ ] Career stage correctly assessed
- [ ] International experience properly contextualized

**Job description context properly analyzed:**
- [ ] Hard vs. soft requirements distinguished
- [ ] Primary keywords identified
- [ ] Role level calibrated
- [ ] Implicit requirements inferred

**User preferences honored:**
- [ ] Optimization level reflected in modification degree
- [ ] Content scope determines role inclusion
- [ ] Any specific requests addressed

**Authenticity maintained:**
- [ ] No fabricated skills or experience
- [ ] Metrics based on actual or reasonable inference
- [ ] Credential accuracy preserved
- [ ] Seniority level accurately represented

---

## Edge Cases and Special Handling

### Minimal Professional Experience

When candidate has limited or no professional experience:

- Elevate education, projects, and certifications
- Reorder sections to lead with strengths
- Frame academic work as professional achievements
- Include relevant internships, co-ops, or volunteer work
- Focus on demonstrated skills rather than years of experience

### Employment Gaps

Handle honestly and constructively:

- Don't try to hide gaps through date manipulation
- Frame productively if context available (education, caregiving, health, freelance)
- Focus surrounding content on achievements rather than duration
- If gap is unexplained in resume, note that candidate may want to address in cover letter

### Non-Traditional Background

For candidates with unconventional paths:

- Identify the narrative thread that makes sense of the journey
- Emphasize adaptability and learning ability
- Find the common skills across diverse experiences
- Position diversity of experience as a strength for roles requiring broad perspective

### Overqualified Candidates

When targeting roles below apparent experience level:

- Focus on genuine interest factors
- Emphasize aspects of role that engage candidate
- Don't artificially diminish accomplishments
- Be honest that candidate may face "overqualified" concerns

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial context guidelines document |
