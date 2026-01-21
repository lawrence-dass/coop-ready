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
  experienceLevel: 'student' | 'career_changer' | 'experienced';
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
      experienceLevel: faker.helpers.arrayElement(['student', 'career_changer', 'experienced']),
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
      data: {
        email: userData.email,
        password: faker.internet.password({ length: 12 }), // Generate random password
        experienceLevel: userData.experienceLevel,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${response.status()} ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(`Failed to create user: ${result.error.message}`);
    }

    const user: User = {
      id: result.data.userId,
      email: result.data.email,
      name: userData.name,
      experienceLevel: result.data.experienceLevel,
      targetRole: userData.targetRole,
      createdAt: new Date().toISOString(),
    };

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
   * Create an experienced professional user
   */
  async createExperienced(overrides: CreateUserParams = {}): Promise<User> {
    return this.create({ experienceLevel: 'experienced', ...overrides });
  }

  /**
   * Create a user with password (for login tests)
   * Creates user in Supabase Auth with email/password authentication
   */
  async createWithPassword(
    params: CreateUserParams & { password: string }
  ): Promise<User & { password: string }> {
    const userData = this.build(params);
    const { password } = params;

    const response = await this.request.post('/api/test/users', {
      data: {
        email: userData.email,
        password,
        experienceLevel: userData.experienceLevel,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create user with auth: ${response.status()} ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(`Failed to create user: ${result.error.message}`);
    }

    const user: User = {
      id: result.data.userId,
      email: result.data.email,
      name: userData.name,
      experienceLevel: result.data.experienceLevel,
      targetRole: userData.targetRole,
      createdAt: new Date().toISOString(),
    };

    this.createdUserIds.push(user.id);

    return {
      ...user,
      password, // Return password for login tests
    };
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
