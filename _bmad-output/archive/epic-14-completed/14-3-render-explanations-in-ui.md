# Story 14.3: Render Explanations in UI

**Status:** review

**Epic:** Epic 14: Explanation Output (V0.5)

**Depends On:**
- Story 14.1 (Types - COMPLETED ✓)
- Story 14.2 (Prompts - COMPLETED ✓)

---

## Story

As a user,
I want to see "Why this works" explanations beneath each suggestion,
So that I understand why the change was recommended.

---

## Acceptance Criteria

1. **Given** suggestions with explanations are displayed
   **When** I view the suggestion cards
   **Then** I see a "Why this works" section beneath each suggestion

2. **Given** the explanation section
   **When** I view a suggestion card
   **Then** the explanation is visually distinct (e.g., light blue background, 💡 icon)

3. **Given** the explanation text
   **When** I view it in the UI
   **Then** the text is readable and not truncated

4. **Given** a suggestion without an explanation
   **When** I view the suggestion card
   **Then** suggestions without explanations display without the explanation section (graceful degradation)

---

## Tasks / Subtasks

- [ ] Update SuggestionCard component to accept explanation prop (AC: #1-4)
  - [ ] Locate: `/components/shared/SuggestionCard.tsx`
  - [ ] Add `explanation?: string` to SuggestionCardProps interface (line 13-37)
  - [ ] Export explanation prop in destructuring (line 48-57)
  - [ ] Verify TypeScript compilation passes

- [ ] Render "Why this works" section in SuggestionCard (AC: #1, #3)
  - [ ] Add new UI section below suggested text (after line 122)
  - [ ] Show only if explanation exists and is not empty
  - [ ] Include 💡 icon for visual distinction
  - [ ] Use light blue background (#E3F2FD or tailwind blue-50)
  - [ ] Use px-3 py-2 padding and rounded corners for card style
  - [ ] Render explanation text with proper line-height for readability
  - [ ] Test on mobile (tabs layout) and desktop (two-column layout)

- [ ] Implement visual styling for explanation section (AC: #2)
  - [ ] Background color: Tailwind `bg-blue-50` or similar light blue
  - [ ] Icon: Lucide `Lightbulb` or similar (💡)
  - [ ] Icon color: Tailwind `text-blue-600` for better contrast
  - [ ] Text color: Tailwind `text-gray-700` for readability
  - [ ] Font size: `text-sm` for consistency with other metadata
  - [ ] Border/styling: Subtle rounded container matching card aesthetic

- [ ] Update SuggestionCard usage in SuggestionDisplay (AC: #1)
  - [ ] Locate: `/components/shared/SuggestionDisplay.tsx`
  - [ ] Find where SuggestionCard components are rendered (look for summary, skills, experience)
  - [ ] Pass `explanation` prop from suggestion data to each SuggestionCard
  - [ ] Ensure explanation flows through from store → component

- [ ] Handle graceful degradation for missing explanations (AC: #4)
  - [ ] If explanation is undefined: Don't render section
  - [ ] If explanation is empty string: Don't render section
  - [ ] If explanation is null: Don't render section
  - [ ] Verify backward compatibility: Old suggestions without explanation still display correctly

- [ ] Test end-to-end explanation rendering (AC: #1-4)
  - [ ] Generate suggestions with explanations (from story 14.2 LLM)
  - [ ] Verify "Why this works" section appears for each suggestion
  - [ ] Verify visual styling matches design spec (light blue, icon, readable text)
  - [ ] Verify graceful handling of missing explanations
  - [ ] Test on desktop and mobile layouts
  - [ ] Verify no text truncation (line-wrap handles long explanations)

---

## Dev Notes

### Architecture Patterns & Constraints

**Component Update Pattern:**
- SuggestionCard is existing component (story 6.5, updated in story 11.3)
- Add optional `explanation` prop to interface (backward compatible)
- Render new section conditionally (only if explanation exists)
- Use existing design system components (Card, Badge, icons from lucide-react)

**Store Integration:**
- Zustand store already has suggestion data: summarySuggestion, skillsSuggestion, experienceSuggestion
- Each suggestion object includes new `explanation?: string` field (from story 14.1)
- SuggestionDisplay component reads from store and passes to SuggestionCard
- No new store mutations needed

**Visual Design Requirements (from UX spec):**
- Primary Color: Purple/Indigo (#635BFF)
- Design Style: Stripe-inspired, clean whites, generous whitespace
- Card aesthetic: Subtle shadows, clean borders
- For explanations: Light blue background (information color), 💡 icon
- Typography: `text-sm`, consistent with existing suggestion metadata

[Source: project-context.md#Directory-Structure-Rules, _bmad-output/planning-artifacts/ux-design-specification.md]

### File Structure Requirements

```
/components/shared/
  ├─ SuggestionCard.tsx        ← Add explanation prop + rendering
  └─ SuggestionDisplay.tsx     ← Pass explanation from store to card
```

**Component Hierarchy:**
```
SuggestionDisplay (reads store)
  ↓ (passes explanation prop)
SuggestionCard (renders explanation section)
  ↓
"Why this works" section with 💡 icon
```

**Example Explanation Section HTML:**
```jsx
{explanation && explanation.trim() !== '' && (
  <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
    <div className="flex gap-2 items-start">
      <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-blue-900 mb-1">Why this works</p>
        <p className="text-sm text-gray-700 leading-relaxed">{explanation}</p>
      </div>
    </div>
  </div>
)}
```

[Source: project-context.md#API-Patterns]

### Testing Standards

**Component Tests:**
- Test SuggestionCard with explanation prop
- Test SuggestionCard without explanation (graceful degradation)
- Test explanation rendering with long text (verify no truncation)
- Test mobile vs desktop layout with explanation visible

**Integration Tests:**
- End-to-end: Full optimization flow with explanations
- Verify explanations render in SuggestionDisplay
- Verify visual styling matches design spec
- Verify backward compatibility (old data without explanations)

**Visual Regression Tests (Recommended):**
- Screenshot: Explanation section visible on desktop
- Screenshot: Explanation section visible on mobile tabs
- Screenshot: Card without explanation (verify no extra space)

[Source: project-context.md#Critical-Rules]

---

## Previous Story Intelligence

**Story 14.2 (Update Prompts) - COMPLETED ✓:**
- LLM now generates explanations in JSON response
- 11 tests pass for explanation field parsing
- Graceful handling for missing/empty explanations
- All 103 AI tests pass

**Learning from Story 14.2:**
- Explanations range from 100-300 chars typically
- Long explanations (>500 chars) are already truncated by LLM layer
- Generic explanations are logged as warnings but still functional
- Pattern: Prompts → Parsing → UI (sequential flow)

**Story 14.1 (Add Types) - COMPLETED ✓:**
- `explanation?: string` added to all suggestion types
- Backward compatible - optional field on existing types
- 1,140 unit tests pass with new field

**Pattern from Previous Stories:**
- Story 6.5: Initial SuggestionCard created with original vs suggested
- Story 11.3: Enhanced SuggestionCard with score comparison
- Story 14.3: Add explanation section to existing card structure

---

## Git Intelligence

**Reference Commits:**
- **006afc2** `feat(story-11-3)`: Score comparison UI - shows how to enhance existing card
  - Added ScoreComparison component rendering in SuggestionCard
  - Pattern: Add new prop → Conditional render → Test backward compat

- **1058ad7** `feat(story-6-5)`: Initial SuggestionCard - base component structure
  - Shows original component design with metadata sections
  - Current structure: Point badge → Original/Suggested (tabs/desktop) → Keywords/Metrics → Actions

**Code Pattern Identified:**
- Story 11-3 enhanced SuggestionCard by adding new props and rendering
- Follow same pattern: explanation prop → conditional render → metadata section style

---

## Latest Tech Information

**React & TypeScript Best Practices:**
- Optional props: Use `prop?: Type` for backward compatibility
- Conditional rendering: `{explanation && explanation.trim() && ( ... )}` prevents empty renders
- Lucide React icons: Import and use with `className` for Tailwind styling
- Line-wrapping: Use `line-clamp-*` or `leading-relaxed` to prevent truncation

**Tailwind CSS for Design System:**
- `bg-blue-50`: Light blue background (information context)
- `text-blue-600`: Icon color (good contrast on white)
- `text-blue-900`: Title color (high contrast text)
- `text-gray-700`: Body text (readable on light backgrounds)
- `rounded-md`: Consistent with card styling
- `border-blue-100`: Light border for definition

**Design System Pattern:**
- Use existing shadcn/ui components (Card, Badge, Tooltip)
- Icons: Lucide React (`Lightbulb`, `AlertCircle`, etc.)
- Colors: Tailwind Palette (blue-50, blue-600, blue-900, gray-700)

---

## Project Context Reference

**Critical Rules:**
1. **Component Naming:** PascalCase - already correct (SuggestionCard)
2. **Prop Interface:** TypeScript strict - add explanation?: string
3. **Error Handling:** Graceful degradation if explanation missing
4. **Design Consistency:** Follow Stripe-inspired aesthetic from UX spec
5. **Accessibility:** Use semantic HTML, proper ARIA labels if needed

**Constraints:**
- No new dependencies required (Lucide, Tailwind already used)
- Component must remain performant (no unnecessary re-renders)
- Mobile-first responsive design (already in SuggestionCard)

[Source: _bmad-output/project-context.md]

---

## Story Completion Status

### Implementation Readiness
- ✅ Story is ready for dev implementation
- ✅ All AC are clear and testable
- ✅ Two files to modify clearly identified
- ✅ Dependencies completed: Story 14.1 ✓, Story 14.2 ✓
- ✅ Design requirements documented from UX spec
- ✅ Reference commits identified for pattern (11-3, 6-5)
- ✅ Visual styling defined (colors, icons, spacing)

### Context Provided
- ✅ Existing SuggestionCard structure documented
- ✅ Component hierarchy and data flow mapped
- ✅ Example JSX for explanation section provided
- ✅ Git reference commits identified
- ✅ Design system colors specified
- ✅ Testing strategy outlined
- ✅ Backward compatibility approach defined

### Next Steps for Dev
1. Review git commits 006afc2 (11-3) and 1058ad7 (6-5) for pattern
2. Examine `/components/shared/SuggestionCard.tsx` current structure
3. Add `explanation?: string` to SuggestionCardProps interface
4. Implement "Why this works" section rendering with 💡 icon
5. Update SuggestionDisplay to pass explanation prop from store
6. Test on desktop and mobile layouts
7. Verify graceful degradation for missing explanations
8. Commit and open PR for code review (with screenshots)

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### References for Implementation
- **Commit Reference:** 006afc2 `feat(story-11-3)` - How to enhance SuggestionCard
- **Commit Reference:** 1058ad7 `feat(story-6-5)` - Base SuggestionCard structure
- **File Reference:** `/components/shared/SuggestionCard.tsx:100-186` - Metadata section pattern
- **Design Reference:** `_bmad-output/planning-artifacts/ux-design-specification.md` - Color/styling spec
- **Type Reference:** `/types/suggestions.ts` - Explanation field definition

### Debug Log References
- None at this stage - UI rendering should produce clean logs

### Completion Notes List
- [x] SuggestionCard accepts explanation prop
- [x] "Why this works" section renders with 💡 icon
- [x] Explanation text readable and not truncated
- [x] Light blue background and styling matches design spec
- [x] Graceful degradation for missing explanations
- [x] SuggestionSection passes explanation prop to SuggestionCard
- [x] Desktop layout displays explanation correctly
- [x] Mobile layout displays explanation correctly
- [x] Backward compatibility verified - old suggestions still work
- [x] Tests pass - 16 component tests all passing

### File List
- `/components/shared/SuggestionCard.tsx` (add explanation prop + rendering with Lightbulb icon)
- `/components/shared/SuggestionSection.tsx` (pass explanation from suggestions to cards)
- `/tests/unit/components/explanation-rendering.test.tsx` (comprehensive test file with 16 tests)

---

## Change Log

- **2026-01-29**: Story created with comprehensive UI implementation plan. SuggestionCard enhancement identified. Design system colors and styling specified. Reference commits identified for pattern (11-3, 6-5). All dependencies verified as completed.
- **2026-01-29**: Implemented explanation rendering in SuggestionCard with "Why this works" section. Added Lightbulb icon, light blue background (bg-blue-50), and proper styling. Updated SuggestionSection to pass explanation prop for Summary, Skills, and Experience sections. Created comprehensive test suite with 16 tests covering AC #1-4, visual styling, graceful degradation, and backward compatibility. All tests pass. Build successful.
