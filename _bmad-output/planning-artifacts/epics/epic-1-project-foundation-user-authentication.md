# Epic 1: Project Foundation & User Authentication

Users can create accounts, sign in, and access the protected dashboard with a complete authentication system.

## Story 1.1: Project Initialization

As a **developer**,
I want **the project initialized with Next.js 14, Supabase, and all required dependencies**,
So that **I have a working foundation to build the application on**.

**Acceptance Criteria:**

**Given** the project does not exist
**When** I run the initialization command `npx create-next-app -e with-supabase coopready`
**Then** a new Next.js 14 project is created with App Router
**And** Supabase auth is pre-configured with middleware
**And** TypeScript strict mode is enabled

**Given** the project is initialized
**When** I install additional dependencies (stripe, openai, pdf-parse, mammoth, @react-pdf/renderer, docx, zod, react-hook-form)
**Then** all packages are added to package.json
**And** the project builds without errors

**Given** the project has dependencies installed
**When** I create the `.env.local` file with Supabase credentials
**Then** environment variables are loaded correctly
**And** Supabase client can connect to the database

**Given** the project structure exists
**When** I run `npx shadcn@latest init`
**Then** shadcn/ui is configured with Tailwind CSS
**And** the `components/ui/` directory is created

**Technical Notes:**
- Follow AR1-AR5 from Architecture
- Create `.env.example` with placeholder values
- Verify Supabase connection works in development

---

## Story 1.2: Design System & Layout Shell

As a **user**,
I want **a consistent, professional-looking interface**,
So that **I feel confident using the application**.

**Acceptance Criteria:**

**Given** shadcn/ui is initialized
**When** I configure the Tailwind theme
**Then** the primary color is purple/violet (#7266ba)
**And** the sidebar color is dark navy (#2f3e4e)
**And** accent colors (teal, yellow, green) are defined
**And** background is light gray (#f0f3f4)

**Given** the theme is configured
**When** I create the dashboard layout component
**Then** a left sidebar navigation is rendered (collapsible)
**And** the main content area uses card-based layout
**And** the layout is responsive (mobile-first)

**Given** the layout exists
**When** I view it on mobile (<768px)
**Then** the sidebar collapses to a hamburger menu
**And** content remains accessible and readable

**Given** the layout exists
**When** I view it on desktop (>1024px)
**Then** the sidebar is expanded by default
**And** the layout uses the full width appropriately

**Technical Notes:**
- Follow UX1-UX10 from design screenshots
- Use Open Sans or similar sans-serif font
- Implement with Tailwind CSS breakpoints
- Create `components/layout/Sidebar.tsx`, `Header.tsx`, `DashboardLayout.tsx`

---

## Story 1.3: User Registration

As a **new user**,
I want **to create an account using my email and password**,
So that **I can access the resume optimization features**.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter a valid email and password (min 8 characters)
**Then** my account is created in Supabase Auth
**And** I receive a confirmation email
**And** I am redirected to a "check your email" page

**Given** I am on the signup page
**When** I enter an email that is already registered
**Then** I see an error message "An account with this email already exists"
**And** I am not redirected

**Given** I am on the signup page
**When** I enter an invalid email format
**Then** I see a validation error "Please enter a valid email"
**And** the form is not submitted

**Given** I am on the signup page
**When** I enter a password shorter than 8 characters
**Then** I see a validation error "Password must be at least 8 characters"
**And** the form is not submitted

**Given** I click the confirmation link in my email
**When** the link is valid and not expired
**Then** my email is verified
**And** I am redirected to the login page with a success message

**Technical Notes:**
- Create `app/(auth)/signup/page.tsx`
- Use Zod schema for validation (AR7)
- Follow ActionResponse pattern (AR6)
- Create `users` table in Supabase with RLS policies
- Style login form per UX7 (centered, minimal)

---

## Story 1.4: User Login

As a **registered user**,
I want **to log in to my account**,
So that **I can access my personalized dashboard**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter valid credentials (email + password)
**Then** I am authenticated via Supabase
**And** a session cookie is set
**And** I am redirected to the dashboard

**Given** I am on the login page
**When** I enter an incorrect password
**Then** I see an error message "Invalid email or password"
**And** I remain on the login page

**Given** I am on the login page
**When** I enter an email that doesn't exist
**Then** I see an error message "Invalid email or password"
**And** the error does not reveal whether the email exists (security)

**Given** I am logged in
**When** I close the browser and return later
**Then** my session is still active (cookie-based)
**And** I am taken directly to the dashboard

**Technical Notes:**
- Create `app/(auth)/login/page.tsx`
- Use `@supabase/ssr` for session management
- Follow UX7 design (clean login form)
- Include "Forgot password?" link
- Include "Don't have an account? Sign up" link

---

## Story 1.5: User Logout

As a **logged-in user**,
I want **to log out of my account**,
So that **my session is securely ended**.

**Acceptance Criteria:**

**Given** I am logged in and on any protected page
**When** I click the "Log out" button in the user menu
**Then** my session is invalidated
**And** the session cookie is cleared
**And** I am redirected to the login page

**Given** I have logged out
**When** I try to access a protected route directly via URL
**Then** I am redirected to the login page
**And** I cannot access protected content

**Given** I have logged out
**When** I use the browser back button
**Then** I cannot access cached protected pages
**And** I am redirected to login if I try

**Technical Notes:**
- Add logout action to `actions/auth.ts`
- Add "Log out" option to `components/layout/UserMenu.tsx`
- Use Server Action for logout (not client-side only)

---

## Story 1.6: Password Reset

As a **user who forgot my password**,
I want **to reset it via email**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Forgot password?"
**Then** I am taken to the password reset request page

**Given** I am on the password reset request page
**When** I enter my registered email and submit
**Then** a password reset email is sent
**And** I see a message "Check your email for reset instructions"

**Given** I am on the password reset request page
**When** I enter an email that is not registered
**Then** I still see "Check your email for reset instructions"
**And** no email is sent (prevents email enumeration)

**Given** I receive a password reset email
**When** I click the reset link within 1 hour
**Then** I am taken to the password reset form

**Given** I am on the password reset form
**When** I enter a new password (min 8 characters) and confirm it
**Then** my password is updated
**And** I am redirected to login with a success message

**Given** I click a password reset link
**When** the link is expired (>1 hour old)
**Then** I see an error "This reset link has expired"
**And** I can request a new reset email

**Technical Notes:**
- Create `app/(auth)/forgot-password/page.tsx`
- Create `app/(auth)/reset-password/page.tsx`
- Use Supabase Auth password reset flow
- Follow security best practices (no email enumeration)

---

## Story 1.7: Protected Dashboard Route

As a **logged-in user**,
I want **to access a protected dashboard**,
So that **I can see my personalized content securely**.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to `/dashboard`
**Then** I see the dashboard page with my user info
**And** the sidebar navigation is visible
**And** a welcome message displays my email

**Given** I am not authenticated
**When** I try to access `/dashboard` directly
**Then** I am redirected to `/login`
**And** the original URL is preserved for post-login redirect

**Given** I am not authenticated
**When** I try to access any route under `/(dashboard)/*`
**Then** I am redirected to `/login`

**Given** I am authenticated and on the dashboard
**When** I view the user menu
**Then** I see my email address
**And** I see a "Log out" option
**And** I see a "Settings" option

**Given** I am authenticated
**When** my session expires while I'm on a protected page
**Then** I am redirected to login on my next action
**And** I see a message "Your session has expired"

**Technical Notes:**
- Create `app/(dashboard)/layout.tsx` with auth check
- Create `app/(dashboard)/dashboard/page.tsx`
- Use middleware for route protection (AR13)
- Implement redirect preservation (return to original URL after login)

---
