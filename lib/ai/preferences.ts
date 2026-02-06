/**
 * LLM Preferences Prompt Builder
 *
 * This module provides utility functions to build LLM prompt instructions
 * based on user optimization preferences.
 *
 * Story: 11.2 - Implement Optimization Preferences
 */

import type { OptimizationPreferences, UserContext, JobTypePreference } from '@/types';
import type { CandidateType } from '@/lib/scoring/types';

/**
 * Build a prompt section describing user preferences
 *
 * This function takes user preferences and generates clear LLM instructions
 * that guide suggestion generation according to user preferences.
 *
 * @param preferences - User's optimization preferences
 * @param userContext - Optional user context from onboarding (career goal, target industries)
 * @returns Formatted prompt instructions as string
 *
 * @example
 * ```typescript
 * const prefs: OptimizationPreferences = {
 *   tone: 'technical',
 *   verbosity: 'concise',
 *   emphasis: 'keywords',
 *   industry: 'tech',
 *   experienceLevel: 'senior',
 *   jobType: 'fulltime',
 *   modificationLevel: 'moderate'
 * };
 *
 * const userContext: UserContext = {
 *   careerGoal: 'advancing',
 *   targetIndustries: ['technology', 'finance']
 * };
 *
 * const promptSection = buildPreferencePrompt(prefs, userContext);
 * // Returns formatted instructions for the LLM including career context
 * ```
 */
export function buildPreferencePrompt(
  preferences: OptimizationPreferences,
  userContext?: UserContext
): string {
  const lines: string[] = [
    '**User Preferences:**',
    'Generate suggestions according to these user preferences:',
  ];

  // Tone preference
  if (preferences.tone === 'professional') {
    lines.push('- **Tone:** Use professional, formal corporate language and standard business terminology');
  } else if (preferences.tone === 'technical') {
    lines.push('- **Tone:** Emphasize technical depth, tools, frameworks, and technical terminology');
  } else if (preferences.tone === 'casual') {
    lines.push('- **Tone:** Use conversational, approachable language; less formal, more natural');
  }

  // Verbosity preference
  if (preferences.verbosity === 'concise') {
    lines.push('- **Verbosity:** Keep suggestions concise (1-2 lines per bullet, remove unnecessary words)');
  } else if (preferences.verbosity === 'detailed') {
    lines.push('- **Verbosity:** Provide standard detail level (2-3 lines per bullet, balanced clarity)');
  } else if (preferences.verbosity === 'comprehensive') {
    lines.push('- **Verbosity:** Be comprehensive (3-4 lines per bullet with extensive context and metrics)');
  }

  // Emphasis preference
  if (preferences.emphasis === 'skills') {
    lines.push('- **Emphasis:** Highlight technical skills, tools, frameworks, and certifications prominently');
  } else if (preferences.emphasis === 'impact') {
    lines.push('- **Emphasis:** Focus on quantifiable results, outcomes, and business value impact');
  } else if (preferences.emphasis === 'keywords') {
    lines.push('- **Emphasis:** Maximize ATS keyword coverage from the job description');
  }

  // Industry preference
  if (preferences.industry === 'tech') {
    lines.push('- **Industry:** Use technology industry language (APIs, databases, CI/CD, scalability, etc.)');
  } else if (preferences.industry === 'finance') {
    lines.push('- **Industry:** Use finance industry language (ROI, financial modeling, compliance, risk, etc.)');
  } else if (preferences.industry === 'healthcare') {
    lines.push('- **Industry:** Use healthcare industry language (patient outcomes, HIPAA, clinical, care, etc.)');
  } else if (preferences.industry === 'generic') {
    lines.push('- **Industry:** Use industry-agnostic, neutral language suitable for any field');
  }

  // Experience level preference
  if (preferences.experienceLevel === 'entry') {
    lines.push('- **Experience Level:** Frame for entry-level (emphasize learning, collaboration, potential, foundational skills)');
    lines.push('  - Use language like: "Contributed to...", "Collaborated on...", "Developed skills in..."');
  } else if (preferences.experienceLevel === 'mid') {
    lines.push('- **Experience Level:** Frame for mid-level (balance execution and leadership, show depth and breadth)');
    lines.push('  - Use language like: "Led...", "Owned...", "Improved...", show career progression');
  } else if (preferences.experienceLevel === 'senior') {
    lines.push('- **Experience Level:** Frame for senior-level (emphasize strategy, mentorship, business impact, innovation)');
    lines.push('  - Use language like: "Drove...", "Architected...", "Established...", "Mentored..."');
  }

  // Job type preference
  if (preferences.jobType === 'coop') {
    lines.push('- **Job Type:** Target is co-op/internship position (learning-focused opportunity)');
    lines.push('  - Use language like: "Contributed to...", "Developed...", "Learned...", "Gained experience in..."');
    lines.push('  - Emphasize growth, development, and learning opportunities');
  } else if (preferences.jobType === 'fulltime') {
    lines.push('- **Job Type:** Target is full-time career position (impact-focused)');
    lines.push('  - Use language like: "Led...", "Drove...", "Owned...", "Delivered..."');
    lines.push('  - Emphasize impact, delivery, and ownership');
  }

  // Modification level preference
  if (preferences.modificationLevel === 'conservative') {
    lines.push('- **Modification Level:** Make CONSERVATIVE changes (15-25% modification)');
    lines.push('  - Only add keywords, make minimal restructuring');
    lines.push('  - Preserve the original writing style and voice');
  } else if (preferences.modificationLevel === 'moderate') {
    lines.push('- **Modification Level:** Make MODERATE changes (35-50% modification)');
    lines.push('  - Restructure for impact while preserving intent');
    lines.push('  - Balance improvements with maintaining authenticity');
  } else if (preferences.modificationLevel === 'aggressive') {
    lines.push('- **Modification Level:** Make AGGRESSIVE changes (60-75% modification)');
    lines.push('  - Full rewrite for maximum impact');
    lines.push('  - Significant reorganization and transformation allowed');
  }

  // Career goal context from onboarding (if provided)
  if (userContext?.careerGoal) {
    const careerGoalInstructions: Record<string, string> = {
      'first-job':
        'User is seeking their **first professional role**. Emphasize transferable skills from academic projects, internships, and extracurriculars. Highlight eagerness to learn and potential.',
      'switching-careers':
        'User is **transitioning to a new career**. Highlight transferable skills that bridge their previous experience to this new field. Focus on adaptability and relevant crossover.',
      'advancing':
        'User is **advancing in their current field**. Emphasize growth trajectory, expanded responsibilities, and deepening domain expertise.',
      'promotion':
        'User is **seeking a promotion**. Highlight leadership potential, initiative-taking, and readiness for increased responsibility.',
      'returning':
        'User is **returning to the workforce**. Emphasize staying current with industry trends, relevant skills, and readiness to contribute.',
    };
    const instruction = careerGoalInstructions[userContext.careerGoal];
    if (instruction) {
      lines.push(`- **Career Goal:** ${instruction}`);
    }
  }

  // Target industries context from onboarding (if provided)
  if (userContext?.targetIndustries && userContext.targetIndustries.length > 0) {
    const formatted = userContext.targetIndustries
      .map((industry) => industry.charAt(0).toUpperCase() + industry.slice(1))
      .join(', ');
    lines.push(
      `- **Target Industries:** User is targeting roles in: ${formatted}. Tailor language and keywords to resonate with these specific industries.`
    );
  }

  lines.push('');
  lines.push('**Important:** Apply ALL of these preferences consistently throughout the suggestions.');

  return lines.join('\n');
}

/**
 * Get job-type-specific action verb guidance
 *
 * Returns detailed guidance on appropriate action verbs based on whether
 * the target position is a co-op/internship or full-time role, or for
 * career changers transitioning between fields.
 *
 * @param jobType - The job type preference ('coop', 'fulltime') or candidate type ('career_changer')
 * @returns Formatted verb guidance string for the LLM prompt
 */
export function getJobTypeVerbGuidance(jobType: JobTypePreference | CandidateType): string {
  if (jobType === 'coop') {
    return `**Action Verb Guidance (Co-op/Internship):**
Use learning-focused, collaborative verbs that show growth:
- PREFERRED: "Contributed to", "Assisted with", "Collaborated on", "Supported", "Helped develop"
- PREFERRED: "Learned", "Gained experience in", "Developed skills in", "Built foundation in"
- PREFERRED: "Participated in", "Worked alongside", "Applied knowledge from coursework"
- AVOID: "Led", "Owned", "Spearheaded", "Drove" (too senior for internship context)
- AVOID: Overstating responsibility or impact beyond intern/co-op scope
- CONNECT work to academic learning where relevant`;
  }

  if (jobType === 'career_changer') {
    return `**Action Verb Guidance (Career Changer):**
Use transferable-skill-focused verbs that bridge old career to new:
- PREFERRED: "Transitioned", "Applied [X] expertise to", "Leveraged", "Adapted"
- PREFERRED: "Collaborated across", "Bridged", "Integrated", "Reframed"
- PREFERRED: "Demonstrated", "Developed", "Built", "Designed"
- PREFERRED: Connection verbs: "Translated [old skill] to [new context]", "Combined [old] with [new]"
- AVOID: Verbs that sound too junior ("Assisted", "Supported") — career changers are experienced professionals
- AVOID: Verbs that don't show transferability — must connect prior career to new field
- FOCUS: Connect prior-career verbs to new-career context — show how past informs future`;
  }

  return `**Action Verb Guidance (Full-time Position):**
Use impact-focused, ownership verbs that show results:
- PREFERRED: "Led", "Drove", "Owned", "Delivered", "Spearheaded"
- PREFERRED: "Architected", "Established", "Transformed", "Scaled"
- PREFERRED: "Increased", "Reduced", "Improved", "Optimized"
- Frame achievements with business impact and measurable outcomes
- Show leadership, initiative, and end-to-end ownership`;
}

/**
 * Get job-type-specific framing guidance for each section
 *
 * Returns section-specific guidance on how to frame content based on
 * the target job type or candidate type, with awareness of education context.
 *
 * @param jobType - The job type preference ('coop', 'fulltime') or candidate type ('career_changer')
 * @param section - The resume section ('summary', 'experience', 'skills', 'education', or 'projects')
 * @param hasEducation - Whether education data is available for context
 * @returns Formatted framing guidance string for the LLM prompt
 */
export function getJobTypeFramingGuidance(
  jobType: JobTypePreference | CandidateType,
  section: 'summary' | 'experience' | 'skills' | 'education' | 'projects',
  hasEducation: boolean = false
): string {
  if (jobType === 'coop') {
    const guidance: Record<string, string> = {
      summary: `**Co-op/Internship Summary Framing:**
- Emphasize eagerness to learn and contribute
- **IMPORTANT: Reference education prominently** (degree program, relevant coursework, expected graduation)
- Highlight academic projects that demonstrate practical skills
- Show enthusiasm for the industry/role
- Mention GPA if strong (3.5+), Dean's List, academic honors
- Tone: Humble, growth-oriented, eager to learn
- Example: "Computer Science student at [University] with hands-on experience in..."
- Example: "Third-year Software Engineering student seeking to apply coursework in data structures and algorithms..."
${hasEducation ? '- Use the provided education section to personalize the summary' : ''}`,

      experience: `**Co-op/Internship Experience Framing:**
- Frame accomplishments as learning experiences
- **Connect work experience to academic coursework** where relevant
- Acknowledge mentorship and team collaboration
- Highlight skills developed, not just tasks completed
- Be realistic about scope (supported, assisted, contributed)
- Example: "Applied algorithms learned in CS 201 to optimize..."
- Example: "Collaborated with senior engineers to..." NOT "Led the engineering team to..."
${hasEducation ? '- Reference relevant coursework when describing technical work' : ''}`,

      skills: `**Co-op/Internship Skills Framing:**
- Include "Familiar with" or "Exposure to" for emerging skills
- **Highlight skills from coursework and academic projects**
- Include academic tools (Jupyter, MATLAB, academic research tools)
- List programming languages learned in courses
- Balance technical skills with soft skills (communication, teamwork)
- Show breadth of exposure over depth of mastery
- Include relevant certifications or online courses
${hasEducation ? '- Use education section to identify coursework-related skills' : ''}`,

      education: `**Co-op/Internship Education Framing (PRIMARY CREDENTIAL):**
- Education is the MOST IMPORTANT section for co-op/internship candidates
- **ALWAYS suggest adding relevant coursework** even if not listed (infer from degree program)
- Coursework should match JD keywords: databases, programming, networks, systems, etc.
- Suggest adding GPA if strong (3.5+) - critical for entry-level positions
- Include academic projects that demonstrate practical skills
- Add location (city, state) for local candidate preference
- Format graduation date consistently (Expected May 2024 or Graduated: December 2021)
- Suggest honors, Dean's List, scholarships, relevant clubs/organizations
- Connect academic work directly to JD requirements
- For sparse education sections: PROACTIVELY suggest content to add
- Example additions:
  - "Relevant Coursework: Data Structures, Database Systems, Network Administration"
  - "Capstone Project: Developed full-stack web application using React and Node.js"
  - "GPA: 3.7/4.0 | Dean's List (4 semesters)"`,

      projects: `**Co-op/Internship Projects Framing:**
- Projects are PRIMARY experience section for co-op candidates
- Format like job entries with company-style bullet points
- Suggest 'Project Experience' or 'Academic Projects' as section heading
- Emphasize individual contributions and skills learned
- Connect to coursework and academic learning
- Include: technologies used, problem solved, impact/outcome`
    };
    return guidance[section];
  }

  if (jobType === 'career_changer') {
    const guidance: Record<string, string> = {
      summary: `**Career Changer Summary Framing:**
- Bridges old career to new — CRITICAL section for career changers
- Lead with transition narrative — explicitly state career change direction
- Include exact job title from JD, 2-3 new-career technical keywords, one quantified transferable achievement
- Must explicitly state: "Transitioning from [old field] to [new field]"
- Format: "[Years] in [old career], now [credential/training] to transition to [new field]"
- Example: "10 years in financial analysis, completed M.S. in Data Science to transition to machine learning engineering"`,

      experience: `**Career Changer Experience Framing:**
- Reframe prior experience with transferable skills emphasis
- Use new-career terminology to describe old achievements
- Connect old achievements to new-field value propositions
- Highlight analytical, leadership, and cross-functional skills
- Example: Marketing manager → "Led data-driven campaigns analyzing customer behavior" (emphasizes data/analytical skills for tech transition)
- Show how previous career provides unique perspective for new role`,

      skills: `**Career Changer Skills Framing:**
- Lead with new-career skills from master's program, bootcamp, or training
- Group transferable skills separately from new technical skills
- Use new-field terminology even for transferable skills
- Include certifications prominently — proof of commitment to new career
- Example structure: "Technical Skills: Python, SQL, TensorFlow | Transferable Skills: Project Management, Stakeholder Communication"`,

      education: `**Career Changer Education Framing (PRIMARY CREDENTIAL):**
- Master's degree, bootcamp, or certificate IS the pivot point — position prominently
- Include all relevant coursework — demonstrates new-field competency
- GPA if strong (3.5+) — proves academic excellence in new field
- Capstone project details if relevant to target role
- Position as demonstration of new-career credibility
- Example: "Master of Science in Computer Science, University of [X], 2024 | GPA: 3.8 | Capstone: Built scalable e-commerce platform"`,

      projects: `**Career Changer Projects Framing:**
- Bridge gap between careers — show progression in new field
- Emphasize capstone, bootcamp, certification projects prominently
- Use skills-transfer language: "Applied financial modeling expertise to build predictive ML model"
- Highlight how previous career informs new work uniquely
- Format like experience entries — demonstrate professional-level execution`
    };
    return guidance[section];
  }

  // Full-time
  const guidance: Record<string, string> = {
    summary: `**Full-time Position Summary Framing:**
- Lead with years of experience and domain expertise
- Emphasize track record of delivery and impact
- Highlight leadership, ownership, and initiative
- Quantify achievements where possible
- Education is supporting context, not the lead
- Tone: Confident, results-oriented, professional
- Example: "Results-driven software engineer with 5+ years..."
- Example: "Senior developer specializing in distributed systems..."`,

    experience: `**Full-time Position Experience Framing:**
- Lead with impact and business outcomes
- Quantify results (percentages, dollar amounts, scale)
- Show ownership and leadership (even without formal title)
- Highlight cross-functional collaboration and stakeholder management
- Demonstrate career progression and increasing responsibility
- Education supports but doesn't lead the narrative
- Example: "Led migration of 50+ microservices..." or "Drove 40% reduction in deployment time..."`,

    skills: `**Full-time Position Skills Framing:**
- Emphasize proficiency and production experience
- Highlight advanced/expert-level skills
- Include leadership and soft skills (mentoring, stakeholder management)
- Show breadth AND depth in key areas
- Include certifications and specialized expertise
- Professional skills take precedence over academic ones`,

    education: `**Full-time Position Education Framing (SUPPORTING CREDENTIAL):**
- Education supports but doesn't lead the resume
- Degree name and institution are most important
- Only include GPA if recent graduate (within 2-3 years) AND strong (3.5+)
- Coursework generally not needed unless highly specialized/relevant
- Focus on advanced degrees, certifications, specialized training
- Keep education section concise for experienced professionals
- Example: "M.S. Computer Science, Stanford University, 2020"
- Certifications and professional development can be more valuable than coursework`,

    projects: `**Full-time Position Projects Framing:**
- Supplement work experience — highlight standalone significant projects
- Keep concise — projects section is lower priority than experience for full-time candidates
- Open-source contributions, side projects, or major initiatives outside day job
- Show technical breadth or exploration of new technologies
- Only include if adds value beyond work experience`
  };
  return guidance[section];
}

/**
 * Derive effective candidate type from explicit candidateType or preferences fallback
 *
 * Until Story 18.9 wires detectCandidateType() into the pipeline, this helper
 * derives candidateType from preferences.jobType as a fallback.
 *
 * @param candidateType - Explicit candidate type (if provided)
 * @param preferences - User preferences (used for jobType fallback)
 * @returns Resolved CandidateType ('coop', 'fulltime', or 'career_changer')
 */
export function deriveEffectiveCandidateType(
  candidateType?: CandidateType,
  preferences?: { jobType?: string } | null
): CandidateType {
  return candidateType ?? (preferences?.jobType === 'coop' ? 'coop' : 'fulltime');
}

/**
 * Get candidate-type-specific guidance for each section
 *
 * Returns section-specific guidance on how to frame content based on
 * the candidate type detected from resume structure analysis.
 *
 * @param candidateType - The detected candidate type ('coop', 'fulltime', or 'career_changer')
 * @param section - The resume section ('summary', 'skills', 'experience', 'education', or 'projects')
 * @returns Formatted candidate-type guidance string for the LLM prompt
 */
export function getCandidateTypeGuidance(
  candidateType: CandidateType,
  section: 'summary' | 'skills' | 'experience' | 'education' | 'projects'
): string {
  if (candidateType === 'coop') {
    const coopGuidance: Record<string, string> = {
      summary: `**Co-op Candidate Summary Guidance:**
- Co-op candidates should NOT include a summary. If one exists, suggest removing it or condensing to 1 line.
- Wastes space on 1-page resume — education and projects are more valuable.
- If summary exists: recommend removal if generic, or condensation to single line if keyword-rich.`,

      skills: `**Co-op Candidate Skills Guidance:**
- Include 'Familiar with'/'Exposure to' for emerging skills.
- Highlight coursework-learned skills prominently.
- Show breadth over depth — exposure to many technologies is expected.
- Balance academic tools (Jupyter, MATLAB) with industry tools (Git, VS Code).`,

      experience: `**Co-op Candidate Experience Guidance:**
- Frame as learning experiences with growth mindset.
- Connect work to coursework where relevant.
- Use collaborative verbs — "Contributed to", "Worked with", "Supported".
- Be realistic about scope — avoid overstating responsibility.
- Mentorship and team collaboration should be highlighted.`,

      education: `**Co-op Candidate Education Guidance:**
- PRIMARY credential — most important section on resume.
- ALWAYS suggest coursework — critical for demonstrating relevant knowledge.
- GPA if 3.5+ is strongly recommended — proves academic excellence.
- Academic projects should be detailed.
- Expected graduation date format: "Expected May 2025" or "Expected Graduation: May 2025".
- Dean's List, honors, academic awards belong here.`,

      projects: `**Co-op Candidate Projects Guidance:**
- PRIMARY experience section — format like job entries with bullet points.
- Suggest 'Project Experience' or 'Academic Projects' as section heading.
- Emphasize individual contributions and technical skills learned.
- Connect projects to coursework where applicable.
- Include technologies used, problem solved, and impact/outcome.`
    };
    return coopGuidance[section];
  }

  if (candidateType === 'career_changer') {
    const careerChangerGuidance: Record<string, string> = {
      summary: `**Career Changer Summary Guidance:**
- CRITICAL section — must bridge old career to new.
- Explicitly state transition narrative in first sentence.
- Include: exact job title from JD, 2-3 new-career technical keywords, one transferable achievement.
- Format: "[Years] experience in [old field], transitioning to [new field] through [credential]. Skilled in [new skills] with proven [transferable skill]."
- Length: 2-3 sentences maximum.
- Must clearly articulate why this candidate is viable despite career change.`,

      skills: `**Career Changer Skills Guidance:**
- Lead with new-career technical skills from master's program, bootcamp, or certification.
- Follow with transferable skills from previous career (leadership, project management, communication).
- Use new-field terminology even for transferable skills — reframe in target industry language.
- Group skills: "Technical Skills" (new), "Transferable Skills" (from previous career).
- Include certifications prominently — proof of new-career commitment.`,

      experience: `**Career Changer Experience Guidance:**
- Reframe prior experience with transferable skills emphasis.
- Use new-career terminology to describe old work — translate achievements into target field language.
- Connect old role achievements to new-field value propositions.
- Highlight cross-functional, analytical, problem-solving, and leadership skills.
- Example: "Led 10-person team (leadership) analyzing customer data (analytical skills) to improve retention (business impact)" → translates to tech product role.`,

      education: `**Career Changer Education Guidance:**
- PRIMARY credential — the master's degree, bootcamp, or certificate IS the pivot point.
- Position prominently — this is proof of new-career competency.
- Include all relevant coursework, capstone project, GPA if strong (3.5+).
- Emphasize: "Master of Science in Computer Science" not just "M.S."
- Capstone/thesis should be detailed if relevant to target role.
- Demonstrate new-field expertise through academic credentials.`,

      projects: `**Career Changer Projects Guidance:**
- Bridge gap between careers — show progression in new field.
- Emphasize capstone, bootcamp, certification projects prominently.
- Use skills-transfer language: "Applied [old skill] to [new context]".
- Highlight how previous career informs new work uniquely.
- Format like experience entries — show professional-level project execution.`
    };
    return careerChangerGuidance[section];
  }

  // fulltime
  const fulltimeGuidance: Record<string, string> = {
    summary: `**Full-time Candidate Summary Guidance:**
- Include if tailored and specific — skip if generic.
- Lead with years of experience and domain expertise.
- Quantify achievements — "5+ years", "led teams of 10+", "delivered $2M in savings".
- Skip generic buzzwords — must be specific to this candidate and this role.
- If summary is generic/buzzwordy, suggest removing entirely.`,

    skills: `**Full-time Candidate Skills Guidance:**
- Emphasize proficiency and production experience.
- Advanced/expert-level skills should be highlighted.
- Include leadership skills (mentoring, team leadership, stakeholder management).
- Show depth in primary skill areas.
- Certifications and specialized expertise belong prominently.`,

    experience: `**Full-time Candidate Experience Guidance:**
- Lead with impact and business outcomes.
- Quantify results — percentages, dollar amounts, scale ("reduced costs by 40%", "led team of 8").
- Show ownership and leadership even without formal title.
- Demonstrate career progression and increasing responsibility.
- Cross-functional collaboration and stakeholder management are key.`,

    education: `**Full-time Candidate Education Guidance:**
- Supporting credential only — degree and institution most important.
- Skip GPA unless recent graduate (within 2-3 years) AND strong (3.5+).
- Coursework generally not needed unless highly specialized.
- Focus on advanced degrees, certifications, specialized training.
- Keep concise — 1-2 lines for most experienced professionals.`,

    projects: `**Full-time Candidate Projects Guidance:**
- Supplement work experience — highlight standalone significant projects.
- Keep concise — projects section is lower priority than experience.
- Open-source contributions, side projects, or major initiatives outside day job.
- Show technical breadth or exploration of new technologies.`
  };
  return fulltimeGuidance[section];
}
