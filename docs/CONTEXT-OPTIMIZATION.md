# Context Optimization for Claude

**Date:** January 31, 2026
**Goal:** Reduce context pollution and improve Claude's focus on relevant information

---

## Problem

Claude was potentially reading **~500KB+ of unnecessary documentation** on every interaction:
- Large specification files (232KB)
- Historical EPIC verification reports (82KB)
- Completed implementation stories (200KB+)
- Duplicate information across multiple files

**Impact:**
- Slower responses
- Higher token usage
- Reduced focus on relevant code
- Confusion from outdated information

---

## Solution: 3-Tier Documentation Strategy

### **Tier 1: Active Context (Always Available)**

**Files in project root and key locations:**
```
CLAUDE.md                           - Quick reference (lean)
_bmad-output/project-context.md     - Detailed rules & patterns
docs/TESTING.md                     - Test commands
docs/ENVIRONMENT.md                 - Env var setup
docs/DATABASE.md                    - DB setup
docs/MCP-SETUP.md                   - MCP configuration
docs/CI-CD.md                       - CI/CD info
docs/EDUCATION-FABRICATION-FIX.md   - Recent critical fix
docs/EDUCATION-QUALITY-FIX.md       - Recent quality fix
docs/GOOGLE-OAUTH-SETUP.md          - OAuth setup
```

**Total:** ~30KB of essential, current information

### **Tier 2: Reference Material (Consult When Needed)**

**Files in docs/reference/:**
```
ats-scoring-system-specification-v2.1.md  - V2.1 algorithm spec
ats-scoring-system-specification.md       - V2 algorithm spec
LLM_PROMPTS.md                            - All LLM prompts
PRODUCT_OVERVIEW.md                       - Product overview
```

**Total:** ~232KB of detailed specs (not loaded by default)

### **Tier 3: Historical Archive (Rarely Needed)**

**Files in docs/verification-reports/ and docs/archive/:**
```
verification-reports/
  - EPIC-*-VERIFICATION.md  - Quality gate reports
archive/
  - ATS_SCORING_IMPROVEMENTS.md
  - llm_judge_refinement.md
  - POINT-SYSTEM-REDESIGN.md
```

**Total:** ~114KB of historical context (excluded from active context)

---

## Changes Made

### **1. Created CLAUDE.md.PROPOSED**

Lean quick reference that points to detailed docs instead of duplicating content.

**Before:** 95 lines with full tech stack, detailed rules
**After:** 80 lines with quick references, links to details

### **2. Created Reorganization Script**

`docs/REORGANIZE_DOCS.sh` moves files into 3-tier structure.

Run with:
```bash
bash docs/REORGANIZE_DOCS.sh
```

### **3. Created .claudeignore**

Explicitly excludes from context:
- `docs/reference/`
- `docs/verification-reports/`
- `docs/archive/`
- `_bmad-output/implementation-artifacts/`
- `.cursor/commands/`
- Build outputs, test reports

### **4. Documentation Index**

Each tier has README.md explaining contents and when to consult.

---

## Implementation Steps

**Step 1: Review Proposed CLAUDE.md**
```bash
diff CLAUDE.md CLAUDE.md.PROPOSED
```

If acceptable:
```bash
mv CLAUDE.md CLAUDE.md.OLD
mv CLAUDE.md.PROPOSED CLAUDE.md
```

**Step 2: Reorganize Docs**
```bash
chmod +x docs/REORGANIZE_DOCS.sh
bash docs/REORGANIZE_DOCS.sh
```

**Step 3: Verify .claudeignore**
`.claudeignore` is already created. Verify it works with your Claude setup.

**Step 4: Cleanup**
```bash
rm CLAUDE.md.OLD  # After verifying new CLAUDE.md works
```

---

## Before vs After

### **Active Context Size**

**Before:**
```
CLAUDE.md:                    3KB
docs/*.md (all 23 files):   350KB
_bmad-output/**/*.md:       200KB+
Total:                      ~550KB
```

**After:**
```
CLAUDE.md:                    2KB
docs/*.md (9 active):        30KB
project-context.md:           8KB
Total:                       ~40KB
```

**Reduction:** ~510KB (93% smaller)

### **Search Efficiency**

**Before:** Grep searches include:
- Historical specs
- Verification reports
- Archived proposals
- Completed stories

**After:** Grep searches focus on:
- Active code
- Current docs
- Project context
- Recent fixes

---

## Verification

After implementing changes, verify context efficiency:

**1. Check active docs:**
```bash
ls -lh docs/*.md
# Should only show ~9 active files
```

**2. Check reference docs:**
```bash
ls -lh docs/reference/
# Should show large spec files
```

**3. Check archive:**
```bash
ls -lh docs/verification-reports/
ls -lh docs/archive/
# Should show historical files
```

**4. Test Claude response:**
Ask Claude: "What documentation is available?"
- Should mention active docs
- Should reference docs/reference/ for specs
- Should not list every archived file

---

## Maintenance

### **When to Update Active Docs:**

Add to docs/ root if:
- ✅ Needed for daily development
- ✅ Less than 10KB
- ✅ Current/accurate information

### **When to Add to Reference:**

Add to docs/reference/ if:
- ✅ Large (>20KB)
- ✅ Detailed specification
- ✅ Consulted occasionally, not daily

### **When to Archive:**

Move to docs/archive/ if:
- ✅ Historical/superseded
- ✅ Rarely needed
- ✅ Background context only

---

## Impact

**Performance:**
- ✅ Faster Claude responses (less context to process)
- ✅ Lower token usage (~93% reduction in docs context)
- ✅ More focused suggestions (less noise)

**Organization:**
- ✅ Clear separation: active vs reference vs archive
- ✅ Easier to find relevant documentation
- ✅ Less duplicate information

**Development:**
- ✅ Claude focuses on current code and patterns
- ✅ Historical context available when needed
- ✅ Cleaner workspace

---

## Summary

Reorganized documentation from **flat 23-file structure** to **3-tier system**:

1. **Active** (docs/): 9 files, ~30KB - Daily reference
2. **Reference** (docs/reference/): 4 files, ~232KB - Consult when needed
3. **Archive** (docs/archive/, docs/verification-reports/): Historical context

**Result:** 93% reduction in active context size, clearer organization, faster Claude responses.
