import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Scan Factory
 *
 * Creates test scan results with sensible defaults and auto-cleanup.
 *
 * @see _bmad/bmm/testarch/knowledge/data-factories.md
 */

export type ScanResult = {
  id: string;
  userId: string;
  resumeId: string;
  jobDescription: string;
  atsScore: number;
  analysis: {
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: Array<{
      original: string;
      improved: string;
      reason: string;
    }>;
    transferableSkills: string[];
  };
  createdAt: string;
};

export type CreateScanParams = Partial<Omit<ScanResult, 'id' | 'createdAt'>> & {
  userId: string;
  resumeId: string;
};

export class ScanFactory {
  private createdScanIds: string[] = [];
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Generate a realistic job description
   */
  private generateJobDescription(): string {
    const role = faker.helpers.arrayElement([
      'Software Engineer',
      'Frontend Developer',
      'Data Analyst',
      'Product Manager',
    ]);

    const skills = faker.helpers.arrayElements(
      ['React', 'TypeScript', 'Python', 'SQL', 'AWS', 'Node.js', 'Git', 'Agile'],
      { min: 4, max: 6 }
    );

    return `
${role} - ${faker.company.name()}

About the Role:
We are looking for a ${role} to join our team. You will work on ${faker.company.buzzPhrase()}.

Requirements:
- ${faker.number.int({ min: 1, max: 3 })}+ years of experience (or equivalent projects)
- Proficiency in ${skills.slice(0, 3).join(', ')}
- Experience with ${skills.slice(3).join(', ')}
- Strong communication skills
- Ability to work in a fast-paced environment

Nice to Have:
- Experience with ${faker.helpers.arrayElement(['CI/CD', 'Docker', 'Kubernetes', 'GraphQL'])}
- Knowledge of ${faker.helpers.arrayElement(['machine learning', 'cloud architecture', 'system design'])}

Benefits:
- Competitive salary
- Health insurance
- Remote work options
    `.trim();
  }

  /**
   * Generate sample analysis results
   */
  private generateAnalysis(): ScanResult['analysis'] {
    return {
      matchedKeywords: faker.helpers.arrayElements(
        ['React', 'JavaScript', 'Python', 'SQL', 'Git', 'Communication'],
        { min: 3, max: 6 }
      ),
      missingKeywords: faker.helpers.arrayElements(
        ['TypeScript', 'AWS', 'Docker', 'CI/CD', 'Agile', 'Scrum'],
        { min: 2, max: 4 }
      ),
      suggestions: [
        {
          original: 'Worked on projects',
          improved: 'Led development of 3 full-stack applications using React and Node.js',
          reason: 'Quantify achievements and specify technologies',
        },
        {
          original: 'Good communication skills',
          improved:
            'Collaborated with cross-functional teams of 5+ members to deliver features on schedule',
          reason: 'Provide concrete examples of collaboration',
        },
      ],
      transferableSkills: faker.helpers.arrayElements(
        [
          'Problem-solving',
          'Project Management',
          'Data Analysis',
          'Communication',
          'Team Leadership',
          'Customer Service',
        ],
        { min: 2, max: 4 }
      ),
    };
  }

  /**
   * Create a scan object with defaults (does NOT persist)
   */
  build(params: CreateScanParams): Omit<ScanResult, 'id' | 'createdAt'> {
    return {
      userId: params.userId,
      resumeId: params.resumeId,
      jobDescription: params.jobDescription || this.generateJobDescription(),
      atsScore: params.atsScore ?? faker.number.int({ min: 40, max: 95 }),
      analysis: params.analysis || this.generateAnalysis(),
    };
  }

  /**
   * Create and persist a scan via API
   */
  async create(params: CreateScanParams): Promise<ScanResult> {
    const scanData = this.build(params);

    const response = await this.request.post('/api/test/scans', {
      data: scanData,
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create scan: ${response.status()} ${errorText}`);
    }

    const scan = (await response.json()) as ScanResult;
    this.createdScanIds.push(scan.id);
    return scan;
  }

  /**
   * Create a high-scoring scan (85+)
   */
  async createHighScore(params: CreateScanParams): Promise<ScanResult> {
    return this.create({
      ...params,
      atsScore: faker.number.int({ min: 85, max: 98 }),
    });
  }

  /**
   * Create a low-scoring scan (below 50)
   */
  async createLowScore(params: CreateScanParams): Promise<ScanResult> {
    return this.create({
      ...params,
      atsScore: faker.number.int({ min: 20, max: 49 }),
    });
  }

  /**
   * Clean up all created scans
   */
  async cleanup(): Promise<void> {
    for (const scanId of this.createdScanIds) {
      try {
        await this.request.delete(`/api/test/scans/${scanId}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.createdScanIds = [];
  }
}
