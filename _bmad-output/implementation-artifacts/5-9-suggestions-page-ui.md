# Story 5.9: Suggestions Page UI Implementation

**Status:** ready-for-dev
**Epic:** 5 - Suggestions & Optimization Workflow
**Dependencies:** Stories 5-1 through 5-5 (suggestion generation complete), Story 5-8 (preview page exists)
**Related Stories:** Stories 5-6, 5-7 (existing completed logic, missing UI)

---

## Problem Statement

Epic 5 stories (5-6 through 5-8) are marked complete, but the **suggestions display page doesn't exist**. Users can't view, accept, or reject suggestions after analysis completes. The infrastructure (database, actions, logic) exists but lacks the UI to surface it.

---

## User Story

As a **user**,
I want **to view all suggestions organized by section and accept/reject them one by one**,
So that **I can optimize my resume systematically before previewing the final result**.

---

## Acceptance Criteria

### AC1: "View Suggestions" Button on Analysis Results
**Given** analysis is complete and displayed
**When** I scroll to the bottom of the Analysis Results page
**Then** I see a prominent "View Suggestions" button
**And** clicking it takes me to `/analysis/[scanId]/suggestions`

### AC2: Suggestions Page Loads and Displays
**Given** I navigate to the suggestions page
**When** the page loads
**Then** I see all suggestions grouped by section (Experience, Skills, Education, Projects, Format)
**And** each section shows a count badge (e.g., "Skills (3)")
**And** sections are collapsible/expandable

### AC3: Suggestion Card Display
**Given** I view a section with suggestions
**When** I expand it
**Then** I see suggestion cards with:
- Suggestion type badge (color-coded: blue/purple/orange/green/teal/yellow/red)
- "Before" and "After" text clearly labeled
- Reasoning/explanation
- Accept and Reject buttons

### AC4: Accept/Reject Suggestions
**Given** I'm viewing a suggestion
**When** I click "Accept"
**Then** the suggestion status updates to "accepted"
**And** the card visual changes (e.g., green highlight, checkmark)
**And** it updates in real-time (no page reload)

**When** I click "Reject"
**Then** the suggestion status updates to "rejected"
**And** the card visual changes (e.g., red highlight, X mark)
**And** it updates in real-time

### AC5: Empty Sections
**Given** a section has no suggestions
**When** I view it
**Then** I see "✓ No suggestions - this section is strong!"

### AC6: Navigation
**Given** I've reviewed suggestions
**When** I click "Preview Optimized Resume"
**Then** I navigate to `/analysis/[scanId]/preview`
**And** the preview shows only accepted changes applied

### AC7: Error Handling
**Given** suggestions fail to load
**When** I view the page
**Then** I see an error message
**And** a "Retry" button

---

## Technical Implementation

### New Files to Create

#### 1. Page: `app/(dashboard)/analysis/[scanId]/suggestions/page.tsx`
- Server Component that fetches suggestions for the scan
- Passes data to client components
- Handles loading, error, and empty states

#### 2. Component: `components/analysis/SuggestionsPageContainer.tsx` (Client)
- Main container for the suggestions UI
- State management for filtering and expanded sections
- Layout and navigation

#### 3. Component: `components/analysis/SuggestionsList.tsx` (Client)
- Renders sections with expandable headers
- Shows suggestion count per section
- Loops through suggestions in each section

#### 4. Component: `components/analysis/SuggestionCard.tsx` (Client)
- Individual suggestion card
- Before/After display
- Accept/Reject buttons with loading state
- Type badge with color-coding

#### 5. Utility: Update `lib/supabase/suggestions.ts` if needed
- Ensure `fetchSuggestionsBySection` returns properly formatted data
- Ensure snake_case → camelCase transformation

### Implementation Steps

#### Step 1: Update Analysis Results Page
In `/app/(dashboard)/scan/[scanId]/page.tsx`:
- Add "View Suggestions" button at the end (after MetadataFooter)
- Button links to `/analysis/[params.scanId]/suggestions`
- Only show when scan.status === 'completed'

#### Step 2: Create Suggestions Page
`app/(dashboard)/analysis/[scanId]/suggestions/page.tsx`:
```typescript
// Fetch scan and suggestions
// Check user ownership via RLS
// Transform DB data to camelCase
// Pass to client component
```

#### Step 3: Build Main Container Component
`components/analysis/SuggestionsPageContainer.tsx`:
- Display header with scan info and stats (e.g., "3 Pending, 0 Accepted, 0 Rejected")
- Render SuggestionsList
- Provide footer with "Preview" button

#### Step 4: Build SuggestionsList Component
- Loop through sections: ['experience', 'skills', 'education', 'projects', 'format']
- For each section with suggestions:
  - Render expandable header with count
  - Loop through suggestions in that section
  - Render SuggestionCard for each

#### Step 5: Build SuggestionCard Component
- Display: type badge, before/after, reasoning
- Add: Accept button (calls `acceptSuggestion` action)
- Add: Reject button (calls `rejectSuggestion` action)
- Add: Loading state on buttons during submission
- Add: Visual feedback on accept/reject (highlight color change)

---

## Suggestion Type Color Mapping

```typescript
{
  bullet_rewrite: "blue",      // bg-blue-100, border-blue-300
  skill_mapping: "purple",     // bg-purple-100, border-purple-300
  action_verb: "orange",       // bg-orange-100, border-orange-300
  quantification: "green",     // bg-green-100, border-green-300
  skill_expansion: "teal",     // bg-teal-100, border-teal-300
  format: "yellow",            // bg-yellow-100, border-yellow-300
  removal: "red"               // bg-red-100, border-red-300
}
```

---

## Test Scenarios

1. Navigate to Analysis Results → click "View Suggestions" → land on suggestions page
2. Expand each section → see cards with before/after text
3. Accept a suggestion → verify card highlights and status updates
4. Reject a suggestion → verify card highlights and status updates
5. Click "Preview Optimized Resume" → verify only accepted changes are shown
6. Test error handling (no suggestions, network error, etc.)

---

## Tasks/Subtasks

### Phase 1: Setup & Page Structure
- [ ] Update Analysis Results page with "View Suggestions" button (conditionally shown when status === 'completed')
- [ ] Create suggestions page at `app/(dashboard)/analysis/[scanId]/suggestions/page.tsx`
- [ ] Implement server-side fetching: scans table, suggestions table, RLS verification
- [ ] Add error boundary and loading state handling

### Phase 2: Main Container Component
- [ ] Create `components/analysis/SuggestionsPageContainer.tsx` (Client Component)
- [ ] Implement header with scan info and suggestion summary stats
- [ ] Add stats display: "Total: 15, Pending: 10, Accepted: 3, Rejected: 2"
- [ ] Implement footer with "Preview Optimized Resume" button

### Phase 3: Suggestions List & Sections
- [ ] Create `components/analysis/SuggestionsList.tsx` (Client Component)
- [ ] Implement collapsible section headers with count badges
- [ ] Loop through sections: experience, skills, education, projects, format
- [ ] Show "✓ No suggestions" message for empty sections
- [ ] Handle expand/collapse state with localStorage or component state

### Phase 4: Suggestion Card Component
- [ ] Create `components/analysis/SuggestionCard.tsx` (Client Component)
- [ ] Display suggestion type badge with correct color mapping
- [ ] Show "Before" text (gray, italic, or styled differently)
- [ ] Show "After" text (bold or highlighted)
- [ ] Display reasoning/explanation text
- [ ] Implement Accept button (calls `updateSuggestionStatus` action)
- [ ] Implement Reject button (calls `updateSuggestionStatus` action)
- [ ] Add loading states on buttons during submission
- [ ] Add visual feedback: green highlight on accept, red/gray on reject
- [ ] Implement real-time status update (no page reload)

### Phase 5: Integration & Testing
- [ ] Verify server component fetches data correctly (transform snake_case → camelCase)
- [ ] Test "View Suggestions" button appears and navigation works
- [ ] Test collapsible sections expand/collapse properly
- [ ] Test Accept button updates suggestion status in real-time
- [ ] Test Reject button updates suggestion status in real-time
- [ ] Test empty sections display correctly
- [ ] Test "Preview" button navigates to `/analysis/[scanId]/preview`
- [ ] Test error handling: missing scan, suggestions not found, API error
- [ ] Test RLS: user can only see their own suggestions
- [ ] Write E2E test: navigate → accept one → reject one → preview

---

## Done Checklist

- [ ] "View Suggestions" button added to Analysis Results page
- [ ] Suggestions page loads and fetches data correctly
- [ ] Sections display with collapsible headers and counts
- [ ] Suggestion cards show before/after with correct type badges
- [ ] Accept button works and updates suggestion status
- [ ] Reject button works and updates suggestion status
- [ ] Empty sections display "No suggestions" message
- [ ] "Preview" button navigates to preview page with accepted changes
- [ ] Error states handled gracefully
- [ ] RLS policies verified (only user's suggestions visible)
- [ ] E2E test covers: load suggestions → accept one → reject one → preview
