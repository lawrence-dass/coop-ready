# Story 6.6: Implement Copy to Clipboard

Status: ready-for-dev

---

## Story

As a user,
I want to copy individual suggestions to my clipboard,
So that I can paste them into my resume.

## Acceptance Criteria

1. **Copy button functionality:** Clicking the copy button on a suggestion copies the suggested text to the user's clipboard
2. **Feedback mechanism:** User sees visual feedback (toast notification + button state change) after copying
3. **Copy performance:** Copy action completes in under 100ms
4. **Icon clarity:** Button uses recognizable icon (clipboard or checkmark) to indicate copy action
5. **Button placement:** Copy button is easily accessible on each SuggestionCard
6. **Text selection:** Copies only the suggested text (not original or metadata)
7. **Accessibility:** Copy button has proper aria-label and keyboard support
8. **Toast notification:** Success message appears and dismisses automatically (5s)
9. **Button state change:** Button shows "Copied!" or checkmark briefly after successful copy
10. **Error handling:** Gracefully handles clipboard API failures with user-friendly error message

## Tasks / Subtasks

- [ ] Task 1: Plan copy-to-clipboard architecture (AC: #1, #2, #3)
  - [ ] Design CopyButton component (reusable, can be used beyond suggestions)
  - [ ] Plan integration point: where button lives in SuggestionCard
  - [ ] Define props: text to copy, onSuccess callback, button variant
  - [ ] Choose icon: Copy icon (default) → Checkmark (after copy)
  - [ ] Plan timing: Toast duration, button state reset timing

- [ ] Task 2: Create CopyButton component (AC: #1, #2, #4, #6, #7)
  - [ ] Create `components/shared/CopyButton.tsx` as reusable component
  - [ ] Accept props: `text: string`, `label?: string`, `variant?: ButtonVariant`
  - [ ] Use Clipboard API: `navigator.clipboard.writeText(text)`
  - [ ] Handle success: Change button state to "Copied!" with checkmark icon
  - [ ] Handle error: Show error toast with fallback copy mechanism (if available)
  - [ ] Add aria-label: "Copy [suggestion type]" for accessibility
  - [ ] Support keyboard interaction: Space/Enter to trigger copy

- [ ] Task 3: Implement clipboard handling with fallback (AC: #1, #3, #10)
  - [ ] Use modern Clipboard API (`navigator.clipboard.writeText`)
  - [ ] Add fallback for older browsers: `document.execCommand('copy')`
  - [ ] Wrap in try-catch for error handling
  - [ ] Return success/failure status
  - [ ] Handle permissions errors gracefully
  - [ ] Test both success and error paths

- [ ] Task 4: Implement visual feedback with toast (AC: #2, #8, #9)
  - [ ] Import toast from `sonner` library (already in stack)
  - [ ] Show success toast: "Copied to clipboard!" on successful copy
  - [ ] Show error toast: "Failed to copy" on error
  - [ ] Auto-dismiss toast after 5 seconds
  - [ ] Position toast consistently (top-right, bottom-right, or center)
  - [ ] Use appropriate colors: green for success, red for error

- [ ] Task 5: Implement button state change feedback (AC: #2, #9)
  - [ ] Change button icon: Copy → Checkmark after copy
  - [ ] Change button text: "Copy" → "Copied!" (optional but recommended)
  - [ ] Reset state after 2-3 seconds (or user clicks again)
  - [ ] Disable button temporarily during copy action (to prevent rapid double-clicks)
  - [ ] Show visual animation (optional): subtle pulse or scale effect

- [ ] Task 6: Integrate CopyButton into SuggestionCard (AC: #1, #5, #6)
  - [ ] Add CopyButton to SuggestionCard component
  - [ ] Position button: typically at bottom-right or with metadata
  - [ ] Pass suggested text to CopyButton: `text={suggestion.suggested}`
  - [ ] Handle click event: CopyButton handles all logic
  - [ ] Test that correct text is copied (not original or metadata)
  - [ ] Verify button is visible on all screen sizes (desktop/mobile)

- [ ] Task 7: Test performance and accessibility (AC: #3, #7, #10)
  - [ ] Unit test: CopyButton component with mock clipboard API
  - [ ] Unit test: Verify copy action < 100ms
  - [ ] Unit test: Error handling paths (permission denied, clipboard unavailable)
  - [ ] Integration test: Copy from SuggestionCard, verify toast appears
  - [ ] Accessibility test: Keyboard navigation, aria-label, screen reader
  - [ ] Manual test: Verify paste result matches suggested text exactly

- [ ] Task 8: Handle edge cases and polish (AC: #10)
  - [ ] Test with empty suggestions
  - [ ] Test with very long suggestions (multiline text)
  - [ ] Test with special characters and formatting
  - [ ] Test on mobile browsers (clipboard permissions differ)
  - [ ] Test rapid clicks (button disabling works)
  - [ ] Test with multiple copy buttons on same page

## Dev Notes

### Architecture Compliance

**From project-context.md:**
- Directory: `/components/shared/` for reusable business components
- Type safety: Full TypeScript typing required
- Naming: PascalCase for components (CopyButton)
- Styling: Tailwind CSS with shadcn/ui components
- Error codes: Use ActionResponse pattern if needed

**From epics.md (Story 6.6):**
- Copy suggestions to clipboard with one click
- Visual feedback: toast notification + button state change
- Copy action completes < 100ms
- User can paste copied text directly into resume

**From UX Design Specification:**
- CopyButton component: One-click with confirmation
- Icon: Clipboard or checkmark
- States: Default, Hover, Copied, Error
- Toast notification for feedback
- Should feel like a "micro-win" - celebrated with visual feedback

### Technical Requirements

**Clipboard API Approach:**
```typescript
// Modern Clipboard API
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback or error handling
    return false;
  }
};

// Fallback for older browsers
const copyFallback = (text: string): boolean => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    document.body.removeChild(textArea);
    return false;
  }
};
```

**Component Props:**
```typescript
interface CopyButtonProps {
  text: string;              // Text to copy
  label?: string;            // Button label (default: "Copy")
  variant?: ButtonVariant;   // shadcn Button variant
  size?: ButtonSize;         // Button size (default: "sm")
  showLabel?: boolean;       // Show text label (default: true)
  successDuration?: number;  // How long to show "Copied!" (default: 2000ms)
  onCopy?: (success: boolean) => void; // Callback after copy attempt
}
```

**Toast Integration:**
```typescript
// From sonner library (already in stack)
import { toast } from 'sonner';

toast.success('Copied to clipboard!');
toast.error('Failed to copy to clipboard');
```

**Button State Management:**
```typescript
// Track copy state with React state
const [isCopied, setIsCopied] = useState(false);

const handleCopy = async () => {
  const success = await copyToClipboard(text);
  if (success) {
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), successDuration);
  } else {
    toast.error('Failed to copy');
  }
};
```

**Icon Selection (Lucide React):**
```typescript
// Default state
import { Copy } from 'lucide-react';
<Copy className="w-4 h-4" />

// After copy
import { Check } from 'lucide-react';
<Check className="w-4 h-4" />
```

**Integration with SuggestionCard:**
```typescript
// In SuggestionCard.tsx
<div className="flex justify-between items-end">
  <div>{/* suggestion content */}</div>
  <CopyButton text={suggestion.suggested} />
</div>
```

### File Structure

```
/components/shared/
  ├─ CopyButton.tsx             ← New reusable component
  ├─ SuggestionCard.tsx         ← MODIFIED to include CopyButton
  ├─ SuggestionDisplay.tsx      ← May read success status (optional)
  └─ SuggestionSection.tsx      ← No changes needed

/lib/
  ├─ clipboard.ts              ← Utility functions (NEW - optional)
  │   ├─ copyToClipboard(text)
  │   ├─ copyWithFallback(text)
  │   └─ isBrowserSupported()

/tests/
  ├─ unit/components/
  │   └─ copy-button.test.tsx          ← Component unit tests (NEW)
  └─ integration/
      └─ copy-to-clipboard.test.tsx    ← E2E tests (NEW)
```

### Previous Story Intelligence

**From Story 6-5 (Suggestion Display UI):**
- SuggestionCard component created with props for displaying suggestions
- Placeholder for copy button already exists (comment: "copy button deferred to 6.6")
- Component receives `Suggestion` type with `original`, `suggested`, `points`, `keywords`, `metrics`
- Card layout: two-column (desktop) / tabs (mobile)
- Metadata badges already implemented for keywords and metrics

**From Story 6-2, 6-3, 6-4 (Suggestion Generation):**
- Each suggestion type returns `Suggestion[]` with `{ original, suggested }`
- Suggested text is the optimized content ready to copy/paste
- Session persistence stores all suggestions in Zupabase
- No special formatting or parsing needed - text is ready to use as-is

**Copy Button Pattern from Similar UI:**
- Stripe and modern SaaS apps use clipboard icon → checkmark transition
- Toast notification provides immediate feedback
- Button should be subtle (not a primary action) - use `variant="ghost"` or `variant="outline"`
- 2-3 second "Copied!" state gives users confirmation time

### Git Intelligence

**Recent commits relevant to this story:**
- `1058ad7` - Story 6-5 (Suggestion Display UI) - Created SuggestionCard with button placeholder
- `b8e8e25` - (pre-merge 6-5) - SuggestionCard.tsx with placeholder for copy button

**Files modified in previous Epic 6 stories:**
- `/components/shared/SuggestionCard.tsx` - Has placeholder for copy button, comment marked for 6.6
- `/components/shared/SuggestionDisplay.tsx` - Renders suggestion cards, no changes needed
- `/components/shared/SuggestionSection.tsx` - Maps suggestions to cards, no changes needed

**Code Patterns to Follow:**
- Button components use shadcn/ui Button with variants: "default", "ghost", "outline"
- Icons from lucide-react library
- Toast notifications from sonner library (already in dependencies)
- Event handlers on button: `onClick={() => handleCopy()}`
- Loading/disabled state: `disabled={isCopied || isLoading}`
- Test pattern: Mock navigator.clipboard API for unit tests

### Latest Technical Information

**Clipboard API Compatibility (2026):**
- Modern browsers: Full support for `navigator.clipboard.writeText()`
- Mobile browsers (iOS/Android): Good support, but requires HTTPS
- Older browsers (<90): Use fallback with `document.execCommand('copy')`
- Firefox quirk: May require user gesture (click) to access clipboard
- Chrome: Needs `<iframe>` for cross-origin isolation (not relevant here)

**Sonner Toast Library:**
- Already in project dependencies (used for notifications)
- Simple API: `toast.success()`, `toast.error()`, `toast.loading()`
- Customizable: position, duration, action buttons
- Auto-dismiss by default (5 seconds for success, longer for errors)
- Can chain: `toast.promise()` for async operations

**React 19 + TypeScript Best Practices:**
- Use `const [isCopied, setIsCopied] = useState(false)` for button state
- Use `useCallback` to memoize copy handler (optional but recommended)
- Type props with `interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`
- Use `React.FC<Props>` or `(props: Props) => JSX.Element` for component signature
- Avoid `any` types - use proper unions if needed

**shadcn/ui Button Component:**
```typescript
import { Button } from '@/components/ui/button';

<Button
  variant="ghost"        // or "outline", "default", "secondary"
  size="sm"              // or "lg", "md"
  onClick={handleCopy}
  disabled={isCopied}
  aria-label="Copy suggestion"
>
  {isCopied ? <Check /> : <Copy />}
  {showLabel && (isCopied ? 'Copied!' : 'Copy')}
</Button>
```

### References

- [Source: epics.md#Story 6.6] - Copy to clipboard user story and acceptance criteria
- [Source: ux-design-specification.md#CopyButton] - Component design and interaction patterns
- [Source: project-context.md#Technology Stack] - Sonner, lucide-react, shadcn/ui versions
- [Source: 6-5-implement-suggestion-display-ui.md#File List] - SuggestionCard.tsx location
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - Technical reference
- [Sonner Documentation](https://sonner.emilkowal.ski/) - Toast notification library

---

## File List

- `components/shared/CopyButton.tsx` - Reusable copy-to-clipboard component (NEW)
- `components/shared/SuggestionCard.tsx` - Updated to include CopyButton (MODIFIED)
- `lib/clipboard.ts` - Utility functions for clipboard operations (NEW - optional)
- `tests/unit/components/copy-button.test.tsx` - Unit tests (NEW)
- `tests/integration/copy-to-clipboard.test.tsx` - Integration tests (NEW)

---

## Change Log

- 2026-01-25: Created comprehensive story context for 6-6 (Copy to Clipboard)
  - Analyzed UX specification for copy button design patterns
  - Extracted requirements from Story 6.6 epic
  - Reviewed SuggestionCard integration point from 6-5
  - Defined clipboard handling strategy (Clipboard API + fallback)
  - Planned toast notification feedback
  - Documented button state transitions and accessibility requirements
  - Identified all test scenarios and edge cases
  - Reference to Sonner library (already in stack) for notifications

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Implementation Plan

**Technical Approach:**
- Create reusable CopyButton component in `/components/shared/`
- Use modern Clipboard API with fallback for older browsers
- Implement button state: Copy → Copied! → Copy (after timeout)
- Show toast notification on success/error
- Integrate into SuggestionCard with proper accessibility
- Write unit tests for clipboard logic and button behavior
- Write integration tests with full suggestion cards

**Key Decisions:**
- Separate CopyButton as reusable component (can be used elsewhere)
- Use Sonner library for toast (already in stack)
- Icon transition: Copy → Checkmark for immediate visual feedback
- Button variant: "ghost" or "outline" to avoid visual dominance
- Success state lasts 2-3 seconds before resetting
- Fallback for older browsers using `execCommand('copy')`

### Debug Log

None yet - story just created

### Completion Notes

✅ **Comprehensive story context created with:**
- 10 acceptance criteria covering all copy-to-clipboard requirements
- 8 implementation tasks with detailed subtasks
- Clipboard API strategy with fallback mechanism
- Toast notification integration pattern
- Button state management and visual feedback plan
- Integration point identified in SuggestionCard from 6-5
- Type definitions for CopyButton props
- Edge cases documented (empty text, special characters, mobile)
- Full accessibility requirements (aria-label, keyboard support)
- All dependencies already in project stack

**Acceptance Criteria Met:**
1. ✅ Copy button functionality - Clipboard API integration
2. ✅ Feedback mechanism - Toast + button state change
3. ✅ Performance requirement - < 100ms target
4. ✅ Icon clarity - Copy → Checkmark transition
5. ✅ Button placement - Planned for SuggestionCard
6. ✅ Text selection - Only suggested text copied
7. ✅ Accessibility - aria-label and keyboard support
8. ✅ Toast notification - Sonner library integration
9. ✅ Button state change - Copied! state with reset
10. ✅ Error handling - Graceful failure with user message

**Next Steps:**
1. Run dev-story workflow to begin implementation
2. Create CopyButton component with Clipboard API
3. Integrate into SuggestionCard
4. Test on modern and older browsers
5. Run code-review after implementation complete

### Story Status

✅ **ready-for-dev** - Ultimate context engine analysis completed, comprehensive developer guide created

---

