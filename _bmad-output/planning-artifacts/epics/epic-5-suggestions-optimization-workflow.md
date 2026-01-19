# Epic 5: Suggestions & Optimization Workflow

Users can view AI-generated improvement suggestions (before/after bullet rewrites, transferable skills mapping), accept/reject them individually, and preview their optimized resume.

## Story 5.1: Bullet Point Rewrite Generation

As a **user**,
I want **AI-generated rewrites of my experience bullet points**,
So that **my achievements are presented more effectively**.

**Acceptance Criteria:**

**Given** analysis is running on my resume
**When** the suggestion generation completes
**Then** I receive before/after rewrites for each experience bullet point
**And** each rewrite improves clarity, impact, and keyword alignment

**Given** I have a vague bullet like "Worked on machine learning project"
**When** the AI generates a rewrite
**Then** the suggestion adds specificity, action verbs, and impact
**And** example: "Designed and deployed ML recommendation engine improving prediction accuracy by 23%"

**Given** I have a bullet that's already strong
**When** the AI analyzes it
**Then** it may suggest minor improvements or mark it as "No changes recommended"
**And** the original is preserved as an option

**Given** rewrites are generated
**When** they are saved
**Then** a `suggestions` table stores each suggestion with: `scan_id`, `section`, `original_text`, `suggested_text`, `suggestion_type`, `status` (pending/accepted/rejected)

**Given** I am a Student
**When** rewrites are generated
**Then** academic projects are rewritten with professional impact language
**And** course work is framed as practical experience

**Technical Notes:**
- Create `lib/openai/prompts/suggestions.ts` for rewrite prompts
- Create `suggestions` table with columns: `id`, `scan_id`, `section`, `item_index`, `original_text`, `suggested_text`, `suggestion_type`, `reasoning`, `status`, `created_at`
- Add RLS policy: users access suggestions via their scans
- Generate suggestions as part of `runAnalysis` or as separate action
- Suggestion types: `bullet_rewrite`, `skill_mapping`, `action_verb`, `quantification`, `skill_expansion`, `format`, `removal`

---

## Story 5.2: Transferable Skills Detection & Mapping

As a **career changer**,
I want **my non-tech experience mapped to tech terminology**,
So that **hiring managers see the relevance of my background**.

**Acceptance Criteria:**

**Given** I have non-tech work experience (e.g., retail manager)
**When** the AI analyzes my resume
**Then** it detects transferable skills in my experience
**And** maps them to tech-equivalent terminology

**Given** I managed inventory of 10,000+ SKUs
**When** the mapping is generated
**Then** I see a suggestion mapping this to "Database management, inventory optimization systems"

**Given** I led a team of 12 associates
**When** the mapping is generated
**Then** I see a suggestion mapping this to "Cross-functional team leadership, performance coaching"

**Given** transferable skills are detected
**When** I view the suggestions
**Then** each mapping shows: Original skill → Tech equivalent
**And** includes reasoning for why this mapping is relevant

**Given** I am a Student (not Career Changer)
**When** analysis runs
**Then** transferable skills mapping still runs but focuses on academic-to-professional translation
**And** TA experience maps to "Technical mentorship", group projects map to "Cross-functional collaboration"

**Given** mappings are generated
**When** they are saved
**Then** suggestions are stored with `suggestion_type: 'skill_mapping'`
**And** include both original context and mapped terminology

**Technical Notes:**
- Create `lib/openai/prompts/skills.ts` for transferable skills prompt
- Include industry-specific mapping knowledge in prompt
- Store mappings in `suggestions` table
- Consider user's target role when generating mappings

---

## Story 5.3: Action Verb & Quantification Suggestions

As a **user**,
I want **suggestions to improve my action verbs and add quantification**,
So that **my resume has more impact**.

**Acceptance Criteria:**

**Given** I have a bullet starting with a weak verb (e.g., "Responsible for", "Helped with")
**When** the AI generates suggestions
**Then** I receive an action verb improvement suggestion
**And** example: "Responsible for development" → "Developed", "Led", "Architected"

**Given** I have achievements without numbers
**When** the AI generates suggestions
**Then** I receive quantification prompts
**And** example: "Improved performance" → "Improved performance by X%" with prompt to add the number

**Given** quantification opportunities are identified
**When** I view the suggestion
**Then** I see the original text highlighted
**And** I see a prompt like "Consider adding: percentage, dollar amount, time saved, users impacted"

**Given** I have a bullet that already uses strong verbs and numbers
**When** the AI analyzes it
**Then** no action verb or quantification suggestion is generated for that bullet

**Given** suggestions are generated
**When** they are saved
**Then** action verb suggestions have `suggestion_type: 'action_verb'`
**And** quantification suggestions have `suggestion_type: 'quantification'`

**Technical Notes:**
- Include action verb improvements in main suggestion prompt
- Create list of weak verbs to flag: "Responsible for", "Helped", "Assisted", "Worked on", "Was involved in"
- Create list of strong verbs by category: Leadership, Technical, Analysis, Communication
- Quantification prompts should be contextual to the achievement type

---

## Story 5.4: Skills Expansion Suggestions

As a **user**,
I want **suggestions to expand my listed skills**,
So that **ATS systems match more specific keywords**.

**Acceptance Criteria:**

**Given** I have a generic skill listed (e.g., "Python")
**When** the AI generates suggestions
**Then** I receive a skill expansion suggestion
**And** example: "Python" → "Python (pandas, scikit-learn, TensorFlow)"

**Given** the job description mentions specific technologies
**When** skill expansion runs
**Then** suggestions prioritize expansions that match JD keywords
**And** example: If JD mentions "React", suggest "JavaScript" → "JavaScript (React, Node.js)"

**Given** I have a skill that can't be meaningfully expanded
**When** the AI analyzes it
**Then** no expansion suggestion is generated

**Given** expansions are suggested
**When** I view the suggestion
**Then** I see the original skill and the expanded version
**And** I see which JD keywords this expansion would match

**Given** suggestions are generated
**When** they are saved
**Then** skill expansion suggestions have `suggestion_type: 'skill_expansion'`
**And** include `keywords_matched` in the suggestion data

**Technical Notes:**
- Create skill expansion mappings for common technologies
- Cross-reference with extracted JD keywords
- Store in `suggestions` table with type `skill_expansion`
- Only suggest expansions the user can honestly claim

---

## Story 5.5: Format & Content Removal Suggestions

As a **user**,
I want **guidance on resume format and content to remove**,
So that **my resume follows North American standards**.

**Acceptance Criteria:**

**Given** my resume is longer than recommended
**When** format suggestions are generated
**Then** I see a suggestion "Consider condensing to 1 page for entry-level roles"
**And** specific sections are flagged as candidates for trimming

**Given** my resume includes a photo
**When** content removal suggestions are generated
**Then** I see a suggestion "Remove photo - not expected in North American resumes"

**Given** my resume includes date of birth or marital status
**When** content removal suggestions are generated
**Then** I see a suggestion "Remove personal information (DOB, marital status) - not expected and may cause bias"

**Given** my resume has outdated or irrelevant experience
**When** content removal suggestions are generated
**Then** I see suggestions to remove or condense that content
**And** reasoning explains why it's not relevant to the target role

**Given** my resume uses non-standard formatting
**When** format suggestions are generated
**Then** I see specific guidance (e.g., "Use consistent date format: MMM YYYY")

**Given** suggestions are generated
**When** they are saved
**Then** format suggestions have `suggestion_type: 'format'`
**And** removal suggestions have `suggestion_type: 'removal'`

**Technical Notes:**
- Format suggestions can partially overlap with format_issues from Epic 4
- Removal suggestions should be sensitive (explain why, not just "remove this")
- Store in `suggestions` table
- Consider international student context from user journey (Priya)

---

## Story 5.6: Suggestions Display by Section

As a **user**,
I want **to see all suggestions organized by resume section**,
So that **I can review and act on them systematically**.

**Acceptance Criteria:**

**Given** analysis and suggestion generation is complete
**When** I view the suggestions on the results page
**Then** suggestions are grouped by section: Experience, Education, Skills, Projects, Format
**And** each section shows the count of suggestions

**Given** I am viewing suggestions for the Experience section
**When** I expand it
**Then** I see suggestions ordered by job entry (most recent first)
**And** within each job, suggestions are listed by bullet point

**Given** I am viewing a suggestion
**When** I look at the card
**Then** I see the suggestion type (Rewrite, Skill Mapping, Action Verb, etc.)
**And** I see "Before" and "After" clearly labeled
**And** I see reasoning/explanation for the suggestion

**Given** a section has no suggestions
**When** I view that section
**Then** I see "No suggestions for this section" with a checkmark
**And** this indicates the section is already strong

**Given** I have many suggestions
**When** I view the list
**Then** suggestions are paginated or virtualized for performance
**And** I can filter by suggestion type

**Technical Notes:**
- Create `components/analysis/SuggestionList.tsx`
- Create `components/analysis/SuggestionCard.tsx` for individual suggestions
- Group suggestions by `section` field from database
- Use collapsible sections (shadcn Accordion or Collapsible)
- Fetch suggestions with scan data or lazy load

---

## Story 5.7: Accept/Reject Individual Suggestions

As a **user**,
I want **to accept or reject each suggestion individually**,
So that **I control which changes are applied to my resume**.

**Acceptance Criteria:**

**Given** I am viewing a suggestion
**When** I look at the suggestion card
**Then** I see "Accept" and "Reject" buttons
**And** the buttons are clearly visible and accessible

**Given** I click "Accept" on a suggestion
**When** the action completes
**Then** the suggestion status changes to "accepted"
**And** the card visually updates (e.g., green border, checkmark)
**And** a toast confirms "Suggestion accepted"

**Given** I click "Reject" on a suggestion
**When** the action completes
**Then** the suggestion status changes to "rejected"
**And** the card visually updates (e.g., grayed out, strikethrough)
**And** a toast confirms "Suggestion rejected"

**Given** I have accepted or rejected a suggestion
**When** I change my mind
**Then** I can click to toggle back to the other state
**And** the status updates accordingly

**Given** I want to accept all suggestions in a section
**When** I click "Accept All" for that section
**Then** all pending suggestions in that section are accepted
**And** I see a confirmation "X suggestions accepted"

**Given** I am done reviewing
**When** I look at the summary
**Then** I see counts: "X accepted, Y rejected, Z pending"
**And** I cannot proceed to download until I've reviewed all suggestions (or explicitly skipped)

**Technical Notes:**
- Create `components/analysis/AcceptRejectButtons.tsx`
- Create `actions/suggestions.ts` with `acceptSuggestion`, `rejectSuggestion`, `acceptAllInSection`
- Update `suggestions.status` in database
- Use optimistic updates for responsive UI
- Follow AR6 ActionResponse pattern

---

## Story 5.8: Optimized Resume Preview

As a **user**,
I want **to preview how my resume looks with accepted suggestions**,
So that **I can see the final result before downloading**.

**Acceptance Criteria:**

**Given** I have accepted some suggestions
**When** I click "Preview Optimized Resume"
**Then** I see a preview showing my resume with accepted changes applied
**And** changes are highlighted or marked to show what's different

**Given** I am viewing the preview
**When** I look at an accepted change
**Then** I can see the original text (strikethrough or tooltip)
**And** I can see the new text (highlighted)

**Given** I am viewing the preview
**When** I find an issue with a change
**Then** I can go back and reject that suggestion
**And** the preview updates to reflect the change

**Given** I haven't accepted any suggestions
**When** I view the preview
**Then** I see my original resume
**And** a message "No changes applied yet"

**Given** I am satisfied with the preview
**When** I look at the actions
**Then** I see a prominent "Download Resume" button
**And** I can proceed to Epic 6 (export)

**Given** I am viewing the preview on mobile
**When** the layout renders
**Then** the preview is readable and scrollable
**And** I can still access accept/reject functionality

**Technical Notes:**
- Create `components/analysis/ResumePreview.tsx` (or extend from Story 3.4)
- Apply accepted suggestions to parsed resume data
- Use diff highlighting (green for additions, red/strikethrough for removals)
- Store preview state client-side (don't persist merged content yet)
- Actual merging happens in Epic 6 during export

---
