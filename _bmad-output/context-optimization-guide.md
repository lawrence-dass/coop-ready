# Context Optimization Guide

Guidelines for keeping BMAD workflow context efficient without compromising quality.

## Why Context Optimization Matters

| Issue | Impact |
|-------|--------|
| Large files loaded every workflow | Higher token costs, slower responses |
| Redundant content across files | Wasted context window |
| Accumulated artifacts | Noise in file discovery |
| Outdated CLAUDE.md | Misleading guidance |

## Optimization Strategies

### 1. Document Sharding

**When**: Large documents (>200 lines) loaded by multiple workflows

**How**:
```
architecture.md (791 lines)
    ↓ shard
architecture.md (108 lines - index)
architecture/
├── architecture-overview.md
├── architecture-decisions.md
├── architecture-patterns.md
├── architecture-structure.md
└── architecture-validation.md
```

**Rules**:
- Keep index under 150 lines with essential patterns
- Put shards in subfolder (avoids glob pattern matching)
- Include "When to Load" guidance in index
- Preserve YAML frontmatter in index

**Candidates for Sharding**:
- architecture.md (>300 lines)
- prd.md (>500 lines)
- Large epic files

### 2. Artifact Archiving

**When**: After epic completion or phase transition

**Archive Structure**:
```
_bmad-output/archive/
├── README.md                    # Archive policy
├── epic-{N}-completed/          # Per-epic test artifacts
│   ├── atdd-checklist-*.md
│   └── automation-summary.md
├── discovery-phase/             # Pre-implementation docs
│   └── product-brief-*.md
└── planning-redundant/          # Superseded files
    └── *.md
```

**What to Archive**:
| Artifact | When to Archive |
|----------|-----------------|
| ATDD checklists | After epic completion |
| Automation summaries | After epic completion |
| Product brief | After PRD is finalized |
| Redundant index files | Immediately |
| Old story versions | After sprint completion |

**What NOT to Archive**:
- Active stories (in-progress or ready-for-dev)
- Sprint-status.yaml
- Project-context.md
- Architecture (reference doc)

### 3. Model Selection

**Configured in**: `_bmad/bmm/config.yaml`

| Workflow | Model | Rationale |
|----------|-------|-----------|
| create-story | haiku | Template filling, ~70% cost savings |
| sprint-planning | haiku | Simple extraction |
| code-review | opus | Comprehensive analysis, fewer iterations |
| dev-story | sonnet | Balanced reasoning (default) |

**Usage**:
```bash
/bmad:bmm:workflows:create-story --model haiku
/bmad:bmm:workflows:code-review --model opus
```

### 4. CLAUDE.md Maintenance

**Target**: Under 60 lines

**Include**:
- Current project state (phase, progress)
- Quick commands with model recommendations
- Key file locations (not content)
- Tech stack one-liner (reference project-context.md)

**Exclude**:
- Duplicate content from other docs
- Detailed feature lists (in PRD)
- Full tech stack details (in project-context.md)
- Historical information

**Update Triggers**:
- Epic completion
- Phase transition
- Architecture changes

## Optimization Checklist

### After Epic Completion

- [ ] Archive ATDD checklists to `archive/epic-{N}-completed/`
- [ ] Archive automation summary
- [ ] Update CLAUDE.md current state
- [ ] Update sprint-status.yaml epic status to "done"
- [ ] Consider retrospective for lessons learned

### After Planning Phase

- [ ] Archive product brief (PRD is canonical)
- [ ] Remove redundant index files
- [ ] Shard large documents (>300 lines)

### Periodic Review

- [ ] Check CLAUDE.md is under 60 lines
- [ ] Verify no duplicate content across docs
- [ ] Ensure archive is organized
- [ ] Review model recommendations still valid

## Metrics

### Target Sizes

| File | Target | Action if Exceeded |
|------|--------|-------------------|
| CLAUDE.md | <60 lines | Remove duplicates |
| architecture.md (index) | <150 lines | Shard further |
| project-context.md | <200 lines | Extract to separate docs |
| Individual stories | <400 lines | Review Dev Notes |

### Per-Workflow Context Budget

| Workflow | Target Context |
|----------|----------------|
| create-story | <200 lines loaded |
| code-review | <300 lines loaded |
| dev-story | <250 lines loaded |

## Automation

### Skill: `/context-optimize`

**Location**: `_bmad/bmm/workflows/4-implementation/context-optimize/`

**Usage**:
```bash
# Analyze only (default) - report issues without changes
/context-optimize

# Archive completed artifacts
/context-optimize archive

# Full optimization (archive + suggestions)
/context-optimize full
```

**Modes**:

| Mode | Description | Changes Files? |
|------|-------------|----------------|
| `analyze` | Report context issues | No |
| `archive` | Move completed artifacts to archive | Yes |
| `full` | Archive + shard suggestions + CLAUDE.md updates | Yes |

**Recommended Model**: `--model haiku` (procedural task)

### When to Trigger `/context-optimize`

#### Automatic Triggers (Reminders)

You'll be reminded to run optimization at these points:

| Workflow | What Happens | Suggested Action |
|----------|--------------|------------------|
| `/code-review` | Shows context health status | Run if ⚠️ warning appears |
| `/retrospective` | Prompts archive after epic | Run `/context-optimize archive` |

#### Manual Triggers (User-Initiated)

| Scenario | When | Command |
|----------|------|---------|
| **Epic completed** | After retrospective | `/context-optimize archive` |
| **Context warning** | Code review shows ⚠️ | `/context-optimize` |
| **Slow responses** | Workflows feeling sluggish | `/context-optimize` |
| **New sprint** | Before starting new epic | `/context-optimize archive` |
| **Monthly maintenance** | First of month | `/context-optimize full` |
| **Large doc added** | After adding big planning doc | `/context-optimize` |

#### Decision Flow

```
Code review shows context status
         │
         ├── ✅ Healthy → Continue to next story
         │
         └── ⚠️ Over budget
                  │
                  ├── Mid-epic? → Run `/context-optimize` (analyze)
                  │                    │
                  │                    └── Review suggestions, fix manually
                  │
                  └── Epic done? → Run `/context-optimize archive`
                                        │
                                        └── Artifacts moved to archive/
```

#### What Each Mode Does

**`/context-optimize`** (analyze - default)
- Scans all artifact folders
- Calculates sizes and counts
- Identifies archivable files
- Reports large documents (sharding candidates)
- Checks CLAUDE.md health
- **Does NOT modify any files**

**`/context-optimize archive`**
- Runs analyze first
- Creates archive folder structure
- Moves completed epic artifacts (ATDD, summaries)
- Moves redundant planning files
- Updates archive README
- **Modifies file locations only**

**`/context-optimize full`**
- Runs archive first
- Suggests documents for sharding (doesn't auto-shard)
- Updates CLAUDE.md if outdated
- Generates comprehensive report
- **Use for periodic deep cleanup**

### Hook: Code Review Context Check

A lightweight context health check runs at the end of every `/code-review`:

```
📊 Context Health: 245KB (budget: 300KB) ✅
```

If over budget:
```
📊 Context Health: 320KB (budget: 300KB) ⚠️
💡 Context over budget. Run `/context-optimize` to investigate.
```

**Location**: `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` (Step 5)

**Why here?**: Code review is a natural checkpoint after each story - non-intrusive visibility without action required.

### Hook: Retrospective Reminder

A context optimization reminder is automatically shown at the end of the `/retrospective` workflow:

```
💡 Context Optimization Reminder
Epic {N} is complete. Consider running `/context-optimize archive` to:
- Archive ATDD checklists and test summaries
- Clean up redundant planning files
- Reduce active context for future workflows
```

**Location**: `_bmad/bmm/workflows/4-implementation/retrospective/instructions.md` (Step 12)

### When to Run

| Trigger | Recommended Action |
|---------|-------------------|
| After retrospective | `/context-optimize archive` |
| Monthly review | `/context-optimize` (analyze) |
| Before major refactor | `/context-optimize full` |
| Context budget exceeded | `/context-optimize` → manual fixes |

### Automation Philosophy

1. **Skill over Hook**: User maintains control over when optimization runs
2. **Analyze before Execute**: Default mode reports without changes
3. **Integrated Reminder**: Retrospective prompts optimization at natural point
4. **No Auto-Delete**: Archive moves files, never deletes

## Implementation History

### 2026-01-19: Initial Optimization

**Changes**:
1. Sharded architecture.md (791→108 lines, 86% reduction)
2. Created archive structure (~149KB archived)
3. Optimized CLAUDE.md (90→59 lines, 34% reduction)
4. Added model recommendations to workflow configs

**Results**:
- create-story context: ~82% reduction
- code-review context: ~78% reduction
- Total archived: ~149KB

### 2026-01-19: Automation Added

**Changes**:
1. Created `/context-optimize` skill with 3 modes (analyze, archive, full)
2. Added context optimization reminder to retrospective workflow
3. Documented automation in this guide

**Files Created**:
- `_bmad/bmm/workflows/4-implementation/context-optimize/workflow.yaml`
- `_bmad/bmm/workflows/4-implementation/context-optimize/instructions.md`

**Files Modified**:
- `_bmad/bmm/workflows/4-implementation/retrospective/instructions.md` (added reminder)
- `_bmad/bmm/workflows/4-implementation/code-review/instructions.xml` (added context health check)
