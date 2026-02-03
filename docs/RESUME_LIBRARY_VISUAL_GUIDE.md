# Resume Library Integration - Visual Guide

## Before & After Comparison

### 1. New Scan Page (`/scan/new`)

#### BEFORE
```
┌─────────────────────────────────────┐
│ 1. Upload Resume                    │
├─────────────────────────────────────┤
│                                     │
│  [📎 Drop file or click to upload] │
│                                     │
└─────────────────────────────────────┘
```

#### AFTER
```
┌─────────────────────────────────────┐
│ 1. Upload Resume                    │
├─────────────────────────────────────┤
│  [📚 Select from Library]           │  ← NEW: Library selection
│                                     │
│  ────────────── Or ──────────────   │  ← NEW: Visual divider
│                                     │
│  [📎 Drop file or click to upload] │  ← Existing upload
│                                     │
└─────────────────────────────────────┘
```

**Key Features:**
- Button only visible when authenticated
- Disabled during analysis (`isPending` or `isExtracting`)
- Clear A/B choice: Library OR Upload

---

### 2. Scan Results Page (`/scan/[sessionId]`)

#### BEFORE
```
┌─────────────────────────────────────┐
│ Optimization Results                │
├─────────────────────────────────────┤
│                                     │
│ [ATS Score Display]                 │
│ [Keyword Analysis]                  │
│                                     │
│ [View Suggestions]                  │  ← Single CTA
│                                     │
└─────────────────────────────────────┘
```

#### AFTER (Authenticated)
```
┌─────────────────────────────────────┐
│ Optimization Results                │
├─────────────────────────────────────┤
│                                     │
│ [ATS Score Display]                 │
│ [Keyword Analysis]                  │
│                                     │
│ [View Suggestions] [Save to Library]│  ← NEW: Two CTAs
│      Primary            Secondary   │
└─────────────────────────────────────┘
```

**Key Features:**
- Save button only visible when authenticated AND has resume content
- Responsive layout (stacks vertically on mobile)
- Primary/secondary visual hierarchy

---

## User Workflows

### Workflow A: First-Time User

```
1. Navigate to /scan/new
   │
   ├─→ See "Select from Library" (empty/disabled)
   │   └─→ Shows empty state if clicked
   │
2. Upload resume via ResumeUploader
   │
3. Enter job description and analyze
   │
4. View results at /scan/[sessionId]
   │
5. Click "Save to Library" button
   │   └─→ Enter name (e.g., "Software Engineer Resume")
   │   └─→ Saved to library ✓
   │
6. Next visit: Can use "Select from Library" ✓
```

### Workflow B: Returning User

```
1. Navigate to /scan/new
   │
2. Click "Select from Library"
   │   ├─→ See list of saved resumes (up to 3)
   │   └─→ Choose "Software Engineer Resume"
   │
3. Resume auto-loads into session ✓
   │   └─→ Success toast: "Resume loaded successfully!"
   │
4. Enter job description and analyze
   │
5. View results at /scan/[sessionId]
   │
6. (Optional) Save optimized version with new name
```

### Workflow C: Power User (Versioning)

```
1. Select "Resume_v1" from library
   │
2. Analyze against Job A
   │
3. View results, click "Save to Library"
   │   └─→ Name: "Resume_JobA_Optimized"
   │
4. Apply suggestions, re-upload modified version
   │
5. Analyze again, save as "Resume_JobA_v2"
   │
6. Library now has 3 resume versions ✓
   │   ├─→ Resume_v1
   │   ├─→ Resume_JobA_Optimized
   │   └─→ Resume_JobA_v2
   │
7. Next job: Select most relevant version
```

---

## Component Behavior

### SelectResumeButton States

| State | Button | Dialog Content |
|-------|--------|----------------|
| Not Authenticated | Hidden | N/A |
| Authenticated + No Resumes | Enabled | Empty state message |
| Authenticated + Has Resumes | Enabled | List of resumes (max 3) |
| During Analysis | Disabled (grayed) | Cannot open |
| Loading | Enabled | Shows spinner |

### SaveResumeButton States

| State | Button | Dialog Behavior |
|-------|--------|-----------------|
| Not Authenticated | Hidden | N/A |
| No Resume Content | Hidden | N/A |
| Authenticated + Has Resume | Enabled | Can enter name + save |
| 3 Resumes Already Saved | Enabled | Shows error toast on save |
| During Save | Disabled (spinner) | Shows "Saving..." |

---

## Dialog Previews

### Select Resume Dialog

```
┌─────────────────────────────────────────────┐
│ Select Resume from Library                  │
│                                             │
│ You have 2 saved resumes                    │
│                                             │
│ ◉ Software Engineer Resume                  │ 🗑️
│   Created: Jan 15, 2026, 2:30 PM           │
│                                             │
│ ○ Data Analyst Resume                       │ 🗑️
│   Created: Jan 20, 2026, 10:15 AM          │
│                                             │
│                [Cancel]  [Select Resume]    │
└─────────────────────────────────────────────┘
```

**Features:**
- Radio buttons for single selection
- Delete icon (🗑️) appears on hover
- Shows creation date for each resume
- Confirm dialog before deletion

### Save Resume Dialog

```
┌─────────────────────────────────────────────┐
│ Save Resume to Library                      │
│                                             │
│ Give your resume a name so you can easily   │
│ find it later. You can save up to 3 resumes.│
│                                             │
│ Resume Name                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ e.g., Software Engineer Resume          │ │
│ └─────────────────────────────────────────┘ │
│ 0/100 characters                            │
│                                             │
│                [Cancel]  [Save Resume]      │
└─────────────────────────────────────────────┘
```

**Features:**
- Character counter (max 100)
- Turns red if over limit
- Enter key submits (if valid)
- Validates unique names

---

## Error Handling

### User-Facing Errors

| Scenario | Error Type | User Message |
|----------|-----------|--------------|
| Try to save 4th resume | Toast | "Cannot save resume. You can store up to 3 resumes. Delete one to add another." |
| Duplicate name | Toast | "A resume with this name already exists. Please choose a different name." |
| Empty name | Toast | "Please enter a name for your resume." |
| Name too long (>100) | Inline + disabled button | "Name too long" + red text |
| Network error (fetch) | Toast | "Failed to load resumes. Please try again." |
| Network error (save) | Toast | "Failed to save resume. Please try again." |
| Delete error | Toast | "Failed to delete resume. Please try again." |

### Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| User not authenticated | Buttons hidden (no error) |
| No resume content | SaveResumeButton hidden (no error) |
| Parse error on load | Stores raw text, shows warning in console |
| Dialog open + user logs out | Dialog closes automatically |
| Delete while selection dialog open | Updates list in real-time |

---

## Mobile Responsive Layout

### Scan Results Page - Mobile

```
┌───────────────────┐
│ Optimization      │
│ Results           │
├───────────────────┤
│ [ATS Score]       │
│ [Keywords]        │
│                   │
│ ┌───────────────┐ │
│ │View Suggestions│ │  ← Full width
│ └───────────────┘ │
│ ┌───────────────┐ │
│ │Save to Library │ │  ← Full width (stacked)
│ └───────────────┘ │
└───────────────────┘
```

### Scan Results Page - Desktop

```
┌──────────────────────────────────────────────┐
│ Optimization Results                         │
├──────────────────────────────────────────────┤
│ [ATS Score Display]                          │
│ [Keyword Analysis]                           │
│                                              │
│ [View Suggestions]  [Save to Library]        │  ← Side by side
└──────────────────────────────────────────────┘
```

---

## Integration Points

### NewScanClient.tsx

```typescript
// Line 35: Import
import { SelectResumeButton } from '@/components/resume/SelectResumeButton';

// Lines 388-395: Integration
<SelectResumeButton
  isAuthenticated={isAuthenticated}           // ← From useAuth() hook
  disabled={isPending || isExtracting}        // ← Existing state
  onResumeSelected={(resumeId, resumeName) => {
    console.log(`[NewScan] Loaded resume: ${resumeName}`);
  }}
/>
```

### ScanResultsClient.tsx

```typescript
// Lines 8-9: Imports
import { SaveResumeButton } from '@/components/resume/SaveResumeButton';
import { useAuth } from '@/components/providers/AuthProvider';

// Lines 29-30: State
const { isAuthenticated } = useAuth();
const resumeContent = useOptimizationStore((state) => state.resumeContent);

// Lines 82-86: Integration
<SaveResumeButton
  resumeContent={resumeContent?.rawText || null}  // ← From Zustand
  isAuthenticated={isAuthenticated}              // ← From useAuth()
  fileName="Optimized_Resume.pdf"                // ← Optional hint
/>
```

---

## Database Triggers & Constraints

### 3-Resume Limit Enforcement

```sql
-- Trigger prevents saving 4th resume
CREATE OR REPLACE FUNCTION check_resume_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_resumes WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'User cannot save more than 3 resumes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fires before insert
CREATE TRIGGER enforce_resume_limit
  BEFORE INSERT ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION check_resume_limit();
```

### Unique Name Constraint

```sql
-- Prevents duplicate names per user
ALTER TABLE user_resumes
  ADD CONSTRAINT unique_user_resume_name
  UNIQUE(user_id, name);
```

---

## Testing Quick Reference

### Manual Test Scenarios

1. **Authenticated User - New Scan Page**
   - ✓ SelectResumeButton visible
   - ✓ Button disabled during analysis
   - ✓ Can open dialog and see empty state
   - ✓ "OR" divider displays correctly

2. **Authenticated User - Results Page**
   - ✓ SaveResumeButton visible
   - ✓ Can save resume with custom name
   - ✓ 3-resume limit enforced (error toast)
   - ✓ Duplicate name shows error

3. **Unauthenticated User**
   - ✓ SelectResumeButton hidden
   - ✓ SaveResumeButton hidden
   - ✓ No errors in console

4. **Full Workflow**
   - ✓ Save → Select → Analyze → Save again
   - ✓ Delete from selection dialog
   - ✓ Network errors show toasts

---

## Performance Considerations

- **List Fetch:** Resumes fetched only when dialog opens (not on page load)
- **Auto-Refresh:** Dialog fetches fresh list each time (prevents stale data)
- **Parsing:** Resume content parsed asynchronously (doesn't block UI)
- **Local State:** Dialog state self-contained (no global state pollution)

---

## Accessibility

- **Keyboard Navigation:** All dialogs support Tab/Shift+Tab, Enter, Escape
- **Screen Readers:** Proper ARIA labels on buttons and form inputs
- **Focus Management:** Focus returns to trigger button on dialog close
- **Error Announcements:** Error toasts announced to screen readers

---

**Last Updated:** February 3, 2026
