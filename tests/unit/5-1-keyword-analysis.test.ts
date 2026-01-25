// Story 5.1: Keyword Analysis Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeywordCategory } from '@/types/analysis';
import type {
  ExtractedKeyword,
  ExtractedKeywords,
  MatchedKeyword,
  KeywordAnalysisResult
} from '@/types/analysis';
import { extractKeywords } from '@/lib/ai/extractKeywords';
import { matchKeywords } from '@/lib/ai/matchKeywords';

// Mock ChatAnthropic
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn().mockImplementation(() => ({
    invoke: vi.fn()
  }))
}));

describe('Task 1: Keyword Analysis Data Model', () => {
  it('should define valid KeywordCategory enum values', () => {
    expect(KeywordCategory.SKILLS).toBe('skills');
    expect(KeywordCategory.TECHNOLOGIES).toBe('technologies');
    expect(KeywordCategory.QUALIFICATIONS).toBe('qualifications');
    expect(KeywordCategory.EXPERIENCE).toBe('experience');
    expect(KeywordCategory.SOFT_SKILLS).toBe('soft_skills');
    expect(KeywordCategory.CERTIFICATIONS).toBe('certifications');
  });

  it('should create a valid ExtractedKeyword object', () => {
    const keyword: ExtractedKeyword = {
      keyword: 'Python',
      category: KeywordCategory.TECHNOLOGIES,
      importance: 'high'
    };

    expect(keyword.keyword).toBe('Python');
    expect(keyword.category).toBe(KeywordCategory.TECHNOLOGIES);
    expect(keyword.importance).toBe('high');
  });

  it('should create a valid ExtractedKeywords object', () => {
    const extracted: ExtractedKeywords = {
      keywords: [
        {
          keyword: 'Python',
          category: KeywordCategory.TECHNOLOGIES,
          importance: 'high'
        },
        {
          keyword: 'Project Management',
          category: KeywordCategory.SKILLS,
          importance: 'high'
        }
      ],
      totalCount: 2
    };

    expect(extracted.keywords).toHaveLength(2);
    expect(extracted.totalCount).toBe(2);
  });

  it('should create a valid MatchedKeyword object', () => {
    const matched: MatchedKeyword = {
      keyword: 'Python',
      category: KeywordCategory.TECHNOLOGIES,
      found: true,
      context: 'Developed data pipelines using Python',
      matchType: 'exact'
    };

    expect(matched.found).toBe(true);
    expect(matched.matchType).toBe('exact');
    expect(matched.context).toBeDefined();
  });

  it('should create a valid KeywordAnalysisResult object', () => {
    const result: KeywordAnalysisResult = {
      matched: [
        {
          keyword: 'Python',
          category: KeywordCategory.TECHNOLOGIES,
          found: true,
          context: 'Developed using Python',
          matchType: 'exact'
        }
      ],
      missing: [
        {
          keyword: 'Docker',
          category: KeywordCategory.TECHNOLOGIES,
          importance: 'medium'
        }
      ],
      matchRate: 50.0,
      analyzedAt: new Date().toISOString()
    };

    expect(result.matched).toHaveLength(1);
    expect(result.missing).toHaveLength(1);
    expect(result.matchRate).toBe(50.0);
    expect(result.analyzedAt).toBeDefined();
  });

  it('should support optional context in MatchedKeyword', () => {
    const matched: MatchedKeyword = {
      keyword: 'AWS',
      category: KeywordCategory.TECHNOLOGIES,
      found: false,
      matchType: 'exact'
    };

    expect(matched.context).toBeUndefined();
  });

  it('should support all match types', () => {
    const exactMatch: MatchedKeyword['matchType'] = 'exact';
    const fuzzyMatch: MatchedKeyword['matchType'] = 'fuzzy';
    const semanticMatch: MatchedKeyword['matchType'] = 'semantic';

    expect(exactMatch).toBe('exact');
    expect(fuzzyMatch).toBe('fuzzy');
    expect(semanticMatch).toBe('semantic');
  });

  it('should support all importance levels', () => {
    const high: ExtractedKeyword['importance'] = 'high';
    const medium: ExtractedKeyword['importance'] = 'medium';
    const low: ExtractedKeyword['importance'] = 'low';

    expect(high).toBe('high');
    expect(medium).toBe('medium');
    expect(low).toBe('low');
  });
});

describe('Task 2: LLM Keyword Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return VALIDATION_ERROR for empty job description', async () => {
    const result = await extractKeywords('');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.data).toBeNull();
  });

  it('should extract keywords from job description', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        keywords: [
          { keyword: 'Python', category: 'technologies', importance: 'high' },
          { keyword: 'Project Management', category: 'skills', importance: 'high' }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const result = await extractKeywords('Looking for Python developer with project management experience');

    expect(result.data).not.toBeNull();
    expect(result.error).toBeNull();
    expect(result.data?.keywords).toHaveLength(2);
    expect(result.data?.totalCount).toBe(2);
    expect(result.data?.keywords[0].keyword).toBe('Python');
  });

  it('should return PARSE_ERROR for invalid JSON response', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: 'Invalid JSON{]'
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const result = await extractKeywords('Test job description');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('PARSE_ERROR');
    expect(result.data).toBeNull();
  });

  it('should return LLM_TIMEOUT on timeout error', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockRejectedValue(new Error('Request timeout'));

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const result = await extractKeywords('Test job description');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('LLM_TIMEOUT');
    expect(result.data).toBeNull();
  });

  it('should return RATE_LIMITED on rate limit error', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const result = await extractKeywords('Test job description');

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('RATE_LIMITED');
    expect(result.data).toBeNull();
  });

  it('should truncate very long job descriptions', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        keywords: [
          { keyword: 'Python', category: 'technologies', importance: 'high' }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const longJD = 'A'.repeat(10000); // 10k characters
    const result = await extractKeywords(longJD);

    expect(result.data).not.toBeNull();
    // Verify it didn't throw and handled truncation gracefully
  });

  it('should wrap user content in XML tags (prompt injection defense)', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        keywords: [
          { keyword: 'Python', category: 'technologies', importance: 'high' }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    await extractKeywords('Test job description');

    // Verify invoke was called with prompt containing XML tags
    expect(mockInvoke).toHaveBeenCalled();
    const callArg = mockInvoke.mock.calls[0][0] as string;
    expect(callArg).toContain('<job_description>');
    expect(callArg).toContain('</job_description>');
  });
});

describe('Task 3: Keyword Matching Algorithm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return VALIDATION_ERROR for empty resume content', async () => {
    const keywords: ExtractedKeyword[] = [
      { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }
    ];

    const result = await matchKeywords('', keywords);

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.data).toBeNull();
  });

  it('should return VALIDATION_ERROR for empty keywords array', async () => {
    const result = await matchKeywords('Resume content here', []);

    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('VALIDATION_ERROR');
    expect(result.data).toBeNull();
  });

  it('should match exact keywords', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        matches: [
          {
            keyword: 'Python',
            category: 'technologies',
            found: true,
            context: 'Developed using Python',
            matchType: 'exact'
          },
          {
            keyword: 'Docker',
            category: 'technologies',
            found: false,
            matchType: 'exact'
          }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const keywords: ExtractedKeyword[] = [
      { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' },
      { keyword: 'Docker', category: KeywordCategory.TECHNOLOGIES, importance: 'medium' }
    ];

    const result = await matchKeywords('Resume with Python experience', keywords);

    expect(result.data).not.toBeNull();
    expect(result.error).toBeNull();
    expect(result.data?.matched).toHaveLength(1);
    expect(result.data?.missing).toHaveLength(1);
    expect(result.data?.matchRate).toBe(50);
  });

  it('should support fuzzy matching', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        matches: [
          {
            keyword: 'JavaScript',
            category: 'technologies',
            found: true,
            context: 'Developed using JS',
            matchType: 'fuzzy'
          }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const keywords: ExtractedKeyword[] = [
      { keyword: 'JavaScript', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }
    ];

    const result = await matchKeywords('Resume with JS experience', keywords);

    expect(result.data?.matched[0].matchType).toBe('fuzzy');
  });

  it('should support semantic matching', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        matches: [
          {
            keyword: 'team leadership',
            category: 'skills',
            found: true,
            context: 'Led teams of developers',
            matchType: 'semantic'
          }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const keywords: ExtractedKeyword[] = [
      { keyword: 'team leadership', category: KeywordCategory.SKILLS, importance: 'high' }
    ];

    const result = await matchKeywords('Led teams of developers', keywords);

    expect(result.data?.matched[0].matchType).toBe('semantic');
  });

  it('should calculate correct match rate', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        matches: [
          { keyword: 'Python', category: 'technologies', found: true, context: 'Python dev', matchType: 'exact' },
          { keyword: 'AWS', category: 'technologies', found: true, context: 'AWS experience', matchType: 'exact' },
          { keyword: 'Docker', category: 'technologies', found: false, matchType: 'exact' },
          { keyword: 'Kubernetes', category: 'technologies', found: false, matchType: 'exact' }
        ]
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const keywords: ExtractedKeyword[] = [
      { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' },
      { keyword: 'AWS', category: KeywordCategory.TECHNOLOGIES, importance: 'high' },
      { keyword: 'Docker', category: KeywordCategory.TECHNOLOGIES, importance: 'medium' },
      { keyword: 'Kubernetes', category: KeywordCategory.TECHNOLOGIES, importance: 'medium' }
    ];

    const result = await matchKeywords('Python and AWS experience', keywords);

    expect(result.data?.matchRate).toBe(50); // 2 out of 4 = 50%
  });

  it('should wrap resume content in XML tags', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        matches: []
      })
    });

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const keywords: ExtractedKeyword[] = [
      { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }
    ];

    await matchKeywords('Resume content', keywords);

    expect(mockInvoke).toHaveBeenCalled();
    const callArg = mockInvoke.mock.calls[0][0] as string;
    expect(callArg).toContain('<resume_content>');
    expect(callArg).toContain('</resume_content>');
  });

  it('should return LLM_TIMEOUT on timeout', async () => {
    const { ChatAnthropic } = await import('@langchain/anthropic');
    const mockInvoke = vi.fn().mockRejectedValue(new Error('Request timeout'));

    (ChatAnthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      invoke: mockInvoke
    }));

    const keywords: ExtractedKeyword[] = [
      { keyword: 'Python', category: KeywordCategory.TECHNOLOGIES, importance: 'high' }
    ];

    const result = await matchKeywords('Resume content', keywords);

    expect(result.error?.code).toBe('LLM_TIMEOUT');
  });
});
