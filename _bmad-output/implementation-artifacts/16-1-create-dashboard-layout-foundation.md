# Story 16.1: Create Dashboard Layout Foundation

**Status:** ready-for-dev

**Epic:** Epic 16: Dashboard UI Architecture (V0.5)

**Depends On:**
- All V1.0 features implemented (Epics 1-12)
- All V0.5 Hybrid features: Privacy Consent (Epic 15) COMPLETED ✓

---

## Story

As a user,
I want a consistent dashboard layout across all app pages,
So that I can easily navigate between different sections of the application.

---

## Acceptance Criteria

1. **Given** I am authenticated
   **When** I visit any `/app/*` route
   **Then** I see a sidebar navigation on the left (desktop) or hamburger menu (mobile)
   **And** I see a header with the current page title
   **And** the main content area displays the page content
   **And** the sidebar shows navigation links: Dashboard, New Scan, History, Settings
   **And** the sidebar shows a Sign Out button at the bottom
   **And** the active route is highlighted in the sidebar
   **And** on mobile (< 1024px), the sidebar collapses to a hamburger menu
   **And** unauthenticated users are redirected to `/auth/login`

---

## Tasks / Subtasks

- [ ] Set up `/app` route structure (AC: #1)
  - [ ] Create `/app` directory with layout structure
  - [ ] Create `/app/(dashboard)` route group for shared layout
  - [ ] Create `/app/layout.tsx` with Sidebar, Header, and outlet structure
  - [ ] Implement auth protection middleware/redirect in layout
  - [ ] Verify authenticated users can access `/app` routes
  - [ ] Verify unauthenticated users are redirected to `/auth/login`

- [ ] Implement Sidebar component (AC: #1,5,6)
  - [ ] Create `/components/shared/Sidebar.tsx` component
  - [ ] Render navigation links: Dashboard, New Scan, History, Settings
  - [ ] Add Sign Out button at bottom of sidebar
  - [ ] Highlight currently active route (use `usePathname()` from next/navigation)
  - [ ] Style sidebar with purple/indigo theme (#635BFF primary)
  - [ ] Use Tailwind spacing and typography from design system
  - [ ] Responsive width: 256px desktop, hidden mobile
  - [ ] Add keyboard navigation support (Tab through links)
  - [ ] Add aria-labels for accessibility

- [ ] Implement Header component (AC: #1)
  - [ ] Create `/components/shared/Header.tsx` component
  - [ ] Display current page title (extracted from route or passed as prop)
  - [ ] Position: sticky top, full width above main content
  - [ ] Responsive height: 64px on desktop, 56px on mobile
  - [ ] Use subtle background (light gray/white) for contrast
  - [ ] Include hamburger menu button on mobile (triggers MobileNav)
  - [ ] Add responsive spacing and padding

- [ ] Implement MobileNav component for hamburger menu (AC: #6)
  - [ ] Create `/components/shared/MobileNav.tsx` component
  - [ ] Use shadcn/ui Sheet component for drawer
  - [ ] Trigger from Header hamburger button on mobile breakpoint (< 1024px)
  - [ ] Display same navigation links as desktop Sidebar
  - [ ] Close drawer when link is clicked (navigate)
  - [ ] Show Sign Out button in mobile menu
  - [ ] Prevent body scroll when drawer is open

- [ ] Set up placeholder pages for `/app` routes (AC: #1)
  - [ ] Create `/app/(dashboard)/dashboard/page.tsx` (Dashboard home - placeholder)
  - [ ] Create `/app/(dashboard)/scan/new/page.tsx` (New Scan - placeholder)
  - [ ] Create `/app/(dashboard)/history/page.tsx` (History - placeholder)
  - [ ] Create `/app/(dashboard)/settings/page.tsx` (Settings - placeholder)
  - [ ] Each page should render with basic heading and "Coming soon" message
  - [ ] Verify sidebar highlights correct route for each page

- [ ] Add responsive design for desktop/tablet/mobile (AC: #6)
  - [ ] Desktop (≥1024px): Sidebar visible, full layout
  - [ ] Tablet (768px-1023px): Sidebar visible (narrower), header with hamburger
  - [ ] Mobile (<768px): Sidebar hidden, hamburger menu in header
  - [ ] Test breakpoints with Tailwind responsive classes
  - [ ] Verify no horizontal scroll on any breakpoint
  - [ ] Test touch interactions on mobile

- [ ] Implement auth protection in layout (AC: #1)
  - [ ] Check for authenticated user in `/app` layout
  - [ ] Use `getUser()` from `/lib/supabase/server.ts` or existing auth hook
  - [ ] If not authenticated: redirect to `/auth/login`
  - [ ] If authenticated: render dashboard layout
  - [ ] Preserve redirect URL so user returns to intended page after login
  - [ ] Handle loading state during auth check (show skeleton/loader)

- [ ] Create navigation routing logic (AC: #1,5,6)
  - [ ] Set up Link components with correct routes:
    - Dashboard → `/app/dashboard`
    - New Scan → `/app/scan/new`
    - History → `/app/history`
    - Settings → `/app/settings`
  - [ ] Use `usePathname()` to detect active route
  - [ ] Highlight active link with visual indicator (underline, background color)
  - [ ] Implement Sign Out action:
    - Call `/auth/logout` or signOut() from Supabase
    - Redirect to `/auth/login` after logout
  - [ ] Test all navigation links work correctly

- [ ] Add styling and theming (AC: #1)
  - [ ] Use design system colors: Primary purple #635BFF
  - [ ] Sidebar background: Light background or white
  - [ ] Header: Subtle shadow, light background
  - [ ] Links: Default text color, active state with purple highlight
  - [ ] Sign Out button: Destructive variant (red/orange) from shadcn/ui
  - [ ] Typography: Use next/font for consistent fonts
  - [ ] Dark mode support (if design system includes dark mode)
  - [ ] All colors match existing app color scheme

- [ ] Test layout on different screen sizes (AC: #6)
  - [ ] Desktop (1920px, 1440px): Sidebar visible, header visible
  - [ ] Tablet (768px): Sidebar visible but responsive, hamburger shows
  - [ ] Mobile (375px, 414px): Full mobile layout with hamburger
  - [ ] Verify no layout shifts or jank
  - [ ] Test with browser DevTools responsive mode
  - [ ] Test with actual mobile devices if possible

- [ ] Update TypeScript types and interfaces (AC: All)
  - [ ] Create `/types/navigation.ts` with route types if needed
  - [ ] Export route constants from `/types` or `/lib/constants`
  - [ ] Type sidebar navigation items
  - [ ] Ensure no TypeScript errors in layout components

---

## Dev Notes

### Architecture Overview

This story implements the foundational dashboard layout that will be shared across all `/app/*` routes. It's a prerequisite for Stories 16.2-16.7.

**Key Design Decision:** Using Route Groups (`/app/(dashboard)/`) to share a common layout without creating route segments. This keeps the URL clean (`/app/dashboard`, not `/app/(dashboard)/dashboard`).

### Critical Patterns & Constraints

**Auth Protection Pattern** [Source: project-context.md#LLM-Security-Rules]
- Auth check happens in layout (server component)
- Redirect to `/auth/login` if not authenticated
- Use existing auth utilities from `/lib/supabase/server.ts`

**Navigation Pattern**
- Use Next.js `usePathname()` hook for active route detection
- Route constants should be centralized (create `/lib/constants/routes.ts` if needed)
- Link components from next/link (built-in type safety)

**Responsive Design** [Source: architecture/architecture-patterns.md]
- Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Mobile-first approach: Default to mobile layout, add desktop styles with `lg:` prefix
- Use `hidden lg:block` for sidebar, `lg:hidden` for hamburger menu

**Component Architecture**
- Sidebar: Read-only navigation display (no state)
- Header: Minimal header with title and mobile trigger
- MobileNav: Drawer for mobile navigation (Sheet component)
- Layout: Container that arranges all above components

### File Structure & Components to Create

```
/app/
  ├── layout.tsx                          (Main auth + layout)
  └── (dashboard)/
      ├── layout.tsx                      (Shared dashboard layout with sidebar)
      ├── dashboard/
      │   └── page.tsx                   (Dashboard home placeholder)
      ├── scan/
      │   └── new/
      │       └── page.tsx              (New Scan placeholder)
      ├── history/
      │   └── page.tsx                  (History placeholder)
      └── settings/
          └── page.tsx                  (Settings placeholder)

/components/shared/
  ├── Sidebar.tsx                        (Desktop navigation sidebar)
  ├── Header.tsx                         (Page header with title)
  └── MobileNav.tsx                      (Mobile hamburger menu)

/lib/constants/
  └── routes.ts                          (Route definitions and navigation items)
```

### Component Dependencies

- **shadcn/ui Components:**
  - Button (for navigation links and Sign Out)
  - Sheet (for mobile drawer)
  - Icons from lucide-react (Menu, X for hamburger)

- **Next.js Utilities:**
  - `usePathname()` from `next/navigation` (get current route)
  - `useRouter()` from `next/navigation` (client-side navigation)
  - `redirect()` from `next/navigation` (server-side redirects)

- **Supabase Auth:**
  - `getUser()` from `/lib/supabase/server.ts` (get current user in server component)
  - `signOut()` or `/auth/logout` action (sign out user)

### Testing Approach

**Unit Tests** (if needed for components):
- Sidebar renders all navigation items
- Header displays correct page title
- Active route is highlighted correctly
- Mobile nav sheet opens/closes

**Integration Tests** (primary):
- Authenticated user can access `/app/dashboard`
- Unauthenticated user is redirected to `/auth/login`
- Sidebar navigation links work and update active state
- Sign Out button clears auth and redirects to login
- Mobile hamburger menu appears on small screens
- Mobile menu closes after clicking a link

### Previous Story Intelligence

**From Story 15.4 (Privacy Consent Integration Testing):**
- Integration testing patterns: Test complete user flows, not isolated components
- Mock external dependencies: Use Supabase mocks for auth checks
- Test auth transitions: Session state changes when user logs in/out

**From Epic 15 Implementation:**
- Auth protection at layout level works reliably
- Zustand store used for client state (not needed here, but similar pattern)
- Header/footer patterns are consistent with existing UI

### Git Intelligence

Recent commits show consistent patterns:
- Feature branches follow naming: `feature/[epic]-[story]-[title]` ✓ (you created: `feature/16-1-dashboard-layout-foundation`)
- Commit messages use: `feat(story-[num]): [description] (#PR)` format
- PRs merged to main without issues
- Average commit: 2-5 files modified, 100-300 lines changed

This story will likely create:
- 1 layout file (`/app/layout.tsx`)
- 1 dashboard layout (`/app/(dashboard)/layout.tsx`)
- 3 shared components (Sidebar, Header, MobileNav)
- 4 placeholder pages
- 1 route constants file
- Estimated: 5-8 files, 300-500 lines

### Latest Tech Information

**Next.js 16 Navigation:**
- Route groups (parentheses) don't affect URL: `(dashboard)` is hidden in URL ✓
- Layouts nested by folder: Each layout wraps its children automatically ✓
- `usePathname()` works in Client Components to detect active route ✓

**Tailwind 4 with CSS Variables:**
- Responsive prefixes work as before: `hidden lg:block` ✓
- CSS variables can be used for colors: `bg-[var(--primary-color)]` ✓
- No breaking changes from v3 for layout/spacing utilities ✓

**shadcn/ui Latest:**
- Sheet component for mobile drawers: Fully accessible with keyboard support ✓
- Button component: Supports `asChild` prop to wrap Next.js Link ✓
- Icons from lucide-react: Menu, X, LogOut icons available ✓

### Project Context Reference

**ActionResponse Pattern:** Not needed for this story (no server actions)

**Directory Structure:** [Source: project-context.md#Directory-Structure-Rules]
- `/components/shared/` for dashboard layout components ✓
- `/lib/constants/` for route definitions ✓

**Naming Conventions:** [Source: project-context.md#Naming-Conventions]
- Components: PascalCase (Sidebar.tsx, Header.tsx) ✓
- Routes: kebab-case in URLs (`/app/new-scan` not `/app/newScan`) - BUT wait, Story 16.3 uses `/app/scan/new` (not kebab-case for "new"). Verify with Story 16 epic requirements. Current: Using `/app/scan/new`, `/app/history`, `/app/settings` as per epic definition.

**Auth Pattern:** Use existing Supabase auth utilities from `/lib/supabase/server.ts`

---

## Implementation Checklist

### Pre-Dev Verification
- [ ] Current branch is `feature/16-1-dashboard-layout-foundation`
- [ ] Pull latest main to ensure no conflicts
- [ ] Verify TypeScript compiles: `npm run build`
- [ ] Verify tests pass: `npm run test:all`

### Post-Implementation
- [ ] All TypeScript errors resolved: `npm run build` passes
- [ ] All acceptance criteria verified (manual testing or automated tests)
- [ ] New components added to Storybook if applicable
- [ ] Updated documentation if new patterns introduced
- [ ] Code follows project conventions: naming, file structure, styling

### Before Code Review
- [ ] Create comprehensive test suite for layout components
- [ ] Test responsive design across breakpoints
- [ ] Test auth protection and redirects
- [ ] Test Sign Out flow
- [ ] Verify no visual regressions

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Debug Log References

None yet - ready for dev-story workflow

### Completion Notes

- Story created with comprehensive context for developer
- All patterns documented with source references
- Route structure clearly defined
- Component architecture specified
- Testing approach outlined

### File List

_To be populated after implementation_

---

## Questions for Clarification (Save for Review)

1. **Auth middleware:** Should auth protection be in `/app/layout.tsx` or `/app/(dashboard)/layout.tsx`? (Recommend: `/app/layout.tsx` to protect all `/app` routes)

2. **Route naming:** Story 16.3 uses `/app/scan/new`. Should `/app/scan/[sessionId]` be a catch-all or explicit route? (Epic shows `[sessionId]` suggesting dynamic route)

3. **Mobile navigation:** Should mobile menu persist a "current user" email/name display? (Recommend: Yes, in menu header for consistency with desktop)

4. **Sign Out action:** Should it be a Server Action or API route? (Recommend: Use existing auth sign-out mechanism from previous epics)

5. **Route constants:** Should route definitions be in `/lib/constants/routes.ts` or `/lib/navigation.ts`? (Recommend: Create `/lib/constants/routes.ts` for consistency)

---
