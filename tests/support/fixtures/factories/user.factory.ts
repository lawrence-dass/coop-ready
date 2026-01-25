import { faker } from '@faker-js/faker';

/**
 * User Factory
 *
 * Generates test user data with realistic, randomized values.
 * Use overrides to customize specific fields for test scenarios.
 *
 * Example:
 * const user = createUser({ email: 'specific@example.com' });
 */

export interface User {
  id?: string;
  email: string;
  password: string;
  name: string;
  anonymousId?: string;
}

/**
 * Create a test user with randomized data
 */
export function createUser(overrides: Partial<User> = {}): User {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    name: faker.person.fullName(),
    anonymousId: faker.string.uuid(),
    ...overrides,
  };
}

/**
 * Create multiple test users
 */
export function createUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

/**
 * Resume Factory
 */
export interface Resume {
  fileName: string;
  content: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Create a test resume with randomized data
 */
export function createResume(overrides: Partial<Resume> = {}): Resume {
  return {
    fileName: `resume-${faker.string.alphanumeric(8)}.pdf`,
    content: faker.lorem.paragraphs(5),
    fileSize: faker.number.int({ min: 1000, max: 5000 }),
    mimeType: 'application/pdf',
    ...overrides,
  };
}

/**
 * Job Description Factory
 */
export interface JobDescription {
  title: string;
  company: string;
  description: string;
  requirements: string[];
}

/**
 * Create a test job description with randomized data
 */
export function createJobDescription(
  overrides: Partial<JobDescription> = {}
): JobDescription {
  return {
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    description: faker.lorem.paragraphs(3),
    requirements: Array.from({ length: 5 }, () => faker.lorem.sentence()),
    ...overrides,
  };
}
