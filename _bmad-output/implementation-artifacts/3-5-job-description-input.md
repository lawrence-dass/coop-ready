# Story 3.5: Job Description Input

Status: ready-for-dev

## Story

As a **user**,
I want **to paste a job description**,
So that **my resume can be analyzed against it**.

## Acceptance Criteria

**AC1: Job Description Input UI**
- **Given** I am on the new scan page
- **When** I view the job description input area
- **Then** I see a large textarea for pasting the JD
- **And** I see a character counter showing current/max (0/5000)
- **And** I see helper text "Paste the full job description"

**AC2: Real-time Character Counting**
- **Given** I paste a job description under 5000 characters
- **When** the text is entered
- **Then** the character counter updates in real-time
- **And** the text is accepted without error

**AC3: Max Length Validation**
- **Given** I paste or type text exceeding 5000 characters
- **When** the validation runs
- **Then** I see an error "Job description must be under 5000 characters"
- **And** the character counter shows red/warning color
- **And** I cannot proceed until I reduce the length

**AC4: Min Length Validation**
- **Given** I try to proceed with an empty job description
- **When** validation runs
- **Then** I see an error "Please enter a job description"
- **And** I cannot proceed

**AC5: Short JD Warning**
- **Given** I paste a job description under 100 characters
- **When** validation runs
- **Then** I see a warning "Job description seems short. Include the full posting for best results"
- **And** I can still proceed (warning, not error)

**AC6: Keyword Preview**
- **Given** a valid job description is entered
- **When** keyword extraction runs (client-side preview)
- **Then** I see a preview of detected keywords/skills
- **And** this helps me verify I pasted the right content

## Tasks / Subtasks

- [ ] **Task 1: Create JDInput Component** (AC: 1, 2, 3, 4, 5)
  - [ ] 1.1 Create `components/forms/JDInput.tsx`
  - [ ] 1.2 Implement textarea for job description input
  - [ ] 1.3 Add character counter (current/max)
  - [ ] 1.4 Display helper text
  - [ ] 1.5 Add max-length attribute to textarea
  - [ ] 1.6 Show character counter in red when approaching limit
  - [ ] 1.7 Add test IDs

- [ ] **Task 2: Implement Validation Schema** (AC: 3, 4, 5)
  - [ ] 2.1 Create `lib/validations/scan.ts` with jobDescriptionSchema
  - [ ] 2.2 Zod schema: `z.string().min(1).max(5000)`
  - [ ] 2.3 Custom error messages for min/max violations
  - [ ] 2.4 Export schema for client and server use

- [ ] **Task 3: Real-time Validation** (AC: 2, 3)
  - [ ] 3.1 Use React Hook Form for form state management
  - [ ] 3.2 Validate as user types (onChange)
  - [ ] 3.3 Show character count in real-time
  - [ ] 3.4 Show error message only when user stops typing (debounced)
  - [ ] 3.5 Update counter color based on length (green → yellow → red)

- [ ] **Task 4: Implement Short JD Warning** (AC: 5)
  - [ ] 4.1 Add warning logic: if length < 100 AND not empty → show warning
  - [ ] 4.2 Display warning in yellow/caution color
  - [ ] 4.3 Warning message clear and helpful
  - [ ] 4.4 Warning doesn't prevent submission

- [ ] **Task 5: Implement Keyword Preview** (AC: 6)
  - [ ] 5.1 Create simple client-side keyword extraction
  - [ ] 5.2 Extract skills keywords from JD (e.g., "Python", "React", "MongoDB")
  - [ ] 5.3 Display extracted keywords as chips/tags
  - [ ] 5.4 Show in collapsible section below textarea
  - [ ] 5.5 Help user verify they pasted correct content

- [ ] **Task 6: Create Scan Form Integration** (AC: 1-6)
  - [ ] 6.1 Create form wrapper component `ScanForm.tsx` (or extend existing)
  - [ ] 6.2 Combine ResumeUpload + JDInput components
  - [ ] 6.3 Add "Start Analysis" button (disabled until both inputs valid)
  - [ ] 6.4 Show button hints: "Enter a job description to continue"
  - [ ] 6.5 Connect to scan/new page
  - [ ] 6.6 Add test IDs for form elements

- [ ] **Task 7: Create Server-Side Validation** (AC: 3, 4)
  - [ ] 7.1 Create `actions/scan.ts` with `createScan` action
  - [ ] 7.2 Validate input with jobDescriptionSchema (server-side re-validation)
  - [ ] 7.3 Create scan record in database
  - [ ] 7.4 Return ActionResponse with scan data or error

- [ ] **Task 8: Database Schema** (AC: All)
  - [ ] 8.1 Create/verify `scans` table migration
  - [ ] 8.2 Columns: `id`, `user_id`, `resume_id`, `job_description`, `status` (pending/processing/completed/failed), `created_at`, `updated_at`
  - [ ] 8.3 Foreign key constraints on user_id and resume_id
  - [ ] 8.4 Add RLS policy: users can only access their own scans

- [ ] **Task 9: Create E2E Tests** (AC: 1-6)
  - [ ] 9.1 Create `tests/e2e/job-description-input.spec.ts`
  - [ ] 9.2 Test AC1: Input UI displays correctly
  - [ ] 9.3 Test AC2: Character counter updates in real-time
  - [ ] 9.4 Test AC3: Max length validation (5000 char limit)
  - [ ] 9.5 Test AC4: Empty input validation
  - [ ] 9.6 Test AC5: Short JD warning (< 100 chars)
  - [ ] 9.7 Test AC6: Keyword preview displays correctly
  - [ ] 9.8 Test form submission with valid JD

- [ ] **Task 10: Final Verification** (AC: 1-6)
  - [ ] 10.1 Run `npm run build` to verify no errors
  - [ ] 10.2 Run `npm run lint` to verify no linting errors
  - [ ] 10.3 Verify E2E tests pass
  - [ ] 10.4 Manual test: Enter various JD lengths, verify counter and errors
  - [ ] 10.5 Manual test: Verify warning shows for short JDs
  - [ ] 10.6 Manual test: Verify keyword preview works

## Dev Notes

### Architecture Compliance

**Component Structure:**
```
components/forms/
├── ResumeUpload.tsx      # Existing (from 3.1)
├── JDInput.tsx           # NEW - Job description textarea
└── ScanForm.tsx          # NEW - Wrapper combining both

actions/
└── scan.ts               # NEW - createScan action
```

**Server Action Pattern:**
```typescript
export async function createScan(input: {
  resumeId: string
  jobDescription: string
}): Promise<ActionResponse<ScanData>> {
  const parsed = scanInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }
  try {
    const scan = await createScanRecord(parsed.data)
    return { data: scan, error: null }
  } catch (e) {
    console.error('[createScan]', e)
    return { data: null, error: { message: 'Failed to create scan', code: 'INTERNAL_ERROR' } }
  }
}
```

### Naming Conventions (STRICT)

| Context | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `JDInput.tsx`, `ScanForm.tsx` |
| Props | camelCase | `jobDescription`, `onDescriptionChange` |
| Database columns | snake_case | `job_description`, `resume_id` |
| API fields | camelCase | `jobDescription`, `resumeId` |

**Transform at boundary:** DB `job_description` → API `jobDescription`

### Technical Requirements

**Character Counter:**
- Real-time update as user types
- Display format: "245 / 5000" characters
- Color coding:
  - Green (0-3500)
  - Yellow (3500-4500)
  - Red (4500+)

**Keyword Extraction (Client-Side):**
```typescript
// Simple regex-based extraction
const keywords = jd.match(/\b[A-Z][a-zA-Z0-9+#]*\b/g) || []
// Filter common keywords
const filtered = keywords.filter(k => !COMMON_WORDS.includes(k))
```

**Form Validation Schema (Zod):**
```typescript
export const jobDescriptionSchema = z.object({
  jobDescription: z.string()
    .min(1, 'Please enter a job description')
    .max(5000, 'Job description must be under 5000 characters')
})

export type JobDescriptionInput = z.infer<typeof jobDescriptionSchema>
```

**Database Schema:**
```sql
CREATE TABLE scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  job_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_status ON scans(status);
```

**RLS Policy:**
```sql
CREATE POLICY "Users can only access own scans" ON scans
  FOR ALL USING (auth.uid() = user_id);
```

### Project Structure

**Files to Create:**
```
components/forms/
├── JDInput.tsx           # Job description textarea
└── ScanForm.tsx          # Form wrapper

lib/validations/
└── scan.ts               # Job description validation schema

actions/
└── scan.ts               # createScan action

tests/e2e/
└── job-description-input.spec.ts  # E2E tests

supabase/migrations/
└── 006_create_scans_table.sql     # Database schema
```

**Files to Modify:**
```
app/(dashboard)/scan/new/page.tsx    # UPDATE - Integrate JDInput
lib/validations/index.ts              # UPDATE - Export jobDescriptionSchema
_bmad-output/implementation-artifacts/sprint-status.yaml  # UPDATE
```

### Previous Story Intelligence

**From Stories 3.1-3.4:**
1. ResumeUpload component pattern (client-side validation, error handling)
2. Form validation with Zod and React Hook Form
3. ActionResponse pattern for server actions
4. Toast notifications for feedback
5. Database schema with RLS policies

**Reusable Patterns:**
- Zod schema pattern from ResumeUpload validation
- React Hook Form integration
- Character counter from existing patterns
- Error message display

### Latest Technical Information (2026)

**Form UX Best Practices:**
- Debounce validation (200-300ms) to avoid rapid updates
- Show errors after user stops typing
- Real-time character counter without debounce
- Warnings don't prevent submission
- Clear, actionable error messages

**Keyword Extraction:**
- Simple client-side regex for preview only
- Full keyword extraction happens in Epic 4 (OpenAI-powered)
- Preview helps user verify content, not for analysis

**Textarea UX:**
- Auto-expand height or scrollable (decide based on design)
- Placeholder text visible
- Good contrast for readability
- Copy-paste friendly

### Conversion Notes

**API Response:**
```typescript
{
  resumeId: "uuid",
  jobDescription: "Senior React Developer...",
  extractedKeywords: ["React", "TypeScript", "Node.js", ...]
}
```

### References

- [Source: epic-3-resume-job-description-input.md#Story 3.5] - Requirements
- [Source: project-context.md] - Zod validation, ActionResponse pattern
- [Source: components/forms/ResumeUpload.tsx] - Form component pattern
- [Source: lib/validations/profile.ts] - Zod schema pattern

---

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Story Creation Context

**Workflow Engine:** BMAD create-story workflow
**Execution Date:** 2026-01-20
**Branch:** feat/3-5-job-description-input
**Epic Status:** in-progress

### Next Steps (for Dev Agent)

1. Create validation schema (lib/validations/scan.ts)
2. Create JDInput component with real-time validation
3. Implement keyword preview (client-side)
4. Create ScanForm wrapper combining resume + JD
5. Create createScan server action
6. Create scans table migration
7. Integrate with scan/new page
8. Write E2E tests
9. Final verification

### File List

**Will be created during dev-story:**
- `components/forms/JDInput.tsx`
- `components/forms/ScanForm.tsx`
- `lib/validations/scan.ts`
- `actions/scan.ts`
- `tests/e2e/job-description-input.spec.ts`
- `supabase/migrations/006_create_scans_table.sql`

**Will be modified:**
- `app/(dashboard)/scan/new/page.tsx` - Integrate JDInput
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

_Story created by BMAD create-story workflow - Ready for dev-story execution_
_Last updated: 2026-01-20_
