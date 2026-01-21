# Test Setup Guide

## Quick Start - Automated E2E Tests for Epics 1-3

### 1. Create Test User in Supabase

**Option A: Using Supabase Dashboard (Easiest)**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" button
3. Enter:
   - Email: `test@example.com`
   - Password: `test123`
4. Make sure to check "Auto Confirm User"
5. Click "Create User"

**Option B: Using SQL (Direct)**
Run this in Supabase SQL Editor:
```sql
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;
```

### 2. Create Test User Profile

After creating the auth user, create their profile:
```sql
INSERT INTO public.user_profiles (
  user_id,
  experience_level,
  target_role,
  onboarding_completed,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'student',
  'Software Engineer',
  true,
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;
```

### 3. Run Automated Tests

```bash
# Run all Epic 1-3 tests (includes all browsers)
npm run test:e2e tests/e2e/epic-1-2-3-full-flow.spec.ts

# Run with one browser only (faster for development)
npm run test:e2e tests/e2e/epic-1-2-3-full-flow.spec.ts -- --project=chromium

# Run in headed mode (see browser)
npm run test:e2e tests/e2e/epic-1-2-3-full-flow.spec.ts -- --headed

# Run specific test
npm run test:e2e tests/e2e/epic-1-2-3-full-flow.spec.ts -- --grep "1.2 - Valid login"
```

## Test Coverage

### Epic 1: Authentication & Layout (8 tests)
- ✅ Login page displays correctly
- ✅ Valid login with test user
- ✅ Invalid email validation
- ✅ Invalid password error
- ✅ Desktop layout
- ✅ Mobile layout
- ✅ Navigation after login
- ✅ Logout functionality

### Epic 2: Onboarding (3 tests)
- ✅ Navigate to onboarding
- ✅ Onboarding form displays
- ✅ Complete onboarding flow

### Epic 3: Resume & Scanning (6 tests)
- ✅ Navigate to scan page
- ✅ Resume upload component
- ✅ Job description input
- ✅ Character counter updates
- ✅ Start Analysis button state
- ✅ Complete scan creation

### Complete Happy Path (1 test)
- ✅ Full journey: Login → Onboarding → Resume Upload → Scan

## Test File Location

```
tests/e2e/epic-1-2-3-full-flow.spec.ts
```

## Credentials

```
Email:    test@example.com
Password: test123
```

## Troubleshooting

### Tests fail with "Invalid email or password"
- Verify test user exists in Supabase
- Check password is exactly: `test123`
- Make sure email is confirmed

### Tests timeout on page load
- Ensure dev server is running: `npm run dev`
- Check that Supabase is connected properly
- Try single browser: `--project=chromium`

### Resume upload test fails
- Test files expected at: `tests/support/fixtures/test-files/`
- Tests handle missing files gracefully

## Running Manual Testing in Parallel

You can also run manual tests alongside automated tests:
1. Open `http://localhost:3000` in browser
2. Login with: `test@example.com` / `test123`
3. Follow manual scenarios in: `_bmad-output/implementation-artifacts/manual-testing-epics-1-2-3.md`
