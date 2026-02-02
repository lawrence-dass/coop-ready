# Co-op vs Full-time Job Type Handling - System Review

**Date**: 2026-02-01
**Purpose**: Review how SubmitSmart differentiates between co-op/internship and full-time positions in ATS scoring and LLM guidance

---

## Executive Summary

✅ **Job type differentiation IS implemented** across three layers:
1. **Scoring Algorithm**: Different component weights and section thresholds
2. **LLM Prompts**: Job-type-specific guidance for verb selection and content framing
3. **Section Evaluation**: Education emphasized for co-op, experience emphasized for full-time

---

## 1. Job Type Detection

### Location
`lib/scoring/jobTypeDetection.ts`

### How It Works
Analyzes job description text for co-op/internship indicators:

```typescript
const coopPatterns = [
  /\b(?:co-?op|intern(?:ship)?)\b/i,
  /\bwork\s+term\b/i,
  /\b(?:4|8|12|16)\s*(?:month|mo)\b/i, // Common co-op durations
  /\bstudent\s+position\b/i,
];
```

**Default**: If no co-op indicators found → `'fulltime'`

### Called From
`app/api/optimize/route.ts:190`

```typescript
const jobType = detectJobType(request.jd_content);
console.log('[SS:optimize] Detected job type:', jobType);
```

---

## 2. Scoring Differentiation

### Component Weight Adjustments

**Location**: `lib/scoring/constants.ts:45-67`

```typescript
export const ROLE_WEIGHT_ADJUSTMENTS = {
  coop_entry: {
    keywords: 0.42,         // +2% from baseline
    qualificationFit: 0.10, // -5% from baseline
    contentQuality: 0.18,   // -2% from baseline
    sections: 0.20,         // +5% from baseline ⭐
    format: 0.10,           // No change
  },
  mid: {
    keywords: 0.40,         // Baseline
    qualificationFit: 0.15, // Baseline
    contentQuality: 0.20,   // Baseline
    sections: 0.15,         // Baseline
    format: 0.10,           // Baseline
  },
  senior_executive: {
    keywords: 0.35,
    qualificationFit: 0.20,
    contentQuality: 0.25,
    sections: 0.10,
    format: 0.10,
  },
};
```

**Key Insight**: Co-op scoring gives **+5%** weight to sections (0.20 vs 0.15) because education/projects sections are more critical.

---

### Section Configuration Differences

**Location**: `lib/scoring/constants.ts:522-539`

```typescript
export const SECTION_CONFIG_V21 = {
  coop: {
    summary: { required: true, minLength: 50, maxPoints: 15 },
    skills: { required: true, minItems: 8, maxPoints: 25 },
    experience: { required: false, minBullets: 3, maxPoints: 20 }, // ⭐ Not required
    education: { required: true, minLength: 30, maxPoints: 25 },    // ⭐ 25 points
    projects: { required: true, minBullets: 2, maxPoints: 20 },     // ⭐ Required
    certifications: { required: false, minItems: 1, maxPoints: 10 },
  },
  fulltime: {
    summary: { required: true, minLength: 50, maxPoints: 15 },
    skills: { required: true, minItems: 8, maxPoints: 25 },
    experience: { required: true, minBullets: 6, maxPoints: 30 },   // ⭐ 30 points, required
    education: { required: true, minLength: 30, maxPoints: 15 },    // ⭐ 15 points only
    projects: { required: false, minBullets: 2, maxPoints: 10 },    // ⭐ Optional
    certifications: { required: false, minItems: 1, maxPoints: 10 },
  },
};
```

**Key Differences**:
- **Co-op**: Education (25 pts) > Projects (20 pts) > Experience (20 pts)
- **Full-time**: Experience (30 pts) > Skills (25 pts) > Education (15 pts)

---

### Education Quality Evaluation

**Location**: `lib/scoring/sectionScore.ts:272-276`

```typescript
export function evaluateEducationQuality(
  educationText: string,
  jdKeywords: string[],
  jobType: JobType  // ⭐ Receives job type
): EducationQualityResult {
  // ...
  if (jobType === 'coop') {
    // For co-op, education is CRITICAL
    score =
      (hasRelevantCoursework ? 0.3 : 0) +
      courseworkMatchScore * 0.25 +
      (hasGPA ? (gpaStrong ? 0.15 : 0.08) : 0) +
      // ... (lines 343-375)
  } else {
    // For fulltime, education is supporting credential
    score =
      (hasDegree ? 0.4 : 0) +
      (hasGPA && gpaStrong ? 0.1 : 0) +
      // ... (lines 377-387)
  }
}
```

**Key Insight**: Co-op education scoring heavily weights coursework (0.55 out of 1.0), while full-time just checks for degree presence.

---

## 3. LLM Prompt Differentiation

### Job Type Guidance Variables

All suggestion generators receive two job-type-specific variables:

**Location**: `lib/ai/preferences.ts`

#### Variable 1: `jobTypeGuidance` (Action Verbs)

```typescript
export function getJobTypeVerbGuidance(jobType: JobTypePreference): string {
  if (jobType === 'coop') {
    return `**Action Verb Guidance (Co-op/Internship):**
Use learning-focused, collaborative verbs that show growth:
- PREFERRED: "Contributed to", "Assisted with", "Collaborated on", "Supported"
- PREFERRED: "Learned", "Gained experience in", "Developed skills in"
- AVOID: "Led", "Owned", "Spearheaded", "Drove" (too senior for internship)`;
  }

  return `**Action Verb Guidance (Full-time Position):**
Use impact-focused, ownership verbs that show results:
- PREFERRED: "Led", "Drove", "Owned", "Delivered", "Spearheaded"
- PREFERRED: "Architected", "Established", "Transformed", "Scaled"`;
}
```

---

#### Variable 2: Section-Specific Framing

```typescript
export function getJobTypeFramingGuidance(
  jobType: JobTypePreference,
  section: 'summary' | 'experience' | 'skills' | 'education',
  hasEducation: boolean = false
): string
```

**Example for Education Section**:

**Co-op Framing** (lines 243-257):
```
**Co-op/Internship Education Framing (PRIMARY CREDENTIAL):**
- Education is the MOST IMPORTANT section for co-op/internship candidates
- ALWAYS suggest adding relevant coursework even if not listed
- Coursework should match JD keywords: databases, programming, networks, etc.
- Suggest adding GPA if strong (3.5+) - critical for entry-level positions
- Include academic projects that demonstrate practical skills
- Add location (city, state) for local candidate preference
- Example additions:
  - "Relevant Coursework: Data Structures, Database Systems, Network Administration"
  - "Capstone Project: Developed full-stack web application using React and Node.js"
  - "GPA: 3.7/4.0 | Dean's List (4 semesters)"
```

**Full-time Framing** (lines 291-299):
```
**Full-time Position Education Framing (SUPPORTING CREDENTIAL):**
- Education supports but doesn't lead the resume
- Degree name and institution are most important
- Only include GPA if recent graduate (within 2-3 years) AND strong (3.5+)
- Coursework generally not needed unless highly specialized/relevant
- Focus on advanced degrees, certifications, specialized training
- Keep education section concise for experienced professionals
- Example: "M.S. Computer Science, Stanford University, 2020"
```

---

### Where Job Type Guidance Is Injected

**All LLM suggestion generators** receive job type guidance:

1. **Education Suggestions** (`lib/ai/generateEducationSuggestion.ts:72`)
   ```typescript
   {jobTypeGuidance}  // Verb guidance for co-op vs fulltime
   ```

2. **Experience Suggestions** (`lib/ai/generateExperienceSuggestion.ts:51`)
   ```typescript
   {educationSection}  // Education context for co-op (to reference coursework)
   {jobTypeGuidance}   // Verb guidance
   ```

3. **Summary Suggestions** (`lib/ai/generateSummarySuggestion.ts`)
   - Receives job type framing for summary section

4. **Skills Suggestions** (`lib/ai/generateSkillsSuggestion.ts`)
   - Receives job type framing for skills section

---

## 4. Data Flow Diagram

```
User uploads resume + JD
         ↓
┌─────────────────────────────┐
│ API Route: /api/optimize    │
├─────────────────────────────┤
│ 1. detectJobType(jdContent) │ ← Analyzes JD text
│    Returns: 'coop'|'fulltime'│
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Scoring: calculateATSScoreV21Full()     │
├─────────────────────────────────────────┤
│ • Receives jobType parameter            │
│ • Applies weight adjustments:           │
│   - coop_entry: sections +5%            │
│ • Uses SECTION_CONFIG_V21[jobType]:     │
│   - coop: education 25pts, projects req │
│   - fulltime: experience 30pts          │
│ • Calls evaluateEducationQuality():     │
│   - coop: coursework-focused (0.55)     │
│   - fulltime: degree-focused (0.4)      │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ LLM Suggestions: Education, Experience, etc │
├─────────────────────────────────────────────┤
│ Receives from preferences:                  │
│ • jobTypeGuidance = getJobTypeVerbGuidance()│
│   - coop: "Contributed", "Learned"          │
│   - fulltime: "Led", "Drove", "Owned"       │
│ • section framing = getJobTypeFramingGuidance()│
│   - coop education: "PRIMARY CREDENTIAL"    │
│   - fulltime education: "SUPPORTING"        │
└─────────────────────────────────────────────┘
```

---

## 5. Example Prompt Differences

### Education Suggestion - Co-op
```
**Job Type:** Target is co-op/internship position (learning-focused opportunity)
  - Use language like: "Contributed to...", "Developed...", "Learned...", "Gained experience in..."
  - Emphasize growth, development, and learning opportunities

**Co-op/Internship Education Framing (PRIMARY CREDENTIAL):**
- Education is the MOST IMPORTANT section for co-op/internship candidates
- ALWAYS suggest adding relevant coursework even if not listed (infer from degree program)
- Coursework should match JD keywords: databases, programming, networks, systems, etc.
- Suggest adding GPA if strong (3.5+) - critical for entry-level positions
- Include academic projects that demonstrate practical skills
```

### Education Suggestion - Full-time
```
**Job Type:** Target is full-time career position (impact-focused)
  - Use language like: "Led...", "Drove...", "Owned...", "Delivered..."
  - Emphasize impact, delivery, and ownership

**Full-time Position Education Framing (SUPPORTING CREDENTIAL):**
- Education supports but doesn't lead the resume
- Degree name and institution are most important
- Only include GPA if recent graduate (within 2-3 years) AND strong (3.5+)
- Coursework generally not needed unless highly specialized/relevant
- Keep education section concise for experienced professionals
```

---

## 6. What Variables/Templates Are Passed to LLMs?

### Common to All Suggestions
- `{education}` or `{experience}` or `{summary}` - User's original section text
- `{jobDescription}` - Full JD text
- `{resumeContent}` - Full resume text (for context)
- `{preferenceSection}` - User preferences (tone, verbosity, emphasis, etc.)

### Job-Type-Specific Variables
- `{jobTypeGuidance}` - Action verb guidance (from `getJobTypeVerbGuidance()`)
- `{resumeSection}` or `{educationSection}` - Additional context for cross-section references

### Education Suggestions Specifically
```typescript
const variables = {
  education: userEducationText,
  jobDescription: jdText,
  resumeSection: fullResumeForContext,
  jobTypeGuidance: getJobTypeVerbGuidance(preferences.jobType), // ⭐
  preferenceSection: buildPreferencePrompt(preferences, userContext)
};
```

### Experience Suggestions Specifically
```typescript
const variables = {
  experience: userExperienceText,
  jobDescription: jdText,
  resumeContent: fullResumeText,
  educationSection: educationContextForCoopStudents, // ⭐ To reference coursework
  jobTypeGuidance: getJobTypeVerbGuidance(preferences.jobType), // ⭐
  preferenceSection: buildPreferencePrompt(preferences, userContext)
};
```

---

## 7. Strengths of Current Implementation

✅ **Multi-layered differentiation**: Scoring, LLM prompts, and section evaluation all job-type-aware

✅ **Explicit verb guidance**: Clear instruction to LLMs on which action verbs to use

✅ **Section priority clarity**: Education is "PRIMARY" for co-op, "SUPPORTING" for full-time

✅ **Coursework emphasis**: Co-op prompts proactively suggest coursework even if not listed

✅ **Quantitative differences**: Different point allocations (education 25pts vs 15pts)

✅ **Academic project focus**: Co-op requires projects section (20pts), full-time doesn't

✅ **GPA guidance**: Co-op strongly encourages GPA if 3.5+, full-time only for recent grads

---

## 8. Potential Enhancements (Optional)

### 8.1. Make Job Type Detection More Visible
**Current**: Job type detected silently from JD
**Enhancement**: Show detected job type in UI with option to override

```typescript
// UI Component
{detectedJobType && (
  <Badge>
    Detected: {detectedJobType === 'coop' ? 'Co-op/Internship' : 'Full-time Position'}
  </Badge>
)}
```

---

### 8.2. Enhance Detection Patterns
**Current**: Basic patterns (co-op, internship, student, duration)
**Enhancement**: Add more patterns

```typescript
const coopPatterns = [
  // ... existing patterns
  /\bco-?op\s+(?:student|position|opportunity)\b/i,
  /\bsummer\s+intern(?:ship)?\b/i,
  /\bwork-?study\b/i,
  /\bacademic\s+year\s+position\b/i,
];
```

---

### 8.3. User Preference Override
**Current**: Only JD-based detection
**Enhancement**: Allow user to specify in preferences

```typescript
// In preferences UI
<Select value={preferences.jobType}>
  <option value="auto">Auto-detect from JD</option>
  <option value="coop">Co-op/Internship</option>
  <option value="fulltime">Full-time Position</option>
</Select>
```

---

### 8.4. More Granular Co-op Guidance
**Current**: Single "coop" category
**Enhancement**: Differentiate first co-op vs returning intern

```typescript
type JobType = 'coop_first' | 'coop_returning' | 'fulltime_entry' | 'fulltime_experienced';

// Different guidance for:
// - coop_first: "Seeking first professional experience..."
// - coop_returning: "Building on previous co-op at [Company]..."
```

---

### 8.5. Academic Context Enrichment
**Current**: Education passed as text to LLM
**Enhancement**: Extract structured data first

```typescript
interface AcademicContext {
  degree: string;
  major: string;
  gpa?: number;
  expectedGraduation: string;
  relevantCoursework: string[];
  academicProjects: string[];
}

// Then pass to LLM as structured JSON for better understanding
```

---

## 9. Summary Table

| Aspect | Co-op/Internship | Full-time |
|--------|-----------------|-----------|
| **Detection Keywords** | co-op, intern, work term, X months | Default (no co-op indicators) |
| **Scoring Weight: Sections** | 0.20 (+5% from baseline) | 0.15 (baseline) |
| **Education Points** | 25 (max) | 15 (max) |
| **Experience Points** | 20 (optional) | 30 (required) |
| **Projects Section** | Required (20 pts) | Optional (10 pts) |
| **Action Verbs** | "Contributed", "Assisted", "Learned" | "Led", "Drove", "Owned" |
| **Education Framing** | "PRIMARY CREDENTIAL" | "SUPPORTING CREDENTIAL" |
| **Coursework** | Heavily encouraged, even if not listed | Generally not needed |
| **GPA** | Critical if 3.5+ | Only if recent grad + 3.5+ |
| **Academic Projects** | Emphasized prominently | Downplayed |
| **Experience Framing** | "Learning experiences" | "Impact and results" |

---

## 10. Conclusion

✅ **The system DOES differentiate** between co-op and full-time positions across:
1. **Scoring algorithm** (weights, section requirements, point allocations)
2. **LLM prompts** (verb guidance, section framing)
3. **Content evaluation** (education quality scoring)

✅ **Job type is detected** from JD text using keyword patterns

✅ **Variables passed to LLMs**:
- `jobTypeGuidance` → Verb selection guidance
- Section-specific framing → Content emphasis guidance
- `educationSection` → Context for co-op students to reference coursework

✅ **Templates/Prompts** are job-type-aware:
- Co-op: Learning-focused, collaborative, academic emphasis
- Full-time: Impact-focused, ownership, results emphasis

---

## Verification Commands

```bash
# Check job type detection
grep -n "detectJobType" app/api/optimize/route.ts

# Check scoring differences
grep -A 10 "coop_entry" lib/scoring/constants.ts
grep -A 10 "SECTION_CONFIG_V21" lib/scoring/constants.ts

# Check LLM guidance
grep -A 20 "getJobTypeVerbGuidance" lib/ai/preferences.ts
grep -A 30 "Co-op/Internship Education Framing" lib/ai/preferences.ts

# Check where job type is used
grep -r "jobType" lib/scoring/*.ts | grep -v "//\|*"
```

---

**End of Review**
