import { APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Profile Factory
 *
 * Creates test user profiles for onboarding tests.
 * Uses faker for parallel-safe unique values.
 *
 * @see _bmad/bmm/testarch/knowledge/data-factories.md
 */

export type UserProfile = {
  id: string;
  userId: string;
  experienceLevel: 'student' | 'career_changer' | 'experienced';
  targetRole: string;
  customRole: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfileParams = Partial<
  Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
> & {
  userId: string; // Required: must link to a user
};

export class ProfileFactory {
  private createdProfileIds: string[] = [];
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Create a profile object with defaults (does NOT persist)
   */
  build(params: CreateProfileParams): Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
    const experienceLevel = params.experienceLevel || faker.helpers.arrayElement(['student', 'career_changer', 'experienced']);
    const targetRole = params.targetRole || faker.helpers.arrayElement([
      'Software Engineer',
      'Data Analyst',
      'Product Manager',
      'UX Designer',
      'DevOps Engineer',
      'Data Scientist',
      'QA Engineer',
      'Business Analyst',
    ]);

    return {
      userId: params.userId,
      experienceLevel,
      targetRole,
      customRole: params.customRole !== undefined ? params.customRole : null,
      onboardingCompleted: params.onboardingCompleted !== undefined ? params.onboardingCompleted : false,
    };
  }

  /**
   * Create and persist a user profile via API
   */
  async create(params: CreateProfileParams): Promise<UserProfile> {
    const profileData = this.build(params);

    const response = await this.request.post('/api/test/profiles', {
      data: profileData,
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create profile: ${response.status()} ${errorText}`);
    }

    const profile = (await response.json()) as UserProfile;
    this.createdProfileIds.push(profile.id);
    return profile;
  }

  /**
   * Create a completed profile (onboarding done)
   */
  async createCompleted(params: CreateProfileParams): Promise<UserProfile> {
    return this.create({
      ...params,
      onboardingCompleted: true,
    });
  }

  /**
   * Create an incomplete profile (onboarding not done)
   */
  async createIncomplete(params: CreateProfileParams): Promise<UserProfile> {
    return this.create({
      ...params,
      onboardingCompleted: false,
    });
  }

  /**
   * Create a student profile
   */
  async createStudent(params: CreateProfileParams): Promise<UserProfile> {
    return this.create({
      ...params,
      experienceLevel: 'student',
    });
  }

  /**
   * Create a career changer profile
   */
  async createCareerChanger(params: CreateProfileParams): Promise<UserProfile> {
    return this.create({
      ...params,
      experienceLevel: 'career_changer',
    });
  }

  /**
   * Create an experienced professional profile
   */
  async createExperienced(params: CreateProfileParams): Promise<UserProfile> {
    return this.create({
      ...params,
      experienceLevel: 'experienced',
    });
  }

  /**
   * Create a profile with custom role
   */
  async createWithCustomRole(
    params: CreateProfileParams & { customRole: string }
  ): Promise<UserProfile> {
    return this.create({
      ...params,
      targetRole: 'Other',
      customRole: params.customRole,
    });
  }

  /**
   * Clean up all created profiles
   */
  async cleanup(): Promise<void> {
    for (const profileId of this.createdProfileIds) {
      try {
        await this.request.delete(`/api/test/profiles/${profileId}`);
      } catch {
        // Ignore cleanup errors - profile may already be deleted
      }
    }
    this.createdProfileIds = [];
  }
}
