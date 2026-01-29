# Story 15.2: Create Privacy Consent Dialog

**Status:** done

**Epic:** Epic 15: Privacy Consent (V0.5)

**Depends On:**
- Story 15.1 (Database Schema - COMPLETED ✓)

---

## Story

As a user,
I want to see a privacy disclosure before my first upload,
So that I understand how my data will be used.

---

## Acceptance Criteria

1. **Given** I have not yet accepted the privacy disclosure
   **When** the consent dialog appears
   **Then** I see a clear explanation of data handling:
   - Resume is processed using AI services (Anthropic Claude)
   - Data is stored securely in my account
   - Data is not used to train AI models
   - I can delete my data at any time

2. **Given** the consent dialog is displayed
   **When** I view the dialog
   **Then** I see links to Privacy Policy and Terms of Service

3. **Given** the consent dialog is displayed
   **When** I interact with the dialog
   **Then** I see a checkbox to confirm understanding
   **And** the "I Agree" button is disabled until checkbox is checked

4. **Given** the checkbox is checked
   **When** I click "I Agree"
   **Then** the dialog can be submitted
   **And** the dialog can be dismissed by clicking "Cancel"

5. **Given** the dialog is accessible
   **When** I interact with it
   **Then** the dialog follows accessibility standards (focus management, ARIA attributes, keyboard navigation)

---

## Tasks / Subtasks

- [x] Create PrivacyConsentDialog component (AC: #1-5)
  - [x] File: `/components/shared/PrivacyConsentDialog.tsx`
  - [x] Props interface: `{ open: boolean, onOpenChange: (open: boolean) => void, onAccept: () => void }`
  - [x] Dialog structure using shadcn Dialog component (pattern from PreferencesDialog)
  - [x] Dialog header with title and description
  - [x] Main content section with 4 data handling points (AC #1)
  - [x] Links section with Privacy Policy and Terms of Service (AC #2)
  - [x] Checkbox for "I understand and agree" (AC #3)
  - [x] Buttons: "I Agree" (disabled until checked) and "Cancel" (AC #4)
  - [x] ARIA attributes and focus management (AC #5)

- [x] Implement consent disclosure content (AC: #1)
  - [x] Title: "Privacy & Data Handling" or similar
  - [x] Description: Brief intro about data handling
  - [x] Point 1: "Processed with AI services (Anthropic Claude API)"
  - [x] Point 2: "Stored securely in your account"
  - [x] Point 3: "Not used to train AI models"
  - [x] Point 4: "You can delete your data anytime"
  - [x] Use clear, non-technical language for non-technical users

- [x] Add Privacy Policy and Terms of Service links (AC: #2)
  - [x] Link to Privacy Policy (route/URL TBD - placeholder OK for now)
  - [x] Link to Terms of Service (route/URL TBD - placeholder OK for now)
  - [x] Links should open in new tab (target="_blank")
  - [x] Use consistent styling from other link patterns in app

- [x] Implement checkbox interaction (AC: #3)
  - [x] Checkbox component from shadcn/ui
  - [x] Label: "I understand how my data will be handled"
  - [x] Local state to track checkbox state
  - [x] "I Agree" button disabled when checkbox unchecked
  - [x] "I Agree" button enabled when checkbox checked

- [x] Implement dialog button actions (AC: #4)
  - [x] "I Agree" button: Call `onAccept()` callback when clicked
  - [x] "Cancel" button: Close dialog via `onOpenChange(false)`
  - [x] Both buttons should be accessible (proper types and disabled states)
  - [x] Loading state optional (no async action in dialog itself, handled by parent)

- [x] Add accessibility features (AC: #5)
  - [x] Dialog uses shadcn Dialog component (has built-in ARIA)
  - [x] Focus trapped in dialog when open
  - [x] Focus returns to trigger after close
  - [x] Keyboard navigation: Tab between elements, Escape to close
  - [x] Semantic HTML: headings, labels, buttons
  - [x] ARIA labels on checkbox and buttons

- [x] Test component locally (AC: #1-5)
  - [x] Create unit test file: `/tests/unit/components/privacy-consent-dialog.test.tsx`
  - [x] Test dialog renders when open=true
  - [x] Test all 4 data handling points visible
  - [x] Test checkbox unchecked → "I Agree" button disabled
  - [x] Test checkbox checked → "I Agree" button enabled
  - [x] Test onAccept called when "I Agree" clicked
  - [x] Test onOpenChange called with false when "Cancel" clicked
  - [x] Test accessibility features (focus management, ARIA)

- [x] Integrate with future stories (preparation)
  - [x] Export component from `/components/shared/index.ts`
  - [x] Component ready for Story 15.3 to integrate with upload flow
  - [x] No backend integration in this story (Story 15.3 handles that)

---

## Dev Notes

### Architecture Patterns & Constraints

**Dialog Component Pattern:**
- Use shadcn/ui Dialog component (shadow-cn provides accessible Dialog with Radix UI)
- Pattern reference: PreferencesDialog component (Story 13.3)
- Client component ('use client' directive required)
- Props-based control: `open` and `onOpenChange` for state management
- Clean separation: dialog handles UI, parent handles business logic

**Content Strategy:**
- Clear, non-technical language (target: users without tech background)
- Progressive disclosure: Start with main points, links for detailed policies
- Trust-building: Emphasize user control and data security
- No legal jargon that would confuse users

**Accessibility Requirements:**
- Dialog component from shadcn already has ARIA labels
- Focus management: Automatic via Radix UI Dialog
- Keyboard: Escape closes, Tab navigates
- Checkbox must have associated label
- Button text must be clear

**Component Design Decision:**
- Simple, focused component (no server actions in this story)
- Story 15.3 will add the server action to save consent
- Component is purely presentational for now
- onAccept callback will be wired to server action in Story 15.3

[Source: project-context.md#Directory-Structure-Rules, /components/shared/PreferencesDialog.tsx pattern]

### File Structure Requirements

```
/components/shared/
  ├─ PrivacyConsentDialog.tsx        ← NEW: Privacy consent dialog
  └─ index.ts                         ← Export component

/tests/unit/components/
  └─ privacy-consent-dialog.test.tsx  ← NEW: Component tests
```

**Component Template Pattern (from PreferencesDialog):**
```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

interface PrivacyConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function PrivacyConsentDialog({
  open,
  onOpenChange,
  onAccept,
}: PrivacyConsentDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAccept = () => {
    if (acknowledged) {
      onAccept();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy & Data Handling
          </DialogTitle>
          <DialogDescription>
            Before uploading your resume, please review how we handle your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data handling points */}
          <div className="space-y-3">
            <DataPoint
              title="Processed with AI Services"
              description="Your resume is processed using Anthropic's Claude API to generate optimization suggestions."
            />
            {/* ... more points ... */}
          </div>

          {/* Links to policies */}
          <div className="flex gap-4 text-sm">
            <a href="/privacy" target="_blank" className="text-primary underline">
              Privacy Policy
            </a>
            <a href="/terms" target="_blank" className="text-primary underline">
              Terms of Service
            </a>
          </div>

          {/* Checkbox */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
            />
            <Label htmlFor="acknowledge" className="cursor-pointer">
              I understand how my data will be handled
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAccept}
            disabled={!acknowledged}
          >
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

[Source: /components/shared/PreferencesDialog.tsx pattern]

### Testing Standards

**Component Tests:**
- Test dialog renders when open=true
- Test dialog hidden when open=false
- Test all 4 data handling points visible
- Test checkbox unchecked state (button disabled)
- Test checkbox checked state (button enabled)
- Test onAccept called when "I Agree" clicked with checkbox checked
- Test onOpenChange(false) called when "Cancel" clicked
- Test focus management (focus inside dialog when open)
- Test Escape key closes dialog

**Accessibility Tests:**
- Checkbox has associated label
- Buttons have accessible names
- Dialog has role="dialog"
- Links open in new tab (target="_blank")

**No Backend Tests in This Story:**
- Story 15.3 will test server action integration
- This story focuses on UI/UX only

[Source: project-context.md#Critical-Rules]

---

## Previous Story Intelligence

**Story 15.1 (Database Schema) - COMPLETED ✓:**
- Added `privacy_accepted` BOOLEAN column with DEFAULT false
- Added `privacy_accepted_at` TIMESTAMP WITH TIME ZONE column
- Added PrivacyConsentStatus TypeScript interface to `/types/auth.ts`
- RLS policies allow users to update their own consent status

**Learning from Story 15.1:**
- Type definitions already in place (PrivacyConsentStatus)
- Database schema is solid - ready for data persistence
- RLS handles security - no backend security work needed here

**Story 13.3 (Preferences Dialog UI) - COMPLETED ✓:**
- Created PreferencesDialog component pattern
- Showed how to structure dialog with multiple sections
- Demonstrated checkbox/radio interaction patterns
- Used shadcn Dialog component successfully

**Pattern from Story 13.3:**
- Dialog pattern: DialogHeader, DialogContent, DialogFooter
- State management: useState for form state
- Callback pattern: onOpenChange for controlling open state
- Icon usage: Settings icon in header

**Story 6.5 (Suggestion Display UI) - COMPLETED ✓:**
- Showed best practices for displaying information
- Used clear sections with descriptions
- Demonstrated link styling patterns

---

## Git Intelligence

**Recent Commits (Last 5):**
- **e5fbb89** `feat(story-15-1)`: Add privacy consent database columns
- **56c9b5e** `feat(story-14-4)`: Epic 14 integration testing
- **8bbf40b** `feat(story-14-3)`: Render explanations in UI
- **653f8dd** `feat(story-14-2)`: Update LLM prompts for explanations
- **2328af6** `feat(story-14-1)`: Add explanation types and schema

**Reference Commits for Dialog Pattern:**
- **ec7173a** `feat(story-13-3)`: Update Preferences Dialog UI - Shows exact PreferencesDialog pattern
- Look at: `/components/shared/PreferencesDialog.tsx` for comprehensive dialog pattern

**Expected Git History for This Story:**
- New file: `/components/shared/PrivacyConsentDialog.tsx`
- New file: `/tests/unit/components/privacy-consent-dialog.test.tsx`
- Updated file: `/components/shared/index.ts` (export new component)
- Story documentation: This file
- Status update: `sprint-status.yaml` (story → done)

---

## Latest Tech Information

**shadcn/ui Dialog Component (2026):**
- Built on Radix UI Dialog - accessible by default
- Provides DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Focus management automatic (traps focus when open)
- Keyboard: Escape closes, Tab navigates
- Escape key handled by Radix UI
- Full ARIA support: role="dialog", aria-modal="true"

**Checkbox Component (shadcn/ui):**
- Built on Radix UI Checkbox
- Controlled component: `checked` prop + `onCheckedChange` callback
- Always has associated label for accessibility
- Styled consistently with rest of app

**Best Practices for Consent Dialogs (2026):**
- Simple, scannable content (bullet points > paragraphs)
- Clear consent checkboxes (one checkbox = one agreement)
- Action buttons clearly labeled ("I Agree", not just "OK")
- Links to policies in new tabs (non-blocking)
- Disable submit until user confirms understanding
- Mobile-responsive: full-width on small screens

[Source: UX Design Specification - Modal standards section]

---

## Project Context Reference

**Critical Rules:**
1. **Component Naming:** PascalCase files for components - already correct (PrivacyConsentDialog.tsx)
2. **Client Components:** Must use 'use client' directive for interactive components
3. **Dialog Pattern:** Always use shadcn Dialog components with DialogContent, DialogHeader, etc.
4. **Accessibility:** All interactive elements must be accessible (labels, ARIA, keyboard)
5. **Error Handling:** This component handles no errors (pure presentation)

**Constraints:**
- No server actions in this component (Story 15.3 handles backend)
- No API calls (parent component will handle)
- Component is presentational only
- Must be re-usable in different contexts

**Naming Convention:**
- Component: PrivacyConsentDialog (PascalCase, story-specific)
- Props: onOpenChange, onAccept (camelCase, clear intent)
- State: acknowledged (boolean, clear meaning)

[Source: _bmad-output/project-context.md]

---

## Story Completion Status

### Implementation Readiness
- ✅ Story is ready for dev implementation
- ✅ All 5 AC are clear and testable
- ✅ Dialog component pattern established (reference: PreferencesDialog)
- ✅ Dependencies completed: Story 15.1 ✓ (database types defined)
- ✅ No breaking changes - new component only
- ✅ Accessibility requirements clear

### Context Provided
- ✅ Component template ready to implement
- ✅ Reference component pattern identified (PreferencesDialog)
- ✅ Data handling content outlined (4 key points)
- ✅ Checkbox interaction logic documented
- ✅ Testing approach outlined
- ✅ Accessibility standards specified
- ✅ Integration points for Story 15.3 identified

### Next Steps for Dev
1. Create PrivacyConsentDialog.tsx component
2. Implement dialog structure with all AC requirements
3. Add 4 data handling points with clear language
4. Implement checkbox state and button disable logic
5. Add Privacy Policy and Terms of Service links
6. Create component tests (9+ test cases)
7. Update component exports
8. Commit and open PR for code review

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### References for Implementation
- **Component Pattern:** `/components/shared/PreferencesDialog.tsx` (Story 13.3) - Full example
- **UI Components:** shadcn/ui Dialog, Checkbox, Button, Label
- **Icons:** Lucide React (Lock icon for privacy)
- **Type Definitions:** `/types/auth.ts` - PrivacyConsentStatus interface
- **Database:** Story 15.1 - privacy_accepted, privacy_accepted_at columns
- **UX Spec:** `/bmad-output/planning-artifacts/ux-design-specification.md` - Dialog/Modal standards

### Debug Log References
- None at this stage - component is straightforward UI presentation
- Tests will validate all AC requirements

### Completion Notes List
- [x] PrivacyConsentDialog component created with full TDD approach
- [x] Dialog header with title "Privacy & Data Handling" and Lock icon
- [x] 4 data handling points implemented with clear, non-technical language and icons
- [x] Privacy Policy and Terms of Service links added (open in new tab)
- [x] Checkbox with label "I understand how my data will be handled"
- [x] "I Agree" button disabled until checkbox checked (AC #3 satisfied)
- [x] "Cancel" button closes dialog via onOpenChange callback
- [x] Component tests created (19 tests total - all passing ✅)
- [x] All accessibility features working (ARIA attributes, focus management, keyboard navigation)
- [x] Component exported from `/components/shared/index.ts`
- [x] Tests passing - all 5 acceptance criteria verified

**Implementation Summary:**
Created PrivacyConsentDialog component following TDD red-green-refactor cycle. Component provides clear privacy disclosure with 4 key data handling points (AI processing with Anthropic Claude, secure storage, no AI training use, user deletion control). Dialog includes checkbox interaction that gates "I Agree" button, links to privacy policies, and full accessibility support. All 19 unit tests pass, covering all 5 acceptance criteria.

### File List
- `/components/shared/PrivacyConsentDialog.tsx` (new - 193 lines)
- `/tests/unit/components/privacy-consent-dialog.test.tsx` (new - 410 lines, 21 tests)
- `/components/shared/index.ts` (updated - added PrivacyConsentDialog export)
- `/_bmad-output/implementation-artifacts/sprint-status.yaml` (updated - story status)
- `/_bmad-output/implementation-artifacts/15-2-create-privacy-consent-dialog.md` (this file - updated)

---

## Change Log

- **2026-01-29**: Story created with comprehensive UI implementation plan. Dialog component pattern from Story 13.3 (PreferencesDialog) identified as reference. 5 AC organized into 7 concrete tasks. Data handling content outlined (4 key points). Checkbox interaction logic documented. Testing and accessibility requirements specified. Component ready for implementation.
- **2026-01-29**: Story implementation completed using TDD red-green-refactor cycle. Created PrivacyConsentDialog component with all 5 AC satisfied (data handling disclosure, policy links, checkbox interaction, button actions, accessibility). Implemented 19 comprehensive unit tests covering all AC requirements - all passing. Component exported and ready for Story 15.3 integration. No regressions in test suite (1226/1230 passing, 4 pre-existing failures unrelated to this story). Status: ready for code review.
- **2026-01-29**: Code review completed by Claude Opus 4.5. Found and fixed 2 HIGH issues (checkbox state not resetting on dialog reopen, missing test for reset behavior), 2 MEDIUM issues (missing test for rel="noopener noreferrer" security attribute, missing test verifying onOpenChange called on accept). Added 2 new tests bringing total to 21 tests - all passing. Status: done.
