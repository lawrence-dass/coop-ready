// Integration Tests for ATS Score Calculation Flow
// Story 5.2: Implement ATS Score Calculation

import { test, expect, describe, beforeEach } from '@playwright/test';
import { createClient } from '@/lib/supabase/client';

describe('[P0] ATS Score Calculation Integration', () => {
  let testSessionId: string;

  beforeEach(async () => {
    // Create a test session
    const supabase = createClient();
    const { data: session } = await supabase
      .from('sessions')
      .insert({
        anonymous_id: crypto.randomUUID(),
        user_id: null,
        resume_content: JSON.stringify({
          rawText: 'Experienced software engineer with Python, React, and AWS skills. Led development of web applications.',
          summary: 'Software engineer with 5 years of experience',
          skills: 'Python, React, AWS, Docker',
          experience: 'Led development of scalable web applications using React and Python. Deployed on AWS with Docker containers.'
        }),
        jd_content: JSON.stringify('Software Engineer position requiring Python, React, and AWS experience.')
      })
      .select()
      .single();

    testSessionId = session!.id;
  });

  test('[P0] should calculate ATS score for complete flow', async () => {
    // This is a server-side integration test
    // Import and call the analyzeResume action directly
    const { analyzeResume } = await import('@/actions/analyzeResume');

    const result = await analyzeResume(testSessionId);

    // Verify no errors
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();

    // Verify keyword analysis present
    expect(result.data!.keywordAnalysis).toBeDefined();
    expect(result.data!.keywordAnalysis.matched).toBeDefined();
    expect(result.data!.keywordAnalysis.matchRate).toBeGreaterThanOrEqual(0);
    expect(result.data!.keywordAnalysis.matchRate).toBeLessThanOrEqual(100);

    // Verify ATS score present
    expect(result.data!.atsScore).toBeDefined();
    expect(result.data!.atsScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.overall).toBeLessThanOrEqual(100);

    // Verify breakdown
    expect(result.data!.atsScore.breakdown).toBeDefined();
    expect(result.data!.atsScore.breakdown.keywordScore).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.breakdown.sectionCoverageScore).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.breakdown.contentQualityScore).toBeGreaterThanOrEqual(0);

    // Verify timestamp
    expect(result.data!.atsScore.calculatedAt).toBeDefined();
    const calculatedTime = new Date(result.data!.atsScore.calculatedAt).getTime();
    expect(calculatedTime).toBeGreaterThan(0);
  });

  test('[P0] should store score in database', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');

    await analyzeResume(testSessionId);

    // Fetch session from database
    const supabase = createClient();
    const { data: session } = await supabase
      .from('sessions')
      .select('ats_score, keyword_analysis')
      .eq('id', testSessionId)
      .single();

    // Verify both fields are persisted
    expect(session!.keyword_analysis).not.toBeNull();
    expect(session!.ats_score).not.toBeNull();

    // Verify score structure
    expect(session!.ats_score.overall).toBeGreaterThanOrEqual(0);
    expect(session!.ats_score.overall).toBeLessThanOrEqual(100);
    expect(session!.ats_score.breakdown).toBeDefined();
  });

  test('[P0] should produce consistent scores for same inputs', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');

    // Run analysis twice
    const result1 = await analyzeResume(testSessionId);
    const result2 = await analyzeResume(testSessionId);

    expect(result1.error).toBeNull();
    expect(result2.error).toBeNull();

    // Keyword scores should be identical (deterministic)
    expect(result1.data!.atsScore.breakdown.keywordScore)
      .toBe(result2.data!.atsScore.breakdown.keywordScore);

    // Section coverage should be identical (deterministic)
    expect(result1.data!.atsScore.breakdown.sectionCoverageScore)
      .toBe(result2.data!.atsScore.breakdown.sectionCoverageScore);

    // Overall scores should be very close (LLM might vary slightly)
    const scoreDiff = Math.abs(
      result1.data!.atsScore.overall - result2.data!.atsScore.overall
    );
    expect(scoreDiff).toBeLessThanOrEqual(5); // Allow max 5 point variance due to LLM
  });

  test('[P0] should ensure score is always 0-100', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');

    const result = await analyzeResume(testSessionId);

    expect(result.error).toBeNull();

    // Overall score
    expect(result.data!.atsScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.overall).toBeLessThanOrEqual(100);

    // Breakdown scores
    expect(result.data!.atsScore.breakdown.keywordScore).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.breakdown.keywordScore).toBeLessThanOrEqual(100);
    expect(result.data!.atsScore.breakdown.sectionCoverageScore).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.breakdown.sectionCoverageScore).toBeLessThanOrEqual(100);
    expect(result.data!.atsScore.breakdown.contentQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.data!.atsScore.breakdown.contentQualityScore).toBeLessThanOrEqual(100);
  });

  test('[P1] should handle missing resume content', async () => {
    // Create session with no resume
    const supabase = createClient();
    const { data: emptySession } = await supabase
      .from('sessions')
      .insert({
        anonymous_id: crypto.randomUUID(),
        user_id: null,
        resume_content: null,
        jd_content: JSON.stringify('Job description text')
      })
      .select()
      .single();

    const { analyzeResume } = await import('@/actions/analyzeResume');

    const result = await analyzeResume(emptySession!.id);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('VALIDATION_ERROR');
    expect(result.error!.message).toContain('resume');
  });

  test('[P1] should handle missing job description', async () => {
    // Create session with no JD
    const supabase = createClient();
    const { data: session } = await supabase
      .from('sessions')
      .insert({
        anonymous_id: crypto.randomUUID(),
        user_id: null,
        resume_content: JSON.stringify({
          rawText: 'Resume text',
          summary: 'Summary',
          skills: 'Skills',
          experience: 'Experience'
        }),
        jd_content: null
      })
      .select()
      .single();

    const { analyzeResume } = await import('@/actions/analyzeResume');

    const result = await analyzeResume(session!.id);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('VALIDATION_ERROR');
    expect(result.error!.message).toContain('job description');
  });

  test('[P2] should handle resume with missing sections (lower section score)', async () => {
    // Create session with incomplete resume
    const supabase = createClient();
    const { data: session } = await supabase
      .from('sessions')
      .insert({
        anonymous_id: crypto.randomUUID(),
        user_id: null,
        resume_content: JSON.stringify({
          rawText: 'Resume with only skills',
          summary: undefined,
          skills: 'Python, React',
          experience: undefined
        }),
        jd_content: JSON.stringify('Software Engineer position requiring Python, React.')
      })
      .select()
      .single();

    const { analyzeResume } = await import('@/actions/analyzeResume');

    const result = await analyzeResume(session!.id);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();

    // Section coverage should be low (only 1/3 sections)
    expect(result.data!.atsScore.breakdown.sectionCoverageScore).toBeLessThan(50);
  });

  test('[P2] should persist score across session reloads', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');

    // Analyze and get score
    const analyzeResult = await analyzeResume(testSessionId);
    const originalScore = analyzeResult.data!.atsScore.overall;

    // Reload session from database
    const supabase = createClient();
    const { data: reloadedSession } = await supabase
      .from('sessions')
      .select('ats_score')
      .eq('id', testSessionId)
      .single();

    // Verify score persisted correctly
    expect(reloadedSession!.ats_score.overall).toBe(originalScore);
  });
});
