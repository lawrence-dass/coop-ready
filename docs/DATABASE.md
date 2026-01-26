# Database Migrations Guide

See main guide: [CLAUDE.md](../CLAUDE.md)

---

## Migrations

**Location:** `supabase/migrations/`

**Naming:** `YYYYMMDDHHMMSS_description.sql`

---

## Commands

```bash
# Apply migrations locally
npx supabase migration up

# Create new migration
npx supabase migration new migration_name
```

---

## Important Rules

- **Always include RLS policies** with new tables
- **Transform at API boundaries:** Database snake_case → TypeScript camelCase
- **Use Row-Level Security** for user data isolation via anonymous_id

---

## Schema Pattern

```sql
-- Example sessions table
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY,
  anonymous_id UUID NOT NULL,
  resume_content TEXT,
  jd_content TEXT,
  analysis JSONB,
  suggestions JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- RLS policy for anonymous_id isolation
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sessions"
  ON sessions
  USING (auth.uid() = anonymous_id OR anonymous_id IS NOT NULL)
  WITH CHECK (auth.uid() = anonymous_id OR anonymous_id IS NOT NULL);
```

