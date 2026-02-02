# Analysis Quality Validation Guide

> **Purpose:** Measure extraction error rates to make data-driven architecture decisions

**Status:** Ready for first validation run
**Target:** 50 test cases (starting with 3, expand incrementally)
**Timeline:** Complete first review within 1 week

---

## Why We're Validating

**The Question:** Is our LLM extraction quality good enough to ship without additional validation?

**The Stakes:**
- If extractions are wrong, users get bad advice
- Bad advice → worse resumes → lost opportunities
- One bad experience → lost user trust

**The Goal:**
- Measure actual error rates (not assumptions)
- Categorize error types and severity
- Make data-driven decision on judge implementation

---

## Validation Process

### Phase 1: Run Validation Script

```bash
npm run validate:analysis
```

**What it does:**
1. Loads test cases (resume + JD pairs)
2. Runs full optimization pipeline
3. Captures all intermediate extractions
4. Generates review worksheet

**Output:**
- `validation-results/validation-results-[timestamp].json` - Raw data
- `validation-results/validation-worksheet-[timestamp].md` - Review template

**Time:** ~5-10 minutes for 3 test cases (LLM calls)

---

### Phase 2: Manual Expert Review

Open the worksheet and review each extraction:

**For Each Test Case:**

1. **Read JD and Resume** - Understand the context

2. **Review Keyword Extraction:**
   - Are important skills/requirements captured?
   - Any obvious omissions (false negatives)?
   - Any hallucinated keywords (false positives)?
   - Rate: GOOD / MINOR_ISSUES / MAJOR_ISSUES

3. **Review Qualification Extraction:**
   - Are degree requirements captured correctly?
   - Is experience requirement accurate?
   - Any certifications missed?
   - Rate: GOOD / MINOR_ISSUES / MAJOR_ISSUES

4. **Review Keyword Matching:**
   - Are matches actually in the resume?
   - Any false positives (matched but not really there)?
   - Any false negatives (should match but didn't)?
   - Rate: GOOD / MINOR_ISSUES / MAJOR_ISSUES

5. **Mark Critical Issues:**
   - Would this lead to harmful advice?
   - Would user's resume get worse from following this?

6. **Document Errors:**
   - Be specific: "Missed 'Python' keyword"
   - Explain impact: "User would think Python not needed"

**Time:** ~10-15 minutes per test case

---

### Phase 3: Calculate Error Rates

Fill in summary section:

```
Keyword Extraction Errors: X / 50 = ___%
Qualification Extraction Errors: X / 50 = ___%
Keyword Matching Errors: X / 50 = ___%

Critical Issues: X / 50 = ___%
```

---

### Phase 4: Make Architecture Decision

Based on error rates:

| Critical Error Rate | Recommendation | Action |
|---------------------|----------------|--------|
| > 20% | **STOP SHIPPING** | Fix extraction prompts before scaling |
| 10-20% | **Conditional Judge** | Judge every analysis before showing to user |
| 5-10% | **Sampling Judge** | Judge 10% for monitoring, alert on regression |
| 2-5% | **Confidence + Rules** | Cheap validation, flag low confidence |
| < 2% | **Ship As-Is** | Acceptable quality for MVP |

---

## Error Classification

### Critical Errors (User Harm)

**Examples:**
- Missing required keyword from JD → User doesn't add it
- False positive match → User thinks resume is good when it's not
- Missed degree requirement → User applies without qualification

**Impact:** User gets worse outcome from following our advice

---

### Moderate Errors (Suboptimal)

**Examples:**
- Misclassified keyword importance (high vs medium)
- Extracted "2-5 years" as "3 years" (reasonable interpretation)
- Semantic match is loose but defensible

**Impact:** Slightly suboptimal advice, but not harmful

---

### Minor Errors (Acceptable)

**Examples:**
- Extra keyword extracted that's related but not explicit
- Category classification is arguable (skill vs technology)
- Match confidence could be higher/lower

**Impact:** Negligible, within acceptable quality bounds

---

## Adding More Test Cases

### Current Test Cases (3)

1. Software Engineer - React/TypeScript (typical)
2. Data Scientist - ML/Python (technical, MS/PhD)
3. Product Manager - B2B SaaS (non-technical)

### Need to Add (47 more)

**By Role Type:**
- [ ] 10x Engineering roles (various stacks)
- [ ] 5x Data/ML roles
- [ ] 5x Product/Design roles
- [ ] 5x Sales/Marketing roles
- [ ] 5x Operations/Support roles

**By Experience Level:**
- [ ] 10x Junior (0-2 years)
- [ ] 20x Mid (3-7 years)
- [ ] 10x Senior (8+ years)
- [ ] 10x Co-op/Intern

**By Complexity:**
- [ ] 10x Simple (clear requirements, obvious matches)
- [ ] 20x Typical (normal job postings)
- [ ] 10x Complex (ambiguous requirements, semantic challenges)
- [ ] 10x Edge cases (unusual formats, tricky matching)

### Where to Get Test Cases

**Option A: Real Data (Anonymized)**
- Export from Supabase sessions table
- Anonymize PII (names, emails, companies)
- Get diverse sample across roles

**Option B: Synthetic (Realistic)**
- Use GPT-4 to generate realistic JDs + resumes
- Ensure variety in roles, levels, industries
- Include known edge cases

**Option C: Crowdsourced**
- Ask team/friends for real resume + recent JD
- Anonymize before adding to test suite
- Good for authentic diversity

---

## How to Expand Test Cases

### Step 1: Create Test Case File

```typescript
// scripts/validation-test-cases.json
[
  {
    "id": "tc-004",
    "name": "Frontend Engineer - Vue.js",
    "source": "real",  // or "synthetic" or "edge_case"
    "jd": "...",
    "resume": "...",
    "notes": "Tests semantic matching: Vue vs React"
  },
  // ... more cases
]
```

### Step 2: Update Loader

```typescript
// In validate-analysis-quality.ts
function loadTestCases(): TestCase[] {
  const testCasesFile = path.join(process.cwd(), 'scripts', 'validation-test-cases.json');
  if (fs.existsSync(testCasesFile)) {
    return JSON.parse(fs.readFileSync(testCasesFile, 'utf-8'));
  }
  return []; // fallback
}
```

### Step 3: Run Validation

```bash
npm run validate:analysis
```

---

## Validation Schedule

### Week 1: Initial Validation (3 cases)
- [x] Create validation framework
- [ ] Run validation on 3 test cases
- [ ] Manual review (Winston/Lawrence)
- [ ] Calculate initial error rates
- [ ] Decide if we need more data

### Week 2: Expanded Validation (20 cases)
- [ ] Add 17 more diverse test cases
- [ ] Run validation on 20 total
- [ ] Manual review
- [ ] Calculate error rates
- [ ] Make preliminary architecture decision

### Week 3: Full Validation (50 cases)
- [ ] Add 30 more test cases
- [ ] Run validation on 50 total
- [ ] Manual review (may split across team)
- [ ] Calculate final error rates
- [ ] Make final architecture decision
- [ ] Implement chosen solution

---

## Red Flags to Watch For

**Systematic Issues:**
- Same type of keyword consistently missed (e.g., always miss certifications)
- Same semantic matching failure (e.g., "React" → "reactive")
- Qualification extraction ambiguity (e.g., "2-5 years" → ???)

**LLM Failure Modes:**
- Hallucinating keywords not in JD
- Over-semantic matching (too loose)
- Under-semantic matching (too strict)
- Missing obvious exact matches
- Category misclassification

**User Impact Indicators:**
- False confidence (bad match rate but looks good)
- Missing critical requirements (degree, years)
- False negative advice (tells user to add something they have)

---

## Success Criteria

**Minimum Acceptable Quality:**
- Critical error rate < 5%
- Keyword extraction accuracy > 90%
- Matching accuracy > 85%
- No systematic blind spots

**If Not Met:**
- Fix extraction prompts
- Add few-shot examples
- Implement judge (conditional or sampling)
- Re-validate after fixes

---

## Quick Start

**Right Now:**

```bash
# 1. Run validation on 3 test cases
npm run validate:analysis

# 2. Open the worksheet
open validation-results/validation-worksheet-*.md

# 3. Review each test case (30-45 min total)
# Mark quality ratings, document errors

# 4. Calculate error rates in summary

# 5. Report findings
# Share worksheet with team for discussion
```

**Next Steps:**
- Add more test cases (target: 50)
- Run expanded validation
- Make architecture decision
- Implement chosen solution

---

## Questions for Reviewer

As you review, consider:

1. **Would I trust this analysis on my own resume?**
2. **If I followed this advice, would my resume improve?**
3. **Are the errors random or systematic?**
4. **What's the worst-case user impact?**
5. **Do we need a judge, or can we fix prompts?**

---

## Results Documentation

After completing validation:

**Create:** `docs/VALIDATION_RESULTS.md`

**Include:**
- Error rates by category
- Common error patterns
- Specific examples of failures
- Architecture recommendation
- Rationale for decision
- Implementation plan (if judge needed)

---

## Contact

**Questions?** Ask Winston (Architect) or Lawrence (Product Owner)

**Found a bug in validation script?** Open issue or fix directly

**Want to add test cases?** Add to `scripts/validation-test-cases.json`

---

**Remember:** This validation isn't bureaucracy. It's the difference between shipping a product that helps users vs one that harms them. Take the time to do it right.
