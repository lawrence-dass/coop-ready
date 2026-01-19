# CLAUDE.md

Project guidance for Claude Code. Keep this file minimal - detailed docs are in `_bmad-output/`.

## ⚠️ CRITICAL: Workflow Model Requirements

**BEFORE executing these workflows, you MUST spawn them via Task tool with the correct model:**

| Workflow | Model | Why |
|----------|-------|-----|
| `code-review` | `opus` | Comprehensive analysis, finds more issues |
| `create-story` | `haiku` | Template filling, 70% cost savings |
| `sprint-planning` | `haiku` | Simple extraction task |

**How to execute correctly:**
```
Use Task tool:
  subagent_type: "general-purpose"
  model: "opus" (or "haiku" as required)
  prompt: "Execute /bmad:bmm:workflows:code-review for Story X.X"
```

**NEVER execute these workflows directly in your current session. Always use Task tool.**

---

## Project: CoopReady

AI-powered resume optimization for students and career changers.

## Current State

- **Phase**: Implementation
- **Epic 1**: Done (7/7 stories)
- **Epic 8**: In-progress (test infrastructure)
- **Next**: Epic 2 (Onboarding & Profile)

## Quick Commands

```bash
# Story creation (use haiku - 70% cost savings)
/bmad:bmm:workflows:create-story --model haiku

# Development
/bmad:bmm:workflows:dev-story

# Code review (use opus - fewer iterations)
/bmad:bmm:workflows:code-review --model opus

# Session management
/session-start    # Beginning of session
/session-end      # Before ending
```

## Key Files

| Purpose | Location |
|---------|----------|
| Project rules | `_bmad-output/project-context.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Sprint status | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Stories | `_bmad-output/implementation-artifacts/*.md` |

## Tech Stack

Next.js 14 + TypeScript + Tailwind + shadcn/ui + Supabase + OpenAI + Stripe + Vercel

See `project-context.md` for patterns and conventions.

## BMAD Structure

```
_bmad/bmm/           # Workflows and agents
_bmad-output/
├── planning-artifacts/
│   ├── architecture.md      # Index (sharded in architecture/)
│   ├── prd.md
│   └── epics/               # Sharded epic files
├── implementation-artifacts/ # Stories, sprint-status
└── archive/                  # Completed artifacts
```
