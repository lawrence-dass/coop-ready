/**
 * E2E Test Data Helper
 *
 * Provides utilities for creating and cleaning up test data during E2E tests.
 * Uses the test API endpoints to manage data via HTTP requests.
 *
 * @see Story 10.2: Fix Download Resume Error
 * @see app/api/test/* - Test API endpoints
 */

import { Page, APIRequestContext } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface User {
  id: string
  email: string
  experienceLevel: string
}

interface Profile {
  userId: string
  experienceLevel: string
}

interface Resume {
  id: string
  fileName: string
  userId: string
}

interface Scan {
  id: string
  userId: string
  resumeId: string
}

interface Suggestion {
  id: string
  scanId: string
  status: string
}

interface CreateScanOptions {
  userId: string
  resumeId: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  atsScore?: number
}

interface CreateSuggestionOptions {
  scanId: string
  userId: string
  status?: 'pending' | 'accepted' | 'rejected'
}

/**
 * Helper class for managing test data in E2E tests
 */
export class TestDataHelper {
  private page: Page
  private request: APIRequestContext
  private createdUsers: string[] = []
  private createdResumes: string[] = []
  private createdScans: string[] = []
  private testEmail: string

  constructor(page: Page) {
    this.page = page
    this.request = page.request
    this.testEmail = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`
  }

  /**
   * Create an authenticated user with browser session
   */
  async createAuthenticatedUser(): Promise<{ user: User; profile: Profile }> {
    const password = 'TestPassword123!'

    // Create user via test API
    const createResponse = await this.request.post(`${BASE_URL}/api/test/users`, {
      data: {
        email: this.testEmail,
        password,
        experienceLevel: 'student',
      },
    })

    if (!createResponse.ok()) {
      const error = await createResponse.json()
      throw new Error(`Failed to create user: ${error.error?.message || 'Unknown error'}`)
    }

    const { data } = await createResponse.json()
    this.createdUsers.push(data.userId)

    // Log in via browser to establish session
    await this.page.goto(`${BASE_URL}/auth/login`)
    await this.page.fill('input[name="email"]', this.testEmail)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')

    // Wait for redirect to dashboard (indicates successful login)
    await this.page.waitForURL(/dashboard|onboarding/, { timeout: 10000 })

    return {
      user: {
        id: data.userId,
        email: data.email,
        experienceLevel: data.experienceLevel,
      },
      profile: {
        userId: data.userId,
        experienceLevel: data.experienceLevel,
      },
    }
  }

  /**
   * Create a resume for a user
   */
  async createResume(userId: string): Promise<Resume> {
    const response = await this.request.post(`${BASE_URL}/api/test/resumes`, {
      data: {
        userId,
        fileName: `test-resume-${Date.now()}.pdf`,
        textContent: `
          John Doe
          Software Engineer

          EXPERIENCE
          Senior Developer at Tech Corp (2020-Present)
          - Developed scalable web applications using React and Node.js
          - Led team of 5 engineers on critical projects
          - Improved system performance by 40%

          EDUCATION
          BS Computer Science, State University (2016-2020)

          SKILLS
          JavaScript, TypeScript, React, Node.js, Python
        `.trim(),
      },
    })

    if (!response.ok()) {
      const error = await response.json()
      throw new Error(`Failed to create resume: ${error.error?.message || 'Unknown error'}`)
    }

    const { data } = await response.json()
    this.createdResumes.push(data.resumeId)

    return {
      id: data.resumeId,
      fileName: data.fileName,
      userId: data.userId,
    }
  }

  /**
   * Create a scan with optional status
   */
  async createScan(options: CreateScanOptions): Promise<Scan> {
    const response = await this.request.post(`${BASE_URL}/api/test/scans`, {
      data: {
        userId: options.userId,
        resumeId: options.resumeId,
        jobDescription: `
          We are looking for a Senior Software Engineer to join our team.

          Requirements:
          - 5+ years of experience with JavaScript/TypeScript
          - Strong knowledge of React and Node.js
          - Experience with cloud platforms (AWS, GCP)
          - Excellent communication skills

          Nice to have:
          - Experience with Python
          - Knowledge of CI/CD pipelines
        `.trim(),
        status: options.status,
        atsScore: options.atsScore ?? (options.status === 'completed' ? 72 : undefined),
      },
    })

    if (!response.ok()) {
      const error = await response.json()
      throw new Error(`Failed to create scan: ${error.error?.message || 'Unknown error'}`)
    }

    const { data } = await response.json()
    this.createdScans.push(data.scanId)

    return {
      id: data.scanId,
      userId: data.userId,
      resumeId: data.resumeId,
    }
  }

  /**
   * Create a suggestion for a scan
   */
  async createSuggestion(options: CreateSuggestionOptions): Promise<Suggestion> {
    const response = await this.request.post(`${BASE_URL}/api/test/suggestions`, {
      data: {
        scanId: options.scanId,
        section: 'experience',
        itemIndex: 0,
        suggestionType: 'bullet_rewrite',
        originalText: 'Developed web applications',
        suggestedText: 'Engineered high-performance web applications serving 100K+ daily users',
        reasoning: 'Added quantification and stronger action verb',
        status: options.status,
      },
    })

    if (!response.ok()) {
      const error = await response.json()
      throw new Error(`Failed to create suggestion: ${error.error?.message || 'Unknown error'}`)
    }

    const { data } = await response.json()

    return {
      id: data.suggestionId,
      scanId: data.scanId,
      status: data.status,
    }
  }

  /**
   * Clean up all created test data
   */
  async cleanup(): Promise<void> {
    // Delete scans (this will cascade delete suggestions)
    for (const scanId of this.createdScans) {
      try {
        await this.request.delete(`${BASE_URL}/api/test/scans/${scanId}`)
      } catch {
        // Ignore cleanup errors
      }
    }

    // Delete resumes
    for (const resumeId of this.createdResumes) {
      try {
        await this.request.delete(`${BASE_URL}/api/test/resumes/${resumeId}`)
      } catch {
        // Ignore cleanup errors
      }
    }

    // Delete users
    for (const userId of this.createdUsers) {
      try {
        await this.request.delete(`${BASE_URL}/api/test/users/${userId}`)
      } catch {
        // Ignore cleanup errors
      }
    }

    // Clear arrays
    this.createdScans = []
    this.createdResumes = []
    this.createdUsers = []
  }
}
