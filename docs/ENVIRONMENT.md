# Environment Variables Guide

See main guide: [CLAUDE.md](../CLAUDE.md)

---

## Configuration

**Required:** See `.env.example`

**Validate configuration:**
```bash
npm run check-env
```

---

## Key Variables

| Variable | Purpose | Required | Visibility |
|----------|---------|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | ✅ | Server-only |
| `ANTHROPIC_API_KEY` | Claude API key | ✅ | Server-only |
| `LLM_TIER` | Model quality tier | ❌ | Server-only |

---

## LLM Model Tier

Control which Claude models are used for suggestion generation:

| Value | Suggestion Model | Judge Model | Cost | Use Case |
|-------|-----------------|-------------|------|----------|
| `development` | Haiku | Haiku | ~$0.01-0.02 | Local dev, testing |
| `production` | Sonnet | Haiku | ~$0.08-0.12 | Production, quality |

**Default:** `development` (cost-safe)

```bash
# .env.local (development - cheaper)
LLM_TIER=development

# .env.production (production - better quality)
LLM_TIER=production
```

---

## Security Rules

- **NEVER** prefix server-only variables with `NEXT_PUBLIC_`
- **NEVER** commit `.env.local` to git
- **Server variables only** in API routes and server actions
- Check `.env.example` for complete list

