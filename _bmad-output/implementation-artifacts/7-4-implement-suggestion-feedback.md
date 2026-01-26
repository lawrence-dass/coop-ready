# Story 7.4: Implement Suggestion Feedback

Status: ready-for-dev

---

## Story

As a user,
I want to provide thumbs up/down feedback on suggestions,
So that I can indicate which suggestions were helpful.

## Acceptance Criteria

1. **Feedback buttons visible:** Each suggestion card displays thumbs up/down buttons
2. **Feedback recording:** When user clicks thumbs up or down, feedback is recorded in the session
3. **Visual feedback confirmation:** Button selection changes appearance (filled/highlighted) to confirm choice
4. **Feedback toggle:** User can change their feedback selection (select different button)
5. **Feedback persistence:** Feedback is stored in Supabase session data for future analytics
6. **Anonymous user support:** Anonymous users can provide feedback without authentication
7. **Feedback data structure:** Each suggestion stores feedback: { suggestion_id, helpful: boolean, timestamp }
8. **UI state management:** Feedback state managed in Zustand store, separate from optimization state
9. **Analytics ready:** Feedback data format supports later analytics queries
10. **Design alignment:** Feedback buttons match UX specification (icons, colors, spacing)

## Tasks / Subtasks

- [ ] Task 1: Design feedback data model and storage (AC: #2, #5, #7, #9)
  - [ ] Define feedback data structure: { suggestion_id, section_type, helpful, timestamp, session_id }
  - [ ] Determine Supabase table schema for feedback (add to sessions table or separate?)
  - [ ] Plan storage: feedback array in OptimizationSession.feedback field
  - [ ] Define analytics queries needed (helpful vs unhelpful counts by section)
  - [ ] Ensure suggestion_id uniquely identifies each suggestion for tracking

- [ ] Task 2: Create feedback action in Zustand store (AC: #2, #3, #8)
  - [ ] Create `recordSuggestionFeedback(suggestionId, helpful: boolean)` action
  - [ ] Update store state: `suggestionFeedback` map { suggestionId → helpful: boolean }
  - [ ] Implement feedback toggle: clicking same button again removes feedback
  - [ ] Implement feedback change: clicking different button updates selection
  - [ ] Persist to Supabase session via existing session update mechanism
  - [ ] Ensure action updates both local state and database immediately

- [ ] Task 3: Implement FeedbackButtons component (AC: #1, #3, #4, #10)
  - [ ] Create `components/shared/FeedbackButtons.tsx` component
  - [ ] Accept props: { suggestionId, sectionType, onFeedback: (helpful) => void }
  - [ ] Display two buttons: thumbs up (helpful) and thumbs down (not helpful)
  - [ ] Use Lucide React icons: `ThumbsUp` and `ThumbsDown`
  - [ ] Style: Primary color when selected, gray when unselected
  - [ ] Add hover states and visual transitions
  - [ ] Support keyboard navigation (Tab, Enter)
  - [ ] Add ARIA labels for accessibility

- [ ] Task 4: Integrate FeedbackButtons into SuggestionCard (AC: #1, #2, #3)
  - [ ] Update `components/shared/SuggestionCard.tsx`
  - [ ] Add FeedbackButtons component below suggestion text
  - [ ] Pass suggestionId (generated from content hash or index)
  - [ ] Pass section type (summary, skills, experience)
  - [ ] Connect feedback callback to store action
  - [ ] Display current feedback state (highlight selected button)
  - [ ] Test with sample suggestions from previous stories

- [ ] Task 5: Implement feedback state management (AC: #2, #8)
  - [ ] Add to Zustand store: `suggestionFeedback: Map<string, boolean>`
  - [ ] Add selector: `getFeedbackForSuggestion(suggestionId) → boolean | null`
  - [ ] Add action: `recordSuggestionFeedback(suggestionId, helpful, metadata)`
  - [ ] Add action: `clearFeedback(suggestionId)`
  - [ ] Ensure state persists across component re-renders
  - [ ] Test state updates with multiple feedback selections

- [ ] Task 6: Add feedback storage to session persistence (AC: #5, #6, #7)
  - [ ] Update OptimizationSession type to include feedback array
  - [ ] Implement `saveFeedbackToSession(sessionId, feedback)` action
  - [ ] Update Supabase query to include feedback field in sessions table
  - [ ] Ensure feedback saves immediately when recorded (not batched)
  - [ ] Handle anonymous users (use anonymous_id for tracking)
  - [ ] Add created_at and updated_at timestamps to feedback entries

- [ ] Task 7: Support feedback for anonymous users (AC: #6)
  - [ ] Verify session creation includes anonymous_id
  - [ ] Ensure feedback stored with session (not tied to user auth)
  - [ ] Test feedback flow: new visitor → anonymous session → add feedback → persist
  - [ ] Verify feedback not lost on page refresh (stored in session table)
  - [ ] Test edge case: anonymous → logged-in migration (feedback preserved)

- [ ] Task 8: Implement UI feedback confirmation (AC: #3, #4)
  - [ ] Design visual states: unselected (gray), selected (primary color), hover (slight highlight)
  - [ ] Add smooth transitions (200ms) between states
  - [ ] Optional: Add subtle toast notification when feedback recorded ("Thanks for the feedback!")
  - [ ] Test on desktop and mobile (hit target size ≥ 44px)
  - [ ] Ensure clear visual indication of current selection

- [ ] Task 9: Add feedback validation and safety (AC: #2, #7)
  - [ ] Validate suggestionId format before recording
  - [ ] Validate helpful boolean type
  - [ ] Add timestamp automatically (no client manipulation)
  - [ ] Ensure feedback can't contain PII (validate before storage)
  - [ ] Add rate limiting: max 1 feedback per suggestion per session

- [ ] Task 10: Write tests for feedback functionality (AC: #1-#10)
  - [ ] Unit test: FeedbackButtons component renders correctly
  - [ ] Unit test: Feedback button clicks trigger callbacks
  - [ ] Unit test: Feedback toggle (same button click removes feedback)
  - [ ] Unit test: Feedback change (different button updates selection)
  - [ ] Unit test: Store action recordSuggestionFeedback updates state
  - [ ] Unit test: Feedback persists to Supabase via session update
  - [ ] Integration test: Record feedback in suggestion flow (Playwright)
  - [ ] Integration test: Feedback survives page refresh (session reload)
  - [ ] Manual test: Feedback with various suggestion types
  - [ ] Manual test: Anonymous user feedback flow

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- Directory: `/components/shared/` for reusable components
- Store pattern: Zustand `useOptimizationStore()` for state management
- ActionResponse pattern: All Supabase operations follow error pattern
- Type safety: Full TypeScript typing, no `any` types
- Database naming: snake_case in Supabase, transform to camelCase in TypeScript

**From architecture.md:**
- Component pattern: Small, single-responsibility components
- Data flow: Zustand store → Components → Supabase
- Session persistence: All user data stored in sessions table
- Anonymous support: Sessions use anonymous_id instead of user_id
- Feedback storage: Add feedback array field to sessions table JSON

**From epics.md (Story 7.4):**
- FR35: "Users can provide thumbs up/down feedback on suggestions"
- Feedback helps track suggestion quality and user satisfaction
- Feedback should be stored for analytics (future Story 12.2)

### Previous Story Intelligence

**Story 7.3 (Implement Timeout Recovery) - Just Completed:**
- Timeout handling already in place
- Error display components working
- Retry mechanism with exponential backoff
- Key learning: Error state separate from input state
- Takeaway: Keep feedback separate from optimization state (similar pattern)

**Story 7.2 (Implement Retry Functionality) - Recent:**
- Retry pattern established: action + backoff + state management
- Error retriability logic exists
- Key learning: Zustand actions for user interactions
- Pattern to follow: Similar action pattern for feedback recording

**Story 7.1 (Implement Error Display Component) - Recent:**
- Error display system established
- Toast notifications (sonner) available
- Key learning: UI feedback confirmation patterns
- Pattern to follow: Use similar visual feedback for feedback buttons

**Story 6.7 (Implement Regenerate Suggestions):**
- Suggestion generation pipeline working
- Section-based organization (Summary, Skills, Experience)
- Key learning: Suggestion data structure from API

**Story 6.6 (Implement Copy to Clipboard):**
- Copy button pattern: click handler → clipboard operation → toast feedback
- Button styling pattern: primary color, hover states, icons
- Key learning: Reuse button styling for feedback buttons

**Story 6.5 (Implement Suggestion Display UI):**
- SuggestionCard component structure: original/suggested comparison
- Section organization: SuggestionDisplay → SuggestionSection → SuggestionCard hierarchy
- Card layout: space for buttons below suggestion text
- Key learning: Where to integrate feedback buttons (in SuggestionCard)

### Technical Requirements

**Feedback Data Model:**
```typescript
interface SuggestionFeedback {
  suggestion_id: string;        // Hash of suggestion content
  section_type: 'summary' | 'skills' | 'experience';
  helpful: boolean;              // true = helpful (thumbs up), false = not helpful (thumbs down)
  recorded_at: string;          // ISO timestamp
  session_id: string;           // Link to session (for analytics)
}

interface OptimizationSession {
  // Existing fields...
  feedback: SuggestionFeedback[];  // Add this field
  // Existing fields...
}
```

**Suggestion ID Generation:**
```typescript
// Generate deterministic ID for each suggestion
function generateSuggestionId(original: string, suggested: string, section: string): string {
  const combined = `${section}:${original}:${suggested}`;
  // Use simple hash or index-based ID
  // Ensure same suggestion always gets same ID
  return `sug_${section}_${index}`;  // index from array position
}
```

**Store Structure (Zustand):**
```typescript
interface OptimizationStore {
  // Existing state...

  // Feedback state (new)
  suggestionFeedback: Map<string, boolean>;  // suggestionId → helpful boolean

  // Existing and new actions...
  recordSuggestionFeedback: (suggestionId: string, helpful: boolean) => Promise<void>;
  clearFeedback: (suggestionId: string) => void;
  getFeedbackForSuggestion: (suggestionId: string) => boolean | null;
}
```

**Component Props:**
```typescript
interface FeedbackButtonsProps {
  suggestionId: string;
  sectionType: 'summary' | 'skills' | 'experience';
  currentFeedback?: boolean | null;  // true = helpful, false = not helpful, null = no feedback
  onFeedback: (helpful: boolean) => Promise<void>;
  disabled?: boolean;
}

interface SuggestionCardProps {
  // Existing props from story 6.5...
  suggestionId: string;
  sectionType: 'summary' | 'skills' | 'experience';
  // Card now includes FeedbackButtons
}
```

**Supabase Schema Update:**
```sql
-- In sessions table, add feedback column
ALTER TABLE sessions
ADD COLUMN feedback JSONB[] DEFAULT '{}';

-- Create feedback index for analytics queries
CREATE INDEX idx_sessions_feedback_helpful
ON sessions USING GIN (feedback)
WHERE (feedback @> '[{"helpful": true}]');

-- Schema:
-- feedback: [
--   {
--     suggestion_id: "sug_summary_0",
--     section_type: "summary",
--     helpful: true,
--     recorded_at: "2026-01-26T12:00:00Z"
--   },
--   ...
-- ]
```

**Feedback Recording Flow:**
1. User views suggestion in SuggestionCard
2. User clicks thumbs up/down button in FeedbackButtons
3. FeedbackButtons onClick → calls onFeedback callback
4. SuggestionCard passes to store action recordSuggestionFeedback
5. Store action generates feedback object with timestamp
6. Store action calls Supabase to update session feedback array
7. UI updates immediately: button fills with primary color
8. Toast notification confirms: "Thanks for the feedback!"

### File Structure & Changes

**New Files:**
1. `/components/shared/FeedbackButtons.tsx`
   - Export `FeedbackButtons` component
   - Props: suggestionId, sectionType, currentFeedback, onFeedback, disabled
   - Display: Two buttons (thumbs up, thumbs down) with icons
   - Styling: Tailwind CSS with Lucide icons
   - Accessibility: ARIA labels, keyboard navigation

**Modified Files:**
1. `/store/useOptimizationStore.ts`
   - Add `suggestionFeedback` state: `Map<string, boolean>`
   - Add action `recordSuggestionFeedback(suggestionId, helpful)`
   - Add action `clearFeedback(suggestionId)`
   - Add selector `getFeedbackForSuggestion(suggestionId)`
   - Implement Supabase update for feedback persistence
   - Handle anonymous users (use anonymous_id)

2. `/components/shared/SuggestionCard.tsx`
   - Import FeedbackButtons component
   - Add suggestionId to props
   - Add sectionType to props
   - Render FeedbackButtons below suggestion text
   - Pass feedback callback to FeedbackButtons
   - Display current feedback state (highlight selected button)

3. `/types/optimization.ts`
   - Add `SuggestionFeedback` interface
   - Update `OptimizationSession` to include `feedback: SuggestionFeedback[]`
   - Update `Suggestion` type to include `feedbackId?: string` (optional)

4. `/lib/supabase/sessionQueries.ts`
   - Add `updateSessionFeedback(sessionId, feedback)` function
   - Update session read to include feedback field
   - Add feedback parameter to session updates

5. `/tests/unit/components/FeedbackButtons.test.ts`
   - Test component rendering
   - Test button clicks
   - Test feedback toggle
   - Test ARIA labels

6. `/tests/unit/store/feedbackStore.test.ts`
   - Test store action recordSuggestionFeedback
   - Test feedback state updates
   - Test feedback persistence
   - Test anonymous user support

### Integration Points

**SuggestionCard → FeedbackButtons:**
- Card passes suggestionId, sectionType, current feedback state
- FeedbackButtons emits feedback callback
- Card calls store action with result
- Store updates local state and Supabase

**Store → Supabase:**
- recordSuggestionFeedback creates feedback object
- Calls updateSessionFeedback to append to feedback array
- Uses existing session update mechanism
- Handles anonymous_id for session tracking

**UI → User:**
- FeedbackButtons show two icons (thumbs up/down)
- Selected state: filled icon, primary color
- Unselected state: outlined icon, gray color
- Hover: slight highlight/scale effect
- Optional toast: "Thanks for the feedback!"

**Analytics (Future Story 12.2):**
- Feedback stored with timestamp
- Can query: which suggestions are helpful vs not helpful
- Can track: per-section feedback rates
- Can measure: suggestion quality improvement over time

### Design System Integration

**FeedbackButtons Styling:**
- Button size: 40px × 40px (accessible click target)
- Icon size: 20px (Lucide React)
- Spacing: 12px between buttons
- Selected color: Primary (#635BFF from UX spec)
- Unselected color: #9CA3AF (gray-400)
- Hover background: Subtle gray-100
- Transition: 200ms ease-in-out
- Border radius: 6px (consistent with design system)
- Cursor: pointer on hover

**Icons:**
- Thumbs up (helpful): `ThumbsUp` from lucide-react
- Thumbs down (not helpful): `ThumbsDown` from lucide-react
- Filled when selected, outlined when unselected

**Accessibility:**
- ARIA labels: "Mark as helpful" (thumbs up), "Mark as not helpful" (thumbs down)
- Keyboard navigation: Tab to focus, Enter/Space to toggle
- Color contrast: Meets WCAG AA standard (primary color on white/gray)
- Screen reader support: Buttons announce purpose and current state
- Touch target: 44px minimum (44px × 44px buttons with padding)

### Testing Strategy

**Unit Tests (FeedbackButtons Component):**
```typescript
describe('FeedbackButtons', () => {
  it('renders thumbs up and thumbs down buttons', () => {});
  it('calls onFeedback(true) when thumbs up clicked', () => {});
  it('calls onFeedback(false) when thumbs down clicked', () => {});
  it('highlights selected button with primary color', () => {});
  it('toggles feedback when same button clicked twice', () => {});
  it('changes selection when different button clicked', () => {});
  it('has correct ARIA labels', () => {});
  it('supports keyboard navigation (Tab, Enter)', () => {});
  it('disables buttons when disabled prop true', () => {});
  it('disables buttons while feedback is being saved', () => {});
});
```

**Unit Tests (Store):**
```typescript
describe('useOptimizationStore - feedback', () => {
  it('records feedback in suggestionFeedback map', () => {});
  it('updates feedback when same suggestion selected again', () => {});
  it('removes feedback when same button clicked twice', () => {});
  it('persists feedback to Supabase', () => {});
  it('handles anonymous user feedback', () => {});
  it('returns correct feedback for suggestion', () => {});
  it('clears feedback action works', () => {});
  it('feedback includes timestamp', () => {});
});
```

**Integration Tests (Playwright):**
```typescript
describe('Suggestion Feedback Flow', () => {
  it('user can record feedback on suggestion', () => {});
  it('feedback visual state updates immediately', () => {});
  it('feedback persists in Supabase session', () => {});
  it('feedback survives page refresh', () => {});
  it('anonymous user can provide feedback', () => {});
  it('multiple suggestions track feedback separately', () => {});
  it('feedback works across all suggestion sections', () => {});
  it('feedback buttons accessible via keyboard', () => {});
});
```

**Manual Testing Checklist:**
- [ ] FeedbackButtons render in SuggestionCard (below text)
- [ ] Click thumbs up: button fills with primary color
- [ ] Click thumbs down: button fills with primary color
- [ ] Click same button again: feedback removed, button returns to gray
- [ ] Click different button: selection switches
- [ ] Toast notification appears: "Thanks for the feedback!"
- [ ] Refresh page: feedback persists (stored in session)
- [ ] Multiple suggestions: each has independent feedback
- [ ] Mobile view: buttons 44px+, accessible to tap
- [ ] Keyboard only: Tab to focus, Enter to select
- [ ] Screen reader: Announces "Mark as helpful" and current state
- [ ] Error handling: Network failure (retry or error state)
- [ ] Anonymous user: Can provide feedback without login
- [ ] Performance: Feedback records in <500ms
- [ ] Accessibility: Color contrast meets WCAG AA

### Analytics and Monitoring

**Feedback Metrics (Ready for Future Story 12.2):**
- Helpful count by section (summary, skills, experience)
- Unhelpful count by section
- Helpful/unhelpful ratio per suggestion
- Most helpful vs unhelpful suggestions
- User satisfaction trend over time
- Feedback participation rate (% of users who leave feedback)

**Logging:**
- Log feedback recording: `feedback_recorded { suggestion_id, helpful, section }`
- Log error on save: `feedback_save_error { error, suggestion_id }`
- Include session_id for tracking

### Git Tracking

**Source Epic Reference:**
- [Source: epics.md#Story 7.4](../planning-artifacts/epics.md#l806)
- Requirement FR35: "Users can provide thumbs up/down feedback on suggestions"
- Version: V0.1 (included in initial release)

**Related Work:**
- Previous: Story 7.3 (Implement Timeout Recovery) - Just Completed
- Previous: Story 7.2 (Implement Retry Functionality) - Recently Completed
- Previous: Story 7.1 (Implement Error Display Component) - Recently Completed
- Previous: Story 6.7 (Implement Regenerate Suggestions) - Completed
- Previous: Story 6.6 (Implement Copy to Clipboard) - Completed
- Previous: Story 6.5 (Implement Suggestion Display UI) - Completed
- Following: Story 7.5 (Epic 7 Integration & Verification Testing)
- Analytics consumer: Story 12.2 (Implement Quality Metrics Logging)

**Epic Progression:**
- Epic 7: Error Handling & Feedback - In progress (Story 4 of 5)
- Total V0.1 progress: 28/31 stories complete (after this story will be 29/31, 94%)

**Expected Branches:**
- Created from: main (after story 7.3 merged)
- Feature branch: `feature/7-4-suggestion-feedback`
- PR target: main

---

## Developer Context

### What This Story Adds

This story implements **suggestion feedback collection** - allowing users to rate suggestions as helpful or not helpful. Feedback is stored with each suggestion for future analytics and quality improvement. The UI integrates thumbs up/down buttons into the suggestion cards, with visual confirmation and Supabase persistence.

### Why It Matters

Currently (after story 7.3), users can optimize their resumes and see suggestions, but they have no way to indicate which suggestions are actually helpful:

**Without feedback:**
- No data on suggestion quality
- Can't improve suggestions over time (FR31 - LLM-as-judge needs training data)
- No user satisfaction metrics
- Suggestions might not match user needs

**With feedback:**
1. **Data-driven improvement** - Know which suggestions work (for Story 12.2 analytics)
2. **User engagement** - Users indicate satisfaction, feel heard
3. **Quality metrics** - Can measure suggestion quality by section
4. **Future personalization** - Use feedback to improve future suggestions
5. **Analytics foundation** - Prepare data for LLM-as-judge quality validation

### Common Mistakes to Avoid

**MISTAKE #1: Feedback not persisted to Supabase**
- WRONG: Feedback only in local state, lost on page refresh
- RIGHT: Feedback recorded to session table feedback array immediately
- FIX: Call updateSessionFeedback on every feedback selection

**MISTAKE #2: No suggestion ID strategy**
- WRONG: Can't track which suggestion received feedback
- RIGHT: Each suggestion has deterministic ID (index-based or content hash)
- FIX: Generate suggestionId in SuggestionCard, pass to FeedbackButtons

**MISTAKE #3: Suggestion ID collision or conflicts**
- WRONG: Two similar suggestions get same ID, feedback confused
- RIGHT: IDs are section + index based (e.g., "sug_summary_0", "sug_skills_1")
- FIX: Use array index or content hash, ensure uniqueness per section

**MISTAKE #4: Not supporting anonymous users**
- WRONG: Feedback only works for logged-in users
- RIGHT: Feedback attached to session via anonymous_id
- FIX: Verify feedback recorded with session_id (works for both auth types)

**MISTAKE #5: Feedback UI doesn't match design system**
- WRONG: Different colors, sizes, or styling than other buttons
- RIGHT: Matches FeedbackButtons from 6.6 copy button styling
- FIX: Use Tailwind CSS primary color, consistent button sizing

**MISTAKE #6: No visual confirmation feedback was recorded**
- WRONG: User clicks, nothing obvious changes
- RIGHT: Button fills immediately, optional toast confirms
- FIX: Update button state instantly, add toast notification

**MISTAKE #7: Feedback affects optimization state**
- WRONG: Recording feedback modifies isLoading, suggestions display
- RIGHT: Feedback state separate from optimization state
- FIX: Keep suggestionFeedback in separate store property, don't touch suggestions

**MISTAKE #8: No accessibility for feedback buttons**
- WRONG: Icons only, no ARIA labels, keyboard not supported
- RIGHT: Proper ARIA labels, Tab/Enter navigation, color + icon
- FIX: Add aria-labels, ensure buttons focusable and keyboard-navigable

**MISTAKE #9: Async feedback operation blocks UI**
- WRONG: Recording feedback to Supabase hangs the UI
- RIGHT: Async operation, UI updates immediately, Supabase call in background
- FIX: Use async action, don't wait for Supabase response before updating UI

**MISTAKE #10: Feedback data structure not analytics-ready**
- WRONG: Simple boolean stored, can't query by section or time
- RIGHT: Full object: { suggestion_id, section_type, helpful, timestamp, session_id }
- FIX: Include all needed fields for future analytics queries (Story 12.2)

### Implementation Order

1. **Create FeedbackButtons component** (standalone, testable)
2. **Update Zustand store** (state management + Supabase calls)
3. **Integrate FeedbackButtons into SuggestionCard** (display layer)
4. **Update OptimizationSession type** (feedback array field)
5. **Implement Supabase persistence** (update session with feedback)
6. **Write unit tests** (component + store)
7. **Write integration tests** (feedback flow with Playwright)
8. **Manual testing** (all acceptance criteria)

### Quick Checklist

Before marking done:
- [ ] FeedbackButtons component renders correctly
- [ ] Thumbs up/down buttons functional with click handlers
- [ ] Visual feedback shows selected button (color + fill)
- [ ] Feedback state toggles (click same = remove, click different = change)
- [ ] Store action recordSuggestionFeedback works
- [ ] Feedback persisted to Supabase in sessions.feedback array
- [ ] Feedback survives page refresh (session reload)
- [ ] Anonymous users can provide feedback
- [ ] SuggestionCard integration complete
- [ ] Feedback data includes: suggestion_id, section_type, helpful, timestamp, session_id
- [ ] FeedbackButtons have ARIA labels
- [ ] Keyboard navigation works (Tab + Enter)
- [ ] Toast notification confirms feedback (optional but nice)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing complete (all devices/keyboard)
- [ ] No TypeScript errors (strict mode)

---

## References

**Core Documentation:**
- [project-context.md](../project-context.md) - Zustand store patterns, type safety, component directories
- [epics.md](../planning-artifacts/epics.md#l806) - Epic 7.4 requirements and FR35
- [architecture.md](../planning-artifacts/architecture.md) - Component patterns, session persistence, anonymous user handling

**Related Completed Stories:**
- [Story 7.3: Implement Timeout Recovery](./7-3-implement-timeout-recovery.md) - Error state management pattern
- [Story 7.2: Implement Retry Functionality](./7-2-implement-retry-functionality.md) - Store action pattern with Supabase
- [Story 7.1: Implement Error Display Component](./7-1-implement-error-display-component.md) - UI feedback confirmation pattern
- [Story 6.7: Implement Regenerate Suggestions](./6-7-implement-regenerate-suggestions.md) - Section-based suggestion management
- [Story 6.6: Implement Copy to Clipboard](./6-6-implement-copy-to-clipboard.md) - Button styling, toast notifications
- [Story 6.5: Implement Suggestion Display UI](./6-5-implement-suggestion-display-ui.md) - SuggestionCard structure, where to integrate buttons

**Existing Code Patterns:**
- `store/useOptimizationStore.ts` - Store pattern (follow structure from other actions like optimizeResume)
- `components/shared/SuggestionCard.tsx` - Integration point (add FeedbackButtons after suggestion text)
- `components/shared/FeedbackButtons.tsx` (from story 6.6) - Button styling reference (copy the aesthetic)
- `lib/supabase/sessionQueries.ts` - Session update pattern (follow updateSession function)
- `types/optimization.ts` - Type definitions (add SuggestionFeedback interface)

**External References:**
- [Lucide React Icons](https://lucide.dev) - ThumbsUp, ThumbsDown icons
- [Supabase JSONB Queries](https://supabase.com/docs/guides/database/json) - For feedback array handling
- [Tailwind Button States](https://tailwindcss.com/docs/hover-focus-other-states) - Button styling reference
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/patterns/button/) - Accessible button patterns

**Future Dependencies:**
- Story 7.5: Epic 7 Integration & Verification Testing - Will test feedback flow end-to-end
- Story 12.2: Implement Quality Metrics Logging - Will consume feedback data for analytics

---

## Story Completion Status

**Status:** ready-for-dev

**Ultimate Context Engine Analysis:** Complete

- Epic analysis: ✓ (Epic 7: Error Handling & Feedback - Story 4 of 5)
- Story requirements extracted: ✓ (10 acceptance criteria)
- Previous story intelligence gathered: ✓ (Stories 7.3, 7.2, 7.1, 6.7, 6.6, 6.5 patterns analyzed)
- Architecture guardrails identified: ✓ (Component structure, state management, Supabase persistence, anonymous user support)
- Technical requirements defined: ✓ (Data model, store actions, component props, feedback recording flow)
- File structure mapped: ✓ (New: FeedbackButtons.tsx; Modified: store, SuggestionCard, types, sessionQueries)
- Testing strategy outlined: ✓ (Unit tests, integration tests, manual testing checklist)
- Git intelligence included: ✓ (Related stories, epic progression, expected branch)
- Analytics readiness: ✓ (Feedback structure supports Story 12.2 quality metrics)

**Developer Readiness:** 100%

The developer now has everything needed for flawless implementation:
- Clear feedback data model with analytics support
- Integration points documented (SuggestionCard → FeedbackButtons → Store → Supabase)
- Component structure with proper TypeScript typing
- Zustand store pattern from related stories
- Button styling reference from story 6.6
- Session persistence pattern from architecture
- Anonymous user support verified
- Common mistakes highlighted with fixes
- Testing strategy with specific test cases
- Implementation order provided
- All prerequisites (stories 6.5, 6.6, 6.7, 7.1, 7.2, 7.3) already completed

---

## Dev Agent Record

### Agent Model Used

Story Creation: Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

(To be filled by developer during implementation)

### Completion Notes List

(To be filled by developer upon completion)

### File List

(To be filled by developer upon completion)

---

_Story created: 2026-01-26_
_Status: ready-for-dev_
_Next Action: Dev Agent should run `dev-story` workflow to implement_
