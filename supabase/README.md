# Supabase Database Setup

This directory contains Supabase configuration and database migrations for the SubmitSmart project.

## Quick Start

### Local Development

```bash
# Start local Supabase (Postgres + Auth + Storage)
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset local database (applies all migrations)
npx supabase db reset
```

### Migrations

Migrations are located in `/supabase/migrations/` and are applied automatically when running `supabase start` or `supabase db reset`.

To create a new migration:

```bash
npx supabase migration new <description>
```

## Database Schema

### Tables

#### `sessions`
Stores user optimization sessions for both anonymous and authenticated users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| anonymous_id | UUID | Identifier for anonymous users |
| user_id | UUID | Identifier for authenticated users (nullable) |
| resume_content | TEXT | Extracted resume text (nullable) |
| jd_content | TEXT | Job description text (nullable) |
| analysis | JSONB | Keyword analysis results (nullable) |
| suggestions | JSONB | Optimization suggestions (nullable) |
| feedback | JSONB | User feedback on suggestions (nullable) |
| created_at | TIMESTAMP | Auto-set on creation |
| updated_at | TIMESTAMP | Auto-updated on modification |

**Indexes:**
- `idx_sessions_anonymous_id` - Fast lookups by anonymous user
- `idx_sessions_user_id` - Fast lookups by authenticated user
- `idx_sessions_created_at` - Ordering and filtering by date

## Row-Level Security (RLS)

All tables have RLS enabled to enforce data isolation:

- **Anonymous users**: Isolated by `anonymous_id`
- **Authenticated users**: Isolated by `user_id` via `auth.uid()`

Each user can only SELECT, INSERT, UPDATE, and DELETE their own sessions.

## Production Deployment

To deploy migrations to production Supabase project:

1. Link to your Supabase project:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Push migrations:
   ```bash
   npx supabase db push
   ```

## Environment Variables

See `.env.local` (created in Story 1.3) for required Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
