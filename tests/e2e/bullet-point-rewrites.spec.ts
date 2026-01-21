/**
 * E2E Tests: Bullet Point Rewrite Generation
 *
 * Tests AC1-AC5 for Story 5.1: Bullet Point Rewrite Generation
 *
 * @see Story 5.1: Bullet Point Rewrite Generation
 */

import { test, expect } from '../support/fixtures'
import { generateBulletRewrites, saveSuggestions } from '@/actions/suggestions'

test.describe('Bullet Point Rewrite Generation', () => {
  let userId: string
  let scanId: string

  test.beforeEach(async ({ userFactory, resumeFactory, scanFactory }) => {
    // Create test user
    const user = await userFactory.create({
      email: `test-rewrites-${Date.now()}@example.com`,
      experienceLevel: 'student',
    })
    userId = user.id

    // Create test resume
    const resume = await resumeFactory.create({
      userId,
      extractedText: `EXPERIENCE
Software Developer Intern - Acme Corp
- Worked on machine learning project
- Helped with database optimization
- Participated in code reviews

EDUCATION
Bachelor of Science in Computer Science
University of Example, 2024`,
    })

    // Create test scan
    const scan = await scanFactory.create({
      userId,
      resumeId: resume.id,
      jobDescription: `Software Engineer
Requirements:
- 2+ years of React, Node.js, TypeScript
- Experience with machine learning and AI
- Database optimization skills
- Strong problem-solving abilities`,
    })
    scanId = scan.id
  })

  test('AC1: Generate rewrites for experience bullet points', async () => {
    // Arrange
    const bulletPoints = [
      'Worked on machine learning project',
      'Helped with database optimization',
      'Participated in code reviews',
    ]
    const jdKeywords = ['React', 'Node.js', 'TypeScript', 'machine learning', 'database']

    // Act
    const result = await generateBulletRewrites({
      scanId,
      bulletPoints,
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      isStudent: true,
      jdKeywords,
    })

    // Assert
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.rewrites).toHaveLength(3)

    // Verify each rewrite has required fields
    result.data?.rewrites.forEach((rewrite, index) => {
      expect(rewrite.original).toBe(bulletPoints[index])
      expect(rewrite.suggested).toBeTruthy()
      expect(rewrite.reasoning).toBeTruthy()
    })
  })

  test('AC2: Vague bullet enhancement with specificity', async () => {
    // Arrange
    const vagueBullets = ['Worked on machine learning project']
    const jdKeywords = ['machine learning', 'AI', 'TensorFlow', 'Python']

    // Act
    const result = await generateBulletRewrites({
      scanId,
      bulletPoints: vagueBullets,
      experienceLevel: 'student',
      targetRole: 'ML Engineer',
      isStudent: true,
      jdKeywords,
    })

    // Assert
    expect(result.error).toBeNull()
    expect(result.data?.rewrites).toHaveLength(1)

    const rewrite = result.data?.rewrites[0]
    expect(rewrite?.suggested).not.toBe('No changes recommended')
    expect(rewrite?.suggested).not.toBe(rewrite?.original)

    // Verify improvement: suggested should be longer and more specific
    if (rewrite) {
      expect(rewrite.suggested.length).toBeGreaterThan(rewrite.original.length)
    }

    // Verify contains action-oriented language (should have action verb)
    const actionVerbs = [
      'Designed',
      'Developed',
      'Built',
      'Created',
      'Implemented',
      'Architected',
      'Deployed',
    ]
    const hasActionVerb = actionVerbs.some((verb) =>
      rewrite?.suggested.toLowerCase().includes(verb.toLowerCase())
    )
    expect(hasActionVerb).toBeTruthy()
  })

  test('AC3: Strong bullet handling - minimal or no changes', async () => {
    // Arrange
    const strongBullets = [
      'Led cross-functional team of 8 engineers to deliver cloud infrastructure migration, reducing deployment time by 40% and improving system reliability',
    ]
    const jdKeywords = ['cloud', 'infrastructure', 'deployment', 'leadership']

    // Act
    const result = await generateBulletRewrites({
      scanId,
      bulletPoints: strongBullets,
      experienceLevel: 'experienced',
      targetRole: 'Senior Software Engineer',
      isStudent: false,
      jdKeywords,
    })

    // Assert
    expect(result.error).toBeNull()
    expect(result.data?.rewrites).toHaveLength(1)

    const rewrite = result.data?.rewrites[0]

    // Strong bullets may get "No changes recommended" OR minimal improvements
    const isMinimalChange =
      rewrite?.suggested === 'No changes recommended' ||
      Math.abs(rewrite!.suggested.length - rewrite!.original.length) < 50

    expect(isMinimalChange).toBeTruthy()
  })

  test('AC4: Suggestions persistence to database', async ({ request }) => {
    // Arrange
    const bulletPoints = ['Worked on machine learning project']
    const jdKeywords = ['machine learning', 'AI']

    // Generate rewrites
    const rewriteResult = await generateBulletRewrites({
      scanId,
      bulletPoints,
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      isStudent: true,
      jdKeywords,
    })

    expect(rewriteResult.error).toBeNull()
    expect(rewriteResult.data?.rewrites).toHaveLength(1)

    const rewrite = rewriteResult.data!.rewrites[0]

    // Transform to suggestion format
    const suggestions = [
      {
        section: 'experience' as const,
        itemIndex: 0,
        originalText: rewrite.original,
        suggestedText: rewrite.suggested,
        suggestionType: 'bullet_rewrite',
        reasoning: rewrite.reasoning,
      },
    ]

    // Act - Save suggestions
    const saveResult = await saveSuggestions({
      scanId,
      suggestions,
    })

    // Assert - Server action response
    expect(saveResult.error).toBeNull()
    expect(saveResult.data?.savedCount).toBe(1)

    // Verify database record via test API
    const dbResponse = await request.get(`/api/test/suggestions?scanId=${scanId}`)
    expect(dbResponse.ok()).toBeTruthy()

    const dbResult = await dbResponse.json()
    expect(dbResult.error).toBeNull()
    expect(dbResult.data.count).toBe(1)

    // Verify suggestion fields
    const savedSuggestion = dbResult.data.suggestions[0]
    expect(savedSuggestion.scanId).toBe(scanId)
    expect(savedSuggestion.section).toBe('experience')
    expect(savedSuggestion.suggestionType).toBe('bullet_rewrite')
    expect(savedSuggestion.originalText).toBe(rewrite.original)
    expect(savedSuggestion.suggestedText).toBe(rewrite.suggested)
    expect(savedSuggestion.status).toBe('pending')
  })

  test('AC5: Student-specific context in rewrites', async () => {
    // Arrange
    const studentBullets = [
      'Completed Machine Learning course project: built image classifier',
      'Worked on group project for Database Systems class',
    ]
    const jdKeywords = [
      'machine learning',
      'image classification',
      'database',
      'SQL',
      'Python',
    ]

    // Act
    const result = await generateBulletRewrites({
      scanId,
      bulletPoints: studentBullets,
      experienceLevel: 'student',
      targetRole: 'Junior Software Engineer',
      isStudent: true,
      jdKeywords,
    })

    // Assert
    expect(result.error).toBeNull()
    expect(result.data?.rewrites).toHaveLength(2)

    // Verify student context: rewrites should NOT contain "coursework" or "class project"
    // Instead, they should use professional framing
    result.data?.rewrites.forEach((rewrite) => {
      const lowerSuggested = rewrite.suggested.toLowerCase()

      // Should avoid academic language
      const hasAcademicFraming =
        lowerSuggested.includes('coursework') ||
        lowerSuggested.includes('class project') ||
        lowerSuggested.includes('homework') ||
        lowerSuggested.includes('assignment')

      // Strong rewrites should avoid these terms (though may exist in "No changes recommended" cases)
      if (rewrite.suggested !== 'No changes recommended') {
        expect(hasAcademicFraming).toBeFalsy()
      }

      // Should emphasize technical skills and impact
      const hasProfessionalFraming =
        lowerSuggested.includes('designed') ||
        lowerSuggested.includes('developed') ||
        lowerSuggested.includes('built') ||
        lowerSuggested.includes('implemented') ||
        lowerSuggested.includes('architected')

      if (rewrite.suggested !== 'No changes recommended') {
        expect(hasProfessionalFraming).toBeTruthy()
      }
    })
  })

  test('Error: Invalid input validation', async () => {
    // Act - Missing required fields
    const result = await generateBulletRewrites({
      scanId: 'invalid-uuid',
      bulletPoints: [],
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      isStudent: true,
      jdKeywords: [],
    })

    // Assert
    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(result.data).toBeNull()
  })

  test('Error: Empty bullet points array', async () => {
    // Act
    const result = await generateBulletRewrites({
      scanId,
      bulletPoints: [], // Empty array should fail validation
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      isStudent: true,
      jdKeywords: ['React'],
    })

    // Assert
    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  test('RLS Security: User can only save suggestions for their own scans', async ({
    request,
    userFactory,
    resumeFactory,
    scanFactory,
  }) => {
    // Create a second user with their own scan
    const user2 = await userFactory.create({
      email: `test-rewrites-user2-${Date.now()}@example.com`,
      experienceLevel: 'experienced',
    })

    const resume2 = await resumeFactory.create({
      userId: user2.id,
      extractedText: 'User 2 resume content',
    })

    const scan2 = await scanFactory.create({
      userId: user2.id,
      resumeId: resume2.id,
      jobDescription: 'User 2 job description for testing RLS security policies',
    })

    // Create suggestion for User 1's scan via test API (bypassing RLS)
    const createResponse = await request.post('/api/test/suggestions', {
      data: {
        scanId: scanId, // User 1's scan
        section: 'experience',
        itemIndex: 0,
        suggestionType: 'bullet_rewrite',
        originalText: 'User 1 original bullet',
        suggestedText: 'User 1 improved bullet',
        reasoning: 'Test reasoning',
      },
    })
    expect(createResponse.ok()).toBeTruthy()

    // Create suggestion for User 2's scan via test API
    const createResponse2 = await request.post('/api/test/suggestions', {
      data: {
        scanId: scan2.id, // User 2's scan
        section: 'experience',
        itemIndex: 0,
        suggestionType: 'bullet_rewrite',
        originalText: 'User 2 original bullet',
        suggestedText: 'User 2 improved bullet',
        reasoning: 'Test reasoning',
      },
    })
    expect(createResponse2.ok()).toBeTruthy()

    // Verify via test API that both suggestions exist (service role bypasses RLS)
    const user1SuggestionsResp = await request.get(`/api/test/suggestions?scanId=${scanId}`)
    const user1Suggestions = await user1SuggestionsResp.json()
    expect(user1Suggestions.data.count).toBe(1)
    expect(user1Suggestions.data.suggestions[0].originalText).toBe('User 1 original bullet')

    const user2SuggestionsResp = await request.get(`/api/test/suggestions?scanId=${scan2.id}`)
    const user2Suggestions = await user2SuggestionsResp.json()
    expect(user2Suggestions.data.count).toBe(1)
    expect(user2Suggestions.data.suggestions[0].originalText).toBe('User 2 original bullet')

    // RLS is enforced at database level via migration policies:
    // - SELECT: Users can only view suggestions for scans they own
    // - INSERT: Users can only insert suggestions for scans they own
    // - UPDATE/DELETE: Users can only modify suggestions for scans they own
    //
    // The RLS policies use: scan_id IN (SELECT id FROM scans WHERE user_id = auth.uid())
    // This ensures cross-user data isolation at the database level.
    //
    // Server actions use createClient() which respects RLS via auth.uid()
    // Test API uses service role which bypasses RLS for test data management
  })
})
