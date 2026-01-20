# Epic 1 Remediation Checklist

**Created**: 2025-01-19
**Priority**: Complete before Epic 3
**Estimated Effort**: 2-3 hours total

---

## 1. Desktop Logout Access (High Priority)

**Problem**: Header with user menu is `md:hidden`, Sidebar has no logout. Desktop users cannot sign out.

**Files**:
- `components/layout/Header.tsx`
- `components/layout/Sidebar.tsx`

**Options** (pick one):
- [ ] **Option A**: Add logout button to Sidebar user section (keeps mobile/desktop parity)
- [ ] **Option B**: Show Header user menu on desktop too (remove `md:hidden` or add desktop variant)

**Acceptance**:
- [ ] Desktop viewport (≥768px): user can access logout
- [ ] Logout redirects to `/auth/login`
- [ ] Existing E2E test `[P0][AC4]` passes on desktop viewport

---

## 2. Mobile Sheet Behavior (Medium Priority)

**Problem**: `onOpenChange={onClose}` may close Sheet immediately when opening.

**File**: `components/layout/Sidebar.tsx:173`

**Current**:
```tsx
<Sheet open={isOpen} onOpenChange={onClose}>
```

**Fix**:
```tsx
<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
```

**Verification**:
- [ ] Manual test: tap hamburger menu on mobile viewport
- [ ] Menu opens and stays open
- [ ] Menu closes on outside tap or nav item click
- [ ] Menu closes on explicit close action

---

## 3. Environment Variable Documentation (Low Priority)

**Problem**: `NEXT_PUBLIC_SITE_URL` used in auth but not documented.

**File**: `.env.example`

**Fix**: Add to `.env.example`:
```bash
# Site URL (Required for auth email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Acceptance**:
- [ ] `.env.example` documents `NEXT_PUBLIC_SITE_URL`
- [ ] Comment explains its purpose (auth email redirects)

---

## 4. Tablet Default Collapsed (Optional)

**Problem**: AC specifies 768-1024 should default to collapsed sidebar; current implementation defaults to expanded.

**File**: `components/layout/DashboardLayout.tsx`

**Fix**: Add viewport-aware default in the localStorage effect:
```tsx
useEffect(() => {
  const savedState = localStorage.getItem("sidebar-collapsed");
  if (savedState !== null) {
    setSidebarCollapsed(savedState === "true");
  } else {
    // Default collapsed for tablet (768-1024)
    const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
    setSidebarCollapsed(isTablet);
  }
}, []);
```

**Acceptance**:
- [ ] Fresh visit on tablet (768-1024px): sidebar collapsed by default
- [ ] Fresh visit on desktop (>1024px): sidebar expanded by default
- [ ] User preference in localStorage still respected

---

## Completion

- [ ] All high/medium items complete
- [ ] Manual smoke test on mobile and desktop
- [ ] Existing E2E tests pass
- [ ] Commit with message: `fix: address Epic 1 UI gaps (logout, mobile nav, env docs)`
