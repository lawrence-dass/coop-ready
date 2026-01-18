# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CoopReady** is an AI-powered resume optimization tool for students and career changers entering tech. The project is currently in the **planning phase** using the BMAD Method framework.

## Current Project State

- **Phase**: Planning (Product Brief complete)
- **Next Steps**: PRD creation, then Architecture, then Epics/Stories
- **Workflow Status**: `_bmad-output/planning-artifacts/bmm-workflow-status.yaml`

## BMAD Method Framework

This project uses BMAD (BMad Methodology) v6.0.0-alpha.23 for AI-assisted development. Key concepts:

### Directory Structure
```
_bmad/
├── bmm/          # BMad Methodology Module - workflows for planning/implementation
├── bmb/          # BMad Builder - tools for creating agents/workflows
├── core/         # Base BMAD functionality
└── _config/      # Configuration files

_bmad-output/
├── planning-artifacts/      # Product briefs, PRDs, architecture docs
└── implementation-artifacts/ # Epics, stories, sprint files
```

### Key Workflows (invoke via slash commands)
- `/bmad:bmm:workflows:prd` - Create/validate/edit PRD
- `/bmad:bmm:workflows:create-architecture` - Technical architecture
- `/bmad:bmm:workflows:create-epics-and-stories` - Break down into stories
- `/bmad:bmm:workflows:dev-story` - Implement a story
- `/bmad:bmm:agents:pm` - Product Manager agent
- `/bmad:bmm:agents:architect` - Architect agent
- `/bmad:bmm:agents:dev` - Developer agent

### Configuration
- Config file: `_bmad/bmm/config.yaml`
- User: Lawrence
- Output folder: `_bmad-output`

## Planned Tech Stack (for MVP implementation)

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: OpenAI API (GPT-4o-mini, text-embedding-3-small)
- **File Storage**: AWS S3
- **Deployment**: Vercel
- **Budget**: $50/month operational cost

## Key Planning Documents

| Document | Location |
|----------|----------|
| Product Brief | `_bmad-output/planning-artifacts/product-brief-CoopReady-2026-01-18.md` |
| Application Idea | `intial_docs/application-idea.md` |
| Workflow Status | `_bmad-output/planning-artifacts/bmm-workflow-status.yaml` |

## Product Context

**Target Users**:
- Students seeking co-ops/internships (no work experience)
- Career changers transitioning to tech
- International students adapting to North American resume style

**Core Features (MVP)**:
1. Experience-level-aware profile (Student/Career Changer)
2. Resume upload (PDF/DOCX) with text extraction
3. Job description input
4. ATS score & analysis (0-100)
5. Before/after bullet point rewrites
6. Transferable skills mapping
7. Accept/reject suggestion workflow
8. Download optimized resume

**Business Model**: Freemium (3 scans/month free, $5/month unlimited)
