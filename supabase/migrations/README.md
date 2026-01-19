# Supabase Migrations

This directory contains SQL migrations for the CoopReady database.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste and run the SQL

### Option 2: Supabase CLI (Recommended for Production)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Migration Files

- `001_create_users_table.sql` - Creates the users table with RLS and triggers (Story 1.3)

## Important Notes

- Migrations should be run in numerical order
- Always test migrations in a development environment first
- RLS policies ensure users can only access their own data
- The `handle_new_user()` trigger automatically creates a user record when someone signs up
