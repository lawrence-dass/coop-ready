import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Resume Factory
 *
 * Creates test resumes with sensible defaults and auto-cleanup.
 *
 * @see _bmad/bmm/testarch/knowledge/data-factories.md
 */

export type Resume = {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  fileSize: number;
  extractedText: string;
  uploadedAt: string;
};

export type CreateResumeParams = Partial<Omit<Resume, 'id' | 'uploadedAt'>> & {
  userId: string;
};

export class ResumeFactory {
  private createdResumeIds: string[] = [];
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Generate sample resume text for a student
   */
  private generateStudentResumeText(): string {
    const name = faker.person.fullName();
    const university = faker.company.name() + ' University';
    const major = faker.helpers.arrayElement([
      'Computer Science',
      'Information Technology',
      'Data Science',
      'Software Engineering',
    ]);

    return `
${name}
${faker.internet.email()}
${faker.phone.number()}

EDUCATION
${university}
Bachelor of Science in ${major}
Expected Graduation: ${faker.date.future().getFullYear()}
GPA: ${(3.0 + Math.random() * 1.0).toFixed(2)}

PROJECTS
${faker.company.buzzPhrase()}
- ${faker.hacker.phrase()}
- Used ${faker.helpers.arrayElements(['React', 'Python', 'Node.js', 'TypeScript', 'SQL'], 3).join(', ')}

SKILLS
Programming: Python, JavaScript, SQL
Tools: Git, VS Code, Figma
    `.trim();
  }

  /**
   * Generate sample resume text for a career changer
   */
  private generateCareerChangerResumeText(): string {
    const name = faker.person.fullName();
    const previousRole = faker.helpers.arrayElement([
      'Marketing Manager',
      'Sales Representative',
      'Teacher',
      'Accountant',
      'Project Coordinator',
    ]);

    return `
${name}
${faker.internet.email()}
${faker.phone.number()}

PROFESSIONAL EXPERIENCE
${faker.company.name()}
${previousRole}
${faker.date.past({ years: 5 }).getFullYear()} - Present
- ${faker.hacker.phrase()}
- Managed team of ${faker.number.int({ min: 3, max: 10 })} people
- Increased efficiency by ${faker.number.int({ min: 15, max: 40 })}%

EDUCATION
${faker.company.name()} University
Bachelor's Degree
${faker.date.past({ years: 10 }).getFullYear()}

CERTIFICATIONS
- ${faker.helpers.arrayElement(['AWS Certified', 'Google Analytics', 'PMP', 'Scrum Master'])}

SKILLS
Transferable: Project Management, Communication, Data Analysis
Technical: Excel, SQL (learning), Python (learning)
    `.trim();
  }

  /**
   * Create a resume object with defaults (does NOT persist)
   */
  build(params: CreateResumeParams): Omit<Resume, 'id' | 'uploadedAt'> {
    const isStudent = Math.random() > 0.5;

    return {
      userId: params.userId,
      fileName: params.fileName || `resume_${faker.string.alphanumeric(8)}.pdf`,
      fileType: params.fileType || 'pdf',
      fileSize: params.fileSize || faker.number.int({ min: 50000, max: 500000 }),
      extractedText:
        params.extractedText ||
        (isStudent ? this.generateStudentResumeText() : this.generateCareerChangerResumeText()),
    };
  }

  /**
   * Create and persist a resume via API
   */
  async create(params: CreateResumeParams): Promise<Resume> {
    const resumeData = this.build(params);

    const response = await this.request.post('/api/test/resumes', {
      data: {
        userId: resumeData.userId,
        fileName: resumeData.fileName,
        textContent: resumeData.extractedText,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create resume: ${response.status()} ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(`Failed to create resume: ${result.error.message}`);
    }

    const resume: Resume = {
      id: result.data.resumeId,
      userId: result.data.userId,
      fileName: result.data.fileName,
      fileType: resumeData.fileType,
      fileSize: resumeData.fileSize,
      extractedText: resumeData.extractedText,
      uploadedAt: new Date().toISOString(),
    };

    this.createdResumeIds.push(resume.id);
    return resume;
  }

  /**
   * Clean up all created resumes
   */
  async cleanup(): Promise<void> {
    for (const resumeId of this.createdResumeIds) {
      try {
        await this.request.delete(`/api/test/resumes/${resumeId}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.createdResumeIds = [];
  }
}
