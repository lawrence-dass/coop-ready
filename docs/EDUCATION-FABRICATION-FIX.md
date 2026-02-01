# Education Suggestion Fabrication Fix

**Date:** January 31, 2026
**Issue:** Critical - System was generating fabricated coursework, projects, and achievements
**Status:** ✅ FIXED

---

## Problem Statement

The education suggestion generator was **fabricating content** including:
- ❌ Fake coursework lists (e.g., "Relevant Coursework: Data Structures, Algorithms, Database Systems...")
- ❌ Fake academic projects (e.g., "Capstone Project: Developed full-stack web application...")
- ❌ Fake honors and achievements (e.g., "Dean's List (6 semesters)", "Hackathon Winner")

**This constitutes resume fraud** and could result in:
- Job offer rescission
- Termination if discovered after hiring
- Legal consequences
- Reputational damage to SubmitSmart

---

## Root Cause

The prompt in `lib/ai/generateEducationSuggestion.ts` explicitly instructed the LLM to:

```typescript
// OLD (BAD) - Lines 40-46
Your task is to ENHANCE and EXPAND a sparse education section by:
1. Adding relevant coursework based on degree program and job requirements
2. Suggesting academic projects and achievements to highlight

**CRITICAL:** Your job is to suggest ADDING valuable content,
not just optimizing existing content.

// OLD (BAD) - Line 106
- Infer coursework from degree program - these are standard curriculum courses
```

This was **intentional fabrication**, not a bug.

---

## Solution: Three-Tier Defense

### Tier 1: Prompt Constraints ✅

**Replaced fabrication instructions with strict anti-fabrication rules:**

```typescript
**CRITICAL CONSTRAINT - ABSOLUTE RULE:**
You MUST NEVER create, invent, or suggest adding factual claims that don't exist.

**WHAT YOU CAN DO:**
✅ Reformat existing content for better ATS parsing
✅ Improve phrasing of existing bullets
✅ Mark future actions as "Recommendation:"
✅ Formatting improvements (dates, location, structure)

**WHAT YOU CANNOT DO:**
❌ Add coursework lists unless user provided them
❌ Create project descriptions unless user mentioned projects
❌ Invent honors or achievements
❌ Add ANY new factual claims about the past
```

**Updated point values to reflect reality:**
- Old: 18-40 points (inflated by fake content)
- New: 3-10 points (formatting + recommendations only)

**Updated examples to show ONLY safe suggestions:**
- Formatting improvements (GPA placement, date format)
- Location inference (Stanford University → Stanford, CA)
- Future recommendations (marked with "Recommendation:" prefix)

### Tier 2: Validation Layer ✅

**Added `detectFabrication()` function to catch LLM hallucinations:**

```typescript
function detectFabrication(original: string, suggested: string): boolean {
  const fabricationSignals = [
    // Coursework fabrication
    /Relevant Coursework:.*,.*,.*,/i,

    // Project fabrication
    /Capstone Project:/i,
    /Developed .* application/i,

    // Achievement fabrication
    /Dean's List/i,
    /Hackathon/i,
    /Outstanding Student/i,
  ];

  // Detect and reject fabrications
  // Returns true if fabrication detected
}
```

**Integrated into suggestion normalization:**
- Filters out fabricated suggestions before returning to user
- Logs warnings for monitoring
- Acts as a safety net even if prompt fails

### Tier 3: Testing ✅

**Created comprehensive anti-fabrication test suite:**

```typescript
// tests/unit/lib/ai/generateEducationSuggestion.test.ts

describe('[CRITICAL] Anti-Fabrication Tests', () => {
  it('should NOT fabricate coursework for sparse education section')
  it('should NOT fabricate capstone projects or academic projects')
  it('should NOT fabricate academic honors or achievements')
  it('should only suggest formatting improvements for sparse sections')
  it('should limit point values for sparse sections (max ~10 points)')
});
```

---

## What Changed

### File: `lib/ai/generateEducationSuggestion.ts`

**Lines changed:**
- 34-50: Added CRITICAL CONSTRAINT block forbidding fabrication
- 59-70: Updated instructions to focus on formatting only
- 73-84: Reduced point value ranges (3-10 instead of 18-40)
- 97-116: Updated rules to prevent coursework/project inference
- 118-176: Replaced fabrication examples with safe formatting examples
- 213-286: Added `detectFabrication()` validation function
- 420-430: Applied fabrication filter in normalization

**Total:** ~100 lines modified, defensive validation added

### File: `tests/unit/lib/ai/generateEducationSuggestion.test.ts`

**NEW FILE** - Comprehensive test coverage:
- 5 anti-fabrication tests
- 2 validation tests
- 2 allowed suggestion tests (formatting, recommendations)

---

## Acceptable vs Unacceptable Suggestions

### ✅ ACCEPTABLE (Formatting)

```
Original: "GPA: 3.85/4.0 (on separate line)"
Suggested: "Graduated: June 2019 | GPA: 3.85/4.0"
Impact: moderate
Points: 2
```

### ✅ ACCEPTABLE (Future Recommendation)

```
Original: "No professional certifications"
Suggested: "Recommendation: Consider AWS Cloud Practitioner to complement academic training"
Impact: high
Points: 4
```

### ❌ UNACCEPTABLE (Fabrication)

```
Original: "No relevant coursework listed"
Suggested: "Relevant Coursework: Data Structures, Algorithms, Database Systems..."
Impact: critical
Points: 10
→ REJECTED by validation layer
```

---

## Testing Status

**Unit tests created:** ✅
**Tests pass locally:** ⚠️ Requires ANTHROPIC_API_KEY
**Validation tests pass:** ✅ (don't need API)

To run tests with API key:
```bash
npm run test:unit:run -- tests/unit/lib/ai/generateEducationSuggestion.test.ts
```

---

## Migration Notes

**Existing users:** No migration needed. Fix applies immediately.

**Behavior changes:**
- Sparse education sections will receive 3-10 points (down from 18-40)
- No fabricated content will be suggested
- Users with sparse sections will see formatting improvements + recommendations instead

**Product impact:**
- More honest, defensible suggestions
- Lower but accurate ATS score projections for sparse education
- Users won't risk job offers from fabricated content

---

## Monitoring

Watch for these in logs:

```
[FABRICATION DETECTED] - LLM attempted to suggest fabricated content
[FABRICATION REJECTED] - Validation layer blocked fabrication
```

If you see these frequently, the LLM is still trying to fabricate despite prompt constraints. May need to:
1. Strengthen prompt language
2. Add more detection patterns
3. Consider switching to a more instruction-following model

---

## Next Steps

1. **Deploy fix** - This is production-ready
2. **Monitor logs** - Watch for fabrication attempts
3. **User communication** - Consider notifying users that education suggestions are now more conservative but honest
4. **Documentation update** - Update user-facing docs to explain what education suggestions do/don't do

---

## Bottom Line

**Before:** Resume fraud generator
**After:** Honest formatting optimizer

This fix ensures SubmitSmart helps users present their REAL qualifications better, not fabricate fake ones.
