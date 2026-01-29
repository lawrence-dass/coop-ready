# SubmitSmart V0.5 Hybrid + Dashboard Plan

## Overview

This document outlines the V0.5 release plan, which includes hybrid preferences, explanation output, privacy consent, and a complete dashboard UI architecture transformation.

**Total V0.5 Stories:** 21 stories across 4 epics

---

## Epic Summary

| Epic | Title | Stories | Focus |
|------|-------|---------|-------|
| 13 | Hybrid Preferences | 5 | Job Type, Modification Level |
| 14 | Explanation Output | 4 | "Why this works" explanations |
| 15 | Privacy Consent | 4 | Data usage disclosure |
| 16 | Dashboard UI Architecture | 8 | Multi-route navigation |

---

## Epic 13: Hybrid Preferences

**Goal:** Add structural controls (Job Type, Modification Level) to complement existing style preferences.

### Stories

| Story | Title | Description |
|-------|-------|-------------|
| 13-1 | Add Job Type and Modification Level Types | Type definitions for new preferences |
| 13-2 | Add Preferences Database Migration | Schema updates for new fields |
| 13-3 | Update Preferences Dialog UI | Radio buttons for Job Type and Modification Level |
| 13-4 | Add Prompt Templates | LLM prompt injection for new preferences |
| 13-5 | Integration Testing | End-to-end verification |

### Job Type Options
- **Co-op/Internship**: Learning-focused language ("Contributed to...", "Developed...")
- **Full-time**: Impact-focused language ("Led...", "Drove...", "Owned...")

### Modification Level Options
- **Conservative (15-25%)**: Keyword additions only, minimal changes
- **Moderate (35-50%)**: Restructure for impact
- **Aggressive (60-75%)**: Full rewrite

---

## Epic 14: Explanation Output

**Goal:** Provide "Why this works" explanations for each suggestion.

### Stories

| Story | Title | Description |
|-------|-------|-------------|
| 14-1 | Add Explanation Types and Schema | Optional `explanation` field on suggestions |
| 14-2 | Update LLM Prompts for Explanations | Request explanations in prompts |
| 14-3 | Render Explanations in UI | Display with light blue background, icon |
| 14-4 | Integration Testing | Verify explanations reference JD keywords |

### Example Explanation
> "This change highlights your React experience, which is listed as a 'must-have' skill in the job description, and adds quantifiable impact metrics."

---

## Epic 15: Privacy Consent

**Goal:** Ensure users accept privacy disclosure before uploading resumes.

### Stories

| Story | Title | Description |
|-------|-------|-------------|
| 15-1 | Add Privacy Consent Database Columns | `privacy_accepted`, `privacy_accepted_at` |
| 15-2 | Create Privacy Consent Dialog | Disclosure with checkbox and accept button |
| 15-3 | Gate Uploads Until Consent Accepted | Block uploads until consent given |
| 15-4 | Integration Testing | Verify all user types see consent flow |

### Consent Dialog Content
- Resume processed using AI services (Anthropic Claude)
- Data stored securely in user account
- Data not used to train AI models
- User can delete data at any time
- Links to Privacy Policy and Terms of Service

---

## Epic 16: Dashboard UI Architecture

**Goal:** Transform from single-page app to multi-route dashboard SaaS.

### Route Structure

```
/                           → Marketing landing page (public)
/app                        → Redirect to /app/dashboard
/app/dashboard              → Dashboard home (overview, recent scans, quick actions)
/app/scan/new               → New scan page (upload resume + enter JD)
/app/scan/[sessionId]       → Scan results (ATS score, breakdowns, keyword analysis)
/app/scan/[sessionId]/suggestions → Suggestions view (section-by-section improvements)
/app/history                → Scan history (list of past sessions)
/app/settings               → User settings (preferences, profile)
/app/onboarding             → First-time user wizard (if not completed)
/auth/*                     → Keep existing auth routes
```

### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] SubmitSmart                    [User] [Settings] [?] │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Dashboard │   [Page Content Area]                           │
│  New Scan  │                                                 │
│  History   │                                                 │
│  Settings  │                                                 │
│            │                                                 │
│            │                                                 │
│ ────────── │                                                 │
│  [Sign Out]│                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

### Stories

| Story | Title | Description |
|-------|-------|-------------|
| 16-1 | Create Dashboard Layout Foundation | Sidebar, Header, MobileNav, auth protection |
| 16-2 | Implement Dashboard Home Page | Welcome, quick actions, recent scans |
| 16-3 | Implement New Scan Page | Resume upload, JD input, V0.5 config |
| 16-4 | Implement Scan Results Page | ATS score, breakdown, keyword analysis |
| 16-5 | Implement Suggestions Page | Section tabs, explanations, score comparison |
| 16-6 | Migrate History and Settings | Move to /app/* routes |
| 16-7 | Create Full Marketing Landing Page | Hero, features, how it works, CTA |
| 16-8 | Integration Testing | Complete flow verification |

---

## File Structure Changes

### New Files

```
app/
├── page.tsx                          # Landing page (modify existing)
├── (dashboard)/
│   ├── layout.tsx                    # Dashboard layout with sidebar
│   ├── app/
│   │   ├── page.tsx                  # Redirect to /app/dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard home
│   │   ├── scan/
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # New scan page
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx          # Scan results
│   │   │       └── suggestions/
│   │   │           └── page.tsx      # Suggestions view
│   │   ├── history/
│   │   │   └── page.tsx              # History (move from /history)
│   │   ├── settings/
│   │   │   └── page.tsx              # Settings page
│   │   └── onboarding/
│   │       └── page.tsx              # Onboarding (move from /auth)

components/
├── layout/
│   ├── index.ts                      # Barrel export
│   ├── Sidebar.tsx                   # Sidebar navigation
│   ├── Header.tsx                    # Top header
│   └── MobileNav.tsx                 # Mobile navigation
├── dashboard/
│   ├── WelcomeCard.tsx               # Welcome widget
│   ├── RecentScansWidget.tsx         # Recent scans list
│   └── QuickActionsCard.tsx          # Quick action buttons
```

### Modified Files

```
app/page.tsx                          # Convert to landing page
store/useOptimizationStore.ts         # Add startNewScan action
components/shared/SignOutButton.tsx   # Accept variant/className props
hooks/useSessionRestore.ts            # Adapt for URL-based sessionId
```

### Deprecated/Removed

```
app/history/                          # Move to /app/history
app/history/[sessionId]/              # Merge into /app/scan/[sessionId]
```

---

## Implementation Phases

### Phase 1: Layout Foundation (Story 16-1)
1. Create `app/(dashboard)/layout.tsx` with sidebar/header
2. Create `components/layout/Sidebar.tsx`, `Header.tsx`, `MobileNav.tsx`
3. Add Sheet component for mobile drawer
4. Add auth protection to dashboard layout
5. Test layout with placeholder dashboard page

### Phase 2: Dashboard & Routing (Stories 16-2, 16-7)
1. Create `/app/dashboard` page with widgets
2. Convert `/` to landing page
3. Set up route guards for authentication
4. Add redirect from `/app` to `/app/dashboard`

### Phase 3: Scan Flow Pages (Stories 16-3, 16-4, 16-5)
1. Create `/app/scan/new` (extract from current home)
2. Create `/app/scan/[sessionId]` (results page)
3. Create `/app/scan/[sessionId]/suggestions` (suggestions page)
4. Adapt store for URL-based session loading
5. Add `startNewScan()` action to clear state

### Phase 4: Supporting Pages (Story 16-6)
1. Move history to `/app/history`
2. Create `/app/settings` (extract PreferencesDialog content)
3. Add redirects from old routes
4. Move onboarding to `/app/onboarding`

### Phase 5: Integration & Polish (Story 16-8)
1. Test complete user journeys
2. Verify mobile navigation
3. Test deep linking and browser navigation
4. Performance testing

---

## State Management Approach

### Keep Existing (Minimal Changes)
- **Zustand store** remains central state container
- **useSessionSync** continues auto-saving to database
- **useSessionRestore** adapts to work with URL-based sessionId

### Add URL-Based Session Routing
```typescript
// Pattern for session-specific pages
const params = useParams();
const sessionId = params.sessionId as string;

useEffect(() => {
  if (sessionId && sessionId !== currentSessionId) {
    // Load session from DB into store
    loadSession(sessionId);
  }
}, [sessionId]);
```

### New Store Additions
```typescript
interface StoreAdditions {
  // Clear for new scan
  startNewScan: () => void;
}
```

---

## V0.5 Integration Points

| V0.5 Feature | Integration Point |
|--------------|-------------------|
| Job Type preference | `/app/scan/new` config section |
| Modification Level | `/app/scan/new` config section |
| Explanations | `/app/scan/[sessionId]/suggestions` per-suggestion |
| Privacy Consent | Modal on first `/app/scan/new` visit |
| Settings page | `/app/settings` for all preferences |

---

## Verification Checklist

### Epic 16 Acceptance Criteria

- [ ] Landing page displays correctly for unauthenticated users
- [ ] Authenticated users redirect from `/` to `/app/dashboard`
- [ ] Dashboard shows welcome message and quick actions
- [ ] New scan flow: `/app/scan/new` → analysis → `/app/scan/[sessionId]`
- [ ] Suggestions flow: results page → `/app/scan/[sessionId]/suggestions`
- [ ] History flow: `/app/history` → click session → `/app/scan/[sessionId]`
- [ ] Settings flow: preferences save and persist
- [ ] Mobile navigation works (hamburger menu, drawer)
- [ ] Browser back/forward navigation works correctly
- [ ] Deep linking to `/app/scan/[sessionId]` loads session from DB
- [ ] Page refresh maintains state at each step
- [ ] Old `/history` routes redirect to new routes
- [ ] No regression in existing functionality

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Release Scope | Part of V0.5 (Epic 16) | Bundle with other V0.5 features for cohesive UX |
| Landing Page | Full marketing page | Hero, features, testimonials, pricing placeholder |
| Mobile Priority | Desktop-first | Optimize desktop, ensure mobile works but not polished |
| URL Structure | `/app/*` prefix | Clear separation from marketing pages |
| Auth Protection | Layout-level | Single point of auth check for all dashboard routes |

---

## Dependencies

### Epic 16 Dependencies
- Epic 13 (Hybrid Preferences): Stories 16-3, 16-5 integrate Job Type and Modification Level
- Epic 14 (Explanations): Story 16-5 displays "Why this works" explanations
- Epic 15 (Privacy Consent): Story 16-3 triggers consent dialog on first upload

### Recommended Implementation Order
1. Epic 13: Hybrid Preferences (foundation for V0.5 features)
2. Epic 14: Explanation Output (enhances suggestions)
3. Epic 15: Privacy Consent (legal requirement)
4. Epic 16: Dashboard UI Architecture (integrates all V0.5 features)

---

## Timeline Estimates

| Epic | Estimated Effort |
|------|-----------------|
| Epic 13 | 3-4 days |
| Epic 14 | 2-3 days |
| Epic 15 | 2-3 days |
| Epic 16 | 5-7 days |
| **V0.5 Total** | **12-17 days** |

*Note: Estimates assume single developer, sequential implementation. Parallel work could reduce timeline.*
