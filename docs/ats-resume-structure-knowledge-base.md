# SubmitSmart ATS Knowledge Base: Resume Structure, Section Ordering & Scoring Rules

**Document Version:** 2.0
**Last Updated:** February 2026
**Purpose:** Comprehensive reference for the SubmitSmart ATS optimizer. This document provides evidence-based rules for how resumes should be structured, ordered, and scored based on candidate type (co-op/intern vs. full-time), with emphasis on North American tech, analytics, and data science roles.

**Usage:** This document is designed to be consumed by an LLM (Claude) as project-level context for generating ATS-optimized resume suggestions, scoring resumes accurately, and adapting structural recommendations based on candidate profile.

---

## Table of Contents

1. [System Context & Candidate Types](#1-system-context--candidate-types)
2. [How ATS Systems Actually Work](#2-how-ats-systems-actually-work)
3. [Resume Section Ordering: Co-op & Internship Candidates](#3-resume-section-ordering-co-op--internship-candidates)
4. [Resume Section Ordering: Full-Time Experienced Candidates](#4-resume-section-ordering-full-time-experienced-candidates)
5. [Section-by-Section Rules & ATS Behavior](#5-section-by-section-rules--ats-behavior)
6. [Scoring Architecture by Candidate Type](#6-scoring-architecture-by-candidate-type)
7. [Formatting Rules That Prevent Parsing Failures](#7-formatting-rules-that-prevent-parsing-failures)
8. [Keyword Strategy & ATS Matching Logic](#8-keyword-strategy--ats-matching-logic)
9. [The Professional Summary Debate](#9-the-professional-summary-debate)
10. [Part-Time Candidate Considerations](#10-part-time-candidate-considerations)
11. [Eye-Tracking & Recruiter Behavior Data](#11-eye-tracking--recruiter-behavior-data)
12. [Myths vs. Reality: What the Evidence Shows](#12-myths-vs-reality-what-the-evidence-shows)
13. [Source References](#13-source-references)
14. [Implementation Notes for SubmitSmart](#14-implementation-notes-for-submitsmart)

---

## 1. System Context & Candidate Types

SubmitSmart serves two distinct candidate profiles. The resume structure, section ordering, scoring weights, and suggestion logic MUST adapt based on which profile is active.

### Candidate Type: Co-op / Internship

- Master's students (Analytics, Data Science, CS, Design, and related programs)
- Limited or no professional industry experience
- Academic projects, coursework, and transferable skills are primary assets
- Applying through Canadian co-op programs (Northeastern Vancouver, UBC, SFU, Waterloo) and external postings
- Resume length: strictly 1 page
- No professional summary needed (wastes space without a track record)

### Candidate Type: Full-Time / Experienced

- Professionals with 3+ years of relevant work experience
- Career changers who completed a master's degree to pivot industries
- Prior professional experience is the primary asset, supplemented by education and projects
- Resume length: 1-2 pages depending on experience depth
- Professional summary is conditional (tailored = valuable; generic = harmful)

### How to Detect Candidate Type

The system should infer candidate type from the resume content and/or user-provided metadata:

- If the user selects "co-op" or "internship" as job type: use co-op/intern structure
- If the user selects "full-time" as job type: use experienced candidate structure
- If the resume has fewer than 2 professional roles AND an active education section with expected graduation date: default to co-op/intern
- If the resume has 3+ professional roles with 3+ years total experience: default to full-time/experienced
- Career changers completing a master's should be treated as a hybrid: use full-time structure but weight education and projects higher than standard full-time (see Section 6 for weight adjustments)

---

## 2. How ATS Systems Actually Work

### The Auto-Rejection Myth is False

The widely cited claim that ATS platforms automatically reject 75% of resumes is definitively debunked. That statistic originated from a 2012 sales pitch by Preptel (now defunct) with no published methodology. A 2025 Enhancv study interviewing 25 U.S. recruiters using Workday, Greenhouse, iCIMS, and BambooHR found that 92% confirmed their ATS does NOT automatically reject resumes based on formatting or keyword absence. Only 8% had content-based auto-rejection enabled, and only for hard thresholds like matching fewer than 7 of 10 required skills.

**What this means for SubmitSmart:** Do not tell users their resume will be "auto-rejected." The accurate framing is that their resume may not surface in recruiter keyword searches, which effectively makes it invisible. The goal is searchability, not avoiding rejection.

### How ATS Parsing Actually Works

Major ATS platforms (Workday, Greenhouse, Lever, iCIMS, Taleo) license third-party parsing engines: RChilli, Textkernel (formerly Sovren), and Daxtra. These parsers follow a four-stage pipeline:

1. **Text Extraction:** Raw text is extracted from the document (.docx or .pdf)
2. **Section Segmentation:** Content is divided into blocks using section headers. Parsers match headers against a dictionary of standard keywords ("Education," "Experience," "Skills"). Non-standard headers like "My Journey" or "Track Record" may cause the parser to fail section categorization entirely.
3. **Field Parsing:** Within each section, the parser extracts structured fields: job title, company name, dates, degree, institution, individual skills.
4. **Relevance Scoring:** Keywords from the resume are matched against the job description or recruiter search queries. Scores are calculated based on keyword presence, frequency, and placement.

### ATS-Safe Section Header Names

The following headers reliably map to standard parser dictionaries:

| Section | Safe Headers | Unsafe Headers |
|---------|-------------|----------------|
| Work history | "Professional Experience", "Work Experience", "Experience", "Employment History" | "My Journey", "Track Record", "Career Path", "What I've Done" |
| Skills | "Technical Skills", "Skills", "Core Competencies", "Areas of Expertise" | "What I Know", "My Toolkit", "Tech Stack" |
| Education | "Education", "Academic Background" | "Learning", "Where I Studied" |
| Projects | "Projects", "Technical Projects", "Project Experience" | "Things I've Built", "My Work" |
| Summary | "Professional Summary", "Summary", "Profile" | "About Me", "Who I Am" |

**Critical insight from University at Buffalo:** "The ATS will weigh, or score content in one section differently than another. The experience section is often weighed more." A skill mentioned both in the Skills section AND within an experience bullet point receives higher weight than one listed only in a skills block.

### How Recruiters Use ATS (Not How Candidates Fear It)

99.7% of recruiters use keyword filters in their ATS to sort and prioritize applicants (Jobscan 2025 State of the Job Search). The resume isn't being auto-rejected; it's being searched like a database. If keywords don't match the recruiter's query, the resume simply never surfaces.

---

## 3. Resume Section Ordering: Co-op & Internship Candidates

### Recommended Order

```
1. HEADER
   - Full name, email, phone, city/province, LinkedIn URL, GitHub/portfolio URL
   - Place in main document body (NOT in document header/footer)

2. TECHNICAL SKILLS / SKILLS SUMMARY
   - Categorized: Languages, Frameworks/Libraries, Tools/Platforms, Databases, Cloud
   - Keywords extracted directly from target job descriptions
   - This section goes FIRST because recruiters search for "Python," "SQL," "TensorFlow" 
     before they search for degree names

3. EDUCATION
   - Degree name, institution, city, expected graduation date
   - Co-op designation if applicable
   - GPA if 3.5+ (or 80%+ in Canadian systems)
   - Relevant coursework (match JD keywords: "Machine Learning," "Databases," "NLP")
   - Academic honors, Dean's List, scholarships

4. PROJECT EXPERIENCE (use "Project Experience" NOT just "Projects")
   - Title the section "Project Experience" to trigger ATS experience-level weighting
   - Each project: title, technologies used, date range
   - 2-3 bullets per project using action verb + contribution + quantified result
   - Emphasize individual role, not just team output
   - Include course projects, personal projects, hackathon projects, capstone work

5. WORK EXPERIENCE (if any)
   - Co-op placements, internships, part-time roles, even non-tech positions
   - Frame non-tech experience through transferable skills lens
   - Retail/service: customer communication, data entry, team coordination
   - Emphasize any technical tasks even if role wasn't technical

6. AWARDS / CERTIFICATIONS / EXTRACURRICULARS (condensed, if space permits)
   - AWS/GCP/Azure certifications
   - Hackathon awards, academic awards
   - Relevant club leadership, volunteer work with technical component
```

### Evidence for This Ordering

Five of six major Canadian university career services recommend Skills at the top:

- **UBC Applied Science Co-op Resume Toolkit:** "Employers often read this section before your cover letter to quickly determine if you have the fundamental skill sets required for the position. All readers of your resume (human or 'bot') scan for keywords relating to the job description."
- **SFU Co-op Resume Guide (Science & Environment):** Places Skills Summary first because it "provides an overview of your qualifications and skills that relate to the job you are applying for."
- **University of Toronto Resume Toolkit:** Recommends "Highlights of Skills & Qualifications" with 3-5 bullets immediately after contact information.
- **University at Buffalo School of Management:** Recommends Skills/Qualifications near the top for student resumes.

The one exception: **Northeastern University** recommends Education first for students, arguing the program IS the primary qualification. This is valid when a student's program, GPA, or coursework is their strongest signal. The resolution: lead with whichever section contains the most competitive keywords for the specific role. For technical co-ops in data science or software engineering, that's almost always Skills.

### The "Project Experience" Heading Trick

University at Buffalo's ATS guide: "Using the word 'EXPERIENCE' in headings where the content is most relevant to your future jobs is crucial." Titling the section "Project Experience" rather than "Projects" may trigger the ATS to apply experience-level weighting to that content. Each project entry should follow work experience formatting: action verb, specific contribution, quantified result, technologies used.

### For Students with Zero Work Experience

When there is no work experience at all, the structure becomes:

```
1. HEADER
2. TECHNICAL SKILLS
3. EDUCATION (expanded: include relevant coursework, academic projects inline)
4. PROJECT EXPERIENCE (3-4 well-documented projects, this is the primary content)
5. AWARDS / CERTIFICATIONS / EXTRACURRICULARS
```

The Projects section effectively replaces Experience. UBC employer feedback: "I don't need to know the details of the course projects... What I am very interested to know is specifically what each student's individual role was."

---

## 4. Resume Section Ordering: Full-Time Experienced Candidates

### Recommended Order

```
1. HEADER
   - Full name, email, phone, city/province, LinkedIn URL, GitHub/portfolio URL
   - Place in main document body (NOT in document header/footer)

2. PROFESSIONAL SUMMARY (conditional; see Section 9 for when to include/exclude)
   - 2-3 tailored sentences per application
   - Include: exact job title from posting, 2-3 high-priority technical keywords, 
     one quantified achievement
   - Exclude if: it would be generic ("results-oriented team player"), 
     or states an objective rather than a value proposition

3. TECHNICAL SKILLS
   - Categorized: Languages, ML Frameworks, Cloud Platforms, 
     Visualization Tools, Databases, DevOps
   - Placed before Experience because tech recruiters need to see the stack immediately
   - 64.8% of employers now use skills-based hiring (NACE Job Outlook 2025)

4. PROFESSIONAL EXPERIENCE
   - Reverse chronological order
   - 3-5 quantified bullets per role
   - Action verb + specific contribution + measurable result
   - Integrate JD keywords naturally within achievement bullets
   - Skills mentioned in context (within experience bullets) receive higher ATS weight 
     than skills listed only in the Skills section

5. PROJECTS (for mid-level candidates)
   - Standalone section for mid-level: Kaggle competitions, open-source contributions, 
     significant personal projects
   - For senior candidates: fold projects into Experience bullets showing business impact
   - BeamJobs: "The more work experience you have, the less space 'projects' should 
     take up as a section on your resume."

6. EDUCATION
   - Degree, institution, year only
   - Drop GPA after 3+ years of experience (unless exceptionally strong and relevant)
   - No coursework listing for experienced candidates (unless career changer)

7. CERTIFICATIONS
   - AWS, GCP, Azure, PMP, relevant professional certifications
   - Only include if relevant to target role
```

### Evidence for This Ordering

- Resume Genius survey of 625 U.S. hiring managers: Work Experience is the #1 most important section, with Education and Skills tied for second.
- Enhancv IT resume guide: "You must ensure your stack is immediately visible to both the ATS and the IT lead."
- Monster.com: "Technology job candidates may want to place the skills section after the job objective and before the experience section."
- Robert Half Technology 2024: 76% of hiring managers prefer chronological-hybrid format for data science roles.

### Career Changer Hybrid Structure

For professionals who completed a master's degree to change careers (e.g., from finance operations to data science):

```
1. HEADER
2. PROFESSIONAL SUMMARY (critical for career changers; explicitly bridges old career to new)
3. TECHNICAL SKILLS (new skills from master's program + transferable tech skills)
4. EDUCATION (positioned higher than standard full-time because the degree is the pivot credential)
5. PROJECT EXPERIENCE (master's capstone, course projects demonstrating new skills)
6. PROFESSIONAL EXPERIENCE (reframed with transferable skills emphasis)
7. CERTIFICATIONS
```

This hybrid acknowledges that for career changers, the master's education and projects ARE the primary evidence of new-career readiness, even though they also have substantial prior experience.

---

## 5. Section-by-Section Rules & ATS Behavior

### Header / Contact Information

- MUST be in the main document body, never in document headers or footers
- TopResume research: ATS failed to identify contact info 25% of the time when in headers/footers
- Required fields: full name, email, phone number, city + province/state
- Recommended fields: LinkedIn URL, GitHub URL or portfolio link
- Never include: photo, date of birth, marital status, nationality (North American convention)
- Canadian-specific: include city and province, not full street address

### Technical Skills Section

- Categorize skills into logical groups (Languages, Frameworks, Tools, etc.)
- Use the exact terminology from job descriptions (e.g., "Amazon Web Services (AWS)" not just "cloud")
- Break down umbrella terms: "AWS" should become "AWS (EC2, S3, Lambda, SageMaker)"
- For co-op candidates: include tools from coursework and projects even if not used professionally
- For experienced candidates: only list technologies you can discuss confidently in an interview
- ATS behavior: Skills section is parsed for individual keywords; each keyword is matched against JD requirements

### Education Section

- Co-op candidates: this is a PRIMARY credential section
  - Always include relevant coursework (match JD keywords)
  - Include GPA if 3.5+ / 80%+
  - Include co-op designation
  - Include expected graduation date
  - Include academic projects if not listed elsewhere
  - Include honors, Dean's List, relevant scholarships
- Full-time candidates: this is a SUPPORTING section
  - Degree, institution, graduation year only
  - No GPA after 3+ years of experience
  - No coursework (unless career changer)
- Career changers: treat education as a PRIMARY section (position higher in ordering)
  - Include relevant coursework from new-career master's program
  - Include GPA if strong
  - Connect coursework explicitly to target role requirements

### Experience Section

- ATS systems often weigh the experience section more heavily than other sections
- Each bullet should start with a strong action verb
- Quantify results wherever possible (%, $, time saved, users impacted)
- Include JD keywords naturally within achievement bullets
- A keyword that appears in BOTH Skills and Experience sections receives higher composite ATS weight
- For co-op candidates with limited experience:
  - Include any work: co-ops, internships, part-time, freelance, volunteer
  - Frame non-tech roles through transferable skills
  - It's acceptable to have only 1-2 entries in this section

### Projects Section

- Co-op candidates: this section serves as the primary "experience equivalent"
  - Title it "Project Experience" (not just "Projects") to trigger ATS experience-level weighting
  - Format each project like a job entry: title, technologies, dates, 2-3 quantified bullets
  - Include: course projects, personal projects, hackathons, capstone work, Kaggle competitions
  - Emphasize individual contribution, not just team outcome
- Full-time mid-level candidates: include standalone significant projects
  - Open-source contributions, significant personal projects, Kaggle wins
- Full-time senior candidates: fold projects into Experience section bullets
  - Projects at this level should demonstrate business impact within company context

### Summary Section

- Co-op candidates: DO NOT include a summary (wastes limited space)
- Full-time candidates: CONDITIONAL (see Section 9 for detailed rules)
- Career changers: STRONGLY RECOMMENDED (bridges narrative between old and new career)
- ATS behavior: summary is parsed for keywords but typically weighted less than Experience and Skills sections

---

## 6. Scoring Architecture by Candidate Type

### Component Weights: Co-op / Internship

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Keyword Match | 42% | Technical skills are the primary differentiator for student candidates |
| Section Coverage & Quality | 20% | Education and projects must be present and substantive |
| Content Quality (bullets) | 18% | Action verbs, quantification, relevance to JD |
| Qualification Fit | 10% | Less experience to verify; education fit matters more |
| Format Compliance | 10% | ATS parsability; single page requirement |

**Section-specific scoring notes for co-op:**

- Education section should be evaluated for: relevant coursework presence, GPA inclusion (if strong), co-op designation, graduation date
- Projects section should be evaluated with experience-level rigor: action verbs, quantification, technology mention, individual contribution clarity
- Experience section (if present) gets reduced weight since many students have minimal entries
- Missing experience section should NOT be penalized for co-op candidates with strong projects

### Component Weights: Full-Time / Experienced

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Keyword Match | 40% | Skills matching remains the primary ATS filter mechanism |
| Content Quality (bullets) | 20% | Achievement quality matters more for experienced candidates |
| Qualification Fit | 15% | Years of experience, seniority alignment with JD |
| Section Coverage & Quality | 15% | All standard sections present with appropriate depth |
| Format Compliance | 10% | ATS parsability; 1-2 page requirement |

### Component Weights: Career Changer (Hybrid)

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Keyword Match | 40% | New-career keywords from education + transferable skills |
| Content Quality (bullets) | 18% | Both new-skill project bullets and reframed experience bullets |
| Section Coverage & Quality | 18% | Education and projects carry more weight than standard full-time |
| Qualification Fit | 14% | Degree relevance + transferable experience years |
| Format Compliance | 10% | ATS parsability |

### Score Interpretation Tiers

| Score Range | Label | What It Means |
|-------------|-------|---------------|
| 85-100 | Excellent | 90%+ keyword match, all sections optimized, strong quantification |
| 70-84 | Strong | 80%+ keyword match, most bullets quantified, good structure |
| 55-69 | Needs Work | 65%+ keyword match, some optimization gaps, missing keywords |
| 40-54 | Weak | <65% keyword match, significant structural or content issues |
| Below 40 | Critical | Missing critical keywords, major format issues, fundamental rewrite needed |

### Keyword Scoring Formula

```
keyword_score = (earned_points / total_possible_points) × 100

For each extracted keyword:
  tier_weight = { required: 3, preferred: 2, mentioned: 1 }
  match_multiplier = { exact: 1.0, fuzzy: 0.85, semantic: 0.65 }
  placement_bonus = { skills_section: 1.0, experience_bullet: 1.15, both: 1.3 }

  if keyword is found:
    earned_points += tier_weight × match_multiplier × placement_bonus
  total_possible_points += tier_weight × 1.0 × 1.3  (max possible per keyword)
```

**Penalty for missing required keywords:**
- Each missing "required" tier keyword applies a -3 point penalty to the overall keyword score
- Each missing "preferred" tier keyword applies a -1 point penalty
- Missing "mentioned" tier keywords have no penalty (they only add positive points if found)

### Experience / Content Quality Scoring Formula

```
experience_score = (
  quantification_rate × 0.40 +
  keyword_integration_rate × 0.30 +
  action_verb_quality × 0.15 +
  role_relevance × 0.15
) × 100

Where:
  quantification_rate = bullets_with_metrics / total_bullets
  keyword_integration_rate = bullets_with_JD_keywords / total_bullets
  action_verb_quality = bullets_with_strong_verbs / total_bullets
  role_relevance = average relevance rating per role (0-1 scale)
```

### Format Score Components

| Check | Points | Description |
|-------|--------|-------------|
| Standard section headers | 20 | Uses ATS-safe header names |
| Contact info in body | 15 | Not in document header/footer |
| No tables or multi-column | 20 | Clean single-column layout |
| Consistent formatting | 15 | Consistent date formats, bullet styles, spacing |
| Appropriate length | 15 | 1 page for co-op; 1-2 pages for experienced |
| Parsable bullet characters | 15 | Simple bullet characters, no nested bullets |

---

## 7. Formatting Rules That Prevent Parsing Failures

These rules apply identically to all candidate types and to both Canadian and U.S. applications. Toronto and Vancouver tech companies use the same ATS platforms (Greenhouse, Lever, Workday) as San Francisco and New York.

### Contact Information Placement

- ALWAYS in main document body, NEVER in headers or footers
- TopResume: ATS failed to read contact info 25% of the time when in headers/footers
- Santa Clara University career services confirms: "ATS systems typically do not read headers and footers"

### Layout

- Single-column layout only
- No tables for layout purposes
- No multi-column designs
- No text boxes
- TalentTuner: "The system might read left-to-right across both columns, jumbling your work history and education together"
- Jobscan tested table-based resumes: "the ATS picked up the work experience section, but ignored everything else; no skills, no 'About' section, no contact info"

### Typography

- Standard fonts only: Arial, Calibri, Garamond, Times New Roman, Helvetica
- Font size: 10-12pt for body, 14-16pt for name
- No graphics, icons, logos, or images anywhere in the document
- No colored text for essential content (decorative color on name is acceptable)

### File Format

- .docx is the safest universal format
- Text-based .pdf is acceptable (NOT image-based / scanned PDFs)
- Design tools like Canva often export image-based PDFs that are completely unparseable
- Never submit .pages, .odt, or other non-standard formats

### Date Formatting

- Safe: "January 2023 - Present" or "01/2023 - Present" or "Jan 2023 - Present"
- Dangerous: year-only ranges, apostrophes ('23), seasons ("Summer 2023"), vague terms ("Ongoing")
- ResumeAdapter: "If the ATS cannot accurately calculate your years of experience, it may auto-reject you for 'Insufficient Experience'"
- Must be consistent throughout the entire document

### Bullet Points

- Use simple bullet characters (standard bullet point or hyphens)
- No nested bullets (multi-level indentation)
- Each bullet should be 1-2 lines (one complete thought)
- Start every bullet with a strong action verb

### Section Headers

- Use standard, recognizable header names (see Section 2 table)
- Bold or slightly larger font to distinguish from body text
- Never use creative or non-standard names
- Workable documentation: "Use typical names for section titles like 'Education,' 'Work Experience,' 'Personal Details'"

---

## 8. Keyword Strategy & ATS Matching Logic

### How Keywords Should Be Extracted from Job Descriptions

Keywords should be classified into three tiers:

| Tier | Definition | Scoring Weight | Examples |
|------|-----------|----------------|----------|
| Required | Explicitly stated as required, must-have, or mandatory in JD | 3x | "Must have Python experience" |
| Preferred | Listed as preferred, nice-to-have, or bonus | 2x | "Experience with Docker preferred" |
| Mentioned | Appears in JD but not explicitly categorized | 1x | Company tech stack mentioned in description |

### "Or" Qualifications Handling

When a JD says "X or Y" (e.g., "PhD or Master's in CS"), BOTH should be extracted with the SAME tier. Having either one satisfies the requirement.

### Match Types

| Match Type | Multiplier | Definition |
|-----------|-----------|------------|
| Exact | 1.0 | Exact string match (e.g., JD says "Python", resume says "Python") |
| Fuzzy | 0.85 | Minor variation (e.g., "JavaScript" vs "Javascript", "ML" vs "Machine Learning") |
| Semantic | 0.65 | Conceptually equivalent (e.g., "data wrangling" vs "data cleaning") |

### Keyword Placement Matters

A keyword's placement affects its effective weight:

| Placement | Bonus Multiplier | Rationale |
|-----------|-----------------|-----------|
| Skills section only | 1.0x (baseline) | Listed but not demonstrated in context |
| Experience bullet only | 1.15x | Demonstrated in professional context |
| Both Skills AND Experience | 1.3x | Maximum signal: listed AND demonstrated |
| Summary section | 1.0x | Mentioned but not demonstrated |

**Recommendation for suggestions:** When a keyword appears only in the Skills section, suggest incorporating it into an Experience or Project bullet. When it appears only in Experience, suggest adding it to the Skills section. This dual-placement strategy maximizes ATS scoring.

### Keyword Density Warning

Jobscan recommends a 75-80% match rate. Below 65% is concerning. Above 85% may indicate keyword stuffing, which can trigger fraud detection in some ATS platforms. SubmitSmart should warn users if match rate exceeds 85%.

---

## 9. The Professional Summary Debate

### When to Include (Full-Time & Career Changers)

Include a professional summary when:

- The candidate has 3+ years of experience
- The summary can be tailored to the specific job (not generic)
- The candidate is changing careers (the summary bridges the narrative)
- The summary includes: exact job title from posting, 2-3 priority technical keywords, one quantified achievement

Resume Genius data: 42% of hiring managers rank the summary in their top three most important sections. 20% view it as the single most important element.

### When to Exclude

Exclude a professional summary when:

- The candidate is a co-op/intern student (wastes space on a 1-page resume)
- The summary would be generic ("results-oriented team player with strong communication skills")
- The summary states an objective rather than a value proposition
- The candidate has fewer than 2 years of experience

### What Makes a Summary ATS-Harmful

- Vague buzzwords without specifics: "dynamic professional," "passionate about technology"
- No keywords from the target JD
- Objective statement instead of value proposition
- Longer than 3 sentences
- Identical across all applications (not tailored)

### What Makes a Summary ATS-Friendly

- Contains the exact job title from the posting
- Includes 2-3 high-priority technical keywords from the JD
- Contains at least one quantified achievement
- Is 2-3 concise sentences
- Reads as a value proposition, not a career objective

---

## 10. Part-Time Candidate Considerations

Part-time job seekers do NOT need a fundamentally different resume structure. The same ATS formatting rules, keyword optimization strategies, and section-ordering principles apply.

- Students seeking part-time work: follow the co-op/intern structure
- Experienced professionals seeking part-time roles: follow the experienced candidate structure
- The only meaningful differences:
  - A career summary can indicate availability or part-time preference
  - Resume length should stay at one page regardless of experience level
  - Emphasis on flexibility, adaptability, and efficient contribution in limited hours
- Zety: "Of all resume styles, the best format for part-timers is the chronological layout. It lets your professional experience go first and get the most attention."

---

## 11. Eye-Tracking & Recruiter Behavior Data

### The 7-Second Scan

The Ladders eye-tracking study found recruiters spend an average of 7.4 seconds on initial resume screening and follow an F-shaped pattern:

1. Across the top line (name, title, current company)
2. Down the left margin (section headers, company names, dates)
3. Shorter horizontal passes at subheadings that catch attention

### The "Above the Fold" Imperative

The top third of page one is the only content guaranteed to receive attention during initial screening. This is why section ordering matters so much:

- For co-op candidates: Skills and Education in the top third
- For experienced candidates: Summary and Skills in the top third
- Teal: "Recruiters aren't reading your resume from top to bottom. They're scanning in an F-pattern."

### Supporting Data Points

- Canadian job site Workopolis: 60% of employers viewed resumes for 11 seconds or less
- Candidates who include the exact job title on their resume are 10.6x more likely to get an interview (Jobscan)
- Quantified achievements boost interview rates by approximately 40%
- Applying within the first 48-72 hours of a posting significantly improves review chances

---

## 12. Myths vs. Reality: What the Evidence Shows

### Myth: "75% of resumes are auto-rejected by ATS"

**Reality:** This statistic is fabricated. 92% of recruiters confirm their ATS does not automatically reject resumes. ATS systems parse, categorize, and make resumes searchable. The real risk is being unsearchable when recruiters run keyword queries.

### Myth: "ATS can't read PDFs"

**Reality:** Modern ATS systems handle text-based PDFs well. The problem is image-based PDFs (common from Canva and similar design tools) where text is embedded as graphics and is completely invisible to parsers.

### Myth: "You need to use the exact same words as the job description"

**Reality:** Most modern ATS parsers handle common variations. "JavaScript" matches "Javascript." Some use semantic matching for related concepts. However, exact matches score highest, so using JD terminology is still the optimal strategy.

### Myth: "One resume fits all applications"

**Reality:** Tailoring matters. The 10.6x callback increase from matching the exact job title demonstrates that customization per application is the single highest-ROI activity for job seekers.

### What IS empirically validated

- Quantified achievements boost interview rates by ~40%
- Matching exact job title increases callbacks by 10.6x
- Applying within 48-72 hours improves review chances
- F-pattern scanning behavior is consistently observed across recruiter studies
- Standard formatting reliably parses across all major ATS platforms

### What is NOT empirically validated

No controlled, peer-reviewed study has isolated the effect of section ordering on callback rates. Statistician David Lindelof demonstrated that achieving statistical significance for resume A/B tests requires far more applications than a typical job search allows. The section-ordering recommendations in this document are based on converging evidence from recruiter surveys, eye-tracking research, ATS vendor documentation, and career services expertise, but they are expert consensus rather than experimentally validated.

---

## 13. Source References

### University Career Services (Canadian)

- UBC Applied Science Co-op Resume Toolkit (2022): https://experience.apsc.ubc.ca/sites/default/files/2022-08/Resume%20ToolKit_2022%20AugustCOPY.pdf
- SFU Co-op Resume Guide (Science & Environment): https://www.studocu.com/en-ca/document/simon-fraser-university/beedie-coop/resume-guide/90652397
- University of Toronto Resume & Cover Letter Toolkit: https://studentlife.utoronto.ca/wp-content/uploads/CC-Resume-and-Cover-Letter-Toolkit.pdf
- University of Waterloo Co-op Resume Tips: https://uwaterloo.ca/writing-and-communication-centre/blog/6-resume-tips-land-co-op-placement
- Northeastern University Resume Guide: https://careers.northeastern.edu/wp-content/uploads/Guides_Resume-Guide_Organizational-Scheme-B.pdf

### ATS Research & Documentation

- Enhancv ATS Myths Study (2025): https://enhancv.com/blog/busting-ats-myths/
- Workable ATS Parsing Documentation: https://resources.workable.com/stories-and-insights/how-ATS-reads-resumes
- ResumeAdapter ATS Formatting Rules (2026): https://www.resumeadapter.com/blog/ats-resume-formatting-rules-2026
- OpenResume Parser (open-source reference): https://www.open-resume.com/resume-parser
- University at Buffalo ATS-Friendly Resumes Guide: https://management.buffalo.edu/career-resource-center/students/preparation/tools/correspondence/resume/electronic.html

### Recruiter Surveys & Data

- Resume Genius 2024 Hiring Trends Survey (625 hiring managers): https://resumegenius.com/blog/job-hunting/hiring-trends-survey
- Jobscan 2025 State of Job Search Report: https://www.jobscan.co/blog/20-ats-friendly-resume-templates/
- Jobscan Top 500 ATS Keywords: https://www.jobscan.co/blog/top-resume-keywords-boost-resume/
- NACE Job Outlook Surveys: https://www.naceweb.org/tag/surveys
- High5 Resume Statistics (2024-2025): https://high5test.com/resume-statistics/

### Eye-Tracking & Scanning Behavior

- Ladders Eye-Tracking Study (2018 update): https://www.prnewswire.com/news-releases/ladders-updates-popular-recruiter-eye-tracking-study-with-new-key-insights-on-how-job-seekers-can-improve-their-resumes-300744217.html
- Wonsulting Recruiter Eye-Tracking Analysis: https://www.wonsulting.com/job-search-hub/hidden-eye-tracker-how-recruiters-actually-read-resumes

### Resume Structure Guides

- Jobscan Resume Section Ordering: https://www.jobscan.co/blog/resume-sections/
- Indeed Resume Format Guide: https://www.indeed.com/career-advice/resumes-cover-letters/resume-format-guide-with-examples
- Teal Data Scientist Resume Examples: https://www.tealhq.com/resume-examples/data-scientist
- BeamJobs Data Scientist Resume Guide: https://www.beamjobs.com/resumes/data-science-resume-example-guide
- Enhancv Canadian Resume Format Guide: https://enhancv.com/blog/canadian-resume-format/

### Canadian vs. U.S. Resume Conventions

- ZipJob US vs Canadian Resume Comparison: https://zipjob.com/blog/us-vs-canada-resume/

---

## 14. Implementation Notes for SubmitSmart

### How This Document Connects to Existing Architecture

This document supplements the existing SubmitSmart prompt documentation and scoring architecture. Specifically:

**Keyword Extraction (extractKeywords.ts):** Use the tier system defined in Section 8 (required/preferred/mentioned) with explicit weights (3/2/1). The extraction prompt should classify keywords into these tiers based on JD language patterns ("must have" = required, "preferred" = preferred, mentioned but uncategorized = mentioned).

**Keyword Matching (matchKeywords.ts):** Apply the match type multipliers from Section 8 (exact: 1.0, fuzzy: 0.85, semantic: 0.65) AND the placement bonus multipliers (skills only: 1.0, experience only: 1.15, both: 1.3). The matching step should detect WHERE in the resume each keyword appears, not just whether it appears.

**Content Quality (judgeContentQuality.ts):** Evaluate using ATS-specific metrics rather than subjective quality. Focus on: keyword integration rate, quantification rate, action verb strength, and role relevance. See Section 6 for the experience scoring formula.

**Suggestion Generation (all suggestion prompts):** Tailor suggestions based on candidate type:
- Co-op candidates: emphasize adding relevant coursework, converting project descriptions to experience-format bullets, breaking down umbrella skills, adding quantification to project bullets
- Full-time candidates: emphasize keyword integration in experience bullets, quantifying achievements, tailoring summary to JD, demonstrating skills in context rather than just listing them
- Career changers: emphasize bridging narrative in summary, connecting prior experience to new field, highlighting transferable skills with new-career terminology

**Scoring Formula:** Use the component weights defined in Section 6 based on detected candidate type. The system MUST detect or be told the candidate type and apply the correct weight profile.

### Job Type Detection Logic

```
IF user_selected_job_type == "coop" OR "internship":
  apply co-op/intern weights and structure rules

ELSE IF user_selected_job_type == "fulltime":
  IF resume has active_education with expected_graduation:
    AND professional_roles < 3:
      flag as potential career changer; apply hybrid weights
  ELSE:
    apply full-time/experienced weights and structure rules

ELSE (auto-detect):
  IF professional_roles < 2 AND has_active_education:
    apply co-op/intern weights
  ELSE IF professional_roles >= 3 AND total_experience_years >= 3:
    apply full-time/experienced weights
  ELSE:
    apply hybrid/career-changer weights (safe middle ground)
```

### Section Ordering Validation

When analyzing a resume, check whether section ordering matches the recommended structure for the candidate type. If sections are out of optimal order, generate a structural suggestion:

- Co-op resume with Experience before Education: suggest moving Education up
- Co-op resume with no Skills section at top: suggest adding categorized Skills section above Education
- Full-time resume with Education before Experience: suggest moving Experience up (unless career changer)
- Any resume with Summary that's generic: suggest removing it or tailoring it
- Any resume with "Projects" heading: suggest renaming to "Project Experience"

### Score Display Recommendations

Show users:
1. **Current ATS Score** (before suggestions): calculated using the formula in Section 6
2. **Projected Score** (after applying all suggestions): estimated improvement
3. **Score Breakdown** by component: keyword match %, content quality %, section coverage %, format %
4. **"What's hurting your score most"** indicator: highlight the lowest-scoring component
5. **Comparison context:** "Scores above 70% typically result in your resume surfacing in recruiter searches"

### Critical Warnings the System Should Surface

- If contact info appears to be in a document header/footer: "Your contact information may not be readable by ATS systems"
- If keyword match rate exceeds 85%: "Your match rate is very high; ensure keywords appear naturally to avoid appearing over-optimized"
- If keyword match rate is below 50%: "Your resume may not surface in recruiter keyword searches for this role"
- If the resume uses non-standard section headers: "Consider using standard section names that ATS systems reliably recognize"
- If the resume appears to use tables or multi-column layout: "This layout may cause ATS parsing failures; consider switching to single-column format"
- If the resume is more than 2 pages for experienced or more than 1 page for co-op: "Consider condensing to [1/2] page(s) for this application type"
