# Story 10.3: Improve Button Visibility

**Epic:** Epic 10 - Quality Fixes & Claude Migration
**Story Key:** 10-3-improve-button-visibility
**Status:** ready-for-dev
**Created:** 2026-01-22
**Priority:** Medium
**Dependencies:** None

---

## Story Summary

As a **user viewing my analysis results**,
I want **to easily find the action buttons without scrolling**,
So that **I can quickly proceed to suggestions or download**.

---

## Problem Statement

**Current Behavior:**
- "View Suggestions" button is at line 201 of the analysis page
- "Download Resume" section is at line 214
- Users must scroll 1,000-2,000px to reach these buttons
- On mobile, the scroll distance is even more noticeable

**User Complaint:**
> "I have to scroll way down to see the buttons. This is too much friction."

**Evidence:**
```
Analysis Page Content Height:
├── Breadcrumb: ~30px
├── Page Header: ~80px
├── ATS Score Card: ~280-350px
├── Score Breakdown: ~400-500px
├── Section Breakdown: ~300-500px
├── Keywords Analysis: ~250-400px
├── Format Issues: ~150-300px
├── Experience Context: ~80px
├── Metadata Footer: ~30px
├── Spacing gaps: ~144px
└── TOTAL: 1,900-3,000px

Typical viewport: 844px (mobile) to 1080px (desktop)
Scroll needed: 1,000-2,000px to reach buttons
```

---

## Acceptance Criteria

### AC1: Primary Actions Visible Above Fold
**Given** user lands on analysis results page
**When** page loads
**Then** primary action buttons are visible without scrolling
**And** buttons are within first 600px of viewport

**Test:** Page load → Buttons visible on 768px viewport

---

### AC2: Clear Visual Hierarchy
**Given** action buttons are displayed
**When** user views the button area
**Then** "View Suggestions" is styled as primary (prominent)
**And** "Download" is styled as secondary
**And** visual distinction is clear

**Test:** Visual inspection → Primary/secondary distinction clear

---

### AC3: Mobile Responsive
**Given** user is on a mobile device (< 768px)
**When** page loads
**Then** buttons are stacked vertically
**And** buttons remain above the fold
**And** touch targets are appropriately sized (min 44px)

**Test:** Mobile viewport → Buttons visible and tappable

---

### AC4: Sticky Behavior (Optional Enhancement)
**Given** user scrolls down the analysis page
**When** buttons would normally scroll out of view
**Then** buttons remain accessible (sticky header or floating bar)

**Test:** Scroll down → Buttons still accessible

---

### AC5: Score + Actions Combined
**Given** ATS score is displayed
**When** viewing the score card
**Then** quick action buttons are integrated nearby
**And** user can act immediately after seeing score

**Test:** Score card → Actions adjacent

---

## Tasks & Subtasks

- [ ] **Task 1: Reposition Buttons to Top Section** (AC: 1, 2, 5)
  - [ ] 1.1 Move buttons from lines 201-227 to after ATS Score Card (line 166)
  - [ ] 1.2 Create `AnalysisActions` component for button grouping
  - [ ] 1.3 Style "View Suggestions" as primary button
  - [ ] 1.4 Style "Download" as secondary/outline button
  - [ ] 1.5 Add appropriate spacing between score and buttons

- [ ] **Task 2: Create Sticky Action Bar (Optional)** (AC: 4)
  - [ ] 2.1 Create `StickyActionBar` component
  - [ ] 2.2 Position below main header on scroll
  - [ ] 2.3 Show/hide based on scroll position
  - [ ] 2.4 Include quick access to suggestions and download
  - [ ] 2.5 Make dismissible if user prefers

- [ ] **Task 3: Mobile Optimization** (AC: 3)
  - [ ] 3.1 Add responsive breakpoints for button layout
  - [ ] 3.2 Stack buttons vertically on mobile
  - [ ] 3.3 Ensure touch targets are 44px minimum
  - [ ] 3.4 Test on various mobile viewport sizes
  - [ ] 3.5 Consider bottom fixed bar for mobile

- [ ] **Task 4: Integration with Score Card** (AC: 5)
  - [ ] 4.1 Option A: Add buttons inside ScoreCard component
  - [ ] 4.2 Option B: Create combined ScoreAndActions component
  - [ ] 4.3 Ensure visual balance between score display and actions

- [ ] **Task 5: Testing** (AC: 1-5)
  - [ ] 5.1 Visual regression test: buttons above fold
  - [ ] 5.2 Test on mobile viewport (375px, 414px)
  - [ ] 5.3 Test on tablet viewport (768px, 1024px)
  - [ ] 5.4 Test on desktop viewport (1280px, 1920px)
  - [ ] 5.5 Test sticky behavior if implemented

---

## Technical Reference

### Current Button Location

**File:** `/app/(dashboard)/scan/[scanId]/page.tsx`

```typescript
// Lines 201-212 (View Suggestions - TOO FAR DOWN)
<div className="mt-6 flex justify-center">
  <Link href={`/analysis/${scan.id}/suggestions`}>
    <Button size="lg" className="px-8">
      <Lightbulb className="mr-2 h-5 w-5" />
      View Suggestions
    </Button>
  </Link>
</div>

// Lines 214-227 (Download - EVEN FURTHER)
<div className="mt-8 border-t pt-6">
  <DownloadWrapper scanId={scan.id} />
</div>
```

### Proposed New Location

```typescript
// After ATS Score Card (around line 166)
<div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
  <Link href={`/analysis/${scan.id}/suggestions`}>
    <Button size="lg" className="w-full sm:w-auto">
      <Lightbulb className="mr-2 h-5 w-5" />
      View Suggestions
    </Button>
  </Link>
  <Link href={`/analysis/${scan.id}/download`}>
    <Button size="lg" variant="outline" className="w-full sm:w-auto">
      <Download className="mr-2 h-5 w-5" />
      Download Resume
    </Button>
  </Link>
</div>

// Then continue with Score Breakdown, Keywords, etc.
```

### Design Options

**Option 1: Simple Reposition (Recommended)**
```
[ATS Score Card]
[Action Buttons] ← Move here
[Score Breakdown]
[Keywords]
...
```

**Option 2: Sticky Header**
```
[Header]
[Sticky Action Bar] ← Appears on scroll
[Content...]
```

**Option 3: Combined Score + Actions Card**
```
┌─────────────────────────────────┐
│  ATS Score: 62%    [Suggestions]│
│  ████████░░░░░░░   [Download]   │
└─────────────────────────────────┘
```

**Option 4: Floating Action Button (Mobile)**
```
[Content...]

        [+] ← FAB bottom-right, expands to show actions
```

---

## Definition of Done

- [ ] Buttons visible without scrolling on desktop (1080px viewport)
- [ ] Buttons visible without scrolling on mobile (768px viewport)
- [ ] Clear primary/secondary visual hierarchy
- [ ] Mobile-responsive layout (stacked on small screens)
- [ ] Touch targets meet 44px minimum
- [ ] Optional: Sticky behavior implemented
- [ ] Visual QA approved
- [ ] No regression in existing functionality

---

## Design Considerations

**Accessibility:**
- Maintain logical tab order
- Buttons must have clear focus states
- Screen reader announces button purposes

**Performance:**
- Sticky positioning uses CSS, not JS scroll listeners
- Minimal layout shift when buttons reposition

**User Experience:**
- Don't hide content behind sticky elements
- Allow users to dismiss sticky bar if they prefer
- Clear visual separation from content

---
