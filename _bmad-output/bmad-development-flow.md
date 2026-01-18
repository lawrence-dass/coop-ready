# BMAD Development Flow Guide

_A practical guide for efficient AI-assisted development using BMAD Method, optimized for context management._

---

## Table of Contents

1. [Overview](#overview)
2. [Development Lifecycle](#development-lifecycle)
3. [Workflow Commands Reference](#workflow-commands-reference)
4. [Context Management Strategies](#context-management-strategies)
5. [Session Boundaries](#session-boundaries)
6. [Best Practices](#best-practices)

---

## Overview

### Core Principle: Context Efficiency

Keep context usage under 60% to maintain AI agent effectiveness. When context grows too large, agents lose focus, make more errors, and work slower.

### BMAD Implementation Phase Workflows

| Workflow | Purpose | Agent |
|----------|---------|-------|
| `sprint-planning` | Initialize sprint tracking | SM |
| `sprint-status` | Check current progress | SM |
| `create-story` | Create next story with full context | SM |
| `dev-story` | Implement a story | DEV |
| `code-review` | Adversarial code review | DEV |
| `retrospective` | Epic completion review | SM |

---

## Development Lifecycle

### Phase 1: Sprint Setup (One-time per Sprint)

```
/bmad:bmm:workflows:sprint-planning
```

**What it does:**
- Parses all epics from planning artifacts
- Creates `sprint-status.yaml` tracking file
- Initializes all stories with `backlog` status

**When to run:**
- Once at the start of implementation phase
- After `create-epics-and-stories` workflow completes

**Context impact:** Low - run once, then use `sprint-status` for checking.

---

### Phase 2: Check Status

```
/bmad:bmm:workflows:sprint-status
```

**What it does:**
- Shows current sprint progress
- Recommends next workflow based on story states
- Surfaces risks and blockers

**When to run:**
- At the start of each work session
- When unsure what to work on next

**Context impact:** Very low - lightweight status check.

**Story Status Flow:**
```
backlog → ready-for-dev → in-progress → review → done
```

---

### Phase 3: Create Story

```
/bmad:bmm:workflows:create-story
```

**What it does:**
- Finds next `backlog` story from sprint-status
- Loads comprehensive context from:
  - Epic file (acceptance criteria, requirements)
  - Architecture document (patterns, structure)
  - Previous story learnings (if exists)
  - Project context (coding standards)
- Creates detailed story file in `_bmad-output/`
- Updates sprint-status: `backlog` → `ready-for-dev`

**When to run:**
- When sprint-status recommends it
- When no `ready-for-dev` stories exist

**Context impact:** Medium - loads planning artifacts but outputs lean story file.

**Key output:** Story file at `_bmad-output/{epic}-{story}-{title}.md` with:
- User story statement
- Acceptance criteria (BDD format)
- Tasks and subtasks with checkboxes
- Dev Notes (technical requirements, architecture compliance)
- Previous story intelligence (if applicable)

---

### Phase 4: Implement Story

```
/bmad:bmm:workflows:dev-story
```

**What it does:**
- Loads story file and project context
- Executes tasks/subtasks in sequence
- Follows red-green-refactor cycle:
  1. **RED:** Write failing tests first
  2. **GREEN:** Implement minimal code to pass
  3. **REFACTOR:** Improve while keeping tests green
- Updates sprint-status: `ready-for-dev` → `in-progress` → `review`
- Marks tasks complete only after validation passes

**When to run:**
- When `ready-for-dev` story exists
- Continue until story reaches `review` status

**Context impact:** HIGH - this is the main work session.

**Critical rules:**
- Never mark task complete until tests pass
- Follow tasks in exact order from story file
- Don't implement anything not in the story
- HALT on 3 consecutive failures or missing dependencies

**Session management for dev-story:**

1. **Single Story Focus:** Complete one story before starting another
2. **Natural Checkpoints:** After completing each task, context is logged to story file
3. **If context grows >60%:** Use `/compact` to summarize, then continue
4. **If must stop mid-story:** Story state is preserved in the file - next session resumes

---

### Phase 5: Code Review

```
/bmad:bmm:workflows:code-review
```

**What it does:**
- Performs adversarial senior developer review
- Finds 3-10 specific problems (NEVER "looks good")
- Checks: code quality, test coverage, architecture compliance, security, performance
- Can auto-fix issues with user approval
- Updates sprint-status: `review` → `done` (if approved)

**When to run:**
- After story reaches `review` status
- Use a **different LLM** than the one that implemented (prevents blind spots)

**Context impact:** Medium - loads story file, architecture, and changed files.

**Best practice:** Start a fresh session for code review to ensure unbiased perspective.

---

### Phase 6: Commit Changes

After code review passes:

1. **Stage changes:**
   ```bash
   git add .
   ```

2. **Commit with conventional format:**
   ```bash
   git commit -m "feat(epic-story): description

   - Detail 1
   - Detail 2

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

3. **Push if ready:**
   ```bash
   git push
   ```

**Commit message conventions:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure
- `test`: Adding tests
- `docs`: Documentation

---

### Phase 7: Retrospective (After Epic Completion)

```
/bmad:bmm:workflows:retrospective
```

**What it does:**
- Reviews completed epic with simulated team discussion
- Analyzes all story dev notes for patterns
- Compares against previous retrospective commitments
- Identifies preparation needs for next epic
- Creates action items with owners

**When to run:**
- After all stories in an epic reach `done` status
- Before starting next epic

**Context impact:** Medium-high - loads all story files for the epic.

---

## Workflow Commands Reference

### Quick Reference Card

| Scenario | Command |
|----------|---------|
| "What should I do next?" | `/bmad:bmm:workflows:sprint-status` |
| "Start implementing" | `/bmad:bmm:workflows:dev-story` |
| "Need to create story file" | `/bmad:bmm:workflows:create-story` |
| "Story is ready for review" | `/bmad:bmm:workflows:code-review` |
| "Epic is complete" | `/bmad:bmm:workflows:retrospective` |
| "Initialize new sprint" | `/bmad:bmm:workflows:sprint-planning` |

### Optional Testing Workflows

| Workflow | Purpose |
|----------|---------|
| `testarch-test-design` | Test planning at epic level |
| `testarch-atdd` | Generate acceptance tests (TDD) |
| `testarch-automate` | Expand test automation coverage |
| `testarch-test-review` | Review test quality |

---

## Context Management Strategies

### Understanding Context

Context = everything the AI remembers in current session:
- System instructions
- Conversation history
- File contents read
- Tool results

**Target:** Keep under 60% for optimal performance.

### Strategy 1: Use `/compact` During Long Sessions

**When:** Context indicator shows >50% usage during implementation.

**What it does:** Summarizes conversation history while preserving essential details.

**Best practice:** Use after completing a task within a story, not mid-task.

```
[Complete task 1]
[Check context - at 55%]
/compact
[Continue with task 2]
```

### Strategy 2: Use `/clear` for Fresh Starts

**When:**
- Starting a completely new story
- After code review (before implementation)
- Context is cluttered with irrelevant history

**What it does:** Clears conversation history completely.

**Warning:** You lose all conversation context. Use when you need a clean slate.

```
[Finish code review]
/clear
[Start next story with fresh context]
```

### Strategy 3: Session Boundaries

**Recommended session structure:**

```
Session 1: Create story
  /bmad:bmm:workflows:create-story
  → Output: story file created
  → End session

Session 2: Implement story
  /bmad:bmm:workflows:dev-story
  → Use /compact if context grows
  → Output: story at "review" status
  → End session

Session 3: Code review (different LLM recommended)
  /bmad:bmm:workflows:code-review
  → Output: story at "done" or fixes needed
  → End session

Session 4: Next story...
```

### Strategy 4: Handover Documents

**When context is growing but work must continue:**

Create a handover note in the conversation:

```
---HANDOVER---
Story: 1-2-user-authentication
Status: Task 3 of 5 complete
Files modified: auth.ts, login.tsx
Next action: Implement password validation (Task 4)
Blockers: None
Notes: Using bcrypt for hashing per architecture
---END HANDOVER---
```

Then `/clear` and paste the handover to resume work.

---

## Session Boundaries

### Ideal Session: One Story

The cleanest workflow is **one story per session**:

1. Start fresh session
2. Run `dev-story` workflow
3. Complete all tasks
4. Story reaches `review` status
5. End session
6. New session for code review

### Long Story Sessions

If a story has many tasks:

1. **After each task:** Check context usage
2. **At 50-60%:** Use `/compact`
3. **At 70%+:** Consider ending session with handover
4. **Next session:** Resume with story file (preserves state)

### Multiple Stories

**Don't do this:**
```
Session: Story 1 → Story 2 → Story 3 (context overflow)
```

**Do this:**
```
Session 1: Story 1 (complete)
Session 2: Story 2 (complete)
Session 3: Story 3 (complete)
```

### When to End a Session

1. Story reaches `review` status
2. Context exceeds 60%
3. You've been working for extended period
4. Switching to a different type of task (dev → review)

---

## Best Practices

### 1. Always Check Sprint Status First

```
/bmad:bmm:workflows:sprint-status
```

Prevents working on wrong story or duplicating effort.

### 2. Trust the Story File

The story file contains:
- Exact tasks to implement
- Acceptance criteria
- Architecture requirements
- Previous learnings

Don't deviate from it. If something seems wrong, update the story first.

### 3. One Thing at a Time

- One story per session
- One task at a time within story
- Don't parallelize unless story explicitly allows

### 4. Use Different LLMs for Review

The agent that wrote code has blind spots. Fresh eyes catch more issues.

Options:
- Different Claude model (Opus for review if Sonnet implemented)
- Different AI provider entirely

### 5. Commit After Each Story

Don't batch commits across multiple stories. Clean git history:

```
feat(1-1): implement user authentication
feat(1-2): add account management
feat(1-3): implement password reset
```

### 6. Let Workflows Update Sprint Status

Don't manually edit `sprint-status.yaml`. The workflows maintain it:
- `create-story`: backlog → ready-for-dev
- `dev-story`: ready-for-dev → in-progress → review
- `code-review`: review → done

### 7. Context Recovery

If you lose context mid-story:

1. Run `/bmad:bmm:workflows:dev-story` again
2. Workflow reads story file and resumes from last incomplete task
3. All previous work is preserved in the story file

### 8. Document As You Go

The dev-story workflow updates:
- Task checkboxes [x]
- File List (modified files)
- Change Log (what changed)
- Dev Agent Record (notes)

This enables perfect resume on next session.

---

## Typical Development Day

```
Morning:
  /bmad:bmm:workflows:sprint-status
  → Shows: 1-2-login-form is ready-for-dev

  /bmad:bmm:workflows:dev-story
  → Implements story, reaches review status
  → Commit changes

Afternoon (fresh session, different LLM if possible):
  /bmad:bmm:workflows:code-review
  → Finds 5 issues, user approves auto-fix
  → Story marked done
  → Commit fixes

  /bmad:bmm:workflows:sprint-status
  → Shows: 1-3-password-reset is next

  /bmad:bmm:workflows:dev-story
  → Begin next story...
```

---

## Summary: The Golden Path

```
sprint-planning (once)
     ↓
sprint-status (check)
     ↓
create-story (if needed)
     ↓
dev-story (implement)
     ↓
code-review (different LLM)
     ↓
commit changes
     ↓
sprint-status (next?)
     ↓
[repeat until epic done]
     ↓
retrospective
     ↓
[next epic]
```

**Context rule:** Stay under 60%. Use `/compact` liberally. Start fresh sessions for different phases.

---

_Last Updated: 2026-01-18_
