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

---

## Security Rules

- **NEVER** prefix server-only variables with `NEXT_PUBLIC_`
- **NEVER** commit `.env.local` to git
- **Server variables only** in API routes and server actions
- Check `.env.example` for complete list

