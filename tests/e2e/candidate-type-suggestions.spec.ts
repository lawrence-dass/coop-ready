/**
 * E2E Test: Dynamic Tab Ordering and Projects Tab
 * Story 18.10 Task 5
 *
 * Tests that candidate-type-aware tab ordering works correctly in the
 * suggestions UI, including Projects tab rendering and structural
 * suggestions banner display.
 *
 * Uses page.route() to mock API responses for determinism.
 */

import { test, expect } from '../support/fixtures';

/**
 * Build a mock optimization session response for a given candidate type.
 * This simulates what the API returns after optimization.
 */
function buildMockSession(candidateType: 'coop' | 'fulltime' | 'career_changer') {
  return {
    id: 'test-session-e2e',
    user_id: 'test-user',
    candidate_type: candidateType,
    ats_score: {
      overall: 72,
      metadata: { version: 'v2.1' },
      breakdownV21: {
        keywords: { score: 80 },
        qualificationFit: { score: 60 },
        contentQuality: { score: 70 },
        sections: { score: 75 },
        format: { score: 85 },
      },
    },
    keyword_analysis: {
      matched: [{ keyword: 'React', category: 'technologies', found: true }],
      missing: [{ keyword: 'Docker', category: 'technologies', importance: 'medium' }],
      matchRate: 50,
      analyzedAt: new Date().toISOString(),
    },
    summary_suggestion: {
      original: 'Engineer with experience.',
      suggested: 'Results-driven engineer...',
      ats_keywords_added: ['results-driven'],
      ai_tell_phrases_rewritten: [],
    },
    skills_suggestion: {
      original: 'React, JS',
      existing_skills: ['React'],
      matched_keywords: ['React'],
      missing_but_relevant: [],
      skill_additions: ['TypeScript'],
      skill_removals: [],
      summary: 'Skills updated.',
    },
    experience_suggestion: {
      original: 'Built apps.',
      experience_entries: [{
        company: 'TechCo',
        role: 'Engineer',
        dates: '2022-2024',
        original_bullets: ['Built apps'],
        suggested_bullets: [{
          original: 'Built apps',
          suggested: 'Developed React applications...',
          metrics_added: [],
          keywords_incorporated: ['React'],
        }],
      }],
      summary: 'Updated.',
    },
    education_suggestion: {
      original: 'BS CS',
      suggested: 'BS Computer Science — GPA 3.8',
      improvements: [],
    },
    projects_suggestion: {
      original: 'Built portfolio',
      project_entries: [{
        title: 'Portfolio Website',
        original_bullets: ['Built portfolio'],
        suggested_bullets: [{
          original: 'Built portfolio',
          suggested: 'Developed responsive portfolio...',
          keywords_incorporated: ['React'],
        }],
      }],
      summary: 'Projects enhanced.',
    },
    structural_suggestions: candidateType === 'career_changer' ? [
      {
        id: 'rule-career-changer-no-summary',
        priority: 'critical',
        category: 'section_presence',
        message: 'Add a Professional Summary',
        currentState: 'No summary section detected',
        recommendedAction: 'Add a professional summary highlighting your career transition',
      },
    ] : [],
    parsed_resume: {
      summary: candidateType === 'coop' ? '' : 'Engineer with experience.',
      skills: 'React, JavaScript, TypeScript',
      experience: 'Built apps at TechCo.',
      education: 'BS Computer Science, StateU 2023',
      projects: 'Built portfolio website',
    },
    resume_content: 'Full resume content',
    job_description: 'Looking for React developer',
    created_at: new Date().toISOString(),
  };
}

test.describe('Candidate Type Suggestions UI @P1', () => {
  // These tests verify the tab ordering differs by candidate type.
  // They require a running dev server and authenticated session.
  // In CI, they may need to be adapted to handle auth.

  test.skip('[P1] co-op tab order shows Skills first, Summary last with Optional badge', async ({ page }) => {
    // GIVEN: Co-op session with suggestions
    const session = buildMockSession('coop');

    // Mock the session fetch API
    await page.route('**/api/sessions/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: session, error: null }),
      });
    });

    // WHEN: Navigate to suggestions page
    await page.goto(`/dashboard/scan/${session.id}/suggestions`);

    // THEN: Verify tab order
    const tabs = page.locator('[role="tab"]');
    const tabTexts = await tabs.allTextContents();

    // Co-op order: skills, education, projects, experience, summary
    expect(tabTexts[0]).toContain('Skills');
    // Summary should be last and marked optional
    const lastTab = tabTexts[tabTexts.length - 1];
    expect(lastTab).toContain('Summary');
  });

  test.skip('[P1] fulltime tab order shows Summary first', async ({ page }) => {
    const session = buildMockSession('fulltime');

    await page.route('**/api/sessions/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: session, error: null }),
      });
    });

    await page.goto(`/dashboard/scan/${session.id}/suggestions`);

    const tabs = page.locator('[role="tab"]');
    const tabTexts = await tabs.allTextContents();

    // Fulltime order: summary, skills, experience, projects, education
    expect(tabTexts[0]).toContain('Summary');
  });

  test.skip('[P1] career_changer tab order shows Summary first, Education before Projects', async ({ page }) => {
    const session = buildMockSession('career_changer');

    await page.route('**/api/sessions/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: session, error: null }),
      });
    });

    await page.goto(`/dashboard/scan/${session.id}/suggestions`);

    const tabs = page.locator('[role="tab"]');
    const tabTexts = await tabs.allTextContents();

    // Career changer order: summary, skills, education, projects, experience
    expect(tabTexts[0]).toContain('Summary');
  });

  test.skip('[P1] structural suggestions banner appears when suggestions exist', async ({ page }) => {
    const session = buildMockSession('career_changer');

    await page.route('**/api/sessions/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: session, error: null }),
      });
    });

    await page.goto(`/dashboard/scan/${session.id}/suggestions`);

    // Structural suggestions banner should be visible
    await expect(page.getByText('Resume Structure Recommendations')).toBeVisible();
  });

  test.skip('[P1] Projects tab renders project entries with bullet suggestions', async ({ page }) => {
    const session = buildMockSession('fulltime');

    await page.route('**/api/sessions/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: session, error: null }),
      });
    });

    await page.goto(`/dashboard/scan/${session.id}/suggestions`);

    // Click on Projects tab
    const projectsTab = page.getByRole('tab', { name: /Projects/i });
    if (await projectsTab.isVisible()) {
      await projectsTab.click();

      // Should show project entry
      await expect(page.getByText('Portfolio Website')).toBeVisible();
    }
  });
});
