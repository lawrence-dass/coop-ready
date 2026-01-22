# Archive

Completed and redundant artifacts moved here to reduce active context loading.

## Archive Policy

### When to Archive

1. **After Epic Completion**
   - ATDD checklists for the epic
   - Automation summaries
   - Any epic-specific test artifacts

2. **After Planning Phase**
   - Product brief (PRD is the canonical source)
   - Discovery documents
   - Superseded requirement docs

3. **Redundant Files**
   - Index duplicates (overview.md, epic-list.md)
   - Files superseded by sharded versions

### Archive Structure

```
archive/
├── epic-1-completed/     # Epic 1 test artifacts
├── epic-2-completed/     # Epic 2 test artifacts
├── epic-3-completed/     # Epic 3 test artifacts
├── epic-4-completed/     # Epic 4 test artifacts
├── epic-5-completed/     # Epic 5 story files (9 stories)
├── epic-6-completed/     # Epic 6 story files (4 stories)
├── epic-8-completed/     # Epic 8 test artifacts + docs
├── discovery-phase/      # Product brief, initial docs
└── planning-redundant/   # Superseded planning docs
```

### Retrieval

If you need to reference archived content:
```bash
# View archived file
cat _bmad-output/archive/epic-1-completed/atdd-checklist-1-3.md

# Restore if needed (rare)
mv _bmad-output/archive/epic-1-completed/file.md _bmad-output/
```

## Archived Files

### epic-1-completed/ (117KB)
- `atdd-checklist-1-3.md` - Story 1.3 test checklist
- `atdd-checklist-1-4.md` - Story 1.4 test checklist
- `atdd-checklist-1-5.md` - Story 1.5 test checklist
- `atdd-checklist-1.6.md` - Story 1.6 test checklist
- `atdd-checklist-1-7.md` - Story 1.7 test checklist
- `automation-summary.md` - Epic 1 test automation summary

### epic-2-completed/ (76KB)
- `atdd-checklist-2-1-onboarding-flow-experience-level-target-role.md`
- `atdd-checklist-2-2-profile-settings-page.md`
- `traceability-epic-2.md` - Epic 2 traceability matrix

### epic-3-completed/ (144KB)
- `atdd-checklist-3-1.md` - Story 3.1 test checklist
- `atdd-checklist-3-4.md` - Story 3.4 test checklist
- `traceability-epic-3.md` - Epic 3 traceability matrix
- `manual-testing-epics-1-2-3.md` - Manual testing for Epics 1-3

### epic-4-completed/ (32KB)
- `epic-4-traceability-matrix.md` - Epic 4 traceability matrix

### epic-5-completed/ (~180KB, 9 stories)
- `5-1-bullet-point-rewrite-generation.md`
- `5-2-transferable-skills-detection-mapping.md`
- `5-3-action-verb-quantification-suggestions.md`
- `5-4-skills-expansion-suggestions.md`
- `5-5-format-content-removal-suggestions.md`
- `5-6-suggestions-display-by-section.md`
- `5-7-accept-reject-individual-suggestions.md`
- `5-8-optimized-resume-preview.md`
- `5-9-suggestions-page-ui.md`

### epic-6-completed/ (~70KB, 4 stories)
- `6-1-resume-content-merging.md`
- `6-2-pdf-resume-generation.md`
- `6-3-docx-resume-generation.md`
- `6-4-download-ui-format-selection.md`

### epic-8-completed/ (~65KB)
- `traceability-epic-8.md` - Epic 8 traceability matrix
- `TEST-AUTOMATION-COMPLETE.md` - Test automation status
- `TEST-AUTOMATION-FINAL-REPORT.md` - Final test report
- `TEST-AUTOMATION-INDEX.md` - Test file index
- `CI-CD-SETUP-GUIDE.md` - CI/CD configuration
- `SESSION-SUMMARY-TEST-AUTOMATION.md` - Session notes

### discovery-phase/ (20KB)
- `product-brief-CoopReady-2026-01-18.md` - Initial product discovery

### planning-redundant/ (20KB)
- `overview.md` - Stub (duplicated index.md)
- `epic-list.md` - Duplicated index.md
- `requirements-inventory.md` - Superseded by epic files

**Total Archived: ~803KB** (updated 2026-01-22)
