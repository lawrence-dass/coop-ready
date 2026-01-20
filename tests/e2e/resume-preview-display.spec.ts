import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

/**
 * E2E Tests for Story 3.4: Resume Preview Display
 * Tests the complete flow: View parsed resume with sections, error states, and loading states
 * These tests should FAIL initially (red phase), then pass after implementation
 */

// Initialize Supabase client for database setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_TIMEOUT = 30000;

test.describe('Resume Preview Display (Story 3.4)', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testResumeId: string;

  test.beforeEach(async () => {
    // Create a test user for authentication
    const email = faker.internet.email();
    const { data: userData } = await supabase.auth.admin.createUser({
      email,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    testUserId = userData.user!.id;
    testUserEmail = email;
  });

  test.afterEach(async () => {
    // Cleanup: Delete test resume and user
    if (testResumeId) {
      await supabase.from('resumes').delete().eq('id', testResumeId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  /**
   * AC1: Resume Preview with Sections
   * GIVEN: My resume has been uploaded and processed (extraction + parsing complete)
   * WHEN: I view the resume preview
   * THEN: I see my resume content organized by section
   * AND: Each section (Contact, Education, Experience, Skills, Projects) is clearly labeled
   * AND: The content matches what's in my original resume
   */
  test('AC1: Should display resume preview with all sections clearly labeled', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Resume has been uploaded and processed
    const resumeData = {
      user_id: testUserId,
      file_name: 'john-doe-resume.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      extraction_error: null,
      parsing_status: 'completed',
      parsing_error: null,
      extracted_text: 'John Doe, Software Engineer...',
      parsed_sections: {
        contact: 'John Doe\njohn.doe@example.com\n(555) 123-4567',
        summary: 'Experienced full-stack developer with 5+ years of expertise.',
        education: [
          {
            institution: 'State University',
            degree: 'B.S. Computer Science',
            dates: '2015-2019',
            gpa: '3.8/4.0',
          },
        ],
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Developer',
            dates: 'June 2021 - Present',
            bulletPoints: [
              'Led development team of 5 engineers',
              'Implemented microservices architecture',
              'Reduced API response time by 40%',
            ],
          },
        ],
        skills: [
          { name: 'Python', category: 'technical' },
          { name: 'JavaScript', category: 'technical' },
          { name: 'Leadership', category: 'soft' },
        ],
        projects: 'E-commerce Platform: Full-stack MERN application',
        other: '',
      },
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    // Login as test user
    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the resume preview
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see my resume content organized by section
    await expect(page.locator('[data-testid="resume-preview-container"]')).toBeVisible();

    // AND: Each section is clearly labeled
    await expect(page.locator('[data-testid="contact-section-header"]')).toHaveText(/Contact/i);
    await expect(page.locator('[data-testid="summary-section-header"]')).toHaveText(/Summary/i);
    await expect(page.locator('[data-testid="education-section-header"]')).toHaveText(/Education/i);
    await expect(page.locator('[data-testid="experience-section-header"]')).toHaveText(/Experience/i);
    await expect(page.locator('[data-testid="skills-section-header"]')).toHaveText(/Skills/i);
    await expect(page.locator('[data-testid="projects-section-header"]')).toHaveText(/Projects/i);

    // AND: The content matches what's in my original resume
    await expect(page.locator('[data-testid="contact-section-content"]')).toContainText('John Doe');
    await expect(page.locator('[data-testid="contact-section-content"]')).toContainText(
      'john.doe@example.com'
    );
  });

  /**
   * AC2: Experience Section Display
   * GIVEN: I am viewing the resume preview
   * WHEN: I look at the Experience section
   * THEN: I see each job entry with company, title, and dates
   * AND: Bullet points are displayed in a readable format
   * AND: Section is expandable/collapsible
   */
  test('AC2: Should display Experience section with job entries and expandable/collapsible behavior', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Resume with multiple job entries
    const resumeData = {
      user_id: testUserId,
      file_name: 'resume.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      parsing_status: 'completed',
      extracted_text: 'Experience data...',
      parsed_sections: {
        contact: 'Contact info',
        summary: 'Summary',
        education: [],
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Developer',
            dates: 'June 2021 - Present',
            bulletPoints: [
              'Led development team of 5 engineers',
              'Implemented microservices architecture',
            ],
          },
          {
            company: 'StartupXYZ',
            title: 'Junior Developer',
            dates: 'Jan 2020 - May 2021',
            bulletPoints: ['Built React components', 'Implemented REST API endpoints'],
          },
        ],
        skills: [],
        projects: '',
        other: '',
      },
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the Experience section
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see each job entry with company, title, and dates
    const firstJob = page.locator('[data-testid="experience-entry-0"]');
    await expect(firstJob.locator('[data-testid="job-company"]')).toContainText('Tech Corp');
    await expect(firstJob.locator('[data-testid="job-title"]')).toContainText('Senior Developer');
    await expect(firstJob.locator('[data-testid="job-dates"]')).toContainText('June 2021');

    // AND: Bullet points are displayed in a readable format
    const bulletPoints = firstJob.locator('[data-testid="job-bullet-points"] li');
    await expect(bulletPoints).toHaveCount(2);
    await expect(bulletPoints.nth(0)).toContainText('Led development team');
    await expect(bulletPoints.nth(1)).toContainText('Implemented microservices');

    // AND: Section is expandable/collapsible
    const experienceSection = page.locator('[data-testid="experience-section"]');
    const collapseButton = experienceSection.locator('[data-testid="section-collapse-button"]');

    // Click to collapse
    await collapseButton.click();
    await expect(firstJob).not.toBeVisible();

    // Click to expand
    await collapseButton.click();
    await expect(firstJob).toBeVisible();
  });

  /**
   * AC3: Skills Section Display
   * GIVEN: I am viewing the resume preview
   * WHEN: I look at the Skills section
   * THEN: I see my skills listed clearly
   * AND: Technical skills are visually distinguished from soft skills
   * AND: Skills are displayed as chips or tags
   */
  test('AC3: Should display Skills section with technical/soft skills visually distinguished as chips', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Resume with technical and soft skills
    const resumeData = {
      user_id: testUserId,
      file_name: 'resume.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      parsing_status: 'completed',
      extracted_text: 'Skills data...',
      parsed_sections: {
        contact: 'Contact info',
        summary: 'Summary',
        education: [],
        experience: [],
        skills: [
          { name: 'Python', category: 'technical' },
          { name: 'JavaScript', category: 'technical' },
          { name: 'React', category: 'technical' },
          { name: 'Leadership', category: 'soft' },
          { name: 'Communication', category: 'soft' },
        ],
        projects: '',
        other: '',
      },
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I look at the Skills section
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see my skills listed clearly
    const skillsSection = page.locator('[data-testid="skills-section-content"]');
    await expect(skillsSection).toBeVisible();

    // AND: Skills are displayed as chips or tags
    const skillChips = page.locator('[data-testid^="skill-chip-"]');
    await expect(skillChips).toHaveCount(5);

    // AND: Technical skills are visually distinguished from soft skills
    const pythonChip = page.locator('[data-testid="skill-chip-Python"]');
    await expect(pythonChip).toHaveAttribute('data-category', 'technical');

    const leadershipChip = page.locator('[data-testid="skill-chip-Leadership"]');
    await expect(leadershipChip).toHaveAttribute('data-category', 'soft');

    // Verify visual distinction (technical skills should have different color)
    const technicalChipClass = await pythonChip.getAttribute('class');
    const softChipClass = await leadershipChip.getAttribute('class');
    expect(technicalChipClass).not.toBe(softChipClass);
  });

  /**
   * AC4: Error State Display
   * GIVEN: Extraction or parsing failed
   * WHEN: I view the preview area
   * THEN: I see the error message explaining what went wrong
   * AND: I see an option to re-upload my resume
   * AND: I see a clear call-to-action to retry
   */
  test('AC4: Should display error state with message and re-upload option when parsing fails', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Parsing failed
    const resumeData = {
      user_id: testUserId,
      file_name: 'corrupted-resume.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      parsing_status: 'failed',
      parsing_error: 'Unable to parse resume sections. The document structure is not recognized.',
      extracted_text: 'Some extracted text',
      parsed_sections: null,
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the preview area
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see the error message explaining what went wrong
    const errorContainer = page.locator('[data-testid="error-preview-container"]');
    await expect(errorContainer).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Unable to parse resume sections'
    );

    // AND: I see an option to re-upload my resume
    const reuploadButton = page.locator('[data-testid="reupload-button"]');
    await expect(reuploadButton).toBeVisible();
    await expect(reuploadButton).toHaveText(/Re-upload|Upload/i);

    // AND: I see a clear call-to-action to retry
    await expect(reuploadButton).toBeEnabled();
  });

  /**
   * AC4b: Error State for Extraction Failure
   */
  test('AC4b: Should display error state when extraction fails', async ({ page, context }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Extraction failed
    const resumeData = {
      user_id: testUserId,
      file_name: 'unreadable.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'failed',
      extraction_error: 'Unable to extract text from PDF. File may be corrupted or encrypted.',
      parsing_status: 'pending',
      extracted_text: null,
      parsed_sections: null,
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the preview area
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see extraction error message
    await expect(page.locator('[data-testid="error-preview-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Unable to extract text from PDF'
    );
  });

  /**
   * AC5: Loading State Display
   * GIVEN: Processing is still in progress
   * WHEN: I view the preview area
   * THEN: I see a loading skeleton or spinner
   * AND: The UI updates automatically when processing completes
   * AND: No errors appear for in-progress operations
   */
  test('AC5: Should display loading skeleton while processing and auto-update when complete', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Processing is still in progress
    const resumeData = {
      user_id: testUserId,
      file_name: 'resume-processing.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      parsing_status: 'pending',
      extracted_text: 'Some text...',
      parsed_sections: null,
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the preview area
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see a loading skeleton or spinner
    const loadingPreview = page.locator('[data-testid="loading-preview-container"]');
    await expect(loadingPreview).toBeVisible();
    await expect(page.locator('[data-testid="loading-message"]')).toContainText(
      /Processing|Analyzing/i
    );

    // AND: No errors appear for in-progress operations
    await expect(page.locator('[data-testid="error-preview-container"]')).not.toBeVisible();

    // Simulate processing completion
    await supabase
      .from('resumes')
      .update({
        parsing_status: 'completed',
        parsed_sections: {
          contact: 'John Doe',
          summary: 'Summary',
          education: [],
          experience: [],
          skills: [],
          projects: '',
          other: '',
        },
      })
      .eq('id', testResumeId);

    // AND: The UI updates automatically when processing completes
    // Wait for polling to detect the change (assuming 2-3 second polling interval)
    await page.waitForTimeout(4000);
    await expect(loadingPreview).not.toBeVisible();
    await expect(page.locator('[data-testid="resume-preview-container"]')).toBeVisible();
  });

  /**
   * AC6: Proceed Button Control
   * GIVEN: Resume has been successfully extracted and parsed
   * WHEN: I view the preview
   * THEN: I see an enabled "Proceed to Analysis" button
   * AND: Clicking proceeds to next step (job description input or analysis)
   */
  test('AC6: Should enable Proceed button when parsing complete and navigate on click', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Resume has been successfully extracted and parsed
    const resumeData = {
      user_id: testUserId,
      file_name: 'complete-resume.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      parsing_status: 'completed',
      extracted_text: 'Resume text',
      parsed_sections: {
        contact: 'John Doe',
        summary: 'Experienced developer',
        education: [],
        experience: [],
        skills: [],
        projects: '',
        other: '',
      },
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the preview
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: I see an enabled "Proceed to Analysis" button
    const proceedButton = page.locator('[data-testid="proceed-button"]');
    await expect(proceedButton).toBeVisible();
    await expect(proceedButton).toBeEnabled();
    await expect(proceedButton).toHaveText(/Proceed|Continue|Next/i);

    // AND: Clicking proceeds to next step
    await proceedButton.click();
    await page.waitForURL(/\/(scan\/job-description|analysis)/);
  });

  /**
   * AC6b: Proceed Button Disabled State
   */
  test('AC6b: Should disable Proceed button when parsing is not complete', async ({
    page,
    context,
  }) => {
    test.setTimeout(TEST_TIMEOUT);

    // GIVEN: Parsing is still pending
    const resumeData = {
      user_id: testUserId,
      file_name: 'resume.pdf',
      file_type: 'pdf',
      file_size: 102400,
      extraction_status: 'completed',
      parsing_status: 'pending',
      extracted_text: 'Resume text',
      parsed_sections: null,
    };

    const { data: resume } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();
    testResumeId = resume.id;

    await context.request.post('/api/auth/login', {
      data: { email: testUserEmail, password: 'TestPassword123!' },
    });

    // WHEN: I view the preview
    await page.goto(`/scan/preview?resumeId=${testResumeId}`);

    // THEN: Proceed button should not be visible (or disabled)
    const proceedButton = page.locator('[data-testid="proceed-button"]');
    const isVisible = await proceedButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(proceedButton).toBeDisabled();
    } else {
      await expect(proceedButton).not.toBeVisible();
    }
  });
});
