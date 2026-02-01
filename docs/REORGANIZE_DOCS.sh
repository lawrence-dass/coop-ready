#!/bin/bash
# Reorganize docs to reduce context pollution
# Run from project root: bash docs/REORGANIZE_DOCS.sh

set -e

echo "=== Reorganizing docs for context efficiency ==="

# Create new directory structure
mkdir -p docs/reference
mkdir -p docs/verification-reports
mkdir -p docs/archive

# Move large specification files to reference
echo "Moving large spec files to docs/reference/..."
mv docs/ats-scoring-system-specification-v2.1.md docs/reference/ 2>/dev/null || true
mv docs/ats-scoring-system-specification.md docs/reference/ 2>/dev/null || true
mv docs/LLM_PROMPTS.md docs/reference/ 2>/dev/null || true
mv docs/PRODUCT_OVERVIEW.md docs/reference/ 2>/dev/null || true

# Move EPIC verification files to verification-reports
echo "Moving EPIC verification files..."
mv docs/EPIC-*-VERIFICATION.md docs/verification-reports/ 2>/dev/null || true

# Move historical improvement docs to archive
echo "Moving historical docs to archive/..."
mv docs/ATS_SCORING_IMPROVEMENTS.md docs/archive/ 2>/dev/null || true
mv docs/llm_judge_refinement.md docs/archive/ 2>/dev/null || true
mv docs/POINT-SYSTEM-REDESIGN.md docs/archive/ 2>/dev/null || true

# Create index files
echo "Creating index files..."

cat > docs/reference/README.md <<'EOF'
# Reference Documentation

Large specification and reference documents.
Not needed for daily development - consult when implementing specific features.

## Files

- `ats-scoring-system-specification-v2.1.md` - Complete V2.1 algorithm spec (128KB)
- `ats-scoring-system-specification.md` - Original V2 spec (56KB)
- `LLM_PROMPTS.md` - All LLM prompts used in system (36KB)
- `PRODUCT_OVERVIEW.md` - High-level product overview (12KB)

**Total:** ~232KB of reference material
EOF

cat > docs/verification-reports/README.md <<'EOF'
# EPIC Verification Reports

Historical test verification reports for completed epics.
Archive of quality gates - not needed for current development.

## Files

- EPIC-1-VERIFICATION.md - Project foundation
- EPIC-2-VERIFICATION.md - Auth & sessions
- EPIC-6-VERIFICATION.md - Suggestions pipeline
- EPIC-8-VERIFICATION.md - Authentication
- EPIC-9-VERIFICATION.md - Resume library
- EPIC-10-VERIFICATION.md - History
- EPIC-11-VERIFICATION.md - Point system
- EPIC-12-VERIFICATION.md - LLM judge

**Total:** ~82KB of historical reports
EOF

cat > docs/archive/README.md <<'EOF'
# Archived Documentation

Historical design documents and improvement proposals.
Superseded by current implementations.

## Files

- ATS_SCORING_IMPROVEMENTS.md - Early scoring improvement proposals
- llm_judge_refinement.md - LLM judge design notes
- POINT-SYSTEM-REDESIGN.md - Point system redesign proposal

These documents informed current implementations but are no longer actively referenced.
EOF

echo ""
echo "=== Reorganization Complete ==="
echo ""
echo "New structure:"
echo "  docs/reference/            - Large specs (not in daily context)"
echo "  docs/verification-reports/ - EPIC test reports (historical)"
echo "  docs/archive/              - Superseded design docs"
echo ""
echo "Active docs remain in docs/ root:"
ls -1 docs/*.md 2>/dev/null | grep -v "REORGANIZE" || echo "  (check docs/ for remaining files)"
echo ""
echo "Context reduction: ~314KB moved out of active context"
