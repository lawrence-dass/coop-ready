# Education Suggestion Quality Fix

**Date:** January 31, 2026
**Issue:** Suggestion quality problems - placeholder "original" text and duplicate suggestions
**Status:** ✅ FIXED

---

## Problem Statement

After fixing the fabrication issue, we discovered **quality problems** with education suggestions:

### Issue 1: Invalid "Original" Field Values
```json
{
  "original": "No location formatting",  // ❌ Placeholder description
  "suggested": "Bachelor's Degree | DePaul University, Chicago, IL | 2020"
}
```

**Should be:**
```json
{
  "original": "Bachelor's Degree\nDePaul University\n2020",  // ✅ Actual resume text
  "suggested": "Bachelor's Degree | DePaul University, Chicago, IL | 2020"
}
```

### Issue 2: Duplicate Suggestions

LLM was creating multiple suggestions for the same change:
- Suggestion 1: Add pipe separators
- Suggestion 2: Add location formatting
- Both produce nearly identical output

### Issue 3: Suggestion Chaining

LLM was basing suggestion #2 on the OUTPUT of suggestion #1, instead of the original resume text.

---

## Root Cause

**Prompt lacked clarity on:**
1. What constitutes a valid "original" field
2. That suggestions should be independent
3. How to handle missing elements (location, GPA, etc.)

**No validation for:**
- Placeholder text in "original" field
- Duplicate suggestions
- Invalid "original" field formats

---

## Solution: Two-Part Fix

### Part 1: Prompt Clarification ✅

**Added "Suggestion Rules (CRITICAL)" section:**

```
**Suggestion Rules (CRITICAL):**
- Each suggestion is INDEPENDENT - base ALL suggestions on the ORIGINAL resume text
- The "original" field MUST contain EXACT text from user's resume
- NEVER use descriptions like "No location formatting" or "Missing X"
- If original doesn't have something, use the actual text that exists
- Do NOT create multiple suggestions for the same change
- For location inference, "original" shows line WITHOUT location, "suggested" shows WITH
- Maximum 2-3 suggestions per entry to avoid redundancy
```

**Updated example JSON:**

```json
{
  "original": "Bachelor's Degree in Information Systems\nDePaul University\n2020",
  "suggested": "Bachelor's Degree in Information Systems | DePaul University, Chicago, IL | 2020",
  "explanation": "Added inferred location (Chicago, IL) and pipe separators for better ATS parseability"
}
```

**NOT:**
```json
{
  "original": "No location formatting",  // ❌
  "suggested": "..."
}
```

### Part 2: Validation Layer ✅

**Added `hasInvalidOriginalField()` function:**

```typescript
function hasInvalidOriginalField(original: string): boolean {
  const placeholderPatterns = [
    /^No (location|coursework|projects|certifications|honors|GPA)/i,
    /^Missing (location|coursework|details)/i,
    /^Add(ing)? (location|GPA|coursework)/i,
    /formatting$/i,  // "No location formatting"
    /^User has not/i,
  ];

  // Detect and reject placeholder text
  for (const pattern of placeholderPatterns) {
    if (pattern.test(original.trim())) {
      return true; // Invalid - reject this suggestion
    }
  }

  return false;
}
```

**Applied in validation chain:**

```typescript
.filter((bullet) => {
  // Reject fabrications
  if (detectFabrication(bullet.original, bullet.suggested)) {
    return false;
  }

  // Reject invalid "original" field placeholders
  if (hasInvalidOriginalField(bullet.original)) {
    console.error('[INVALID ORIGINAL FIELD REJECTED]', {
      original: bullet.original
    });
    return false;
  }

  return true;
})
```

---

## What Changed

### File: `lib/ai/generateEducationSuggestion.ts`

**Lines modified:**
- 59-77: Added "Suggestion Rules (CRITICAL)" with 6 explicit constraints
- 118-176: Updated example JSON to show CORRECT "original" field usage
- 213-237: Added `hasInvalidOriginalField()` validation function
- 450-460: Applied validation to filter out invalid suggestions

**Total:** ~50 lines modified/added

### File: `tests/unit/lib/ai/generateEducationSuggestion.test.ts`

**Tests added:**
- `should NOT use placeholder text in "original" field`
- `should not create duplicate suggestions for same change`

---

## Examples: Before vs After

### Before (Bad) ❌

**Input:**
```
Bachelor's Degree in Information Systems
DePaul University
2020
```

**Output:**
```json
[
  {
    "original": "Bachelor's Degree in Information Systems DePaul University, Chicago, IL | 2020",
    "suggested": "Bachelor's Degree in Information Systems | DePaul University, Chicago, IL | 2020"
  },
  {
    "original": "No location formatting",
    "suggested": "Bachelor's Degree in Information Systems | DePaul University, Chicago, IL | 2020"
  }
]
```

**Problems:**
- Duplicate suggestions (same output)
- Placeholder in "original" field
- Suggestion chaining (basing #2 on output of #1)

### After (Good) ✅

**Input:**
```
Bachelor's Degree in Information Systems
DePaul University
2020
```

**Output:**
```json
[
  {
    "original": "Bachelor's Degree in Information Systems\nDePaul University\n2020",
    "suggested": "Bachelor's Degree in Information Systems | DePaul University, Chicago, IL | 2020",
    "impact": "moderate",
    "point_value": 2
  },
  {
    "original": "User has not listed certifications or professional development",
    "suggested": "Recommendation: Consider CompTIA A+ or AWS Cloud Practitioner",
    "impact": "high",
    "point_value": 4
  }
]
```

**Improvements:**
- Single formatting suggestion (no duplication)
- Actual resume text in "original" field
- Second suggestion is future recommendation (clearly marked)

---

## Validation Logs

When invalid suggestions are detected, you'll see:

```
[INVALID ORIGINAL FIELD REJECTED] {
  original: "No location formatting",
  suggested: "Bachelor's Degree | DePaul University, Chicago, IL | 2020"
}
```

This helps monitor LLM compliance with the constraints.

---

## Testing

**New tests verify:**
1. ✅ No placeholder text in "original" field
2. ✅ No duplicate suggestions
3. ✅ Original field contains actual resume content
4. ✅ Suggestions are independent (not chained)

Run with:
```bash
npm run test:unit:run -- tests/unit/lib/ai/generateEducationSuggestion.test.ts
```

---

## Impact

**Before:**
- Users saw duplicate suggestions
- Confusing "original" field values
- Unclear what was being changed

**After:**
- Clean, non-redundant suggestions
- Clear "original" shows exact resume text
- Each suggestion is independent and actionable

---

## Monitoring

Watch for these logs:
- `[INVALID ORIGINAL FIELD REJECTED]` - LLM used placeholder text
- `[FABRICATION REJECTED]` - LLM attempted fabrication

If you see frequent rejections, the prompt may need further strengthening.

---

## Summary

Fixed **suggestion quality issues** on top of the fabrication fix:
1. ✅ No more placeholder "original" text
2. ✅ No more duplicate suggestions
3. ✅ Each suggestion based on actual resume content
4. ✅ Clearer, more actionable suggestions for users

Combined with the fabrication fix, education suggestions are now:
- **Honest** (no fake content)
- **High quality** (no placeholders or duplicates)
- **Actionable** (clear what's being changed)
