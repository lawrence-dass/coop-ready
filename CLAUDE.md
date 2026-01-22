# CLAUDE.md

Project guidance for Claude Code. Detailed docs in `_bmad-output/`.

## Project: CoopReady

AI-powered resume optimization for students and career changers.

## Current State

- **Phase**: Implementation (7 of 9 epics complete)
- **Done**: Epic 1-6, 8 (38 stories, 150+ tests)
- **Backlog**: Epic 7 (Billing), Epic 9 (AI Refinement)

## Quick Commands

```bash
/bmad:bmm:workflows:create-story   # Create next story
/bmad:bmm:workflows:dev-story      # Implement story
/bmad:bmm:workflows:code-review    # Review code
/session-start                      # Resume work
/session-end                        # Save state
```

## What's Built

Complete user journey: **Upload → Analyze → Suggest → Accept/Reject → Merge → Export → Download**

- Auth, onboarding, profile management
- Resume upload, parsing, ATS scoring
- AI suggestions with accept/reject workflow
- PDF & DOCX export with format selection

## Key Files

| Purpose | Location |
|---------|----------|
| Rules & patterns | `_bmad-output/project-context.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Sprint status | `_bmad-output/implementation-artifacts/sprint-status.yaml` |

## Tech Stack

Next.js 14 · TypeScript · Tailwind · shadcn/ui · Supabase · OpenAI · Stripe · Vercel

## Next Up

| Epic | Stories | Focus |
|------|---------|-------|
| 7 | 6 | Stripe billing, rate limiting, subscriptions |
| 9 | 4 | ATS recalibration, better AI suggestions |

## BMAD Structure

```
_bmad/bmm/           # Workflows, agents
_bmad-output/        # PRD, architecture, stories, sprint-status, archive
```
