# Context Optimization Instructions

<critical>Communicate all responses in {communication_language}</critical>
<critical>This workflow helps reduce token usage without compromising quality</critical>

## Workflow Modes

| Mode | Command | Description |
|------|---------|-------------|
| analyze | `/context-optimize` | Report issues only (default) |
| archive | `/context-optimize archive` | Archive completed artifacts |
| full | `/context-optimize full` | All optimizations |

---

## Step 1: Detect Mode from Arguments

<action>Check if user provided mode argument</action>
<action>Set {{mode}} = argument OR "analyze" (default)</action>

<output>
🔍 **Context Optimization** - Mode: {{mode}}
</output>

---

## Step 2: Scan Project Files

<action>Read {sprint_status} to identify completed epics</action>
<action>List all files in {planning_artifacts} with sizes</action>
<action>List all files in {implementation_artifacts} with sizes</action>
<action>List all files in {output_folder} root with sizes</action>
<action>Check if {archive_folder} exists</action>

<action>Calculate totals:</action>
- Total planning artifacts size
- Total implementation artifacts size
- Total output folder size
- Number of completed epics
- Number of stories per epic

---

## Step 3: Detect Issues

### 3.1 Completed Epic Artifacts (Archivable)

<action>For each completed epic (status = "done" in sprint-status):</action>
- Find ATDD checklists: `atdd-checklist-{epic}-*.md`
- Find automation summaries: `automation-summary*.md`
- Find epic retrospectives: `epic-{N}-retro-*.md`
- Calculate total archivable size

### 3.2 Large Documents (Sharding Candidates)

<action>Identify files exceeding thresholds:</action>

| File Type | Threshold | Action |
|-----------|-----------|--------|
| architecture.md | >200 lines | Suggest sharding |
| prd.md | >500 lines | Suggest sharding |
| Epic files | >300 lines | Suggest sharding |
| Story files | >400 lines | Review Dev Notes |
| CLAUDE.md | >60 lines | Suggest trimming |

### 3.3 Redundant Files

<action>Check for redundant files:</action>
- `epics/overview.md` (duplicates index.md)
- `epics/epic-list.md` (duplicates index.md)
- `product-brief-*.md` (superseded by PRD)
- Multiple index files in same folder

### 3.4 Outdated CLAUDE.md

<action>Read {claude_md} and check for:</action>
- Incorrect phase/status
- Outdated "Next Workflow" reference
- Duplicate content from other docs
- Missing model recommendations
- Line count exceeding 60

---

## Step 4: Execute Based on Mode

### Mode: analyze

<action>Generate report only - no file changes</action>

<output>
## 📊 Context Optimization Report

### Current State
| Category | Size | Files |
|----------|------|-------|
| Planning Artifacts | {{planning_size}} | {{planning_count}} |
| Implementation Artifacts | {{impl_size}} | {{impl_count}} |
| Output Root | {{output_size}} | {{output_count}} |
| **Total Active** | {{total_size}} | {{total_count}} |

### 🗄️ Archivable Artifacts
{{#each archivable}}
- `{{this.file}}` ({{this.size}}) - {{this.reason}}
{{/each}}
**Total Archivable:** {{archivable_total}}

### 📄 Large Documents (Sharding Candidates)
{{#each large_files}}
- `{{this.file}}` - {{this.lines}} lines (threshold: {{this.threshold}})
{{/each}}

### 🔄 Redundant Files
{{#each redundant}}
- `{{this.file}}` - {{this.reason}}
{{/each}}

### 📝 CLAUDE.md Status
- Lines: {{claude_lines}}/60 {{#if claude_over}}⚠️ OVER LIMIT{{/if}}
- Outdated info: {{claude_outdated_count}} items
- Missing: {{claude_missing}}

### 💡 Recommendations
1. {{recommendation_1}}
2. {{recommendation_2}}
3. {{recommendation_3}}

---
Run `/context-optimize archive` to archive completed artifacts.
Run `/context-optimize full` for all optimizations.
</output>

### Mode: archive

<action>Create archive folder structure if needed:</action>
```
{archive_folder}/
├── README.md
├── epic-{N}-completed/
├── discovery-phase/
└── planning-redundant/
```

<action>For each completed epic:</action>
1. Create `archive/epic-{N}-completed/` folder
2. Move ATDD checklists for that epic
3. Move automation summaries for that epic
4. Move retrospective files for that epic

<action>Archive redundant planning files:</action>
1. Move `epics/overview.md` → `archive/planning-redundant/`
2. Move `epics/epic-list.md` → `archive/planning-redundant/`
3. Move `product-brief-*.md` → `archive/discovery-phase/`

<action>Update or create archive README.md with policy</action>

<output>
## ✅ Archive Complete

### Moved to Archive
{{#each archived}}
- `{{this.from}}` → `{{this.to}}`
{{/each}}

### Archive Structure
```
{archive_folder}/
{{archive_tree}}
```

**Total Archived:** {{archived_total}}
**Active Context Reduced By:** {{reduction_percent}}%
</output>

### Mode: full

<action>Execute archive mode first</action>

<action>For large documents, suggest sharding:</action>

<output>
### 📄 Sharding Recommendations

The following files exceed size thresholds:

{{#each shard_candidates}}
**{{this.file}}** ({{this.lines}} lines)
- Suggested shards: {{this.suggested_shards}}
- Run: `/shard-doc {{this.file}}`
{{/each}}
</output>

<action>Update CLAUDE.md if outdated:</action>
1. Fix incorrect phase/status
2. Update current epic progress
3. Remove duplicate content
4. Add model recommendations if missing
5. Ensure under 60 lines

<output>
### 📝 CLAUDE.md Updates
{{#each claude_updates}}
- {{this}}
{{/each}}
</output>

<action>Generate final summary</action>

<output>
## ✅ Full Optimization Complete

### Summary
| Action | Before | After | Savings |
|--------|--------|-------|---------|
| Archived | {{before_archived}} | {{after_archived}} | {{archive_savings}} |
| CLAUDE.md | {{claude_before}} lines | {{claude_after}} lines | {{claude_savings}}% |

### Pending Manual Actions
{{#each pending_actions}}
- [ ] {{this}}
{{/each}}

### Next Run
Schedule next optimization after epic completion.
</output>

---

## Step 5: Update Guide (if changes made)

<check if="mode != analyze">
<action>Append entry to {optimization_guide} Implementation History section:</action>

```markdown
### {{date}}: {{mode}} Optimization

**Changes:**
{{list_changes}}

**Results:**
- Archived: {{archived_size}}
- Context reduced: {{reduction_percent}}%
```
</check>

---

## Facilitation Notes

- Always show what WILL change before making changes
- In `analyze` mode, never modify files
- In `archive` mode, only move completed artifacts
- In `full` mode, suggest sharding but don't auto-execute (use /shard-doc)
- Preserve all file content when moving (no data loss)
- Update archive README.md to track what was archived
- Keep CLAUDE.md under 60 lines as target
