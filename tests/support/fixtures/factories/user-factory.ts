import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * User Factory
 *
 * Creates test users with sensible defaults and auto-cleanup.
 * Uses faker for parallel-safe unique values.
 *
 * @see _bmad/bmm/testarch/knowledge/data-factories.md
 */

export type User = {
  id: string;
  email: string;
  name: string;
  experienceLevel: 'student' | 'career_changer';
  targetRole: string;
  createdAt: string;
};

export type CreateUserParams = Partial<Omit<User, 'id' | 'createdAt'>>;

export class UserFactory {
  private createdUserIds: string[] = [];
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Create a user object with defaults (does NOT persist)
   */
  build(overrides: CreateUserParams = {}): Omit<User, 'id' | 'createdAt'> {
    return {
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      experienceLevel: faker.helpers.arrayElement(['student', 'career_changer']),
      targetRole: faker.helpers.arrayElement([
        'Software Engineer',
        'Data Analyst',
        'Product Manager',
        'UX Designer',
        'DevOps Engineer',
      ]),
      ...overrides,
    };
  }

  /**
   * Create and persist a user via API
   */
  async create(overrides: CreateUserParams = {}): Promise<User> {
    const userData = this.build(overrides);

    const response = await this.request.post('/api/test/users', {
      data: userData,
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${response.status()} ${errorText}`);
    }

    const user = (await response.json()) as User;
    this.createdUserIds.push(user.id);
    return user;
  }

  /**
   * Create a student user
   */
  async createStudent(overrides: CreateUserParams = {}): Promise<User> {
    return this.create({ experienceLevel: 'student', ...overrides });
  }

  /**
   * Create a career changer user
   */
  async createCareerChanger(overrides: CreateUserParams = {}): Promise<User> {
    return this.create({ experienceLevel: 'career_changer', ...overrides });
  }

  /**
   * Clean up all created users
   */
  async cleanup(): Promise<void> {
    for (const userId of this.createdUserIds) {
      try {
        await this.request.delete(`/api/test/users/${userId}`);
      } catch {
        // Ignore cleanup errors - user may already be deleted
      }
    }
    this.createdUserIds = [];
  }
}
