# Story 11.5: Epic 11 Integration and Verification Testing

Status: backlog

## Story

As a developer,
I want to verify that all Epic 11 stories (point values, preferences, score comparison, and before/after comparison) work correctly,
So that users can configure optimization preferences and compare results.

## Acceptance Criteria

1. **Given** suggestions are generated
   **When** I view them
   **Then** each suggestion displays a point value indicating potential impact

2. **Given** I'm setting up optimization
   **When** I access optimization preferences
   **Then** I can configure 5 preference settings

3. **Given** I have optimized my resume
   **When** I compare scores
   **Then** I see original ATS score vs optimized score side-by-side

4. **Given** I have suggestions applied
   **When** I view before/after text
   **Then** I can see original text next to optimized text with differences highlighted

5. **Given** Epic 11 is complete
   **When** I execute the verification checklist
   **Then** comparison and preferences work end-to-end and Epic 12 (quality assurance) is ready

## Tasks / Subtasks

- [ ] **Task 1: Point Values Verification** (AC: #1)
  - [ ] Generate suggestions
  - [ ] Verify each suggestion shows point value
  - [ ] Verify point values reflect impact (higher = more important)
  - [ ] Test sorting by point value

- [ ] **Task 2: Optimization Preferences Verification** (AC: #2)
  - [ ] Access preferences panel
  - [ ] Verify 5 preference options available
  - [ ] Test saving preferences
  - [ ] Verify preferences affect suggestion generation
  - [ ] Test resetting to defaults

- [ ] **Task 3: Score Comparison Verification** (AC: #3)
  - [ ] Generate suggestions and apply
  - [ ] View comparison view
  - [ ] Verify original score shown
  - [ ] Verify new score calculated
  - [ ] Verify score improvement percentage

- [ ] **Task 4: Before/After Comparison Verification** (AC: #4)
  - [ ] View before/after text comparison
  - [ ] Verify original text visible
  - [ ] Verify suggested text visible
  - [ ] Verify differences highlighted/visible
  - [ ] Test across multiple sections

- [ ] **Task 5: Create Verification Checklist** (AC: #5)
  - [ ] Create `/docs/EPIC-11-VERIFICATION.md`
  - [ ] Include preference configurations
  - [ ] Include comparison views test cases
  - [ ] Update README with reference

## Dev Notes

### What Epic 11 Delivers

- **Story 11.1:** Point Values - Quantify suggestion impact
- **Story 11.2:** Optimization Preferences - 5-option config
- **Story 11.3:** Score Comparison - Original vs optimized
- **Story 11.4:** Before/After Text Comparison - Side-by-side view

### Preferences (Likely)

- Tone/Style preference
- Length preference (concise vs detailed)
- Industry focus
- Experience emphasis
- Keywords emphasis

### Dependencies

- Epic 5: Score calculation
- Epic 6: Suggestions
- Types: Suggestion with pointValue

### Verification Success Criteria

✅ Point values display on suggestions
✅ Preferences configurable
✅ Preferences affect suggestions
✅ Score comparison shows improvement
✅ Before/after view clear
✅ Differences highlighted
✅ All features work together
✅ No console errors
