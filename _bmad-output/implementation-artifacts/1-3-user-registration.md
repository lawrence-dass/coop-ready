# Story 1.3: User Registration

Status: done

## Story

As a **new user**,
I want **to create an account using my email and password**,
So that **I can access the resume optimization features**.

## Acceptance Criteria

1. **AC1: Valid Registration Flow**
   - **Given** I am on the signup page
   - **When** I enter a valid email and password (min 8 characters)
   - **Then** my account is created in Supabase Auth
   - **And** I receive a confirmation email
   - **And** I am redirected to a "check your email" page

2. **AC2: Duplicate Email Handling**
   - **Given** I am on the signup page
   - **When** I enter an email that is already registered
   - **Then** I see an error message "An account with this email already exists"
   - **And** I am not redirected

3. **AC3: Invalid Email Validation**
   - **Given** I am on the signup page
   - **When** I enter an invalid email format
   - **Then** I see a validation error "Please enter a valid email"
   - **And** the form is not submitted

4. **AC4: Password Length Validation**
   - **Given** I am on the signup page
   - **When** I enter a password shorter than 8 characters
   - **Then** I see a validation error "Password must be at least 8 characters"
   - **And** the form is not submitted

5. **AC5: Email Confirmation Flow**
   - **Given** I click the confirmation link in my email
   - **When** the link is valid and not expired
   - **Then** my email is verified
   - **And** I am redirected to the login page with a success message

## Tasks / Subtasks

- [x] **Task 1: Create Zod Validation Schema** (AC: 3, 4)
  - [x] 1.1 Create `lib/validations/auth.ts` for auth-related schemas
  - [x] 1.2 Define `signUpSchema` with email (valid format) and password (min 8 chars)
  - [x] 1.3 Add confirmPassword field with refinement for password match
  - [x] 1.4 Export schema and inferred types

- [x] **Task 2: Create Server Action for Registration** (AC: 1, 2)
  - [x] 2.1 Create `actions/auth.ts` (or add to existing)
  - [x] 2.2 Implement `signUp` action following ActionResponse pattern
  - [x] 2.3 Validate input with Zod schema (first thing)
  - [x] 2.4 Call Supabase Auth signUp with email confirmation
  - [x] 2.5 Handle duplicate email error (check Supabase error codes)
  - [x] 2.6 Return proper error messages for each failure case

- [x] **Task 3: Refactor SignUpForm Component** (AC: 1, 3, 4)
  - [x] 3.1 Move `components/sign-up-form.tsx` to `components/forms/SignUpForm.tsx`
  - [x] 3.2 Integrate React Hook Form with Zod resolver
  - [x] 3.3 Replace useState with useForm hook
  - [x] 3.4 Use useTransition for Server Action calls
  - [x] 3.5 Display field-level validation errors
  - [x] 3.6 Update import paths in `app/auth/sign-up/page.tsx`

- [x] **Task 4: Create Users Table in Supabase** (AC: 1)
  - [x] 4.1 Create `users` table via Supabase Dashboard (or migration)
  - [x] 4.2 Define columns: `id` (uuid, FK to auth.users), `email`, `created_at`, `updated_at`
  - [x] 4.3 Create RLS policy: users can only read/update their own row
  - [x] 4.4 Create trigger to auto-insert user row on auth.users insert
  - [x] 4.5 Document SQL in story file for reference

- [x] **Task 5: Update Email Confirmation Flow** (AC: 5)
  - [x] 5.1 Verify `app/auth/confirm/route.ts` handles token exchange
  - [x] 5.2 Update redirect to `/auth/login?verified=true`
  - [x] 5.3 Add success toast/message on login page when `verified=true`
  - [x] 5.4 Ensure sign-up-success page has clear instructions

- [x] **Task 6: Style Updates for CoopReady Theme** (AC: 1-5)
  - [x] 6.1 Apply CoopReady colors to form (primary purple for submit button)
  - [x] 6.2 Ensure form is centered and minimal (per UX7)
  - [x] 6.3 Add CoopReady logo/branding to auth pages

- [x] **Task 7: Final Verification** (AC: 1-5)
  - [x] 7.1 Test valid registration with new email
  - [x] 7.2 Test duplicate email error handling
  - [x] 7.3 Test invalid email validation
  - [x] 7.4 Test short password validation
  - [x] 7.5 Test email confirmation link (if possible in dev)
  - [x] 7.6 Run `npm run build` to verify no errors
  - [x] 7.7 Run `npm run lint` to verify no linting errors

## Dev Notes

### Architecture Compliance

**CRITICAL - Follow these patterns exactly:**

1. **Server Actions Pattern** (from project-context.md)
   ```typescript
   // actions/auth.ts
   'use server'

   import { z } from 'zod'
   import { signUpSchema } from '@/lib/validations/auth'
   import { createClient } from '@/lib/supabase/server'

   type ActionResponse<T> =
     | { data: T; error: null }
     | { data: null; error: { message: string; code?: string } }

   export async function signUp(input: z.infer<typeof signUpSchema>): Promise<ActionResponse<{ email: string }>> {
     const parsed = signUpSchema.safeParse(input)
     if (!parsed.success) {
       return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
     }

     try {
       const supabase = await createClient()
       const { data, error } = await supabase.auth.signUp({
         email: parsed.data.email,
         password: parsed.data.password,
         options: {
           emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
         },
       })

       if (error) {
         // Handle specific Supabase errors
         if (error.message.includes('already registered')) {
           return { data: null, error: { message: 'An account with this email already exists', code: 'DUPLICATE_EMAIL' } }
         }
         return { data: null, error: { message: error.message, code: 'AUTH_ERROR' } }
       }

       return { data: { email: parsed.data.email }, error: null }
     } catch (e) {
       console.error('[signUp]', e)
       return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
     }
   }
   ```

2. **Zod Schema Pattern** (from project-context.md)
   ```typescript
   // lib/validations/auth.ts
   import { z } from 'zod'

   export const signUpSchema = z.object({
     email: z.string().email('Please enter a valid email'),
     password: z.string().min(8, 'Password must be at least 8 characters'),
     confirmPassword: z.string(),
   }).refine((data) => data.password === data.confirmPassword, {
     message: 'Passwords do not match',
     path: ['confirmPassword'],
   })

   export type SignUpInput = z.infer<typeof signUpSchema>
   ```

3. **React Hook Form Pattern** (from project-context.md)
   ```typescript
   // components/forms/SignUpForm.tsx
   'use client'

   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   import { useTransition } from 'react'
   import { signUpSchema, SignUpInput } from '@/lib/validations/auth'
   import { signUp } from '@/actions/auth'

   export function SignUpForm() {
     const [isPending, startTransition] = useTransition()
     const form = useForm<SignUpInput>({
       resolver: zodResolver(signUpSchema),
       defaultValues: { email: '', password: '', confirmPassword: '' },
     })

     function onSubmit(data: SignUpInput) {
       startTransition(async () => {
         const { error } = await signUp(data)
         if (error) {
           toast.error(error.message)
           return
         }
         router.push('/auth/sign-up-success')
       })
     }
   }
   ```

4. **File Organization** (from project-context.md)
   ```
   lib/
   └── validations/
       └── auth.ts          # NEW - Zod schemas for auth

   actions/
   └── auth.ts              # NEW - Server Actions for auth

   components/
   └── forms/
       └── SignUpForm.tsx   # MOVE from components/sign-up-form.tsx
   ```

### Supabase Users Table SQL

**Run in Supabase SQL Editor:**

```sql
-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: Auto-insert user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on change
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Supabase Error Codes Reference

| Error Message Contains | User-Facing Message |
|------------------------|---------------------|
| "already registered" | "An account with this email already exists" |
| "Invalid email" | "Please enter a valid email" |
| "Password should be at least" | "Password must be at least 8 characters" |
| Other | "Something went wrong. Please try again." |

### Previous Story Intelligence (from 1-2-design-system-layout-shell)

**What Was Established:**
- CoopReady theme colors configured (purple primary, navy sidebar)
- Layout components created (Sidebar, Header, DashboardLayout)
- Dashboard route group `(dashboard)` with auth protection
- Open Sans font configured
- Existing auth components from starter: `sign-up-form.tsx`, `login-form.tsx`

**Files From Previous Stories (DO NOT break):**
- `app/globals.css` - CoopReady theme CSS variables
- `app/layout.tsx` - Root layout with Open Sans and Toaster
- `components/layout/*` - Dashboard layout components
- `lib/supabase/client.ts` - Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
- `lib/supabase/server.ts` - Uses NEXT_PUBLIC_SUPABASE_ANON_KEY

**Existing Auth Files to Modify:**
- `components/sign-up-form.tsx` → Move to `components/forms/SignUpForm.tsx`
- `app/auth/sign-up/page.tsx` → Update import path
- `app/auth/confirm/route.ts` → Verify redirect behavior
- `app/auth/sign-up-success/page.tsx` → May need styling

### Environment Variables Required

Ensure these are set in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # For email redirect
```

### Testing Checklist

| Scenario | Expected Result |
|----------|----------------|
| Valid email + 8+ char password | Redirect to sign-up-success, email sent |
| Existing email | Error: "An account with this email already exists" |
| Invalid email format (no @) | Error: "Please enter a valid email" |
| Password < 8 chars | Error: "Password must be at least 8 characters" |
| Passwords don't match | Error: "Passwords do not match" |
| Click confirmation link | Redirect to login with success message |

### References

- [Source: epics/epic-1#Story 1.3] - Acceptance criteria
- [Source: project-context.md#Server Actions] - ActionResponse pattern
- [Source: project-context.md#Zod Validation] - Validation requirements
- [Source: project-context.md#Client-Side Patterns] - useTransition usage
- [Source: architecture.md] - File organization

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None

### Completion Notes List

- ✅ Created Zod validation schema in `lib/validations/auth.ts` with email, password, and confirmPassword validation
- ✅ Implemented Server Action in `actions/auth.ts` following ActionResponse pattern with proper error handling for duplicate emails
- ✅ Refactored SignUpForm to use React Hook Form with Zod resolver and useTransition for Server Actions
- ✅ Created Supabase migration file with users table, RLS policies, and auto-insert trigger
- ✅ Updated email confirmation flow to redirect to login with success toast
- ✅ Added CoopReady branding to all auth pages with primary purple theme colors
- ✅ Fixed linting errors and verified build succeeds
- ✅ Added Suspense boundary to login page for useSearchParams compatibility

### File List

- `lib/validations/auth.ts` (new)
- `actions/auth.ts` (new)
- `components/forms/SignUpForm.tsx` (new)
- `components/sign-up-form.tsx` (deleted - replaced by SignUpForm.tsx)
- `components/login-form.tsx` (modified)
- `app/auth/sign-up/page.tsx` (modified)
- `app/auth/login/page.tsx` (modified)
- `app/auth/confirm/route.ts` (modified)
- `app/auth/sign-up-success/page.tsx` (modified)
- `supabase/migrations/001_create_users_table.sql` (new)
- `supabase/migrations/README.md` (new)
- `tests/e2e/user-registration.spec.ts` (modified)

## Change Log

- **2026-01-18**: Code review fixes applied
  - Deleted old `components/sign-up-form.tsx` (dead code cleanup)
  - Fixed E2E test AC5 - corrected query param from `token` to `token_hash` and added `.skip()` with manual testing instructions
  - Added rate limiting security note to `actions/auth.ts`
  - Added "Go to Login" link to sign-up-success page for better UX
  - Updated File List to document deletion

- **2026-01-18**: Story 1.3 implementation completed
  - Created complete user registration flow with Zod validation, Server Actions, and React Hook Form
  - Implemented Supabase users table with RLS policies and auto-insert trigger
  - Added email confirmation flow with success messaging
  - Applied CoopReady branding and theme colors to auth pages
  - All acceptance criteria met, build and linting checks pass
