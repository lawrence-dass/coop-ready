# CLAUDE.md

Project guidance for Claude Code. Keep this file minimal - detailed docs are in `_bmad-output/`.

## Project: CoopReady

AI-powered resume optimization for students and career changers.

## Current State

- **Phase**: Implementation (6 of 9 epics complete)
- **Done**: Epic 1, 2, 3, 4, 5, 6, 8 (42 stories)
- **Ready for dev**: Epic 7 (Subscription & Billing) or Epic 9 (Logic Refinement)
- **Backlog**: Epic 7, 9

## Quick Commands

```bash
# Story creation (use haiku - 70% cost savings)
/bmad:bmm:workflows:create-story --model haiku

# Development (use sonnet - best balance for complex tasks)
/bmad:bmm:workflows:dev-story --model sonnet

# Code review (use opus - comprehensive analysis)
/bmad:bmm:workflows:code-review --model opus

# Session management
/session-start    # Beginning of session
/session-end      # Before ending
```

## Completed Features (Epic 1-6)

✅ User authentication, onboarding, profile management
✅ Resume upload, parsing, ATS analysis with scoring
✅ Smart suggestions (bullets, skills, removal flags)
✅ Suggestion review and acceptance workflow
✅ Resume export: PDF (ATS-friendly) and DOCX (editable)

**Current**: Complete user journey from upload → optimize → export → download (150+ tests)

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

## Next: Epic 7 or Epic 9

- **Epic 7** (6 stories): Stripe, billing, rate limiting, subscriptions
- **Epic 9** (4 stories): ATS recalibration, better suggestions, natural writing

**Session Context**: `.claude/handoff/CURRENT.md` - Latest handoff notes and epic status
