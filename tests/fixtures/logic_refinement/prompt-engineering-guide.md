# Prompt Engineering Guide for ATS Resume Optimizer

## Purpose

This document explains the design rationale behind the ATS Resume Optimizer prompts, provides best practices for resume optimization, and documents lessons learned from iterative development. Use this guide to understand why certain approaches were chosen and how to maintain consistency when extending the system.

---

## Core Design Principles

### 1. Authenticity as Foundation

**Principle:** Never fabricate experience, skills, or credentials under any circumstances.

**Rationale:** Resume fraud is both unethical and practically counterproductive. Candidates who misrepresent qualifications face:
- Verification failures during background checks
- Performance gaps in interviews when probed on fabricated skills
- Termination if discovered post-hire
- Long-term reputation damage

**Implementation:**
- Every skill mentioned must exist in the original resume
- Metrics must be accurate or clearly marked as reasonable inference
- Job titles and dates are immutable
- Certifications and degrees cannot be invented

**Design decision:** The prompt explicitly lists what can never be fabricated and requires verification before output. This constraint shapes all downstream optimization, ensuring creativity operates within truthful bounds.

### 2. ATS-First Formatting

**Principle:** Optimize for machine parsing first, human readability second.

**Rationale:** 75%+ of resumes are filtered by ATS before human review. A beautifully designed resume that fails parsing never reaches a recruiter.

**Implementation:**
- Standard section headers only (no creative alternatives)
- No tables, columns, text boxes, or graphics
- Simple bullet characters (• or -)
- Both acronyms and spelled-out terms included
- Standard fonts assumed (system enforces this through output format)

**Design decision:** The output format template enforces ATS-compatible structure. The prompt doesn't offer formatting creativity because it would undermine the core purpose.

### 3. Natural Human Voice

**Principle:** Output should read like a skilled human wrote it, not an AI.

**Rationale:** AI-generated content increasingly faces scrutiny. Recruiters and hiring managers can detect patterns typical of AI writing, which may bias them against the candidate.

**Implementation:**
- Banned phrase list eliminates common AI tells ("leveraged," "spearheaded," "synergized")
- Simple punctuation only (no em dashes, which AI overuses)
- Varied sentence structure and length
- Power verb diversity requirement (no verb used more than twice)
- Explicit quality check for natural writing

**Design decision:** The prompt includes specific lists of banned phrases and required variations because general instructions to "write naturally" are insufficient. Explicit constraints produce more consistent results.

### 4. Structured User Journey

**Principle:** Guide users through a clear, predictable process.

**Rationale:** Users often don't know what information is needed for effective optimization. A structured flow ensures complete input while setting expectations.

**Implementation:**
- 4-step workflow with explicit progress indicators
- Each step has clear deliverable and acceptance criteria
- Acknowledgment of received input before proceeding
- Options presented with context about when each is appropriate

**Design decision:** The prompt prescribes exact language for each step rather than general guidance. This ensures consistency across sessions and reduces user confusion.

---

## Prompt Architecture

### Input Collection Phase

**Design:** Sequential collection with validation

```
Step 1: Resume → Acknowledge and confirm key areas
Step 2: Job Description → Acknowledge role and company, identify requirements
Step 3: Optimization Level → Present options with use cases
Step 4: Content Scope → Present options with use cases
```

**Why this order:**
1. Resume first because it's the foundation; can't discuss optimization without content
2. Job description second because alignment analysis requires both documents
3. Optimization level third because it depends on understanding the alignment
4. Content scope last because it's the most tactical decision

**Alternative considered and rejected:** Asking all questions upfront. This was rejected because users benefit from seeing their context acknowledged before making decisions.

### Analysis Phase

**Design:** Systematic evaluation before generation

The prompt requires explicit analysis sections before output:
- Quick Analysis (alignment assessment)
- Keyword Gap Analysis (what's missing)
- Advanced Optimization Checks (quantification, skills evidence, red flags)

**Rationale:** Analysis before generation:
1. Forces systematic evaluation rather than pattern matching
2. Provides transparency into reasoning
3. Catches issues before they appear in output
4. Gives users insight into the optimization strategy

**Design decision:** Analysis is mandatory, not optional. The prompt structures it as part of the response format rather than a suggested approach.

### Generation Phase

**Design:** Templated output with quality checks

The output format is strictly specified:
- Section headers defined
- Content patterns for each section
- Length constraints (word counts, bullet counts)
- Formatting rules

**Rationale:** Structured output:
1. Ensures ATS compatibility
2. Provides predictable results
3. Makes quality verification systematic
4. Reduces variance between sessions

**Design decision:** The template is prescriptive rather than suggestive. Instructions say "use this format" not "consider this format."

---

## Key Prompt Design Decisions

### Decision: Optimization Levels with Percentage Ranges

**What:** Three discrete levels (Conservative, Moderate, Aggressive) with modification percentages (15-25%, 35-50%, 60-75%).

**Why percentages:**
- Makes abstract concept concrete
- Sets appropriate expectations
- Provides decision criteria for content modification
- Prevents both under-optimization and over-modification

**Why three levels (not two or five):**
- Two levels lack nuance for the common middle case
- Five levels create decision paralysis and false precision
- Three levels map to natural user mental models (light/medium/heavy)

**Alternative rejected:** Continuous scale (1-10). This was rejected because users can't meaningfully distinguish between adjacent points and it complicates generation logic.

### Decision: Content Scope as Separate Parameter

**What:** Separate choice for how many roles to include (Focused, Balanced, Comprehensive).

**Why separate from optimization level:**
- These are orthogonal decisions
- A candidate might want aggressive optimization but only recent roles
- A candidate might want conservative optimization but full career history
- Bundling them reduces user control

**Why not ask about resume length directly:**
- Length is an outcome, not a goal
- Scope naturally determines appropriate length
- Users understand "which roles to include" better than "how many pages"

### Decision: Explicit Power Verb Management

**What:** Categorized verb lists with usage limits (no verb more than twice).

**Why verb categories:**
- Helps match verb to context (leadership vs. technical vs. achievement)
- Provides variety within appropriate semantic range
- Reduces repetition systematically

**Why usage limits:**
- AI tends to over-rely on favorites ("Leveraged" appears constantly)
- Repetition makes writing feel mechanical
- Forcing variety improves overall quality

**Alternative rejected:** Just saying "vary your verbs." This is insufficient; explicit rules produce better compliance.

### Decision: STAR Method for Bullets

**What:** Each bullet follows Situation → Task → Action → Result structure, targeting 20-35 words.

**Why STAR:**
- Proven framework for communicating achievements
- Forces concrete detail over vague description
- Naturally includes metrics (Result component)
- Familiar to recruiters and hiring managers

**Why 20-35 words:**
- Under 20 words typically lacks sufficient context
- Over 35 words becomes difficult to scan
- This range allows complete STAR structure without bloat

### Decision: Contribution Titles (Bold Labels)

**What:** Each bullet starts with a 2-3 word bold label indicating the contribution area.

**Why contribution titles:**
- Improves scannability for recruiters
- Creates visual structure beyond raw bullets
- Helps ATS categorize achievements by theme
- Forces the writer to clarify the point of each bullet

**Why 2-3 words:**
- Single word too vague ("Development")
- Four+ words become sentence fragments
- Two-three words hit the sweet spot ("API Development," "Team Leadership")

---

## Career Changer Optimization Strategy

### The Challenge

Career changers face a fundamental tension: their experience is valuable but not directly aligned. The prompt must balance:
- Honoring their actual background
- Positioning them for new roles
- Maintaining authenticity

### Design Approach

**Lead with transferable skills:**

The Skills section is reorganized to prioritize capabilities relevant to the target role, regardless of where they were developed. A lawyer transitioning to data analytics leads with analytical and research skills, not legal specializations.

**Reframe, don't fabricate:**

Achievement bullets are rewritten to emphasize transferable aspects. "Reviewed 200+ contracts for compliance" becomes "Analyzed 200+ complex documents, identifying critical issues and recommending actions." Same experience, different framing.

**Bridge explicitly:**

The Professional Summary must connect past experience to target role. The prompt requires this connection, not just separate statements about background and goals.

**Use projects strategically:**

For career changers, the Projects section becomes critical for demonstrating new skills. Academic projects, personal projects, and coursework provide evidence of capability in the target field.

### Implementation in Prompt

The prompt includes:
- Explicit "Career Change" scenario with handling instructions
- Career pivot positioning framework in context guidelines
- Project section decision criteria that elevate projects for changers
- Red flag mitigation strategies for career transitions

---

## International Student Considerations

### Unique Challenges

International master's students often have:
- Professional experience from different markets
- Unfamiliar company names
- Credentials that don't map directly to North American equivalents
- Terminology differences (British vs. American English)
- Currency and metric context issues

### Design Accommodations

**Terminology normalization:**

The prompt instructs use of North American terminology when targeting Canadian/US roles. "Redundancy" becomes "layoff," "CV" becomes "resume," etc.

**Company context:**

For companies not recognized in North American markets, brief context may be needed. "Infosys (Fortune 500 IT services)" provides anchoring.

**Credential handling:**

Foreign degrees are valid and included. The prompt doesn't require equivalency statements but allows them when relevant (e.g., "CA (equivalent to CPA)").

**Metric localization:**

Financial metrics should be in target market currency when possible, or provide context. "$500K USD" is clearer than "₹4 Cr" for Canadian employers.

---

## Quality Control Design

### Pre-Output Verification

The prompt includes explicit quality checks:

```
Relevance:
- ✅ Top 5-7 job requirements prominently addressed
- ✅ Most relevant experience appears first
...

Authenticity:
- ✅ Every technical skill existed in original resume
- ✅ All achievements based on actual experience
...

Natural Writing:
- ✅ No em dashes used anywhere
- ✅ Power verbs varied (no verb more than twice)
...
```

**Why checklists:**
- Forces systematic review
- Catches common errors
- Provides audit trail
- Makes quality criteria explicit

### Judge Mode

The evaluation system uses specific criteria with point values:

| Category | Points | Purpose |
|----------|--------|---------|
| Keyword Optimization | 25 | Core ATS function |
| Formatting & Structure | 20 | Parseability |
| Content Relevance | 25 | Job alignment |
| Quantification & Impact | 15 | Achievement clarity |
| Experience Presentation | 15 | Communication quality |

**Why this weighting:**
- Keywords and relevance are highest because they determine ATS passage
- Formatting is binary (works or doesn't) but critical
- Quantification and presentation matter but less than core alignment

**Why 100-point scale:**
- Intuitive for users
- Allows meaningful granularity
- Maps to familiar grading systems
- Enables percentage comparisons

---

## Anti-Patterns and Lessons Learned

### Anti-Pattern: Keyword Stuffing

**Problem:** Early versions produced resumes with awkward keyword insertion.

**Solution:** Require keywords to appear in natural context of achievements. "Managed AWS infrastructure" is acceptable; "AWS-skilled, AWS-experienced AWS professional" is not.

**Prompt implementation:** Instructions emphasize "integrate naturally" and "use in context of actual achievements."

### Anti-Pattern: Over-Quantification

**Problem:** Pressure to add metrics led to implausible numbers.

**Solution:** Distinguish between actual metrics, reasonable inference, and fabrication. Only the first two are acceptable.

**Prompt implementation:** Quantification framework with explicit guidance on inference vs. fabrication.

### Anti-Pattern: Template Rigidity

**Problem:** Early versions produced identical structures regardless of candidate profile.

**Solution:** Section ordering and inclusion varies by career stage and target role.

**Prompt implementation:** Decision framework for section ordering and optional section inclusion.

### Anti-Pattern: AI Voice Markers

**Problem:** Output contained telltale AI patterns (em dashes, "leverage," parallel structure).

**Solution:** Explicit banned phrase list and structural variation requirements.

**Prompt implementation:** Detailed natural writing guidelines with specific patterns to avoid.

### Anti-Pattern: Scope Creep in Questions

**Problem:** Considered adding more user questions (relevant experience years, target salary, etc.).

**Solution:** Rejected additional questions because:
- Information can be extracted from inputs
- More questions add friction
- User self-assessment may be inaccurate

**Prompt implementation:** Kept 4-step workflow; analysis extracts additional context automatically.

---

## Extending the System

### Adding New Features

When adding capabilities, ensure:

1. **Authenticity preserved:** New features cannot compromise truthfulness
2. **ATS compatibility maintained:** New formatting cannot break parsing
3. **User flow preserved:** Additions should fit natural workflow
4. **Quality checks updated:** New content needs verification criteria

### Modifying Output Format

If changing the resume template:

1. Test with multiple ATS systems
2. Verify parseability with standard tools
3. Ensure section headers remain standard
4. Update quality checklist accordingly

### Adjusting Optimization Levels

If modifying the optimization spectrum:

1. Maintain clear distinction between levels
2. Update percentage ranges to reflect changes
3. Ensure descriptors match actual behavior
4. Update user-facing explanations

---

## Prompt Maintenance

### Version Control

Track changes to:
- Main instruction document
- Context guidelines
- Prompt engineering guide
- Output templates

### Testing Protocol

For prompt changes:
1. Test with representative resumes (various career stages)
2. Test with various job descriptions (different industries, levels)
3. Test career change scenarios
4. Verify natural writing quality
5. Check ATS compatibility

### Feedback Integration

When users report issues:
1. Identify root cause (prompt instruction, context handling, edge case)
2. Determine if fix requires prompt change or documentation
3. Test fix against original issue and regression cases
4. Update relevant documentation

---

## Summary of Key Design Choices

| Choice | Rationale |
|--------|-----------|
| 4-step workflow | Ensures complete input, sets expectations |
| Three optimization levels | Balances nuance with decision simplicity |
| Separate content scope | Orthogonal to optimization, increases user control |
| Explicit verb management | Prevents AI over-reliance patterns |
| STAR method bullets | Proven framework, forces concrete detail |
| Contribution titles | Improves scannability, clarifies purpose |
| Mandatory analysis phase | Forces systematic evaluation before generation |
| Explicit quality checklist | Catches errors, provides audit trail |
| Natural writing rules | Prevents AI detection, improves quality |
| Career changer framework | Addresses major user segment need |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial prompt engineering guide |
