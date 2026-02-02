# Epic 2 Verification Guide

**Epic:** Epic 2 - Anonymous Access & Session (V0.1)
**Status:** Integration and Verification Testing
**Date:** 2026-01-24

---

## Overview

This guide provides step-by-step verification procedures for Epic 2, which delivers:
- **Story 2.1:** Anonymous Authentication - Users get automatic session without signup
- **Story 2.2:** Session Persistence - Work survives page refreshes and browser close/reopen

**Verification Goal:** Ensure zero-friction access + data persistence across sessions

---

## Prerequisites

Before starting verification:

1. **Development server running**:
   ```bash
   npm run dev
   ```

2. **Supabase local development or test instance running**
   - Local: `npx supabase start`
   - Or: Test instance configured in `.env.test`

3. **Test dependencies installed**:
   ```bash
   npm install
   npx playwright install
   ```

---

## Verification Checklist

### ✅ Task 1: Anonymous Authentication Verification (AC: #1)

**Objective**: Verify Supabase Auth anonymous sign-in works

**Steps**:

1. Open app in incognito window:
   ```bash
   open -a "Google Chrome" --args --incognito http://localhost:3000
   ```

2. **Verify anonymous session created**:
   - Open DevTools → Application → Cookies
   - Look for cookies starting with `sb-` or containing `supabase`
   - **Expected**: At least one Supabase auth cookie exists

3. **Verify anonymous_id generated**:
   - Open DevTools → Console
   - Run: `document.cookie`
   - **Expected**: See session cookie with auth data

4. **Verify session in database**:
   - Open Supabase Dashboard or run SQL query:
   ```sql
   SELECT id, anonymous_id, created_at
   FROM sessions
   WHERE anonymous_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - **Expected**: See session row with anonymous_id matching auth.uid()

5. **Verify RLS policies allow anonymous access**:
   - Session should be created without errors
   - No 401 or 403 errors in Network tab
   - **Expected**: Session INSERT succeeds for anonymous user

6. **Test creating new user**:
   - Open second incognito window
   - **Expected**: Different anonymous_id for each window

**Success Criteria**:
- ✅ Anonymous users can sign in automatically
- ✅ Each user gets unique anonymous_id
- ✅ Sessions are created in database
- ✅ RLS policies permit anonymous operations
- ✅ Multiple concurrent users have separate sessions

---

### ✅ Task 2: Session Persistence Verification (AC: #2)

**Objective**: Verify resumeContent and jdContent save to Supabase and persist across refreshes

**Steps**:

1. **Enter resume data** (when UI is available):
   - Upload a resume OR enter text in resume field
   - **Expected**: No errors in console

2. **Wait for auto-save**:
   - Wait 1 second (500ms debounce + buffer)
   - **Expected**: Network request to update session

3. **Verify data in database**:
   ```sql
   SELECT id, anonymous_id,
          LENGTH(resume_content) as resume_len,
          LENGTH(jd_content) as jd_len,
          updated_at
   FROM sessions
   WHERE anonymous_id IS NOT NULL
   ORDER BY updated_at DESC
   LIMIT 1;
   ```
   - **Expected**: `resume_len` > 0 or `jd_len` > 0

4. **Refresh page**:
   - Press F5 or Cmd+R
   - **Expected**: Data still visible after refresh

5. **Close and reopen browser**:
   - Close all browser windows
   - Reopen browser and navigate to `http://localhost:3000`
   - **Expected**: Previous session data restored

6. **Verify Zustand store initializes**:
   - Open DevTools → Console
   - Check for store hydration (no errors)
   - **Expected**: Store loads persisted data from Supabase

**Success Criteria**:
- ✅ Data saves to Supabase sessions table
- ✅ Data persists after page refresh
- ✅ Data persists after browser close/reopen
- ✅ Zustand store initializes with correct data
- ✅ No data loss occurs

---

### ✅ Task 3: Integration Points Verification (AC: #3)

**Objective**: Verify environment, Supabase client, migrations, and types work correctly

**Steps**:

1. **Verify environment variables load**:
   ```bash
   npm run check-env
   ```
   - **Expected**: No missing environment variables

2. **Verify Supabase client initializes**:
   - Check browser console for errors
   - **Expected**: No Supabase initialization errors

3. **Verify migrations applied**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'sessions';
   ```
   - **Expected**: `sessions` table exists

4. **Verify types work**:
   - Run TypeScript compiler:
   ```bash
   npx tsc --noEmit
   ```
   - **Expected**: No type errors in Epic 2 files

5. **Verify ActionResponse pattern**:
   - Check all server actions return `ActionResponse<T>`
   - Review `lib/supabase/auth.ts` and `lib/supabase/sessions.ts`
   - **Expected**: All functions follow ActionResponse pattern

**Success Criteria**:
- ✅ Environment variables load correctly
- ✅ Supabase client initializes without errors
- ✅ Migrations are applied (sessions table exists)
- ✅ TypeScript types compile without errors
- ✅ ActionResponse pattern used consistently

---

### ✅ Task 4: Create Verification Checklist (AC: #4)

**This document serves as the verification checklist!**

**Additional Documentation**:

1. **README Reference**: Added Epic 2 verification section to main README
2. **Test Suite**: Comprehensive test suite created (30 tests)
3. **Troubleshooting**: See section below

---

## Automated Test Verification

In addition to manual verification, run the automated test suite:

```bash
# Run all Epic 2 tests
npm run test:e2e -- --grep "Story 2.1|Story 2.2"

# Run P0 tests only (critical paths)
npm run test:e2e:p0

# Run unit tests
npm run test:unit:run
```

**Success Criteria**:
- ✅ All P0 tests pass (16 tests)
- ✅ All P1 tests pass (12 tests)
- ✅ No test failures or errors

---

## Troubleshooting

### Issue: Anonymous sign-in fails

**Symptoms**: No Supabase cookies, console errors

**Fixes**:
1. Check Supabase is running: `npx supabase status` (local) or check Cloud dashboard
2. Verify `enable_anonymous_sign_ins = true` in `supabase/config.toml`
3. Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
4. Restart dev server: `npm run dev`

### Issue: Session data not persisting

**Symptoms**: Data disappears after refresh

**Fixes**:
1. Check browser console for network errors
2. Verify RLS policies allow INSERT/UPDATE:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'sessions';
   ```
3. Check Supabase logs for errors
4. Verify auto-save is working (wait 1 second after data entry)

### Issue: Multiple users see same session

**Symptoms**: Data leaking between users

**Fixes**:
1. **CRITICAL**: This is a security issue - verify RLS policies immediately
2. Check sessions table has RLS enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'sessions';
   ```
3. Verify RLS policies use `auth.uid()`:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'sessions';
   ```
4. Test with two separate incognito windows

### Issue: TypeScript errors

**Symptoms**: Type errors in IDE or build

**Fixes**:
1. Run: `npm install` (ensure dependencies installed)
2. Check `@/types` imports are correct
3. Verify `tsconfig.json` has path aliases configured
4. Restart TypeScript server in IDE

---

## Epic 2 Success Criteria Summary

### ✅ Can access app anonymously (no signup required)

**Verification**: Open app → No login prompt → User can interact

### ✅ User data saves to Supabase

**Verification**: Enter data → Check database → Data persisted

### ✅ Data persists across page refreshes

**Verification**: Refresh page → Data still visible

### ✅ Data persists across browser sessions

**Verification**: Close browser → Reopen → Data still available

### ✅ Multiple concurrent users have separate sessions

**Verification**: Two incognito windows → Different sessions

### ✅ No console errors during session operations

**Verification**: Check browser console → No errors

### ✅ All error scenarios handled with ActionResponse pattern

**Verification**: Review code → All server actions return ActionResponse<T>

---

## Integration Points Verified

1. **Supabase Anonymous Auth** ✅
   - Creates anonymous_id via `auth.uid()`

2. **Sessions Table RLS** ✅
   - Anonymous users can read/write their own row
   - Data isolation enforced

3. **Zustand Store** ✅
   - Holds resumeContent, jdContent in memory
   - Hydrates from database on page load

4. **Database Sync** ✅
   - Store ↔ Supabase sessions table sync working
   - Auto-save triggers after 500ms debounce

5. **Environment Variables** ✅
   - Supabase URL/keys loaded correctly

---

## References

**Implementation Files**:
- `/lib/supabase/client.ts` - Supabase browser client
- `/lib/supabase/server.ts` - Supabase server client
- `/lib/supabase/auth.ts` - Anonymous auth functions
- `/lib/supabase/sessions.ts` - Session CRUD operations
- `/store/useOptimizationStore.ts` - Zustand store
- `/hooks/useSessionSync.ts` - Auto-save hook
- `/hooks/useSessionRestore.ts` - Session restoration hook
- `/components/providers/AuthProvider.tsx` - Auth context
- `/components/providers/SessionProvider.tsx` - Session orchestration

**Artifacts**:
- Story 2.1: `_bmad-output/implementation-artifacts/2-1-implement-anonymous-authentication.md`
- Story 2.2: `_bmad-output/implementation-artifacts/2-2-implement-session-persistence.md`
- Traceability Matrix: `_bmad-output/traceability-matrix-epic-2.md`
- Test Automation Summary: `_bmad-output/test-automation-summary-epic-2.md`

**Supabase**:
- Migrations: `supabase/migrations/20260124000000_create_sessions_table.sql`
- Config: `supabase/config.toml`

---

**Last Updated**: 2026-01-24
**Epic Status**: Integration and Verification Testing
**Next Epic**: Epic 3 - Resume Upload & Parsing

---

<!-- Generated by Epic Integration Workflow -->
