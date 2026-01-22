# CLAUDE.md

Project guidance for Claude Code. Keep this file minimal - detailed docs are in `_bmad-output/`.

## Project: CoopReady

AI-powered resume optimization for students and career changers.

## Current State

- **Phase**: Implementation
- **Done**: Epic 1, 2, 3, 4, 8
- **In-progress**: Epic 5 (Suggestions) - Story 5-9 ready-for-dev
- **Backlog**: Epic 6, 7

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
