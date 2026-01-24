# Archive

This folder contains completed artifacts that are no longer needed in active context.

## Purpose

Archived files are preserved for:
- Historical reference
- Audit trails
- Potential restoration

**These files should NEVER be loaded into AI context during normal development.**

## Structure

```
archive/
├── discovery-phase/        # Product briefs, early research
├── planning-redundant/     # Superseded planning documents
└── epic-{N}-completed/     # Completed epic artifacts
    ├── stories/            # Completed story files
    ├── atdd-*.md          # Testing checklists
    └── traceability-*.md  # Requirements mapping
```

## Restoration

To restore an archived file:

```bash
# Using git mv preserves history
git mv archive/{path} {original-path}
```

## Policy

| Action | When |
|--------|------|
| Archive stories | After epic is marked `done` |
| Archive ATDD/traceability | After epic completion |
| Archive product brief | After PRD is finalized |
| Archive superseded docs | Immediately when replaced |

## Automation

Run context optimization to auto-identify archivable artifacts:

```bash
/context-optimize archive
```

---

*Managed by Context Optimization Workflow*
